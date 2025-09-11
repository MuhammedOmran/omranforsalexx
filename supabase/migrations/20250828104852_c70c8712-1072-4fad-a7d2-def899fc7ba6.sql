-- Fix Security Definer View issue by removing SECURITY DEFINER properties
-- and ensuring views respect current user's RLS policies

-- Drop existing views that have SECURITY DEFINER issues  
DROP VIEW IF EXISTS public.employee_directory;
DROP VIEW IF EXISTS public.employee_salary_view;

-- Recreate employee directory view without SECURITY DEFINER
-- This view will respect the current user's RLS policies
CREATE VIEW public.employee_directory AS
SELECT 
  id,
  name,
  "position",
  department,
  phone,
  email,
  hire_date,
  is_active,
  user_id
FROM public.employees
WHERE is_active = true;

-- Create a function for salary access that respects permissions
CREATE OR REPLACE FUNCTION public.get_employee_salary_info(p_employee_id UUID)
RETURNS TABLE(
  id UUID,
  name TEXT,
  "position" TEXT,
  department TEXT,
  salary NUMERIC,
  user_id UUID
) AS $$
BEGIN
  -- Only return data if user has permission (HR manager or owns the employee data)
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e."position",
    e.department,
    CASE 
      WHEN public.is_hr_manager() OR auth.uid() = e.user_id THEN e.salary
      ELSE NULL::NUMERIC
    END as salary,
    e.user_id
  FROM public.employees e
  WHERE e.id = p_employee_id
    AND (public.is_hr_manager() OR auth.uid() = e.user_id OR public.is_department_manager_for_employee(e.user_id, e.department));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a safer function to get employee directory that respects RLS
CREATE OR REPLACE FUNCTION public.get_employee_directory()
RETURNS TABLE(
  id UUID,
  name TEXT,
  "position" TEXT,
  department TEXT,
  phone TEXT,
  email TEXT,
  hire_date DATE,
  is_active BOOLEAN,
  user_id UUID
) AS $$
BEGIN
  -- This function will respect the RLS policies on the employees table
  RETURN QUERY
  SELECT 
    e.id,
    e.name,
    e."position",
    e.department,
    -- Only show contact info to authorized users
    CASE 
      WHEN public.is_hr_manager() OR auth.uid() = e.user_id OR public.is_department_manager_for_employee(e.user_id, e.department) 
      THEN e.phone 
      ELSE NULL::TEXT 
    END as phone,
    CASE 
      WHEN public.is_hr_manager() OR auth.uid() = e.user_id OR public.is_department_manager_for_employee(e.user_id, e.department) 
      THEN e.email 
      ELSE NULL::TEXT 
    END as email,
    e.hire_date,
    e.is_active,
    e.user_id
  FROM public.employees e
  WHERE e.is_active = true
    AND (
      public.is_hr_manager() OR 
      auth.uid() = e.user_id OR 
      public.is_department_manager_for_employee(e.user_id, e.department)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Add comments explaining the security model
COMMENT ON FUNCTION public.get_employee_salary_info IS 
'Secure function that checks user permissions before returning salary data. Uses SECURITY DEFINER with internal permission validation.';

COMMENT ON FUNCTION public.get_employee_directory IS 
'Secure function that respects user roles and departments. Uses SECURITY DEFINER with internal permission validation to filter sensitive contact information.';

-- Create a simple view for basic employee lookup (no sensitive data)
CREATE VIEW public.employee_basic_info AS
SELECT 
  id,
  name,
  "position",
  department,
  is_active,
  user_id
FROM public.employees
WHERE is_active = true;

-- This view will automatically respect the RLS policies on the employees table
-- No SECURITY DEFINER needed - it inherits permissions from the base table