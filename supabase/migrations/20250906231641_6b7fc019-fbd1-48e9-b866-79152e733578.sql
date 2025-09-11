-- إنشاء مستخدم جديد للتطوير والاختبار
-- سيتم إنشاء المستخدم مع تأكيد البريد الإلكتروني مباشرة

-- إدراج مستخدم جديد في جدول المصادقة
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@spadex.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "مستخدم تجريبي", "username": "testuser"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- إنشاء هوية للمستخدم
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  (SELECT id FROM auth.users WHERE email = 'test@spadex.com'),
  '{"sub": "' || (SELECT id FROM auth.users WHERE email = 'test@spadex.com') || '", "email": "test@spadex.com"}',
  'email',
  NOW(),
  NOW(),
  NOW()
);