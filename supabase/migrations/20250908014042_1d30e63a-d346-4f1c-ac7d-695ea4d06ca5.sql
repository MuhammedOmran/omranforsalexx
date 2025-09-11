-- إضافة عمود deleted_at للجدول installments لدعم الحذف المؤقت
ALTER TABLE public.installments ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- إضافة فهرس للبحث السريع في الأقساط المحذوفة
CREATE INDEX idx_installments_deleted_at ON public.installments(deleted_at) WHERE deleted_at IS NOT NULL;

-- وظيفة جلب الأقساط المحذوفة
CREATE OR REPLACE FUNCTION public.get_deleted_installments(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(
    id uuid,
    user_id uuid,
    customer_name text,
    customer_phone text,
    total_amount numeric,
    installment_amount numeric,
    start_date date,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب أقساطه الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    RETURN QUERY 
    SELECT 
        i.id,
        i.user_id,
        i.customer_name,
        i.customer_phone,
        i.total_amount,
        i.installment_amount,
        i.start_date,
        i.deleted_at,
        i.created_at
    FROM installments i
    WHERE i.user_id = p_user_id 
    AND i.deleted_at IS NOT NULL
    AND i.deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
    ORDER BY i.deleted_at DESC;
END;
$function$;

-- وظيفة استعادة الأقساط المحذوفة
CREATE OR REPLACE FUNCTION public.restore_deleted_installments(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(restored_count integer, installments jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_count integer;
    v_installments jsonb;
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة أقساطه الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- جلب الأقساط المحذوفة خلال فترة محددة
    WITH deleted_installments AS (
        SELECT *
        FROM installments
        WHERE user_id = p_user_id 
        AND deleted_at IS NOT NULL
        AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
        ORDER BY deleted_at DESC
    )
    SELECT COUNT(*), json_agg(to_json(deleted_installments.*))
    INTO v_count, v_installments
    FROM deleted_installments;
    
    -- استعادة الأقساط (إزالة تاريخ الحذف)
    UPDATE installments 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE user_id = p_user_id 
    AND deleted_at IS NOT NULL
    AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back;
    
    RETURN QUERY SELECT v_count, COALESCE(v_installments, '[]'::jsonb);
END;
$function$;

-- وظيفة الحذف النهائي لقسط واحد
CREATE OR REPLACE FUNCTION public.permanently_delete_installment(p_user_id uuid, p_installment_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب حذف قسطه الخاص
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- التحقق من وجود القسط وأنه محذوف بالفعل
    IF NOT EXISTS (
        SELECT 1 FROM installments 
        WHERE id = p_installment_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT false, 'القسط غير موجود أو لم يتم حذفه بعد'::text;
        RETURN;
    END IF;
    
    -- حذف المدفوعات المرتبطة بالقسط أولاً
    DELETE FROM installment_payments 
    WHERE installment_id = p_installment_id;
    
    -- حذف القسط نهائياً
    DELETE FROM installments 
    WHERE id = p_installment_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, 'تم حذف القسط نهائياً'::text;
END;
$function$;

-- وظيفة استعادة قسط واحد
CREATE OR REPLACE FUNCTION public.restore_single_installment(p_user_id uuid, p_installment_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة قسطه الخاص
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- التحقق من وجود القسط وأنه محذوف بالفعل
    IF NOT EXISTS (
        SELECT 1 FROM installments 
        WHERE id = p_installment_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT false, 'القسط غير موجود أو لم يتم حذفه'::text;
        RETURN;
    END IF;
    
    -- استعادة القسط (إزالة تاريخ الحذف)
    UPDATE installments 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = p_installment_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, 'تم استعادة القسط بنجاح'::text;
END;
$function$;