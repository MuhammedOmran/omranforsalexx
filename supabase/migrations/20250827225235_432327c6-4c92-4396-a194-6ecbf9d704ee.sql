-- إنشاء جدول لتسجيل الأحداث الأمنية المتقدمة  
CREATE TABLE IF NOT EXISTS public.advanced_security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_category TEXT NOT NULL, -- 'auth', 'data_access', 'permission_change', 'system'
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  device_fingerprint TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '1 year')
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_advanced_security_logs_user_id ON public.advanced_security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_advanced_security_logs_event_type ON public.advanced_security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_advanced_security_logs_severity ON public.advanced_security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_advanced_security_logs_created_at ON public.advanced_security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_advanced_security_logs_risk_score ON public.advanced_security_logs(risk_score);

-- جدول لتتبع محاولات تسجيل الدخول المشبوهة
CREATE TABLE IF NOT EXISTS public.suspicious_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL,
  email TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'failed_login', 'brute_force', 'suspicious_location', etc.
  attempt_count INTEGER DEFAULT 1,
  first_attempt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_attempt TIMESTAMP WITH TIME ZONE DEFAULT now(),
  blocked_until TIMESTAMP WITH TIME ZONE,
  is_blocked BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_ip ON public.suspicious_activities(ip_address);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_email ON public.suspicious_activities(email);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_user_id ON public.suspicious_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_suspicious_activities_blocked ON public.suspicious_activities(is_blocked);

-- جدول لتتبع الجلسات النشطة
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  platform TEXT,
  browser_info JSONB DEFAULT '{}',
  ip_address INET,
  location_info JSONB DEFAULT '{}',  
  is_active BOOLEAN DEFAULT true,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_token ON public.active_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_active_sessions_is_active ON public.active_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_active_sessions_expires_at ON public.active_sessions(expires_at);

-- تفعيل RLS لجميع الجداول الجديدة
ALTER TABLE public.advanced_security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suspicious_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للـ advanced_security_logs
CREATE POLICY "Admins can view all security logs" ON public.advanced_security_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "System can insert security logs" ON public.advanced_security_logs
  FOR INSERT WITH CHECK (true);

-- سياسات RLS للـ suspicious_activities
CREATE POLICY "Admins can view suspicious activities" ON public.suspicious_activities
  FOR SELECT USING (is_admin());

CREATE POLICY "System can manage suspicious activities" ON public.suspicious_activities
  FOR ALL USING (is_admin());

-- سياسات RLS للـ active_sessions
CREATE POLICY "Users can view their own sessions" ON public.active_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" ON public.active_sessions
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can manage sessions" ON public.active_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update sessions" ON public.active_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- تحديث الدالة المحدثة للـ updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لتنظيف السجلات القديمة
CREATE OR REPLACE FUNCTION public.cleanup_old_security_logs()
RETURNS void AS $$
BEGIN
  -- حذف سجلات الأمان المنتهية الصلاحية
  DELETE FROM public.advanced_security_logs 
  WHERE expires_at < now();
  
  -- حذف الأنشطة المشبوهة القديمة (أكثر من 30 يوم)
  DELETE FROM public.suspicious_activities 
  WHERE created_at < now() - INTERVAL '30 days' AND NOT is_blocked;
  
  -- حذف الجلسات المنتهية الصلاحية
  DELETE FROM public.active_sessions 
  WHERE expires_at < now() OR NOT is_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- جدولة تنظيف أسبوعية (يتطلب pg_cron extension)
-- SELECT cron.schedule('cleanup-security-logs', '0 0 * * 0', 'SELECT public.cleanup_old_security_logs();');

-- دالة للتحقق من الأنشطة المشبوهة
CREATE OR REPLACE FUNCTION public.is_suspicious_activity(
  p_ip_address INET,
  p_email TEXT DEFAULT NULL,
  p_activity_type TEXT DEFAULT 'failed_login'
)
RETURNS BOOLEAN AS $$
DECLARE
  activity_count INTEGER;
  is_blocked BOOLEAN;
BEGIN
  -- التحقق من وجود نشاط مشبوه
  SELECT attempt_count, COALESCE(is_blocked, false) 
  INTO activity_count, is_blocked
  FROM public.suspicious_activities 
  WHERE ip_address = p_ip_address 
    AND (p_email IS NULL OR email = p_email)
    AND activity_type = p_activity_type
    AND (blocked_until IS NULL OR blocked_until > now());
    
  -- إذا كان محظور أو تجاوز الحد المسموح
  RETURN (is_blocked = true OR activity_count >= 5);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;