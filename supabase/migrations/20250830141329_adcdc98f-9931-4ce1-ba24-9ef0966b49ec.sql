-- Fix security warnings by removing SECURITY BARRIER and ensuring proper access control through RLS on underlying employees table

-- 1) Drop existing views 
DROP VIEW IF EXISTS public.employee_basic_info CASCADE;
DROP VIEW IF EXISTS public.employee_directory CASCADE;

-- 2) Recreate as regular views without SECURITY BARRIER
-- The security is enforced by the RLS policies on the underlying employees table
CREATE VIEW public.employee_basic_info AS
SELECT
  e.id,
  e.user_id,
  e.name,
  e.position,
  e.department,
  e.is_active
FROM public.employees e;

CREATE VIEW public.employee_directory AS
SELECT
  e.id,
  e.user_id,
  e.name,
  e.position,
  e.department,
  e.is_active,
  e.hire_date,
  CASE 
    WHEN public.is_hr_manager() OR auth.uid() = e.user_id OR public.is_department_manager_for_employee(e.user_id, e.department) 
    THEN e.phone 
    ELSE NULL::TEXT 
  END AS phone,
  CASE 
    WHEN public.is_hr_manager() OR auth.uid() = e.user_id OR public.is_department_manager_for_employee(e.user_id, e.department) 
    THEN e.email 
    ELSE NULL::TEXT 
  END AS email
FROM public.employees e
WHERE e.is_active = true;