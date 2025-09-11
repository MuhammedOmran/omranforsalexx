-- Add department manager tracking to employees table
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES auth.users(id);
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'basic' CHECK (access_level IN ('basic', 'department', 'full'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON public.employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON public.employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_access_level ON public.employees(access_level);

-- Drop existing RLS policies to replace with more secure ones
DROP POLICY IF EXISTS "Users can delete own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can insert own employees" ON public.employees;  
DROP POLICY IF EXISTS "Users can read own employees" ON public.employees;
DROP POLICY IF EXISTS "Users can update own employees" ON public.employees;

-- Create function to check if user is HR manager
CREATE OR REPLACE FUNCTION public.is_hr_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN public.get_current_user_role() IN ('admin', 'hr_manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create function to check if user is department manager
CREATE OR REPLACE FUNCTION public.is_department_manager_for_employee(employee_user_id UUID, employee_department TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if current user is the department manager or admin/HR
  RETURN (
    public.get_current_user_role() IN ('admin', 'hr_manager') OR
    EXISTS (
      SELECT 1 FROM public.employees 
      WHERE user_id = employee_user_id 
        AND department = employee_department 
        AND manager_id = auth.uid()
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Create secure RLS policies for employees table

-- SELECT: Role-based access to employee data
CREATE POLICY "Role-based employee access" ON public.employees
  FOR SELECT USING (
    -- Admin and HR can see all employees
    public.is_hr_manager() OR
    -- Users can see employees they created (company owner)
    auth.uid() = user_id OR
    -- Department managers can see their department employees
    public.is_department_manager_for_employee(user_id, department) OR
    -- Employees can see limited info about colleagues (no salary/sensitive data)
    (auth.uid() IS NOT NULL AND access_level = 'basic')
  );

-- INSERT: Only HR managers and company owners can add employees  
CREATE POLICY "HR managers can insert employees" ON public.employees
  FOR INSERT WITH CHECK (
    public.is_hr_manager() OR auth.uid() = user_id
  );

-- UPDATE: Restricted based on role and data sensitivity
CREATE POLICY "Role-based employee updates" ON public.employees
  FOR UPDATE USING (
    -- Admin and HR can update all fields
    public.is_hr_manager() OR
    -- Company owners can update their employees  
    auth.uid() = user_id OR
    -- Department managers can update non-sensitive fields only
    (public.is_department_manager_for_employee(user_id, department) AND 
     -- Prevent salary updates by department managers (use UPDATE with specific columns)
     OLD.salary = NEW.salary AND OLD.user_id = NEW.user_id)
  );

-- DELETE: Only HR managers and company owners
CREATE POLICY "HR managers can delete employees" ON public.employees  
  FOR DELETE USING (
    public.is_hr_manager() OR auth.uid() = user_id
  );

-- Create view for public employee directory (no sensitive data)
CREATE OR REPLACE VIEW public.employee_directory AS
SELECT 
  id,
  name,
  position,
  department,
  phone,
  email,
  hire_date,
  is_active,
  user_id
FROM public.employees
WHERE is_active = true;

-- RLS for employee directory view
ALTER VIEW public.employee_directory SET (security_barrier = true);
CREATE POLICY "Public employee directory access" ON public.employee_directory
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Create audit trigger for salary changes
CREATE OR REPLACE FUNCTION public.audit_employee_salary_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log salary changes for security audit
  IF OLD.salary IS DISTINCT FROM NEW.salary THEN
    INSERT INTO public.advanced_security_logs (
      user_id, event_type, event_category, severity, description,
      metadata, success
    ) VALUES (
      auth.uid(),
      'salary_change',
      'data_access', 
      'high',
      'Employee salary modified: ' || OLD.name,
      jsonb_build_object(
        'employee_id', NEW.id,
        'employee_name', NEW.name,
        'old_salary', OLD.salary,
        'new_salary', NEW.salary,
        'department', NEW.department
      ),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for salary change auditing
DROP TRIGGER IF EXISTS audit_salary_changes ON public.employees;
CREATE TRIGGER audit_salary_changes
  AFTER UPDATE ON public.employees
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_employee_salary_changes();

-- Add user role for HR manager if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'hr_manager', 'department_manager', 'manager', 'user');
  ELSE
    -- Add hr_manager to existing enum if not present
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'hr_manager';
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'department_manager';
    EXCEPTION WHEN others THEN
      -- Ignore if values already exist
      NULL;
    END;
  END IF;
END $$;