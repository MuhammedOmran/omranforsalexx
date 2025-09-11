-- إنشاء trigger لربط فواتير الشراء بالمنتجات وتحديث المخزون
-- أولاً: إنشاء function لمعالجة تحديث المخزون من فواتير الشراء

CREATE OR REPLACE FUNCTION handle_purchase_invoice_inventory()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    product_exists BOOLEAN;
    new_product_id UUID;
    margin_percentage NUMERIC := 0.30; -- هامش ربح 30%
BEGIN
    -- عند إضافة فاتورة شراء جديدة أو تغيير حالتها
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
        
        -- معالجة كل عنصر في فاتورة الشراء
        FOR item IN 
            SELECT * FROM purchase_invoice_items 
            WHERE invoice_id = NEW.id
        LOOP
            -- التحقق من وجود المنتج
            SELECT EXISTS(
                SELECT 1 FROM products 
                WHERE user_id = NEW.user_id 
                AND (
                    id = item.product_id OR 
                    name = item.product_name
                )
            ) INTO product_exists;
            
            IF NOT product_exists THEN
                -- إنشاء منتج جديد إذا لم يكن موجوداً
                INSERT INTO products (
                    user_id,
                    name,
                    code,
                    cost,
                    price,
                    stock,
                    min_stock,
                    is_active
                ) VALUES (
                    NEW.user_id,
                    item.product_name,
                    'PRD' || EXTRACT(EPOCH FROM NOW())::TEXT,
                    item.unit_cost,
                    item.unit_cost * (1 + margin_percentage),
                    item.quantity,
                    5,
                    true
                ) RETURNING id INTO new_product_id;
                
                -- ربط المنتج الجديد بعنصر الفاتورة
                UPDATE purchase_invoice_items 
                SET product_id = new_product_id 
                WHERE id = item.id;
                
            ELSE
                -- تحديث المنتج الموجود
                UPDATE products 
                SET 
                    stock = stock + item.quantity,
                    cost = item.unit_cost,
                    price = item.unit_cost * (1 + margin_percentage),
                    updated_at = NOW()
                WHERE user_id = NEW.user_id 
                AND (
                    id = item.product_id OR 
                    name = item.product_name
                );
                
                -- إذا لم يكن product_id محدد، قم بتحديثه
                IF item.product_id IS NULL THEN
                    UPDATE purchase_invoice_items 
                    SET product_id = (
                        SELECT id FROM products 
                        WHERE user_id = NEW.user_id 
                        AND name = item.product_name 
                        LIMIT 1
                    )
                    WHERE id = item.id;
                END IF;
            END IF;
        END LOOP;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger على جدول فواتير الشراء
DROP TRIGGER IF EXISTS trigger_purchase_invoice_inventory ON purchase_invoices;
CREATE TRIGGER trigger_purchase_invoice_inventory
    AFTER INSERT OR UPDATE ON purchase_invoices
    FOR EACH ROW
    EXECUTE FUNCTION handle_purchase_invoice_inventory();

-- إنشاء function لمعالجة تحديث المنتجات عند تعديل عناصر الفاتورة
CREATE OR REPLACE FUNCTION handle_purchase_item_inventory()
RETURNS TRIGGER AS $$
DECLARE
    invoice_user_id UUID;
    margin_percentage NUMERIC := 0.30;
BEGIN
    -- الحصول على user_id من الفاتورة
    SELECT user_id INTO invoice_user_id 
    FROM purchase_invoices 
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    IF TG_OP = 'INSERT' THEN
        -- عند إضافة عنصر جديد للفاتورة
        IF NEW.product_id IS NOT NULL THEN
            UPDATE products 
            SET 
                stock = stock + NEW.quantity,
                cost = NEW.unit_cost,
                price = NEW.unit_cost * (1 + margin_percentage),
                updated_at = NOW()
            WHERE id = NEW.product_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- عند تحديث عنصر موجود
        IF NEW.product_id IS NOT NULL THEN
            -- إزالة الكمية القديمة وإضافة الجديدة
            UPDATE products 
            SET 
                stock = stock - OLD.quantity + NEW.quantity,
                cost = NEW.unit_cost,
                price = NEW.unit_cost * (1 + margin_percentage),
                updated_at = NOW()
            WHERE id = NEW.product_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- عند حذف عنصر من الفاتورة
        IF OLD.product_id IS NOT NULL THEN
            UPDATE products 
            SET 
                stock = stock - OLD.quantity,
                updated_at = NOW()
            WHERE id = OLD.product_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إنشاء trigger على جدول عناصر فواتير الشراء
DROP TRIGGER IF EXISTS trigger_purchase_item_inventory ON purchase_invoice_items;
CREATE TRIGGER trigger_purchase_item_inventory
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION handle_purchase_item_inventory();

-- تحديث المنتجات الموجودة من فواتير الشراء الحالية
UPDATE products 
SET 
    cost = latest_costs.unit_cost,
    price = latest_costs.unit_cost * 1.30,
    updated_at = NOW()
FROM (
    SELECT DISTINCT ON (p.id) 
        p.id as product_id,
        pii.unit_cost,
        pi.invoice_date
    FROM products p
    JOIN purchase_invoice_items pii ON (pii.product_id = p.id OR pii.product_name = p.name)
    JOIN purchase_invoices pi ON pii.invoice_id = pi.id
    WHERE pi.deleted_at IS NULL
    ORDER BY p.id, pi.invoice_date DESC, pi.created_at DESC
) AS latest_costs
WHERE products.id = latest_costs.product_id;