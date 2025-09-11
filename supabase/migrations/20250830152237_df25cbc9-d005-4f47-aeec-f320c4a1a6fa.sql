-- إصلاح المشاكل الأمنية - حل مشكلة العروض (Views)

-- بما أن employee_basic_info و employee_directory هما عروض وليس جداول،
-- سنقوم بإنشاء دوال آمنة للوصول إليهما بدلاً من RLS

-- 1. دالة آمنة للحصول على المعلومات الأساسية للموظفين
CREATE OR REPLACE FUNCTION public.get_employee_basic_info_secure()
RETURNS TABLE(
  id uuid,
  name text,
  position text,
  department text,
  is_active boolean,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- تسجيل محاولة الوصول
  INSERT INTO public.advanced_security_logs (
    user_id, event_type, event_category, severity, description,
    metadata, success
  ) VALUES (
    auth.uid(),
    'sensitive_data_access',
    'data_access',
    'medium',
    'الوصول لمعلومات الموظفين الأساسية',
    jsonb_build_object(
      'table_name', 'employee_basic_info',
      'operation', 'SELECT',
      'accessed_at', now()
    ),
    true
  );

  -- إرجاع البيانات بناءً على الصلاحيات
  IF is_hr_manager() THEN
    -- مديرو الموارد البشرية يمكنهم رؤية جميع الموظفين
    RETURN QUERY
    SELECT 
      ebi.id,
      ebi.name,
      ebi.position,
      ebi.department,
      ebi.is_active,
      ebi.user_id
    FROM public.employee_basic_info ebi;
  ELSE
    -- الموظفون العاديون يرون بياناتهم فقط + بيانات فريقهم إذا كانوا مديرين
    RETURN QUERY
    SELECT 
      ebi.id,
      ebi.name,
      ebi.position,
      ebi.department,
      ebi.is_active,
      ebi.user_id
    FROM public.employee_basic_info ebi
    WHERE ebi.user_id = auth.uid()
       OR is_department_manager_for_employee(ebi.user_id, ebi.department);
  END IF;
END;
$function$;

-- 2. دالة آمنة للحصول على دليل الموظفين
CREATE OR REPLACE FUNCTION public.get_employee_directory_secure()
RETURNS TABLE(
  id uuid,
  name text,
  position text,
  department text,
  phone text,
  email text,
  hire_date date,
  is_active boolean,
  user_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- تسجيل محاولة الوصول
  INSERT INTO public.advanced_security_logs (
    user_id, event_type, event_category, severity, description,
    metadata, success
  ) VALUES (
    auth.uid(),
    'sensitive_data_access',
    'data_access',
    'medium',
    'الوصول لدليل الموظفين',
    jsonb_build_object(
      'table_name', 'employee_directory',
      'operation', 'SELECT',
      'accessed_at', now()
    ),
    true
  );

  -- إرجاع البيانات بناءً على الصلاحيات
  IF is_hr_manager() THEN
    -- مديرو الموارد البشرية يمكنهم رؤية جميع التفاصيل
    RETURN QUERY
    SELECT 
      ed.id,
      ed.name,
      ed.position,
      ed.department,
      ed.phone,
      ed.email,
      ed.hire_date,
      ed.is_active,
      ed.user_id
    FROM public.employee_directory ed;
  ELSE
    -- الموظفون العاديون يرون معلومات محدودة
    RETURN QUERY
    SELECT 
      ed.id,
      ed.name,
      ed.position,
      ed.department,
      CASE 
        WHEN ed.user_id = auth.uid() OR is_department_manager_for_employee(ed.user_id, ed.department)
        THEN ed.phone 
        ELSE NULL::text 
      END as phone,
      CASE 
        WHEN ed.user_id = auth.uid() OR is_department_manager_for_employee(ed.user_id, ed.department)
        THEN ed.email 
        ELSE NULL::text 
      END as email,
      ed.hire_date,
      ed.is_active,
      ed.user_id
    FROM public.employee_directory ed
    WHERE ed.user_id = auth.uid()
       OR is_department_manager_for_employee(ed.user_id, ed.department)
       OR is_hr_manager();
  END IF;
END;
$function$;

-- 3. دالة للتحقق من أمان كلمات المرور (محاكاة التحقق من التسريب)
CREATE OR REPLACE FUNCTION public.check_password_security(password_hash text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  security_score integer := 100;
  issues jsonb := '[]'::jsonb;
BEGIN
  -- فحص قوة كلمة المرور (محاكاة بسيطة)
  
  -- فحص الطول
  IF length(password_hash) < 60 THEN
    security_score := security_score - 30;
    issues := issues || jsonb_build_object('issue', 'weak_hash', 'description', 'كلمة مرور ضعيفة');
  END IF;
  
  -- تسجيل فحص كلمة المرور
  INSERT INTO public.advanced_security_logs (
    user_id, event_type, event_category, severity, description,
    metadata, success
  ) VALUES (
    auth.uid(),
    'password_security_check',
    'authentication',
    'low',
    'فحص أمان كلمة المرور',
    jsonb_build_object(
      'security_score', security_score,
      'issues_found', jsonb_array_length(issues)
    ),
    true
  );
  
  RETURN jsonb_build_object(
    'security_score', security_score,
    'issues', issues,
    'is_secure', CASE WHEN security_score >= 70 THEN true ELSE false END
  );
END;
$function$;

-- 4. دالة للتحقق من النشاط المشبوه المحسنة
CREATE OR REPLACE FUNCTION public.enhanced_suspicious_activity_check(
  p_ip_address inet,
  p_email text DEFAULT NULL,
  p_activity_type text DEFAULT 'login_attempt'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  activity_count integer := 0;
  is_blocked boolean := false;
  risk_level text := 'low';
  block_duration interval;
BEGIN
  -- فحص النشاط الحالي
  SELECT 
    COALESCE(attempt_count, 0),
    COALESCE(sa.is_blocked, false)
  INTO activity_count, is_blocked
  FROM public.suspicious_activities sa
  WHERE sa.ip_address = p_ip_address 
    AND (p_email IS NULL OR sa.email = p_email)
    AND sa.activity_type = p_activity_type
    AND (sa.blocked_until IS NULL OR sa.blocked_until > now());
  
  -- تحديد مستوى المخاطر
  IF activity_count >= 10 THEN
    risk_level := 'critical';
    block_duration := '24 hours';
  ELSIF activity_count >= 5 THEN
    risk_level := 'high';
    block_duration := '1 hour';
  ELSIF activity_count >= 3 THEN
    risk_level := 'medium';
    block_duration := '15 minutes';
  END IF;
  
  -- تسجيل الفحص
  INSERT INTO public.advanced_security_logs (
    user_id, event_type, event_category, severity, description,
    metadata, success
  ) VALUES (
    auth.uid(),
    'suspicious_activity_check',
    'security_monitoring',
    risk_level,
    'فحص النشاط المشبوه',
    jsonb_build_object(
      'ip_address', p_ip_address,
      'email', p_email,
      'activity_type', p_activity_type,
      'attempt_count', activity_count,
      'risk_level', risk_level,
      'is_blocked', is_blocked
    ),
    true
  );
  
  RETURN jsonb_build_object(
    'is_suspicious', CASE WHEN activity_count >= 3 THEN true ELSE false END,
    'is_blocked', is_blocked,
    'attempt_count', activity_count,
    'risk_level', risk_level,
    'recommended_action', CASE 
      WHEN activity_count >= 5 THEN 'block_user'
      WHEN activity_count >= 3 THEN 'require_captcha'
      ELSE 'monitor'
    END
  );
END;
$function$;