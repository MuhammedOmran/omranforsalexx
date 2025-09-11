-- إزالة الدالة المعطلة وإعادة إنشائها بطريقة مختلفة
DROP FUNCTION IF EXISTS public.create_demo_users();

-- دالة أبسط لإنشاء حساب مشرف تجريبي
CREATE OR REPLACE FUNCTION public.make_user_admin(user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- البحث عن المستخدم
  SELECT au.id INTO target_user_id
  FROM auth.users au
  WHERE au.email = user_email;
  
  IF target_user_id IS NOT NULL THEN
    -- تحديث الملف الشخصي ليصبح مشرف
    UPDATE public.profiles 
    SET is_admin = true 
    WHERE user_id = target_user_id;
    
    -- إنشاء ملف شخصي إذا لم يكن موجود
    INSERT INTO public.profiles (user_id, display_name, is_admin)
    VALUES (target_user_id, 'مشرف النظام', true)
    ON CONFLICT (user_id) DO UPDATE SET is_admin = true;
  END IF;
END;
$$;