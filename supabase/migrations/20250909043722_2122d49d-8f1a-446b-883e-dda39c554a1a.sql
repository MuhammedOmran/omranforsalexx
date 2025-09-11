-- إصلاح مشكلة company_id في profiles table
-- تحديد company_id للمستخدم الحالي بناءً على الشركة الموجودة

UPDATE public.profiles 
SET company_id = (
  SELECT id 
  FROM public.companies 
  WHERE is_active = true 
  LIMIT 1
)
WHERE company_id IS NULL;