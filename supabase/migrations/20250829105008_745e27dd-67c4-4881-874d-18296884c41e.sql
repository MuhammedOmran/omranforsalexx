-- Drop the existing views that have no security
DROP VIEW IF EXISTS public.employee_basic_info;
DROP VIEW IF EXISTS public.employee_directory;

-- Create secure views that incorporate RLS-like logic directly
CREATE VIEW public.employee_basic_info 
WITH (security_invoker = true) AS
SELECT 
  e.id,
  e.name,
  e.position,
  e.department,
  e.user_id,
  e.is_active
FROM public.employees e
WHERE 
  -- Only show if user is HR manager, owns the record, or is department manager
  is_hr_manager() OR 
  auth.uid() = e.user_id OR 
  is_department_manager_for_employee(e.user_id, e.department);

CREATE VIEW public.employee_directory 
WITH (security_invoker = true) AS
SELECT 
  e.id,
  e.name,
  e.position,
  e.department,
  -- Only show contact info to authorized users
  CASE 
    WHEN is_hr_manager() OR auth.uid() = e.user_id OR is_department_manager_for_employee(e.user_id, e.department) 
    THEN e.phone 
    ELSE NULL 
  END as phone,
  CASE 
    WHEN is_hr_manager() OR auth.uid() = e.user_id OR is_department_manager_for_employee(e.user_id, e.department) 
    THEN e.email 
    ELSE NULL 
  END as email,
  e.hire_date,
  e.is_active,
  e.user_id
FROM public.employees e
WHERE 
  -- Only show if user is HR manager, owns the record, or is department manager
  is_hr_manager() OR 
  auth.uid() = e.user_id OR 
  is_department_manager_for_employee(e.user_id, e.department);