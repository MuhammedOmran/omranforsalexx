-- إنشاء trigger جديد لتحديث المخزون بعد ربط المنتجات
CREATE OR REPLACE FUNCTION public.sync_existing_purchase_items_stock()
RETURNS void AS $$
DECLARE
    item RECORD;
BEGIN
    -- تحديث المخزون لجميع عناصر فواتير الشراء الموجودة التي لها product_id
    FOR item IN 
        SELECT pii.product_id, pii.quantity, pii.unit_cost
        FROM purchase_invoice_items pii
        JOIN purchase_invoices pi ON pii.invoice_id = pi.id
        WHERE pii.product_id IS NOT NULL
        AND pi.deleted_at IS NULL
    LOOP
        -- تحديث كمية المنتج في المخزون
        UPDATE products 
        SET 
            stock = stock + item.quantity,
            cost = COALESCE(item.unit_cost, cost),
            updated_at = NOW()
        WHERE id = item.product_id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- تشغيل دالة المزامنة لتحديث المخزون
SELECT public.sync_existing_purchase_items_stock();

-- التأكد من وجود trigger لتحديث المخزون عند إضافة عناصر جديدة لفواتير الشراء
DROP TRIGGER IF EXISTS trigger_handle_purchase_item_inventory ON purchase_invoice_items;
CREATE TRIGGER trigger_handle_purchase_item_inventory
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_purchase_item_inventory();