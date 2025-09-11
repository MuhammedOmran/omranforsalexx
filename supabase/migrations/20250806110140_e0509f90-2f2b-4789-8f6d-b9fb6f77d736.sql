-- إدراج حساب تجريبي في auth.users عبر RPC function
CREATE OR REPLACE FUNCTION create_demo_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  demo_user_id UUID;
BEGIN
  -- التحقق من عدم وجود المستخدم التجريبي مسبقاً
  SELECT id INTO demo_user_id 
  FROM auth.users 
  WHERE email = 'admin@test.com';
  
  -- إذا لم يكن موجود، إنشاؤه
  IF demo_user_id IS NULL THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      aud,
      role,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      phone,
      phone_confirmed_at,
      phone_change,
      phone_change_token,
      email_change_token_current,
      email_change_confirm_status,
      banned_until,
      reauthentication_token,
      reauthentication_sent_at,
      is_sso_user,
      deleted_at
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@test.com',
      crypt('123456', gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      '',
      'authenticated',
      'authenticated',
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "مدير تجريبي"}',
      false,
      null,
      null,
      '',
      '',
      '',
      0,
      null,
      '',
      null,
      false,
      null
    );
  END IF;
END;
$$;