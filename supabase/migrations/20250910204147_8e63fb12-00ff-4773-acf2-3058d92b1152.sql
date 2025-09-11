-- تحديث دالة حساب المخزون الصحيح بناءً على المشتريات والمبيعات
CREATE OR REPLACE FUNCTION public.sync_product_stock_correct(p_product_id UUID DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    product_record RECORD;
    total_purchased INTEGER;
    total_sold INTEGER;
    calculated_stock INTEGER;
BEGIN
    -- إذا تم تحديد منتج معين
    IF p_product_id IS NOT NULL THEN
        -- الحصول على معلومات المنتج
        SELECT id, name, stock INTO product_record
        FROM public.products 
        WHERE id = p_product_id;
        
        IF FOUND THEN
            -- حساب إجمالي المشتريات
            SELECT COALESCE(SUM(pii.quantity), 0) INTO total_purchased
            FROM public.purchase_invoice_items pii
            JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
            WHERE pii.product_id = product_record.id
              AND pi.deleted_at IS NULL
              AND pi.status IN ('paid', 'received');
            
            -- حساب إجمالي المبيعات
            SELECT COALESCE(SUM(ii.quantity), 0) INTO total_sold
            FROM public.invoice_items ii
            JOIN public.invoices i ON ii.invoice_id = i.id
            WHERE ii.product_id = product_record.id
              AND i.deleted_at IS NULL
              AND i.status = 'paid';
            
            -- حساب المخزون الصحيح
            calculated_stock := total_purchased - total_sold;
            
            -- تحديث المخزون
            UPDATE public.products 
            SET stock = GREATEST(calculated_stock, 0),
                updated_at = now()
            WHERE id = product_record.id;
            
            RAISE NOTICE 'Updated product %: purchased=%, sold=%, new_stock=%', 
                product_record.name, total_purchased, total_sold, GREATEST(calculated_stock, 0);
        END IF;
    ELSE
        -- تحديث جميع المنتجات
        FOR product_record IN SELECT id, name FROM public.products LOOP
            -- حساب إجمالي المشتريات
            SELECT COALESCE(SUM(pii.quantity), 0) INTO total_purchased
            FROM public.purchase_invoice_items pii
            JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
            WHERE pii.product_id = product_record.id
              AND pi.deleted_at IS NULL
              AND pi.status IN ('paid', 'received');
            
            -- حساب إجمالي المبيعات
            SELECT COALESCE(SUM(ii.quantity), 0) INTO total_sold
            FROM public.invoice_items ii
            JOIN public.invoices i ON ii.invoice_id = i.id
            WHERE ii.product_id = product_record.id
              AND i.deleted_at IS NULL
              AND i.status = 'paid';
            
            -- حساب المخزون الصحيح
            calculated_stock := total_purchased - total_sold;
            
            -- تحديث المخزون
            UPDATE public.products 
            SET stock = GREATEST(calculated_stock, 0),
                updated_at = now()
            WHERE id = product_record.id;
        END LOOP;
    END IF;
END;
$function$;