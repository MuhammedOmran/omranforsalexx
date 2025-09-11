-- إصلاح المشاكل الأمنية المتبقية

-- 1. إضافة search_path للدوال الموجودة لحل مشكلة Function Search Path Mutable
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 2. تحديث دالة تنظيف البيانات القديمة مع search_path
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

-- 3. إنشاء دالة لجدولة تنظيف البيانات الأمنية
CREATE OR REPLACE FUNCTION public.schedule_security_cleanup()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- هذه الدالة يمكن استدعاؤها من خلال cron job أو task scheduler
  PERFORM public.cleanup_security_data();
  
  -- تسجيل عملية التنظيف
  INSERT INTO public.advanced_security_logs (
    event_type, event_category, severity, description, metadata
  ) VALUES (
    'security_cleanup',
    'maintenance',
    'low',
    'تم تشغيل عملية تنظيف البيانات الأمنية',
    jsonb_build_object(
      'cleanup_time', now(),
      'automated', true
    )
  );
END;
$$;

-- 4. إنشاء دالة للحصول على تقرير الأمان اليومي
CREATE OR REPLACE FUNCTION public.get_daily_security_report()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  report jsonb := '{}'::jsonb;
  high_risk_events INTEGER := 0;
  failed_logins INTEGER := 0;
  blocked_ips INTEGER := 0;
  suspicious_activities INTEGER := 0;
BEGIN
  -- إحصائيات الأحداث عالية المخاطر
  SELECT COUNT(*) INTO high_risk_events
  FROM public.advanced_security_logs
  WHERE created_at >= CURRENT_DATE
    AND risk_score > 70;
    
  -- إحصائيات محاولات تسجيل الدخول الفاشلة
  SELECT COUNT(*) INTO failed_logins
  FROM public.advanced_security_logs
  WHERE created_at >= CURRENT_DATE
    AND event_type = 'login_failed';
    
  -- إحصائيات IPs المحظورة
  SELECT COUNT(*) INTO blocked_ips
  FROM public.suspicious_activities
  WHERE created_at >= CURRENT_DATE
    AND is_blocked = true;
    
  -- إحصائيات الأنشطة المشبوهة
  SELECT COUNT(*) INTO suspicious_activities
  FROM public.suspicious_activities
  WHERE created_at >= CURRENT_DATE;
  
  report := jsonb_build_object(
    'date', CURRENT_DATE,
    'high_risk_events', high_risk_events,
    'failed_logins', failed_logins,
    'blocked_ips', blocked_ips,
    'suspicious_activities', suspicious_activities,
    'security_status', 
      CASE 
        WHEN high_risk_events > 10 OR blocked_ips > 5 THEN 'تحذير عالي'
        WHEN high_risk_events > 5 OR blocked_ips > 2 THEN 'تحذير متوسط'
        ELSE 'آمن'
      END
  );
  
  RETURN report;
END;
$$;

-- 5. إنشاء دالة لفحص صحة النظام الأمني
CREATE OR REPLACE FUNCTION public.security_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  health_status jsonb := '{}'::jsonb;
  rls_tables_count INTEGER := 0;
  total_tables_count INTEGER := 0;
  recent_attacks INTEGER := 0;
BEGIN
  -- فحص عدد الجداول التي لديها RLS
  SELECT COUNT(*) INTO rls_tables_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname = 'public'
    AND c.relrowsecurity = true;
    
  -- عدد إجمالي الجداول في public schema
  SELECT COUNT(*) INTO total_tables_count
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname = 'public';
  
  -- فحص الهجمات الأخيرة
  SELECT COUNT(*) INTO recent_attacks
  FROM public.advanced_security_logs
  WHERE created_at > now() - INTERVAL '24 hours'
    AND risk_score > 80;
  
  health_status := jsonb_build_object(
    'rls_coverage', round((rls_tables_count::decimal / total_tables_count::decimal) * 100, 2),
    'rls_tables_count', rls_tables_count,
    'total_tables_count', total_tables_count,
    'recent_high_risk_events', recent_attacks,
    'last_check', now(),
    'overall_status',
      CASE 
        WHEN (rls_tables_count::decimal / total_tables_count::decimal) < 0.8 THEN 'يحتاج تحسين'
        WHEN recent_attacks > 5 THEN 'تحذير'
        ELSE 'جيد'
      END
  );
  
  RETURN health_status;
END;
$$;

-- 6. إنشاء دالة لحظر IP تلقائياً
CREATE OR REPLACE FUNCTION public.auto_block_suspicious_ip(p_ip_address inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  risk_analysis jsonb;
  should_block boolean := false;
BEGIN
  -- تحليل المخاطر للـ IP
  risk_analysis := public.analyze_login_security(p_ip_address);
  
  -- قرار الحظر التلقائي
  should_block := (risk_analysis->>'risk_score')::integer > 80;
  
  IF should_block THEN
    -- إضافة أو تحديث في جدول الأنشطة المشبوهة
    INSERT INTO public.suspicious_activities (
      ip_address, activity_type, is_blocked, blocked_until, metadata
    ) VALUES (
      p_ip_address,
      'auto_blocked',
      true,
      now() + INTERVAL '2 hours',
      risk_analysis
    ) ON CONFLICT (ip_address, activity_type) 
    DO UPDATE SET 
      is_blocked = true,
      blocked_until = now() + INTERVAL '2 hours',
      metadata = EXCLUDED.metadata;
      
    -- تسجيل الحدث
    PERFORM public.log_security_event_enhanced(
      'ip_auto_blocked',
      format('تم حظر IP %s تلقائياً بسبب النشاط المشبوه', p_ip_address),
      NULL,
      p_ip_address,
      NULL,
      risk_analysis,
      'high'
    );
  END IF;
  
  RETURN should_block;
END;
$$;

-- 7. إنشاء trigger لحظر IPs المشبوهة تلقائياً
CREATE OR REPLACE FUNCTION public.trigger_auto_block_check()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- فحص تلقائي للحظر عند إضافة أحداث أمنية جديدة
  IF NEW.risk_score > 80 AND NEW.ip_address IS NOT NULL THEN
    PERFORM public.auto_block_suspicious_ip(NEW.ip_address);
  END IF;
  
  RETURN NEW;
END;
$$;

-- إضافة trigger للمراقبة التلقائية
DROP TRIGGER IF EXISTS auto_block_trigger ON public.advanced_security_logs;
CREATE TRIGGER auto_block_trigger
  AFTER INSERT ON public.advanced_security_logs
  FOR EACH ROW 
  WHEN (NEW.risk_score > 80 AND NEW.ip_address IS NOT NULL)
  EXECUTE FUNCTION public.trigger_auto_block_check();