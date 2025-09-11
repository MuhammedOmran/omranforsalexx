-- إصلاح مشكلة إنشاء المستخدمين عبر admin panel
-- تحديث الـ trigger function ليكون security definer وبذلك يتخطى RLS policies

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER  -- هذا مهم جداً
SET search_path = public
AS $$
BEGIN
  -- إنشاء profile جديد للمستخدم
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;