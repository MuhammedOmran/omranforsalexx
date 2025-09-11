-- إنشاء function لتحديث المخزون عند حذف فاتورة الشراء
CREATE OR REPLACE FUNCTION handle_purchase_invoice_deletion_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا كانت فاتورة الشراء مدفوعة أو مستلمة، قم بطرح الكمية من المخزون
    IF OLD.status IN ('paid', 'received') THEN
        -- تحديث المخزون لكل منتج في الفاتورة المحذوفة
        UPDATE products 
        SET stock = GREATEST(stock - pii.quantity, 0),
            updated_at = NOW()
        FROM purchase_invoice_items pii
        WHERE products.id = pii.product_id 
        AND pii.invoice_id = OLD.id
        AND products.user_id = OLD.user_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء trigger لتحديث المخزون عند حذف فاتورة الشراء
DROP TRIGGER IF EXISTS trigger_purchase_invoice_deletion_inventory ON purchase_invoices;
CREATE TRIGGER trigger_purchase_invoice_deletion_inventory
    BEFORE DELETE ON purchase_invoices
    FOR EACH ROW
    EXECUTE FUNCTION handle_purchase_invoice_deletion_inventory();

-- إنشاء function لتحديث المخزون عند الحذف المنطقي لفاتورة الشراء
CREATE OR REPLACE FUNCTION handle_purchase_invoice_soft_deletion_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- إذا تم تحديث deleted_at من NULL إلى قيمة (حذف منطقي)
    IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
        -- إذا كانت فاتورة الشراء مدفوعة أو مستلمة، قم بطرح الكمية من المخزون
        IF OLD.status IN ('paid', 'received') THEN
            UPDATE products 
            SET stock = GREATEST(stock - pii.quantity, 0),
                updated_at = NOW()
            FROM purchase_invoice_items pii
            WHERE products.id = pii.product_id 
            AND pii.invoice_id = OLD.id
            AND products.user_id = OLD.user_id;
        END IF;
    END IF;
    
    -- إذا تم استعادة الفاتورة (deleted_at من قيمة إلى NULL)
    IF OLD.deleted_at IS NOT NULL AND NEW.deleted_at IS NULL THEN
        -- إذا كانت فاتورة الشراء مدفوعة أو مستلمة، قم بإضافة الكمية للمخزون
        IF NEW.status IN ('paid', 'received') THEN
            UPDATE products 
            SET stock = stock + pii.quantity,
                updated_at = NOW()
            FROM purchase_invoice_items pii
            WHERE products.id = pii.product_id 
            AND pii.invoice_id = NEW.id
            AND products.user_id = NEW.user_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء trigger للحذف المنطقي
DROP TRIGGER IF EXISTS trigger_purchase_invoice_soft_deletion_inventory ON purchase_invoices;
CREATE TRIGGER trigger_purchase_invoice_soft_deletion_inventory
    AFTER UPDATE ON purchase_invoices
    FOR EACH ROW
    WHEN (OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
    EXECUTE FUNCTION handle_purchase_invoice_soft_deletion_inventory();