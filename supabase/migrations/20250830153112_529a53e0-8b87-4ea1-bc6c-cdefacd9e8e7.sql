-- إصلاح مشاكل الأمان - تحديث محسن

-- 1. حذف الـ views الحالية وإنشاء جداول حقيقية مع RLS
DROP VIEW IF EXISTS public.employee_basic_info;
DROP VIEW IF EXISTS public.employee_directory;

-- إنشاء جداول حقيقية بدلاً من views
CREATE TABLE public.employee_basic_info (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text,
  position text,
  department text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE public.employee_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text,
  position text,
  department text,
  phone text,
  email text,
  hire_date date,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.employee_basic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_directory ENABLE ROW LEVEL SECURITY;

-- 2. إنشاء سياسات أمان محسنة للموظفين

-- سياسات employee_basic_info
CREATE POLICY "HR managers can view basic employee info" 
ON public.employee_basic_info 
FOR SELECT 
USING (is_hr_manager() OR auth.uid() = user_id);

CREATE POLICY "HR managers can insert basic employee info" 
ON public.employee_basic_info 
FOR INSERT 
WITH CHECK (is_hr_manager());

CREATE POLICY "HR managers can update basic employee info" 
ON public.employee_basic_info 
FOR UPDATE 
USING (is_hr_manager());

CREATE POLICY "HR managers can delete basic employee info" 
ON public.employee_basic_info 
FOR DELETE 
USING (is_hr_manager());

-- سياسات employee_directory
CREATE POLICY "HR managers can view employee directory" 
ON public.employee_directory 
FOR SELECT 
USING (is_hr_manager() OR auth.uid() = user_id);

CREATE POLICY "HR managers can insert employee directory" 
ON public.employee_directory 
FOR INSERT 
WITH CHECK (is_hr_manager());

CREATE POLICY "HR managers can update employee directory" 
ON public.employee_directory 
FOR UPDATE 
USING (is_hr_manager());

CREATE POLICY "HR managers can delete employee directory" 
ON public.employee_directory 
FOR DELETE 
USING (is_hr_manager());

-- 3. تحسين أمان كلمات المرور مع دوال محسنة
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  result jsonb := '{"valid": false, "errors": []}'::jsonb;
  errors text[] := array[]::text[];
BEGIN
  -- التحقق من طول كلمة المرور (8 أحرف على الأقل)
  IF length(password) < 8 THEN
    errors := array_append(errors, 'يجب أن تكون كلمة المرور 8 أحرف على الأقل');
  END IF;
  
  -- التحقق من وجود أحرف كبيرة
  IF NOT (password ~ '[A-Z]') THEN
    errors := array_append(errors, 'يجب أن تحتوي على حرف كبير واحد على الأقل');
  END IF;
  
  -- التحقق من وجود أحرف صغيرة  
  IF NOT (password ~ '[a-z]') THEN
    errors := array_append(errors, 'يجب أن تحتوي على حرف صغير واحد على الأقل');
  END IF;
  
  -- التحقق من وجود أرقام
  IF NOT (password ~ '[0-9]') THEN
    errors := array_append(errors, 'يجب أن تحتوي على رقم واحد على الأقل');
  END IF;
  
  -- التحقق من وجود رموز خاصة
  IF NOT (password ~ '[!@#$%^&*(),.?":{}|<>]') THEN
    errors := array_append(errors, 'يجب أن تحتوي على رمز خاص واحد على الأقل');
  END IF;
  
  -- التحقق من عدم احتواء كلمات شائعة
  IF lower(password) = ANY(ARRAY['password', '123456', 'admin', 'user', 'test']) THEN
    errors := array_append(errors, 'كلمة المرور بسيطة جداً');
  END IF;
  
  IF array_length(errors, 1) IS NULL THEN
    result := '{"valid": true, "errors": []}'::jsonb;
  ELSE
    result := jsonb_build_object('valid', false, 'errors', errors);
  END IF;
  
  RETURN result;
END;
$$;

-- 4. دالة محسنة لفحص محاولات تسجيل الدخول المشبوهة
CREATE OR REPLACE FUNCTION public.analyze_login_security(
  p_ip_address inet,
  p_email text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_attempts INTEGER := 0;
  different_accounts INTEGER := 0;
  suspicious_patterns INTEGER := 0;
  risk_score INTEGER := 0;
  result jsonb;
BEGIN
  -- فحص عدد المحاولات الأخيرة من نفس IP
  SELECT COUNT(*) INTO recent_attempts
  FROM public.advanced_security_logs
  WHERE ip_address = p_ip_address
    AND event_type IN ('login_attempt', 'login_failed')
    AND created_at > now() - INTERVAL '1 hour';
    
  -- فحص عدد الحسابات المختلفة من نفس IP
  SELECT COUNT(DISTINCT metadata->>'email') INTO different_accounts
  FROM public.advanced_security_logs
  WHERE ip_address = p_ip_address
    AND event_type IN ('login_attempt', 'login_failed')
    AND created_at > now() - INTERVAL '1 hour'
    AND metadata->>'email' IS NOT NULL;
    
  -- فحص الأنماط المشبوهة
  SELECT COUNT(*) INTO suspicious_patterns
  FROM public.advanced_security_logs
  WHERE ip_address = p_ip_address
    AND event_type = 'suspicious_activity'
    AND created_at > now() - INTERVAL '24 hours';
    
  -- حساب نقاط المخاطر
  risk_score := 0;
  
  IF recent_attempts > 5 THEN
    risk_score := risk_score + 30;
  END IF;
  
  IF different_accounts > 3 THEN
    risk_score := risk_score + 40;
  END IF;
  
  IF suspicious_patterns > 0 THEN
    risk_score := risk_score + 20;
  END IF;
  
  -- فحص User Agent المشبوه
  IF p_user_agent IS NULL OR length(p_user_agent) < 10 THEN
    risk_score := risk_score + 10;
  END IF;
  
  result := jsonb_build_object(
    'risk_score', risk_score,
    'is_suspicious', risk_score > 50,
    'recent_attempts', recent_attempts,
    'different_accounts', different_accounts,
    'suspicious_patterns', suspicious_patterns,
    'recommendation', 
      CASE 
        WHEN risk_score > 80 THEN 'حظر فوري'
        WHEN risk_score > 50 THEN 'مراقبة مشددة'
        WHEN risk_score > 30 THEN 'مراقبة عادية'
        ELSE 'آمن'
      END
  );
  
  RETURN result;
END;
$$;

-- 5. دالة آمنة لتسجيل الأحداث الأمنية
CREATE OR REPLACE FUNCTION public.log_security_event_enhanced(
  p_event_type text,
  p_description text,
  p_user_id uuid DEFAULT auth.uid(),
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb,
  p_severity text DEFAULT 'medium'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  event_id uuid;
  risk_analysis jsonb;
BEGIN
  -- تحليل المخاطر إذا كان هناك IP
  IF p_ip_address IS NOT NULL THEN
    risk_analysis := public.analyze_login_security(p_ip_address, p_metadata->>'email', p_user_agent);
  ELSE
    risk_analysis := '{}'::jsonb;
  END IF;
  
  -- إدراج الحدث مع تحليل المخاطر
  INSERT INTO public.advanced_security_logs (
    user_id, event_type, event_category, severity, description,
    metadata, ip_address, user_agent, risk_score
  ) VALUES (
    p_user_id,
    p_event_type,
    'security_event',
    p_severity,
    p_description,
    p_metadata || risk_analysis,
    p_ip_address,
    p_user_agent,
    COALESCE((risk_analysis->>'risk_score')::integer, 0)
  ) RETURNING id INTO event_id;
  
  -- إذا كان الحدث عالي المخاطر، سجل في جدول الأنشطة المشبوهة
  IF COALESCE((risk_analysis->>'risk_score')::integer, 0) > 50 THEN
    INSERT INTO public.suspicious_activities (
      ip_address, user_id, activity_type, metadata,
      attempt_count, is_blocked
    ) VALUES (
      p_ip_address,
      p_user_id,
      p_event_type,
      p_metadata || risk_analysis,
      1,
      COALESCE((risk_analysis->>'risk_score')::integer, 0) > 80
    ) ON CONFLICT (ip_address, activity_type) 
    DO UPDATE SET 
      attempt_count = suspicious_activities.attempt_count + 1,
      last_attempt = now(),
      metadata = EXCLUDED.metadata,
      is_blocked = EXCLUDED.is_blocked OR suspicious_activities.is_blocked;
  END IF;
  
  RETURN event_id;
END;
$$;

-- 6. trigger محسن لمراقبة العمليات الحساسة
CREATE OR REPLACE FUNCTION public.audit_sensitive_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  operation_type text;
  table_name text := TG_TABLE_NAME;
  record_info jsonb := '{}'::jsonb;
BEGIN
  operation_type := lower(TG_OP);
  
  -- تحديد معلومات السجل حسب نوع العملية
  IF TG_OP = 'DELETE' THEN
    record_info := to_jsonb(OLD);
    PERFORM public.log_security_event_enhanced(
      'sensitive_data_delete',
      format('حذف سجل من جدول %s', table_name),
      auth.uid(),
      inet_client_addr(),
      current_setting('request.headers', true)::jsonb->>'user-agent',
      jsonb_build_object(
        'table_name', table_name,
        'operation', TG_OP,
        'deleted_record', record_info
      ),
      'high'
    );
    RETURN OLD;
    
  ELSIF TG_OP = 'UPDATE' THEN
    record_info := jsonb_build_object(
      'old_values', to_jsonb(OLD),
      'new_values', to_jsonb(NEW)
    );
    PERFORM public.log_security_event_enhanced(
      'sensitive_data_update',
      format('تحديث سجل في جدول %s', table_name),
      auth.uid(),
      inet_client_addr(),
      current_setting('request.headers', true)::jsonb->>'user-agent',
      jsonb_build_object(
        'table_name', table_name,
        'operation', TG_OP,
        'changes', record_info
      ),
      'medium'
    );
    RETURN NEW;
    
  ELSIF TG_OP = 'INSERT' THEN
    record_info := to_jsonb(NEW);
    PERFORM public.log_security_event_enhanced(
      'sensitive_data_create',
      format('إنشاء سجل جديد في جدول %s', table_name),
      auth.uid(),
      inet_client_addr(),
      current_setting('request.headers', true)::jsonb->>'user-agent',
      jsonb_build_object(
        'table_name', table_name,
        'operation', TG_OP,
        'new_record', record_info
      ),
      'low'
    );
    RETURN NEW;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- إضافة triggers للجداول الحساسة
CREATE TRIGGER employees_security_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

CREATE TRIGGER employee_basic_info_security_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_basic_info
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

CREATE TRIGGER employee_directory_security_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_directory
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_operations();

-- 7. إنشاء index لتحسين الأداء الأمني
CREATE INDEX IF NOT EXISTS idx_security_logs_user_time 
ON public.advanced_security_logs(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_security_logs_ip_time 
ON public.advanced_security_logs(ip_address, created_at);

CREATE INDEX IF NOT EXISTS idx_security_logs_risk_score 
ON public.advanced_security_logs(risk_score) WHERE risk_score > 50;

CREATE INDEX IF NOT EXISTS idx_suspicious_activities_ip 
ON public.suspicious_activities(ip_address, created_at);

-- 8. دالة تنظيف البيانات القديمة
CREATE OR REPLACE FUNCTION public.cleanup_security_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- حذف سجلات الأمان القديمة (أكثر من 90 يوم للسجلات العادية)
  DELETE FROM public.advanced_security_logs 
  WHERE created_at < now() - INTERVAL '90 days' 
    AND severity NOT IN ('high', 'critical');
  
  -- حذف السجلات عالية الخطورة القديمة (أكثر من سنة)
  DELETE FROM public.advanced_security_logs 
  WHERE created_at < now() - INTERVAL '1 year';
  
  -- حذف الأنشطة المشبوهة المحلولة القديمة
  DELETE FROM public.suspicious_activities 
  WHERE created_at < now() - INTERVAL '30 days' 
    AND NOT is_blocked;
  
  -- إعادة تعيين محاولات تسجيل الدخول القديمة
  UPDATE public.suspicious_activities 
  SET attempt_count = 0, is_blocked = false, blocked_until = NULL
  WHERE last_attempt < now() - INTERVAL '24 hours' 
    AND is_blocked = true;
END;
$$;