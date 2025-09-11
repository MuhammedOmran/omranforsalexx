-- إنشاء trigger لتحديث المخزون عند تغيير حالة فاتورة الشراء
CREATE OR REPLACE FUNCTION public.update_stock_on_invoice_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    item RECORD;
BEGIN
    -- إذا تغيرت حالة الفاتورة من غير مدفوعة إلى مدفوعة
    IF OLD.status != 'paid' AND NEW.status = 'paid' THEN
        -- إضافة كل المنتجات في الفاتورة إلى المخزون
        FOR item IN 
            SELECT product_id, quantity 
            FROM public.purchase_invoice_items 
            WHERE invoice_id = NEW.id AND product_id IS NOT NULL
        LOOP
            UPDATE public.products 
            SET stock = stock + item.quantity,
                updated_at = NOW()
            WHERE id = item.product_id;
        END LOOP;
        
    -- إذا تغيرت حالة الفاتورة من مدفوعة إلى غير مدفوعة
    ELSIF OLD.status = 'paid' AND NEW.status != 'paid' THEN
        -- طرح كل المنتجات في الفاتورة من المخزون
        FOR item IN 
            SELECT product_id, quantity 
            FROM public.purchase_invoice_items 
            WHERE invoice_id = NEW.id AND product_id IS NOT NULL
        LOOP
            UPDATE public.products 
            SET stock = GREATEST(stock - item.quantity, 0),
                updated_at = NOW()
            WHERE id = item.product_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$;

-- إنشاء trigger لتحديث المخزون عند تغيير حالة الفاتورة
CREATE TRIGGER update_stock_on_invoice_status_change_trigger
    AFTER UPDATE ON public.purchase_invoices
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.update_stock_on_invoice_status_change();

-- دالة لإعادة حساب مخزون جميع المنتجات بناءً على فواتير الشراء والمبيعات المدفوعة
CREATE OR REPLACE FUNCTION public.recalculate_all_product_stock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    product_record RECORD;
    total_purchased INTEGER;
    total_sold INTEGER;
    calculated_stock INTEGER;
BEGIN
    FOR product_record IN 
        SELECT id FROM public.products WHERE is_active = true
    LOOP
        -- حساب إجمالي المشتريات من فواتير الشراء المدفوعة
        SELECT COALESCE(SUM(pii.quantity), 0) INTO total_purchased
        FROM public.purchase_invoice_items pii
        JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
        WHERE pii.product_id = product_record.id
          AND pi.status = 'paid'
          AND pi.deleted_at IS NULL;
        
        -- حساب إجمالي المبيعات من الفواتير المدفوعة
        SELECT COALESCE(SUM(ii.quantity), 0) INTO total_sold
        FROM public.invoice_items ii
        JOIN public.invoices i ON ii.invoice_id = i.id
        WHERE ii.product_id = product_record.id
          AND i.status = 'paid'
          AND i.deleted_at IS NULL;
        
        -- حساب المخزون الصحيح
        calculated_stock := GREATEST(total_purchased - total_sold, 0);
        
        -- تحديث المخزون في جدول المنتجات
        UPDATE public.products 
        SET stock = calculated_stock,
            updated_at = NOW()
        WHERE id = product_record.id;
        
        -- رسالة في السجل لمتابعة العملية
        RAISE NOTICE 'Updated product % stock to %', product_record.id, calculated_stock;
    END LOOP;
END;
$$;