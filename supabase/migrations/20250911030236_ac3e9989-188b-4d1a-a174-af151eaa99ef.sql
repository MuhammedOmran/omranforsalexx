-- إنشاء دالة حذف فاتورة الشراء نهائياً إذا لم تكن موجودة
CREATE OR REPLACE FUNCTION public.permanently_delete_purchase_invoice(p_user_id uuid, p_invoice_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_invoice_record RECORD;
BEGIN
    -- التحقق من أن المستخدم يطلب حذف فاتورته الخاصة
    IF p_user_id != auth.uid() THEN
        RETURN QUERY SELECT false, 'غير مصرح لك بحذف هذه الفاتورة'::text;
        RETURN;
    END IF;
    
    -- التحقق من وجود فاتورة الشراء وأنها محذوفة بالفعل
    SELECT * INTO v_invoice_record
    FROM purchase_invoices 
    WHERE id = p_invoice_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'فاتورة الشراء غير موجودة أو لم يتم حذفها بعد'::text;
        RETURN;
    END IF;
    
    -- حذف عناصر الفاتورة أولاً
    DELETE FROM purchase_invoice_items 
    WHERE invoice_id = p_invoice_id;
    
    -- حذف المعاملات المالية المرتبطة بالفاتورة
    DELETE FROM cash_transactions 
    WHERE reference_id = p_invoice_id::text 
    AND reference_type = 'purchase_invoice'
    AND user_id = p_user_id;
    
    -- حذف الفاتورة نهائياً
    DELETE FROM purchase_invoices 
    WHERE id = p_invoice_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;
    
    -- إرجاع نتيجة النجاح
    RETURN QUERY SELECT true, ('تم حذف فاتورة الشراء رقم ' || v_invoice_record.invoice_number || ' نهائياً')::text;
END;
$$;