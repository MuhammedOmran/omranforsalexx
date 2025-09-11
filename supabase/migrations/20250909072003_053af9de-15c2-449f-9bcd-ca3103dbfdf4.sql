-- دالة لتحديث المخزون عند إضافة أو تحديث عناصر فاتورة الشراء
CREATE OR REPLACE FUNCTION update_product_stock_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
    old_quantity INTEGER DEFAULT 0;
    new_quantity INTEGER DEFAULT 0;
    quantity_diff INTEGER;
BEGIN
    -- في حالة INSERT
    IF TG_OP = 'INSERT' THEN
        UPDATE products 
        SET 
            stock = stock + NEW.quantity,
            updated_at = now()
        WHERE id = NEW.product_id;
        
        RETURN NEW;
    END IF;
    
    -- في حالة UPDATE
    IF TG_OP = 'UPDATE' THEN
        old_quantity = COALESCE(OLD.quantity, 0);
        new_quantity = COALESCE(NEW.quantity, 0);
        quantity_diff = new_quantity - old_quantity;
        
        -- تحديث المخزون بالفرق
        UPDATE products 
        SET 
            stock = stock + quantity_diff,
            updated_at = now()
        WHERE id = NEW.product_id;
        
        RETURN NEW;
    END IF;
    
    -- في حالة DELETE
    IF TG_OP = 'DELETE' THEN
        UPDATE products 
        SET 
            stock = stock - OLD.quantity,
            updated_at = now()
        WHERE id = OLD.product_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- إنشاء Trigger للتنفيذ التلقائي
DROP TRIGGER IF EXISTS trigger_update_stock_on_purchase ON purchase_invoice_items;

CREATE TRIGGER trigger_update_stock_on_purchase
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_on_purchase();

-- دالة لإعادة مزامنة المخزون للمنتجات الموجودة
CREATE OR REPLACE FUNCTION sync_existing_product_stock()
RETURNS void AS $$
DECLARE
    product_record RECORD;
    total_purchased INTEGER;
    total_sold INTEGER;
    calculated_stock INTEGER;
BEGIN
    -- لكل منتج، احسب الكمية الصحيحة من المشتريات والمبيعات
    FOR product_record IN SELECT id FROM products WHERE user_id IS NOT NULL LOOP
        -- حساب إجمالي الكميات المشتراة
        SELECT COALESCE(SUM(pii.quantity), 0) INTO total_purchased
        FROM purchase_invoice_items pii
        JOIN purchase_invoices pi ON pii.invoice_id = pi.id
        WHERE pii.product_id = product_record.id
        AND pi.deleted_at IS NULL;
        
        -- حساب إجمالي الكميات المباعة 
        SELECT COALESCE(SUM(ii.quantity), 0) INTO total_sold
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.id
        WHERE ii.product_id = product_record.id
        AND i.deleted_at IS NULL;
        
        -- الكمية الصحيحة = المشتريات - المبيعات
        calculated_stock = total_purchased - total_sold;
        
        -- تحديث المخزون
        UPDATE products 
        SET 
            stock = GREATEST(calculated_stock, 0),
            updated_at = now()
        WHERE id = product_record.id;
        
    END LOOP;
    
    RAISE NOTICE 'تم إعادة مزامنة المخزون للمنتجات بنجاح';
END;
$$ LANGUAGE plpgsql;

-- تنفيذ المزامنة للبيانات الموجودة
SELECT sync_existing_product_stock();