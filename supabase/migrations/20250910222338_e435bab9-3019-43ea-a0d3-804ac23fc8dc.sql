-- إنشاء trigger لتحديث المخزون عند إضافة/تعديل/حذف عناصر فواتير الشراء
CREATE OR REPLACE FUNCTION public.handle_purchase_invoice_stock_update()
RETURNS TRIGGER AS $$
DECLARE
    invoice_status TEXT;
    invoice_user_id UUID;
BEGIN
    -- الحصول على معلومات الفاتورة
    SELECT pi.status, pi.user_id INTO invoice_status, invoice_user_id
    FROM public.purchase_invoices pi
    WHERE pi.id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- تحديث المخزون فقط للفواتير المستلمة/المدفوعة
    IF invoice_status IN ('received', 'paid') THEN
        IF TG_OP = 'INSERT' AND NEW.product_id IS NOT NULL THEN
            -- إضافة كمية جديدة للمخزون
            UPDATE public.products 
            SET stock = stock + NEW.quantity,
                updated_at = now()
            WHERE id = NEW.product_id AND user_id = invoice_user_id;
            
        ELSIF TG_OP = 'UPDATE' AND NEW.product_id IS NOT NULL THEN
            -- تحديث الكمية - طرح القديمة وإضافة الجديدة
            UPDATE public.products 
            SET stock = stock - COALESCE(OLD.quantity, 0) + COALESCE(NEW.quantity, 0),
                updated_at = now()
            WHERE id = NEW.product_id AND user_id = invoice_user_id;
            
        ELSIF TG_OP = 'DELETE' AND OLD.product_id IS NOT NULL THEN
            -- حذف الكمية من المخزون
            UPDATE public.products 
            SET stock = GREATEST(stock - OLD.quantity, 0),
                updated_at = now()
            WHERE id = OLD.product_id AND user_id = invoice_user_id;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء triggers لعناصر فواتير الشراء
DROP TRIGGER IF EXISTS trigger_purchase_invoice_items_stock_insert ON public.purchase_invoice_items;
DROP TRIGGER IF EXISTS trigger_purchase_invoice_items_stock_update ON public.purchase_invoice_items;
DROP TRIGGER IF EXISTS trigger_purchase_invoice_items_stock_delete ON public.purchase_invoice_items;

CREATE TRIGGER trigger_purchase_invoice_items_stock_insert
    AFTER INSERT ON public.purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_purchase_invoice_stock_update();

CREATE TRIGGER trigger_purchase_invoice_items_stock_update
    AFTER UPDATE ON public.purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_purchase_invoice_stock_update();

CREATE TRIGGER trigger_purchase_invoice_items_stock_delete
    AFTER DELETE ON public.purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_purchase_invoice_stock_update();

-- trigger لتحديث المخزون عند تغيير حالة فاتورة الشراء
CREATE OR REPLACE FUNCTION public.handle_purchase_invoice_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- إذا تغيرت الحالة من غير مستلمة إلى مستلمة، أضف للمخزون
    IF OLD.status != 'received' AND NEW.status = 'received' THEN
        FOR item IN 
            SELECT product_id, quantity 
            FROM public.purchase_invoice_items 
            WHERE invoice_id = NEW.id AND product_id IS NOT NULL
        LOOP
            UPDATE public.products 
            SET stock = stock + item.quantity,
                updated_at = now()
            WHERE id = item.product_id AND user_id = NEW.user_id;
        END LOOP;
        
    -- إذا تغيرت الحالة من مستلمة إلى غير مستلمة، اخصم من المخزون
    ELSIF OLD.status = 'received' AND NEW.status != 'received' THEN
        FOR item IN 
            SELECT product_id, quantity 
            FROM public.purchase_invoice_items 
            WHERE invoice_id = NEW.id AND product_id IS NOT NULL
        LOOP
            UPDATE public.products 
            SET stock = GREATEST(stock - item.quantity, 0),
                updated_at = now()
            WHERE id = item.product_id AND user_id = NEW.user_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_purchase_invoice_status_change ON public.purchase_invoices;
CREATE TRIGGER trigger_purchase_invoice_status_change
    AFTER UPDATE OF status ON public.purchase_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_purchase_invoice_status_change();

-- function لحساب إجمالي المشتريات لكل منتج
CREATE OR REPLACE FUNCTION public.calculate_product_total_purchases(p_product_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_purchased NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(pii.quantity), 0) INTO total_purchased
    FROM public.purchase_invoice_items pii
    JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
    WHERE pii.product_id = p_product_id
      AND pi.status IN ('received', 'paid')
      AND pi.deleted_at IS NULL;
    
    RETURN total_purchased;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- function لمزامنة المخزون الحالي بناءً على فواتير الشراء والمبيعات
CREATE OR REPLACE FUNCTION public.sync_product_stock_from_transactions(p_product_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_purchased NUMERIC := 0;
    total_sold NUMERIC := 0;
    calculated_stock NUMERIC := 0;
    product_user_id UUID;
BEGIN
    -- الحصول على user_id للمنتج
    SELECT user_id INTO product_user_id
    FROM public.products
    WHERE id = p_product_id;
    
    IF product_user_id IS NULL THEN
        RETURN 0;
    END IF;
    
    -- حساب إجمالي المشتريات
    SELECT COALESCE(SUM(pii.quantity), 0) INTO total_purchased
    FROM public.purchase_invoice_items pii
    JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
    WHERE pii.product_id = p_product_id
      AND pi.status IN ('received', 'paid')
      AND pi.deleted_at IS NULL;
    
    -- حساب إجمالي المبيعات
    SELECT COALESCE(SUM(ii.quantity), 0) INTO total_sold
    FROM public.invoice_items ii
    JOIN public.invoices i ON ii.invoice_id = i.id
    WHERE ii.product_id = p_product_id
      AND i.status = 'paid'
      AND i.deleted_at IS NULL;
    
    -- حساب المخزون المحسوب
    calculated_stock := total_purchased - total_sold;
    
    -- تحديث المخزون في جدول المنتجات
    UPDATE public.products 
    SET stock = GREATEST(calculated_stock, 0),
        updated_at = now()
    WHERE id = p_product_id;
    
    RETURN calculated_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_product_id 
ON public.purchase_invoice_items(product_id) 
WHERE product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status 
ON public.purchase_invoices(status) 
WHERE deleted_at IS NULL;