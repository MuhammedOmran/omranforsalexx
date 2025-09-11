-- إصلاح مشكلة تحديث المخزون عند تعديل فواتير المبيعات

-- حذف الـ trigger القديم إذا كان موجوداً
DROP TRIGGER IF EXISTS handle_invoice_inventory_trigger ON public.invoices;
DROP TRIGGER IF EXISTS handle_invoice_item_inventory_trigger ON public.invoice_items;

-- إنشاء أو تحديث دالة تحديث المخزون للفواتير
CREATE OR REPLACE FUNCTION public.handle_invoice_item_inventory()
RETURNS TRIGGER AS $$
DECLARE
    invoice_status TEXT;
    old_quantity INTEGER := 0;
    new_quantity INTEGER := 0;
BEGIN
    -- الحصول على حالة الفاتورة
    SELECT status INTO invoice_status
    FROM public.invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- التعامل مع الفواتير المدفوعة فقط
    IF invoice_status = 'paid' THEN
        IF TG_OP = 'INSERT' THEN
            -- إضافة عنصر جديد - خصم من المخزون
            IF NEW.product_id IS NOT NULL AND NEW.quantity > 0 THEN
                UPDATE public.products 
                SET stock = GREATEST(stock - NEW.quantity, 0),
                    updated_at = now()
                WHERE id = NEW.product_id;
            END IF;
            
        ELSIF TG_OP = 'UPDATE' THEN
            -- تعديل عنصر موجود - حساب الفرق وتطبيقه
            old_quantity := COALESCE(OLD.quantity, 0);
            new_quantity := COALESCE(NEW.quantity, 0);
            
            IF NEW.product_id IS NOT NULL AND old_quantity != new_quantity THEN
                -- إذا تغيرت الكمية، احسب الفرق وطبقه
                UPDATE public.products 
                SET stock = GREATEST(stock + old_quantity - new_quantity, 0),
                    updated_at = now()
                WHERE id = NEW.product_id;
            END IF;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- حذف عنصر - إعادة الكمية للمخزون
            IF OLD.product_id IS NOT NULL AND OLD.quantity > 0 THEN
                UPDATE public.products 
                SET stock = stock + OLD.quantity,
                    updated_at = now()
                WHERE id = OLD.product_id;
            END IF;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء دالة للتعامل مع تغيير حالة الفاتورة
CREATE OR REPLACE FUNCTION public.handle_invoice_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- إذا تغيرت الحالة من غير مدفوعة إلى مدفوعة
    IF OLD.status != 'paid' AND NEW.status = 'paid' THEN
        -- خصم كمية جميع العناصر من المخزون
        FOR item IN 
            SELECT product_id, quantity 
            FROM public.invoice_items 
            WHERE invoice_id = NEW.id AND product_id IS NOT NULL
        LOOP
            UPDATE public.products 
            SET stock = GREATEST(stock - item.quantity, 0),
                updated_at = NOW()
            WHERE id = item.product_id;
        END LOOP;
        
    -- إذا تغيرت الحالة من مدفوعة إلى غير مدفوعة
    ELSIF OLD.status = 'paid' AND NEW.status != 'paid' THEN
        -- إعادة كمية جميع العناصر للمخزون
        FOR item IN 
            SELECT product_id, quantity 
            FROM public.invoice_items 
            WHERE invoice_id = NEW.id AND product_id IS NOT NULL
        LOOP
            UPDATE public.products 
            SET stock = stock + item.quantity,
                updated_at = NOW()
            WHERE id = item.product_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء الـ triggers الجديدة
CREATE TRIGGER handle_invoice_item_inventory_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invoice_item_inventory();

CREATE TRIGGER handle_invoice_status_change_trigger
    AFTER UPDATE ON public.invoices
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.handle_invoice_status_change();

-- دالة لإصلاح المخزون الحالي بناءً على الفواتير الموجودة
CREATE OR REPLACE FUNCTION public.fix_current_inventory()
RETURNS void AS $$
DECLARE
    product_record RECORD;
    total_sold INTEGER;
    current_stock INTEGER;
BEGIN
    FOR product_record IN SELECT id, stock FROM public.products LOOP
        -- حساب إجمالي الكمية المباعة من الفواتير المدفوعة
        SELECT COALESCE(SUM(ii.quantity), 0) INTO total_sold
        FROM public.invoice_items ii
        JOIN public.invoices i ON ii.invoice_id = i.id
        WHERE ii.product_id = product_record.id
          AND i.status = 'paid'
          AND i.deleted_at IS NULL;
        
        -- تحديث المخزون بناءً على المبيعات الفعلية
        -- افتراض أن المخزون الأصلي هو المخزون الحالي + المباع
        current_stock := (product_record.stock + total_sold) - total_sold;
        
        UPDATE public.products 
        SET stock = GREATEST(current_stock, 0),
            updated_at = now()
        WHERE id = product_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;