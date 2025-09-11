-- إصلاح مشاكل الأمان في الـ functions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;