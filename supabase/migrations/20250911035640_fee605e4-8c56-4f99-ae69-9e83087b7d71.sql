-- حذف جميع الـ triggers المتضاربة على purchase_invoice_items
DROP TRIGGER IF EXISTS handle_purchase_inventory_trigger ON purchase_invoice_items;
DROP TRIGGER IF EXISTS handle_purchase_stock_update_trigger ON purchase_invoice_items;
DROP TRIGGER IF EXISTS purchase_invoice_items_stock_trigger ON purchase_invoice_items;
DROP TRIGGER IF EXISTS purchase_invoice_stock_trigger_optimized ON purchase_invoice_items;
DROP TRIGGER IF EXISTS purchase_item_stock_sync ON purchase_invoice_items;
DROP TRIGGER IF EXISTS trg_recalc_stock_on_purchase_items ON purchase_invoice_items;
DROP TRIGGER IF EXISTS trigger_handle_purchase_item_inventory ON purchase_invoice_items;
DROP TRIGGER IF EXISTS trigger_link_purchase_item_to_product ON purchase_invoice_items;
DROP TRIGGER IF EXISTS trigger_purchase_invoice_items_stock_delete ON purchase_invoice_items;
DROP TRIGGER IF EXISTS trigger_purchase_invoice_items_stock_insert ON purchase_invoice_items;
DROP TRIGGER IF EXISTS trigger_purchase_invoice_items_stock_update ON purchase_invoice_items;
DROP TRIGGER IF EXISTS trigger_purchase_item_inventory ON purchase_invoice_items;
DROP TRIGGER IF EXISTS trigger_stock_update_accurate ON purchase_invoice_items;
DROP TRIGGER IF EXISTS trigger_update_product_cost_on_insert ON purchase_invoice_items;
DROP TRIGGER IF EXISTS trigger_update_product_cost_on_update ON purchase_invoice_items;
DROP TRIGGER IF EXISTS update_product_stock_from_purchase_trigger ON purchase_invoice_items;
DROP TRIGGER IF EXISTS update_product_stock_on_purchase_items ON purchase_invoice_items;

-- حذف الـ functions غير المستخدمة
DROP FUNCTION IF EXISTS update_product_stock_accurate();
DROP FUNCTION IF EXISTS update_product_stock_batch();
DROP FUNCTION IF EXISTS update_product_stock_from_purchase();

-- إنشاء function محسن ونظيف لتحديث المخزون
CREATE OR REPLACE FUNCTION handle_purchase_inventory_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invoice_status TEXT := 'draft';
    product_exists BOOLEAN := FALSE;
BEGIN
    -- التحقق من وجود المنتج
    IF COALESCE(NEW.product_id, OLD.product_id) IS NOT NULL THEN
        SELECT EXISTS(
            SELECT 1 FROM products 
            WHERE id = COALESCE(NEW.product_id, OLD.product_id)
        ) INTO product_exists;
        
        IF NOT product_exists THEN
            RETURN COALESCE(NEW, OLD);
        END IF;
    END IF;

    -- الحصول على حالة فاتورة الشراء
    SELECT COALESCE(pi.status, 'draft') INTO invoice_status
    FROM purchase_invoices pi
    WHERE pi.id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    -- تحديث المخزون فقط للفواتير المدفوعة أو المستلمة
    IF invoice_status IN ('paid', 'received') THEN
        
        IF TG_OP = 'INSERT' AND NEW.product_id IS NOT NULL AND NEW.quantity > 0 THEN
            -- إضافة الكمية الجديدة إلى المخزون
            UPDATE products 
            SET stock = stock + NEW.quantity,
                updated_at = NOW()
            WHERE id = NEW.product_id;
            
        ELSIF TG_OP = 'UPDATE' AND NEW.product_id IS NOT NULL THEN
            -- تحديث المخزون بالفرق بين الكمية الجديدة والقديمة
            UPDATE products 
            SET stock = stock - COALESCE(OLD.quantity, 0) + COALESCE(NEW.quantity, 0),
                updated_at = NOW()
            WHERE id = NEW.product_id;
            
        ELSIF TG_OP = 'DELETE' AND OLD.product_id IS NOT NULL AND OLD.quantity > 0 THEN
            -- طرح الكمية المحذوفة من المخزون
            UPDATE products 
            SET stock = GREATEST(stock - OLD.quantity, 0),
                updated_at = NOW()
            WHERE id = OLD.product_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- إنشاء trigger واحد فقط لتحديث المخزون
CREATE TRIGGER purchase_inventory_update_trigger
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION handle_purchase_inventory_update();