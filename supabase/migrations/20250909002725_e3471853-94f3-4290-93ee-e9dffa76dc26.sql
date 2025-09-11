-- إضافة عمود deleted_at إلى جدول payroll_records
ALTER TABLE public.payroll_records 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- إنشاء function لجلب سجلات الرواتب المحذوفة
CREATE OR REPLACE FUNCTION public.get_deleted_payroll_records(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(
  id uuid,
  employee_name text,
  month integer,
  year integer,
  basic_salary numeric,
  allowances numeric,
  deductions numeric,
  net_salary numeric,
  is_paid boolean,
  payment_method text,
  deleted_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- التحقق من أن المستخدم يطلب سجلاته الخاصة
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized access';
  END IF;

  RETURN QUERY
  SELECT 
    pr.id,
    pr.employee_name,
    pr.month,
    pr.year,
    pr.basic_salary,
    pr.allowances,
    pr.deductions,
    pr.net_salary,
    pr.is_paid,
    pr.payment_method,
    pr.deleted_at,
    pr.created_at
  FROM payroll_records pr
  WHERE pr.user_id = p_user_id
    AND pr.deleted_at IS NOT NULL
    AND pr.deleted_at >= (CURRENT_TIMESTAMP - INTERVAL '1 day' * p_days_back)
  ORDER BY pr.deleted_at DESC;
END;
$function$;

-- إنشاء function لاستعادة سجل راتب واحد
CREATE OR REPLACE FUNCTION public.restore_single_payroll_record(p_user_id uuid, p_record_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_record_exists BOOLEAN := FALSE;
  v_employee_name TEXT;
  v_month INTEGER;
  v_year INTEGER;
BEGIN
  -- التحقق من وجود السجل ومن أنه محذوف
  SELECT EXISTS(
    SELECT 1 FROM payroll_records 
    WHERE id = p_record_id 
      AND user_id = p_user_id 
      AND deleted_at IS NOT NULL
  ), employee_name, month, year
  INTO v_record_exists, v_employee_name, v_month, v_year
  FROM payroll_records 
  WHERE id = p_record_id AND user_id = p_user_id;

  IF NOT v_record_exists THEN
    RETURN QUERY SELECT FALSE, 'السجل غير موجود أو غير محذوف'::TEXT;
    RETURN;
  END IF;

  -- استعادة السجل
  UPDATE payroll_records 
  SET deleted_at = NULL
  WHERE id = p_record_id AND user_id = p_user_id;

  RETURN QUERY SELECT TRUE, ('تم استعادة راتب ' || v_employee_name || ' لشهر ' || v_month || '/' || v_year)::TEXT;
END;
$function$;

-- إنشاء function لاستعادة جميع سجلات الرواتب
CREATE OR REPLACE FUNCTION public.restore_deleted_payroll_records(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(restored_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_restored_count INTEGER := 0;
BEGIN
  -- استعادة جميع السجلات المحذوفة في الفترة المحددة
  UPDATE payroll_records 
  SET deleted_at = NULL
  WHERE user_id = p_user_id
    AND deleted_at IS NOT NULL
    AND deleted_at >= (CURRENT_TIMESTAMP - INTERVAL '1 day' * p_days_back);

  GET DIAGNOSTICS v_restored_count = ROW_COUNT;

  RETURN QUERY SELECT v_restored_count, ('تم استعادة ' || v_restored_count || ' سجل راتب بنجاح')::TEXT;
END;
$function$;

-- إنشاء function للحذف النهائي لسجل راتب
CREATE OR REPLACE FUNCTION public.permanently_delete_payroll_record(p_user_id uuid, p_record_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_record_exists BOOLEAN := FALSE;
  v_employee_name TEXT;
  v_month INTEGER;
  v_year INTEGER;
BEGIN
  -- التحقق من وجود السجل ومن أنه محذوف
  SELECT EXISTS(
    SELECT 1 FROM payroll_records 
    WHERE id = p_record_id 
      AND user_id = p_user_id 
      AND deleted_at IS NOT NULL
  ), employee_name, month, year
  INTO v_record_exists, v_employee_name, v_month, v_year
  FROM payroll_records 
  WHERE id = p_record_id AND user_id = p_user_id;

  IF NOT v_record_exists THEN
    RETURN QUERY SELECT FALSE, 'السجل غير موجود أو غير محذوف'::TEXT;
    RETURN;
  END IF;

  -- حذف السجل نهائياً
  DELETE FROM payroll_records 
  WHERE id = p_record_id AND user_id = p_user_id;

  RETURN QUERY SELECT TRUE, ('تم حذف راتب ' || v_employee_name || ' لشهر ' || v_month || '/' || v_year || ' نهائياً')::TEXT;
END;
$function$;