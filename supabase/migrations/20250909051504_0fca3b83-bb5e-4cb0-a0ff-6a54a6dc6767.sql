-- تحديث دالة الحذف النهائي للفواتير لتشمل حذف المعاملات المالية المرتبطة
CREATE OR REPLACE FUNCTION public.permanently_delete_invoice(p_user_id uuid, p_invoice_id uuid)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_invoice_number TEXT;
    v_total_amount NUMERIC;
BEGIN
    -- التحقق من وجود الفاتورة والصلاحية
    SELECT invoice_number, total_amount
    INTO v_invoice_number, v_total_amount
    FROM public.invoices 
    WHERE id = p_invoice_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'الفاتورة غير موجودة أو غير محذوفة';
        RETURN;
    END IF;

    -- حذف المعاملة المالية المرتبطة بالفاتورة من جدول cash_transactions
    DELETE FROM public.cash_transactions 
    WHERE user_id = p_user_id 
    AND reference_type = 'invoice'
    AND reference_id = v_invoice_number;

    -- حذف عناصر الفاتورة أولاً
    DELETE FROM public.invoice_items 
    WHERE invoice_id = p_invoice_id;

    -- حذف الفاتورة نهائياً
    DELETE FROM public.invoices 
    WHERE id = p_invoice_id AND user_id = p_user_id;

    RETURN QUERY SELECT TRUE, 'تم حذف الفاتورة والمعاملة المالية المرتبطة بها نهائياً';
END;
$function$;