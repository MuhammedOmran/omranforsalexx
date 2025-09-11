-- إنشاء دالة لجلب الشيكات المحذوفة
CREATE OR REPLACE FUNCTION public.get_deleted_checks(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(
    id uuid,
    check_number text,
    amount numeric,
    customer_name text,
    bank_name text,
    due_date date,
    date_received date,
    status text,
    description text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب شيكاته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    RETURN QUERY 
    SELECT 
        c.id,
        c.check_number,
        c.amount,
        c.customer_name,
        c.bank_name,
        c.due_date,
        c.date_received,
        c.status,
        c.description,
        c.deleted_at,
        c.created_at
    FROM checks c
    WHERE c.user_id = p_user_id 
    AND c.deleted_at IS NOT NULL
    AND c.deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
    ORDER BY c.deleted_at DESC;
END;
$function$

-- إنشاء دالة لاستعادة الشيكات المحذوفة
CREATE OR REPLACE FUNCTION public.restore_deleted_check(p_user_id uuid, p_check_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة شيكه الخاص
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- التحقق من وجود الشيك وأنه محذوف بالفعل
    IF NOT EXISTS (
        SELECT 1 FROM checks 
        WHERE id = p_check_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT false, 'الشيك غير موجود أو لم يتم حذفه بعد'::text;
        RETURN;
    END IF;
    
    -- استعادة الشيك (إزالة تاريخ الحذف)
    UPDATE checks 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = p_check_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, 'تم استعادة الشيك بنجاح'::text;
END;
$function$

-- إنشاء دالة لاستعادة جميع الشيكات المحذوفة
CREATE OR REPLACE FUNCTION public.restore_all_deleted_checks(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(restored_count integer, checks_data jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_count integer;
    v_checks jsonb;
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة شيكاته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- جلب الشيكات المحذوفة خلال فترة محددة
    WITH deleted_checks AS (
        SELECT *
        FROM checks
        WHERE user_id = p_user_id 
        AND deleted_at IS NOT NULL
        AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
        ORDER BY deleted_at DESC
    )
    SELECT COUNT(*), json_agg(to_json(deleted_checks.*))
    INTO v_count, v_checks
    FROM deleted_checks;
    
    -- استعادة الشيكات (إزالة تاريخ الحذف)
    UPDATE checks 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE user_id = p_user_id 
    AND deleted_at IS NOT NULL
    AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back;
    
    RETURN QUERY SELECT v_count, COALESCE(v_checks, '[]'::jsonb);
END;
$function$