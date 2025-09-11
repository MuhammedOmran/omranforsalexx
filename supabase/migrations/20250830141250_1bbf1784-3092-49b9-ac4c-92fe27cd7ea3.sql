-- Fix: These are views, so RLS cannot be enabled directly. Replace with secure views that rely on employees RLS and mask sensitive fields.

-- 1) Drop existing views if they exist
DROP VIEW IF EXISTS public.employee_basic_info CASCADE;
DROP VIEW IF EXISTS public.employee_directory CASCADE;

-- 2) Recreate as SECURITY BARRIER views that read from employees (which already has strict RLS)
CREATE VIEW public.employee_basic_info WITH (security_barrier) AS
SELECT
  e.id,
  e.user_id,
  e.name,
  e.position,
  e.department,
  e.is_active
FROM public.employees e;

CREATE VIEW public.employee_directory WITH (security_barrier) AS
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