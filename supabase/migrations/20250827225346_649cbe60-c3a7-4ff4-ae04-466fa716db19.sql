-- إصلاح مشاكل الدوال الأمنية بإضافة search_path
ALTER FUNCTION public.cleanup_old_security_logs() SET search_path = 'public';
ALTER FUNCTION public.is_suspicious_activity(INET, TEXT, TEXT) SET search_path = 'public';
ALTER FUNCTION public.handle_updated_at() SET search_path = 'public';

-- إنشاء دالة آمنة لتسجيل الأحداث الأمنية
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_event_category TEXT,
  p_severity TEXT,
  p_description TEXT,
  p_metadata JSONB DEFAULT '{}',
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_fingerprint TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_risk_score INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.advanced_security_logs (
    user_id, event_type, event_category, severity, description, 
    metadata, ip_address, user_agent, device_fingerprint, 
    success, risk_score
  ) VALUES (
    p_user_id, p_event_type, p_event_category, p_severity, p_description,
    p_metadata, p_ip_address, p_user_agent, p_device_fingerprint,
    p_success, p_risk_score
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- دالة لإدارة المحاولات المشبوهة
CREATE OR REPLACE FUNCTION public.handle_suspicious_activity(
  p_ip_address INET,
  p_email TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_activity_type TEXT DEFAULT 'failed_login',
  p_metadata JSONB DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
  activity_record public.suspicious_activities%ROWTYPE;
  is_now_blocked BOOLEAN := false;
BEGIN
  -- البحث عن السجل الموجود
  SELECT * INTO activity_record
  FROM public.suspicious_activities 
  WHERE ip_address = p_ip_address 
    AND (p_email IS NULL OR email = p_email)
    AND activity_type = p_activity_type;
    
  IF activity_record.id IS NOT NULL THEN
    -- تحديث السجل الموجود
    UPDATE public.suspicious_activities 
    SET 
      attempt_count = attempt_count + 1,
      last_attempt = now(),
      user_id = COALESCE(p_user_id, user_id),
      metadata = p_metadata,
      is_blocked = CASE 
        WHEN attempt_count + 1 >= 5 THEN true 
        ELSE is_blocked 
      END,
      blocked_until = CASE 
        WHEN attempt_count + 1 >= 5 THEN now() + INTERVAL '30 minutes'
        ELSE blocked_until 
      END
    WHERE id = activity_record.id;
    
    is_now_blocked := (activity_record.attempt_count + 1 >= 5);
  ELSE
    -- إنشاء سجل جديد
    INSERT INTO public.suspicious_activities (
      ip_address, email, user_id, activity_type, metadata
    ) VALUES (
      p_ip_address, p_email, p_user_id, p_activity_type, p_metadata
    );
  END IF;
  
  RETURN is_now_blocked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- دالة للتحقق من صحة الجلسة
CREATE OR REPLACE FUNCTION public.validate_session(
  p_session_token TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  session_valid BOOLEAN := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.active_sessions 
    WHERE session_token = p_session_token 
      AND user_id = p_user_id 
      AND is_active = true 
      AND expires_at > now()
  ) INTO session_valid;
  
  -- تحديث آخر نشاط إذا كانت الجلسة صالحة
  IF session_valid THEN
    UPDATE public.active_sessions 
    SET last_activity = now() 
    WHERE session_token = p_session_token AND user_id = p_user_id;
  END IF;
  
  RETURN session_valid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- إنشاء مؤشرات إضافية للأداء
CREATE INDEX IF NOT EXISTS idx_advanced_security_logs_composite 
ON public.advanced_security_logs(user_id, event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_suspicious_activities_composite 
ON public.suspicious_activities(ip_address, email, is_blocked);

CREATE INDEX IF NOT EXISTS idx_active_sessions_composite 
ON public.active_sessions(user_id, is_active, last_activity);