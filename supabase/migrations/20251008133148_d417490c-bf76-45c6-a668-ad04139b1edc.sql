-- إصلاح RLS policies على جدول user_sessions
DROP POLICY IF EXISTS "Users can create own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.user_sessions;

-- إنشاء policies جديدة للسماح بإدارة الجلسات
CREATE POLICY "Users can create own sessions"
  ON public.user_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own sessions"
  ON public.user_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON public.user_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON public.user_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- إنشاء trigger لإنشاء ملف تعريف تلقائياً عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, is_active)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    true
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- حذف trigger القديم إذا كان موجوداً
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- إنشاء trigger جديد
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- إنشاء profiles للمستخدمين الموجودين الذين لا يملكون profiles
INSERT INTO public.profiles (user_id, full_name, is_active)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  true
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;