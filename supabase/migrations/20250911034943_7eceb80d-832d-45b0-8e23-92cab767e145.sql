-- إصلاح trigger handle_purchase_invoice_inventory للتعامل مع حالة INSERT بشكل صحيح
CREATE OR REPLACE FUNCTION handle_purchase_invoice_inventory()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
    product_exists BOOLEAN;
    new_product_id UUID;
    margin_percentage NUMERIC := 0.30; -- هامش ربح 30%
BEGIN
    -- عند إضافة فاتورة شراء جديدة أو تغيير حالتها
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND COALESCE(OLD.status, '') != COALESCE(NEW.status, '')) THEN
        
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
$$ LANGUAGE plpgsql;

-- إصلاح trigger handle_purchase_invoice_status_change للتعامل مع حالة INSERT بشكل صحيح
CREATE OR REPLACE FUNCTION handle_purchase_invoice_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- التأكد من أن هذا تحديث وليس إدراج
    IF TG_OP = 'UPDATE' THEN
        -- إذا تغيرت الحالة من غير مستلمة إلى مستلمة، أضف للمخزون
        IF COALESCE(OLD.status, '') != 'received' AND NEW.status = 'received' THEN
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
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;