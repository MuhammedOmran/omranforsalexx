-- إصلاح مشكلة Security Definer Views
-- حذف Views الحالية التي تستخدم SECURITY DEFINER وإنشاء بديل آمن

-- حذف Views الموجودة
DROP VIEW IF EXISTS public.active_sessions_safe;
DROP VIEW IF EXISTS public.user_sessions_safe;

-- إنشاء view آمنة للجلسات النشطة بدون SECURITY DEFINER
CREATE VIEW public.active_sessions_safe AS
SELECT 
  id,
  user_id,
  device_id,
  created_at,
  last_activity,
  expires_at,
  is_active
FROM public.active_sessions
WHERE user_id = auth.uid() -- استخدام RLS بدلاً من SECURITY DEFINER
  AND is_active = true
  AND expires_at > now();

-- إنشاء view آمنة لجلسات المستخدمين بدون SECURITY DEFINER  
CREATE VIEW public.user_sessions_safe AS
SELECT 
  id,
  user_id,
  device_id,
  created_at,
  last_activity,
  expires_at,
  is_active
FROM public.user_sessions
WHERE user_id = auth.uid() -- استخدام RLS بدلاً من SECURITY DEFINER
  AND is_active = true
  AND expires_at > now();

-- تطبيق RLS على Views الجديدة
ALTER VIEW public.active_sessions_safe SET (security_barrier = true);
ALTER VIEW public.user_sessions_safe SET (security_barrier = true);

-- إنشاء سياسات RLS للViews إذا لم تكن موجودة
DO $$
BEGIN
  -- للجلسات النشطة
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'active_sessions_safe' 
    AND policyname = 'Users can view own safe active sessions'
  ) THEN
    -- Views لا تدعم RLS policies مباشرة، لكن الجدول الأساسي يحتوي على RLS
    -- لذا سنعتمد على RLS الموجود في الجداول الأساسية
    NULL;
  END IF;
END $$;

-- تسجيل الإصلاح في سجل الأمان
INSERT INTO public.advanced_security_logs (
  event_type,
  event_category, 
  severity,
  description,
  metadata,
  success
) VALUES (
  'security_definer_views_fixed',
  'security_enhancement',
  'high',
  'تم إصلاح مشكلة Security Definer Views وإنشاء views آمنة',
  jsonb_build_object(
    'fixed_views', ARRAY['active_sessions_safe', 'user_sessions_safe'],
    'security_improvement', 'Removed SECURITY DEFINER and added proper RLS filtering',
    'timestamp', now()
  ),
  true
);