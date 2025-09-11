-- إنشاء دالة لاستعادة جميع الشيكات المحذوفة
CREATE OR REPLACE FUNCTION public.restore_all_deleted_checks(p_user_id uuid)
RETURNS TABLE(restored_count integer, total_amount numeric, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_count INTEGER;
    v_total_amount NUMERIC;
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة شيكاته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- حساب العدد والمبلغ الإجمالي للشيكات المحذوفة
    SELECT COUNT(*), COALESCE(SUM(amount), 0)
    INTO v_count, v_total_amount
    FROM public.checks
    WHERE user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إذا لم توجد شيكات محذوفة
    IF v_count = 0 THEN
        RETURN QUERY SELECT 0, 0::numeric, 'لا توجد شيكات محذوفة للاستعادة'::text;
        RETURN;
    END IF;
    
    -- استعادة جميع الشيكات المحذوفة (إزالة تاريخ الحذف)
    UPDATE public.checks 
    SET deleted_at = NULL, updated_at = now()
    WHERE user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع النتيجة
    RETURN QUERY SELECT v_count, v_total_amount, 'تم استعادة جميع الشيكات المحذوفة بنجاح'::text;
END;
$function$;