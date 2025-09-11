-- إنشاء دالة للحذف النهائي للمعاملات المحذوفة
CREATE OR REPLACE FUNCTION public.permanently_delete_transaction(p_user_id uuid, p_transaction_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب حذف معاملته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- التحقق من وجود المعاملة وأنها محذوفة بالفعل
    IF NOT EXISTS (
        SELECT 1 FROM cash_transactions 
        WHERE id = p_transaction_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT false, 'المعاملة غير موجودة أو لم يتم حذفها بعد'::text;
        RETURN;
    END IF;
    
    -- حذف المعاملة نهائياً
    DELETE FROM cash_transactions 
    WHERE id = p_transaction_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, 'تم حذف المعاملة نهائياً'::text;
END;
$function$;