-- إضافة حقل deleted_at لجدول العملاء لدعم الحذف الناعم
ALTER TABLE public.customers ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- إنشاء دالة للحصول على العملاء المحذوفين
CREATE OR REPLACE FUNCTION public.get_deleted_customers(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(id uuid, name text, email text, phone text, address text, deleted_at timestamp with time zone, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب عملائه الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    RETURN QUERY 
    SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.address,
        c.deleted_at,
        c.created_at
    FROM customers c
    WHERE c.user_id = p_user_id 
    AND c.deleted_at IS NOT NULL
    AND c.deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
    ORDER BY c.deleted_at DESC;
END;
$function$;

-- إنشاء دالة استعادة جميع العملاء المحذوفين
CREATE OR REPLACE FUNCTION public.restore_deleted_customers(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(restored_count integer, customers jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_count integer;
    v_customers jsonb;
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة عملائه الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- جلب العملاء المحذوفين خلال فترة محددة
    WITH deleted_customers AS (
        SELECT *
        FROM customers
        WHERE user_id = p_user_id 
        AND deleted_at IS NOT NULL
        AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
        ORDER BY deleted_at DESC
    )
    SELECT COUNT(*), json_agg(to_json(deleted_customers.*))
    INTO v_count, v_customers
    FROM deleted_customers;
    
    -- استعادة العملاء (إزالة تاريخ الحذف)
    UPDATE customers 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE user_id = p_user_id 
    AND deleted_at IS NOT NULL
    AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back;
    
    RETURN QUERY SELECT v_count, COALESCE(v_customers, '[]'::jsonb);
END;
$function$;

-- إنشاء دالة استعادة عميل واحد
CREATE OR REPLACE FUNCTION public.restore_single_customer(p_user_id uuid, p_customer_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة عميله الخاص
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- التحقق من وجود العميل وأنه محذوف بالفعل
    IF NOT EXISTS (
        SELECT 1 FROM customers 
        WHERE id = p_customer_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT false, 'العميل غير موجود أو لم يتم حذفه'::text;
        RETURN;
    END IF;
    
    -- استعادة العميل (إزالة تاريخ الحذف)
    UPDATE customers 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = p_customer_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, 'تم استعادة العميل بنجاح'::text;
END;
$function$;

-- إنشاء دالة الحذف النهائي لعميل واحد
CREATE OR REPLACE FUNCTION public.permanently_delete_customer(p_user_id uuid, p_customer_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب حذف عميله الخاص
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- التحقق من وجود العميل وأنه محذوف بالفعل
    IF NOT EXISTS (
        SELECT 1 FROM customers 
        WHERE id = p_customer_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT false, 'العميل غير موجود أو لم يتم حذفه بعد'::text;
        RETURN;
    END IF;
    
    -- حذف العميل نهائياً
    DELETE FROM customers 
    WHERE id = p_customer_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, 'تم حذف العميل نهائياً'::text;
END;
$function$;