-- إنشاء دالة لحذف جميع الفواتير المحذوفة نهائياً
CREATE OR REPLACE FUNCTION public.permanently_delete_all_invoices(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(deleted_count integer, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_count integer;
    invoice_record RECORD;
    item RECORD;
BEGIN
    -- التحقق من أن المستخدم يطلب حذف فواتيره الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    v_count := 0;
    
    -- المرور عبر جميع الفواتير المحذوفة
    FOR invoice_record IN 
        SELECT id, status, invoice_number
        FROM public.invoices 
        WHERE user_id = p_user_id 
        AND deleted_at IS NOT NULL
        AND deleted_at >= NOW() - (p_days_back || ' days')::INTERVAL
    LOOP
        -- إعادة الكمية إلى المخزون إذا كانت الفاتورة مدفوعة
        IF invoice_record.status = 'paid' THEN
            FOR item IN 
                SELECT ii.product_id, ii.quantity 
                FROM public.invoice_items ii
                WHERE ii.invoice_id = invoice_record.id AND ii.product_id IS NOT NULL
            LOOP
                UPDATE public.products 
                SET stock = stock + item.quantity,
                    updated_at = NOW()
                WHERE id = item.product_id 
                AND user_id = p_user_id;
            END LOOP;
        END IF;

        -- حذف المعاملة المالية المرتبطة بالفاتورة من جدول cash_transactions
        DELETE FROM public.cash_transactions 
        WHERE user_id = p_user_id 
        AND reference_type = 'sales_invoice'
        AND reference_id = invoice_record.invoice_number;

        -- حذف عناصر الفاتورة أولاً
        DELETE FROM public.invoice_items 
        WHERE invoice_id = invoice_record.id;

        -- حذف الفاتورة نهائياً
        DELETE FROM public.invoices 
        WHERE id = invoice_record.id AND user_id = p_user_id;
        
        v_count := v_count + 1;
    END LOOP;

    RETURN QUERY SELECT v_count, 
        CASE 
            WHEN v_count = 0 THEN 'لا توجد فواتير محذوفة للحذف النهائي'
            WHEN v_count = 1 THEN 'تم حذف فاتورة واحدة نهائياً'
            ELSE 'تم حذف ' || v_count || ' فاتورة نهائياً'
        END;
END;
$$;