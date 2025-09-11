-- إنشاء شركة افتراضية
INSERT INTO companies (id, name, email)
VALUES (
  gen_random_uuid(),
  'SPADEX',
  'tr@gmail.com'
);

-- تعيين دور المالك للمستخدم الحالي
INSERT INTO user_roles (user_id, role_id, company_id, is_active)
SELECT 
  '07045e5c-0528-4561-9c0b-dbc47313a19b'::uuid,
  r.id,
  c.id,
  true
FROM roles r, companies c
WHERE r.name = 'owner'
AND c.name = 'SPADEX';