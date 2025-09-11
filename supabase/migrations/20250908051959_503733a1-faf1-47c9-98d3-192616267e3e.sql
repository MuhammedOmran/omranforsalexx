-- إنشاء شركة افتراضية
INSERT INTO public.companies (
  id,
  name,
  email,
  phone,
  address,
  country,
  currency,
  timezone,
  is_active
) VALUES (
  gen_random_uuid(),
  'شركة عُمران للتقنية',
  'info@omran-tech.com',
  '+966123456789',
  'الرياض - المملكة العربية السعودية',
  'Saudi Arabia',
  'SAR',
  'Asia/Riyadh',
  true
) ON CONFLICT DO NOTHING;

-- الحصول على معرف الشركة
WITH company_data AS (
  SELECT id as company_id FROM public.companies LIMIT 1
),
-- الحصول على معرف دور المالك
owner_role AS (
  SELECT id as role_id FROM public.roles WHERE name = 'owner' LIMIT 1
),
-- الحصول على أول مستخدم ليكون مالك النظام
first_user AS (
  SELECT user_id FROM public.profiles ORDER BY created_at ASC LIMIT 1
)
-- ربط المستخدم الأول كمالك للنظام
INSERT INTO public.user_roles (
  user_id,
  role_id,
  company_id,
  role,
  is_active,
  assigned_at
)
SELECT 
  fu.user_id,
  or_data.role_id,
  cd.company_id,
  'owner'::app_role,
  true,
  NOW()
FROM first_user fu
CROSS JOIN owner_role or_data
CROSS JOIN company_data cd
ON CONFLICT (user_id, role_id, company_id) DO NOTHING;

-- ربط باقي المستخدمين كمديرين
WITH company_data AS (
  SELECT id as company_id FROM public.companies LIMIT 1
),
admin_role AS (
  SELECT id as role_id FROM public.roles WHERE name = 'admin' LIMIT 1
),
other_users AS (
  SELECT user_id FROM public.profiles 
  WHERE user_id NOT IN (
    SELECT user_id FROM public.user_roles LIMIT 1
  )
)
INSERT INTO public.user_roles (
  user_id,
  role_id,
  company_id,
  role,
  is_active,
  assigned_at
)
SELECT 
  ou.user_id,
  ar.role_id,
  cd.company_id,
  'admin'::app_role,
  true,
  NOW()
FROM other_users ou
CROSS JOIN admin_role ar
CROSS JOIN company_data cd
ON CONFLICT (user_id, role_id, company_id) DO NOTHING;

-- تحديث ملفات المستخدمين لتضمين معرف الشركة
UPDATE public.profiles 
SET company_id = (SELECT id FROM public.companies LIMIT 1)
WHERE company_id IS NULL;