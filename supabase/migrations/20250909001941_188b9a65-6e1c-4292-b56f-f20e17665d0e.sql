-- إصلاح التحذيرات الأمنية للدوال المنشأة حديثاً

-- تحديث دالة جلب سجلات الرواتب المحذوفة
CREATE OR REPLACE FUNCTION get_deleted_payroll_records(
  p_user_id UUID,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  id UUID,
  employee_name TEXT,
  month INTEGER,
  year INTEGER,  
  basic_salary NUMERIC,
  allowances NUMERIC,
  deductions NUMERIC,
  net_salary NUMERIC,
  is_paid BOOLEAN,
  payment_method TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
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
$$;

-- تحديث دالة استعادة سجل راتب واحد
CREATE OR REPLACE FUNCTION restore_single_payroll_record(
  p_user_id UUID,
  p_record_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- تحديث دالة استعادة جميع سجلات الرواتب المحذوفة
CREATE OR REPLACE FUNCTION restore_deleted_payroll_records(
  p_user_id UUID,
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
  restored_count INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- تحديث دالة الحذف النهائي لسجل راتب
CREATE OR REPLACE FUNCTION permanently_delete_payroll_record(
  p_user_id UUID,
  p_record_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
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
$$;

-- تحديث دالة الحذف التدريجي لسجل راتب
CREATE OR REPLACE FUNCTION soft_delete_payroll_record(
  p_user_id UUID,
  p_record_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_record_exists BOOLEAN := FALSE;
  v_employee_name TEXT;
  v_month INTEGER;
  v_year INTEGER;
BEGIN
  -- التحقق من وجود السجل
  SELECT EXISTS(
    SELECT 1 FROM payroll_records 
    WHERE id = p_record_id 
      AND user_id = p_user_id 
      AND deleted_at IS NULL
  ), employee_name, month, year
  INTO v_record_exists, v_employee_name, v_month, v_year
  FROM payroll_records 
  WHERE id = p_record_id AND user_id = p_user_id;

  IF NOT v_record_exists THEN
    RETURN QUERY SELECT FALSE, 'السجل غير موجود أو محذوف مسبقاً'::TEXT;
    RETURN;
  END IF;

  -- تحديث deleted_at
  UPDATE payroll_records 
  SET deleted_at = CURRENT_TIMESTAMP
  WHERE id = p_record_id AND user_id = p_user_id;

  RETURN QUERY SELECT TRUE, ('تم حذف راتب ' || v_employee_name || ' لشهر ' || v_month || '/' || v_year)::TEXT;
END;
$$;