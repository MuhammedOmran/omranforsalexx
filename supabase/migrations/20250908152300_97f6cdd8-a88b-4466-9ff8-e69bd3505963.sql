-- إنشاء وظائف استعادة فواتير الشراء المحذوفة

-- وظيفة جلب فواتير الشراء المحذوفة
CREATE OR REPLACE FUNCTION public.get_deleted_purchase_invoices(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(
    id uuid, 
    invoice_number text, 
    supplier_name text, 
    total_amount numeric, 
    status text, 
    deleted_at timestamp with time zone, 
    created_at timestamp with time zone,
    suppliers record
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب فواتيره الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    RETURN QUERY 
    SELECT 
        pi.id,
        pi.invoice_number,
        pi.supplier_name,
        pi.total_amount,
        pi.status,
        pi.deleted_at,
        pi.created_at,
        ROW(s.name, s.phone)::record as suppliers
    FROM purchase_invoices pi
    LEFT JOIN suppliers s ON pi.supplier_id = s.id
    WHERE pi.user_id = p_user_id 
    AND pi.deleted_at IS NOT NULL
    AND pi.deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
    ORDER BY pi.deleted_at DESC;
END;
$function$;

-- وظيفة استعادة فاتورة شراء واحدة
CREATE OR REPLACE FUNCTION public.restore_single_purchase_invoice(p_user_id uuid, p_invoice_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة فاتورته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- التحقق من وجود فاتورة الشراء وأنها محذوفة بالفعل
    IF NOT EXISTS (
        SELECT 1 FROM purchase_invoices 
        WHERE id = p_invoice_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT false, 'فاتورة الشراء غير موجودة أو لم يتم حذفها'::text;
        RETURN;
    END IF;
    
    -- استعادة فاتورة الشراء (إزالة تاريخ الحذف)
    UPDATE purchase_invoices 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = p_invoice_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, 'تم استعادة فاتورة الشراء بنجاح'::text;
END;
$function$;

-- وظيفة استعادة جميع فواتير الشراء المحذوفة
CREATE OR REPLACE FUNCTION public.restore_deleted_purchase_invoices(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(restored_count integer, invoices jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    v_count integer;
    v_invoices jsonb;
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة فواتيره الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- جلب فواتير الشراء المحذوفة خلال فترة محددة
    WITH deleted_invoices AS (
        SELECT *
        FROM purchase_invoices
        WHERE user_id = p_user_id 
        AND deleted_at IS NOT NULL
        AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
        ORDER BY deleted_at DESC
    )
    SELECT COUNT(*), json_agg(to_json(deleted_invoices.*))
    INTO v_count, v_invoices
    FROM deleted_invoices;
    
    -- استعادة فواتير الشراء (إزالة تاريخ الحذف)
    UPDATE purchase_invoices 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE user_id = p_user_id 
    AND deleted_at IS NOT NULL
    AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back;
    
    RETURN QUERY SELECT v_count, COALESCE(v_invoices, '[]'::jsonb);
END;
$function$;

-- وظيفة الحذف النهائي لفاتورة شراء
CREATE OR REPLACE FUNCTION public.permanently_delete_purchase_invoice(p_user_id uuid, p_invoice_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب حذف فاتورته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- التحقق من وجود فاتورة الشراء وأنها محذوفة بالفعل
    IF NOT EXISTS (
        SELECT 1 FROM purchase_invoices 
        WHERE id = p_invoice_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT false, 'فاتورة الشراء غير موجودة أو لم يتم حذفها بعد'::text;
        RETURN;
    END IF;
    
    -- حذف عناصر فاتورة الشراء أولاً
    DELETE FROM purchase_invoice_items 
    WHERE invoice_id = p_invoice_id;
    
    -- حذف فاتورة الشراء نهائياً
    DELETE FROM purchase_invoices 
    WHERE id = p_invoice_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, 'تم حذف فاتورة الشراء نهائياً'::text;
END;
$function$;