-- إنشاء شركة افتراضية
INSERT INTO companies (id, name, email, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'SPADEX',
  'tr@gmail.com',
  now(),
  now()
);

-- تعيين دور المالك للمستخدم الحالي
INSERT INTO user_roles (user_id, role_id, company_id, is_active, created_at, updated_at)
SELECT 
  '07045e5c-0528-4561-9c0b-dbc47313a19b'::uuid,
  r.id,
  c.id,
  true,
  now(),
  now()
FROM roles r, companies c
WHERE r.name = 'owner'
AND c.name = 'SPADEX';