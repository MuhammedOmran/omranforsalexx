-- إصلاح مشاكل الأمان في التطبيق

-- 1. إضافة سياسات RLS للجداول المفقودة
ALTER TABLE public.employee_basic_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_directory ENABLE ROW LEVEL SECURITY;

-- 2. إنشاء سياسات أمان لجدول employee_basic_info
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

-- 3. إنشاء سياسات أمان لجدول employee_directory
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

-- 4. تحسين الأمان للعمليات الحساسة
CREATE OR REPLACE FUNCTION public.log_sensitive_operation(
  p_operation_type text,
  p_table_name text,
  p_description text,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.advanced_security_logs (
    user_id, event_type, event_category, severity, description, metadata
  ) VALUES (
    auth.uid(),
    p_operation_type,
    'data_access',
    'high',
    p_description,
    p_metadata
  );
END;
$$;

-- 5. إنشاء trigger لتسجيل العمليات الحساسة على بيانات الموظفين
CREATE OR REPLACE FUNCTION public.audit_employee_operations()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- تسجيل العمليات على بيانات الموظفين
  IF TG_OP = 'DELETE' THEN
    PERFORM public.log_sensitive_operation(
      'employee_data_delete',
      TG_TABLE_NAME,
      'حذف بيانات موظف: ' || OLD.name,
      jsonb_build_object(
        'employee_id', OLD.id,
        'employee_name', OLD.name,
        'operation', TG_OP
      )
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM public.log_sensitive_operation(
      'employee_data_update',
      TG_TABLE_NAME,
      'تحديث بيانات موظف: ' || NEW.name,
      jsonb_build_object(
        'employee_id', NEW.id,
        'employee_name', NEW.name,
        'operation', TG_OP
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    PERFORM public.log_sensitive_operation(
      'employee_data_create',
      TG_TABLE_NAME,
      'إنشاء بيانات موظف جديد: ' || NEW.name,
      jsonb_build_object(
        'employee_id', NEW.id,
        'employee_name', NEW.name,
        'operation', TG_OP
      )
    );
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$;

-- إضافة triggers للمراقبة
CREATE TRIGGER employee_basic_info_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_basic_info
  FOR EACH ROW EXECUTE FUNCTION public.audit_employee_operations();

CREATE TRIGGER employee_directory_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.employee_directory
  FOR EACH ROW EXECUTE FUNCTION public.audit_employee_operations();

-- 6. تحسين أمان كلمات المرور
CREATE OR REPLACE FUNCTION public.validate_password_strength(password text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  -- التحقق من طول كلمة المرور (8 أحرف على الأقل)
  IF length(password) < 8 THEN
    RETURN false;
  END IF;
  
  -- التحقق من وجود أحرف كبيرة وصغيرة وأرقام
  IF NOT (password ~ '[A-Z]' AND password ~ '[a-z]' AND password ~ '[0-9]') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 7. دالة للتحقق من محاولات تسجيل الدخول المشبوهة
CREATE OR REPLACE FUNCTION public.check_suspicious_login_pattern(
  p_ip_address inet,
  p_email text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  recent_attempts INTEGER;
  different_accounts INTEGER;
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
    AND created_at > now() - INTERVAL '1 hour';
    
  -- إذا كانت المحاولات أكثر من 10 أو الحسابات أكثر من 5، فهو مشبوه
  RETURN (recent_attempts > 10 OR different_accounts > 5);
END;
$$;

-- 8. دالة آمنة لإعادة تعيين كلمة المرور
CREATE OR REPLACE FUNCTION public.secure_password_reset(
  p_user_id uuid,
  p_reset_token text,
  p_new_password text
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  token_valid boolean := false;
BEGIN
  -- التحقق من صحة الرمز المميز (يجب تنفيذه حسب نظام الرموز المميزة)
  -- هذا مثال بسيط، يجب استبداله بالتحقق الفعلي
  
  -- التحقق من قوة كلمة المرور الجديدة
  IF NOT public.validate_password_strength(p_new_password) THEN
    RAISE EXCEPTION 'كلمة المرور ضعيفة - يجب أن تحتوي على 8 أحرف على الأقل وتشمل أحرف كبيرة وصغيرة وأرقام';
  END IF;
  
  -- تسجيل محاولة إعادة تعيين كلمة المرور
  PERFORM public.log_sensitive_operation(
    'password_reset_attempt',
    'auth',
    'محاولة إعادة تعيين كلمة المرور',
    jsonb_build_object(
      'user_id', p_user_id,
      'reset_token_provided', p_reset_token IS NOT NULL
    )
  );
  
  RETURN token_valid;
END;
$$;