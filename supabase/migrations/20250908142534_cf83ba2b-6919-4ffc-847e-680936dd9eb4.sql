-- Create functions to handle deleted sales invoices

-- Function to get deleted invoices
CREATE OR REPLACE FUNCTION public.get_deleted_invoices(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(id uuid, invoice_number text, total_amount numeric, status text, deleted_at timestamp with time zone, created_at timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب فواتيره الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    RETURN QUERY 
    SELECT 
        i.id,
        i.invoice_number,
        i.total_amount,
        i.status,
        i.deleted_at,
        i.created_at
    FROM invoices i
    WHERE i.user_id = p_user_id 
    AND i.deleted_at IS NOT NULL
    AND i.deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
    ORDER BY i.deleted_at DESC;
END;
$function$;

-- Function to restore deleted invoices
CREATE OR REPLACE FUNCTION public.restore_deleted_invoices(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(restored_count integer, invoices jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_count integer;
    v_invoices jsonb;
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة فواتيره الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- جلب الفواتير المحذوفة خلال فترة محددة
    WITH deleted_invoices AS (
        SELECT *
        FROM invoices
        WHERE user_id = p_user_id 
        AND deleted_at IS NOT NULL
        AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
        ORDER BY deleted_at DESC
    )
    SELECT COUNT(*), json_agg(to_json(deleted_invoices.*))
    INTO v_count, v_invoices
    FROM deleted_invoices;
    
    -- استعادة الفواتير (إزالة تاريخ الحذف)
    UPDATE invoices 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE user_id = p_user_id 
    AND deleted_at IS NOT NULL
    AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back;
    
    RETURN QUERY SELECT v_count, COALESCE(v_invoices, '[]'::jsonb);
END;
$function$;

-- Function to permanently delete invoice
CREATE OR REPLACE FUNCTION public.permanently_delete_invoice(p_user_id uuid, p_invoice_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب حذف فاتورته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- التحقق من وجود الفاتورة وأنها محذوفة بالفعل
    IF NOT EXISTS (
        SELECT 1 FROM invoices 
        WHERE id = p_invoice_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT false, 'الفاتورة غير موجودة أو لم يتم حذفها بعد'::text;
        RETURN;
    END IF;
    
    -- حذف عناصر الفاتورة أولاً
    DELETE FROM invoice_items 
    WHERE invoice_id = p_invoice_id;
    
    -- حذف الفاتورة نهائياً
    DELETE FROM invoices 
    WHERE id = p_invoice_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, 'تم حذف الفاتورة نهائياً'::text;
END;
$function$;

-- Function to restore single invoice
CREATE OR REPLACE FUNCTION public.restore_single_invoice(p_user_id uuid, p_invoice_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة فاتورته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- التحقق من وجود الفاتورة وأنها محذوفة بالفعل
    IF NOT EXISTS (
        SELECT 1 FROM invoices 
        WHERE id = p_invoice_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT false, 'الفاتورة غير موجودة أو لم يتم حذفها'::text;
        RETURN;
    END IF;
    
    -- استعادة الفاتورة (إزالة تاريخ الحذف)
    UPDATE invoices 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE id = p_invoice_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, 'تم استعادة الفاتورة بنجاح'::text;
END;
$function$;