-- إضافة عمود is_admin إلى جدول profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- إنشاء جدول الإشعارات للتنبيهات الأمنية
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- تفعيل RLS على جدول الإشعارات
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للإشعارات
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (true);

-- إنشاء جدول سجل النشاط
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  details jsonb,
  ip_address text,
  device_info text,
  status text NOT NULL DEFAULT 'success',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- تفعيل RLS على جدول سجل النشاط
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لسجل النشاط
CREATE POLICY "Users can view their own activity logs" 
ON public.activity_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create activity logs" 
ON public.activity_logs 
FOR INSERT 
WITH CHECK (true);

-- دالة لتسجيل النشاط
CREATE OR REPLACE FUNCTION public.log_user_activity(
  p_user_id uuid,
  p_action text,
  p_details jsonb DEFAULT NULL,
  p_ip_address text DEFAULT NULL,
  p_device_info text DEFAULT NULL,
  p_status text DEFAULT 'success'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.activity_logs (
    user_id, action, details, ip_address, device_info, status
  )
  VALUES (
    p_user_id, p_action, p_details, p_ip_address, p_device_info, p_status
  );
END;
$$;

-- دالة للتحقق من الجلسات الجديدة وإرسال تنبيهات
CREATE OR REPLACE FUNCTION public.check_new_device_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  device_exists boolean := false;
  device_info text;
BEGIN
  -- التحقق من وجود الجهاز مسبقاً
  SELECT EXISTS(
    SELECT 1 FROM public.user_sessions 
    WHERE user_id = NEW.user_id 
    AND device_id = NEW.device_id
    AND created_at < NEW.created_at
  ) INTO device_exists;
  
  -- إذا كان جهازاً جديداً، إنشاء تنبيه
  IF NOT device_exists THEN
    -- الحصول على معلومات الجهاز
    SELECT COALESCE(device_name, 'جهاز غير محدد') 
    FROM public.user_devices 
    WHERE device_id = NEW.device_id 
    AND user_id = NEW.user_id 
    LIMIT 1 INTO device_info;
    
    -- إنشاء إشعار تنبيه أمني
    INSERT INTO public.notifications (
      user_id, 
      title, 
      message, 
      type
    )
    VALUES (
      NEW.user_id,
      'تسجيل دخول من جهاز جديد',
      'تم تسجيل دخول من جهاز جديد: ' || COALESCE(device_info, 'غير محدد'),
      'security'
    );
    
    -- تسجيل النشاط
    PERFORM public.log_user_activity(
      NEW.user_id,
      'new_device_login',
      jsonb_build_object(
        'device_id', NEW.device_id,
        'device_name', device_info
      ),
      NULL,
      device_info,
      'success'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger للتحقق من الجلسات الجديدة
DROP TRIGGER IF EXISTS check_new_device_login_trigger ON public.user_sessions;
CREATE TRIGGER check_new_device_login_trigger
  AFTER INSERT ON public.user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.check_new_device_login();

-- دالة لإنشاء مستخدمين تجريبيين
CREATE OR REPLACE FUNCTION public.create_demo_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  i integer;
  demo_email text;
  demo_password text := 'demo123456';
  user_id uuid;
BEGIN
  FOR i IN 1..100 LOOP
    demo_email := 'demo' || i || '@test.com';
    
    -- التحقق من عدم وجود المستخدم
    SELECT id INTO user_id 
    FROM auth.users 
    WHERE email = demo_email;
    
    IF user_id IS NULL THEN
      -- إنشاء المستخدم
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        aud,
        role,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        is_sso_user
      ) VALUES (
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        demo_email,
        crypt(demo_password, gen_salt('bf')),
        now(),
        now(),
        now(),
        'authenticated',
        'authenticated',
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object('name', 'مستخدم تجريبي ' || i),
        false,
        false
      );
    END IF;
  END LOOP;
END;
$$;

-- إنشاء المستخدمين التجريبيين
SELECT public.create_demo_users();