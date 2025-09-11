-- تأكد من وجود RLS policies محدثة لجدول user_sessions

-- إضافة حالة الجلسة إذا لم تكن موجودة
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' 
                   AND column_name = 'is_active' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_sessions ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- إضافة معرف الجلسة إذا لم يكن موجوداً
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_sessions' 
                   AND column_name = 'session_token' 
                   AND table_schema = 'public') THEN
        ALTER TABLE public.user_sessions ADD COLUMN session_token TEXT NOT NULL DEFAULT gen_random_uuid()::text;
    END IF;
END $$;

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON public.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON public.user_sessions(expires_at);

-- إضافة trigger لتنظيف الجلسات المنتهية تلقائياً
CREATE OR REPLACE FUNCTION public.cleanup_expired_user_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- إنهاء الجلسات المنتهية
  UPDATE public.user_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
  
  -- حذف الجلسات القديمة جداً (أكثر من 90 يوم)
  DELETE FROM public.user_sessions 
  WHERE created_at < now() - INTERVAL '90 days';
END;
$$;

-- إنشاء وظيفة لتنظيف الجلسات المنتهية بشكل دوري
CREATE OR REPLACE FUNCTION public.auto_cleanup_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  PERFORM public.cleanup_expired_user_sessions();
END;
$$;