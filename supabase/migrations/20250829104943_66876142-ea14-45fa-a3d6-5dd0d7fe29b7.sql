-- Enable RLS on employee directory tables
ALTER TABLE public.employee_basic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_directory ENABLE ROW LEVEL SECURITY;

-- RLS policies for employee_basic_info table
CREATE POLICY "HR managers can view basic employee info" 
ON public.employee_basic_info 
FOR SELECT 
USING (is_hr_manager());

CREATE POLICY "Employees can view their own basic info" 
ON public.employee_basic_info 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Department managers can view their team basic info" 
ON public.employee_basic_info 
FOR SELECT 
USING (is_department_manager_for_employee(user_id, department));

-- RLS policies for employee_directory table  
CREATE POLICY "HR managers can view employee directory" 
ON public.employee_directory 
FOR SELECT 
USING (is_hr_manager());

CREATE POLICY "Employees can view their own directory info" 
ON public.employee_directory 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Department managers can view their team directory" 
ON public.employee_directory 
FOR SELECT 
USING (is_department_manager_for_employee(user_id, department));

-- Restrict write operations to HR managers only
CREATE POLICY "HR managers can insert basic employee info" 
ON public.employee_basic_info 
FOR INSERT 
WITH CHECK (is_hr_manager());

CREATE POLICY "HR managers can update basic employee info" 
ON public.employee_basic_info 
FOR UPDATE 
USING (is_hr_manager());

CREATE POLICY "HR managers can delete basic employee info" 
ON public.employee_basic_info 
FOR DELETE 
USING (is_hr_manager());

CREATE POLICY "HR managers can insert directory info" 
ON public.employee_directory 
FOR INSERT 
WITH CHECK (is_hr_manager());

CREATE POLICY "HR managers can update directory info" 
ON public.employee_directory 
FOR UPDATE 
USING (is_hr_manager());

CREATE POLICY "HR managers can delete directory info" 
ON public.employee_directory 
FOR DELETE 
USING (is_hr_manager());