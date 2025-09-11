-- إصلاح مشكلة search_path للدوال الموجودة
CREATE OR REPLACE FUNCTION public.get_deleted_transactions(p_user_id uuid, p_days_back integer DEFAULT 30)
 RETURNS TABLE(id uuid, transaction_type text, amount numeric, description text, category text, deleted_at timestamp with time zone, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب معاملاته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    RETURN QUERY 
    SELECT 
        ct.id,
        ct.transaction_type,
        ct.amount,
        ct.description,
        ct.category,
        ct.deleted_at,
        ct.created_at
    FROM public.cash_transactions ct
    WHERE ct.user_id = p_user_id 
    AND ct.deleted_at IS NOT NULL
    AND ct.deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
    ORDER BY ct.deleted_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restore_deleted_transactions(p_user_id uuid, p_days_back integer DEFAULT 30)
 RETURNS TABLE(restored_count integer, transactions jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_count integer;
    v_transactions jsonb;
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة معاملاته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- جلب المعاملات المحذوفة خلال فترة محددة
    WITH deleted_transactions AS (
        SELECT *
        FROM public.cash_transactions
        WHERE user_id = p_user_id 
        AND deleted_at IS NOT NULL
        AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
        ORDER BY deleted_at DESC
    )
    SELECT COUNT(*), json_agg(to_json(deleted_transactions.*))
    INTO v_count, v_transactions
    FROM deleted_transactions;
    
    -- استعادة المعاملات (إزالة تاريخ الحذف)
    UPDATE public.cash_transactions 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE user_id = p_user_id 
    AND deleted_at IS NOT NULL
    AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back;
    
    RETURN QUERY SELECT v_count, COALESCE(v_transactions, '[]'::jsonb);
END;
$function$;

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
        SELECT 1 FROM public.cash_transactions 
        WHERE id = p_transaction_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT false, 'المعاملة غير موجودة أو لم يتم حذفها بعد'::text;
        RETURN;
    END IF;
    
    -- حذف المعاملة نهائياً
    DELETE FROM public.cash_transactions 
    WHERE id = p_transaction_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, 'تم حذف المعاملة نهائياً'::text;
END;
$function$;