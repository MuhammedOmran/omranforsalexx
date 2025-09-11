-- إنشاء function لربط إضافة المنتجات بالصندوق
CREATE OR REPLACE FUNCTION sync_products_with_cash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    old_product_value NUMERIC := 0;
    new_product_value NUMERIC := 0;
    difference_value NUMERIC := 0;
BEGIN
    -- حساب قيمة المنتج القديمة والجديدة
    IF TG_OP = 'INSERT' THEN
        new_product_value := NEW.stock * NEW.cost;
        
        -- إضافة معاملة مصروف للمنتج الجديد إذا كانت له قيمة
        IF new_product_value > 0 THEN
            INSERT INTO cash_transactions (
                user_id,
                transaction_type,
                amount,
                description,
                category,
                subcategory,
                payment_method,
                reference_id,
                reference_type,
                notes
            ) VALUES (
                NEW.user_id,
                'expense',
                new_product_value,
                'إضافة منتج جديد - ' || NEW.name,
                'inventory',
                'new_product',
                'cash',
                NEW.id::text,
                'product_addition',
                'منتج: ' || NEW.name || ' | الكمية: ' || NEW.stock || ' | التكلفة: ' || NEW.cost || ' ج.م'
            );
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        old_product_value := OLD.stock * OLD.cost;
        new_product_value := NEW.stock * NEW.cost;
        difference_value := new_product_value - old_product_value;
        
        -- إضافة معاملة فقط إذا كان هناك فرق في القيمة
        IF difference_value != 0 THEN
            -- إذا كان الفرق موجب (زيادة في القيمة) = مصروف
            -- إذا كان الفرق سالب (نقص في القيمة) = دخل
            INSERT INTO cash_transactions (
                user_id,
                transaction_type,
                amount,
                description,
                category,
                subcategory,
                payment_method,
                reference_id,
                reference_type,
                notes
            ) VALUES (
                NEW.user_id,
                CASE WHEN difference_value > 0 THEN 'expense' ELSE 'income' END,
                ABS(difference_value),
                CASE 
                    WHEN difference_value > 0 THEN 'زيادة قيمة المخزون - ' || NEW.name
                    ELSE 'تقليل قيمة المخزون - ' || NEW.name
                END,
                'inventory',
                'stock_adjustment',
                'cash',
                NEW.id::text,
                'product_update',
                'منتج: ' || NEW.name || 
                ' | الكمية: ' || OLD.stock || ' → ' || NEW.stock ||
                ' | التكلفة: ' || OLD.cost || ' → ' || NEW.cost ||
                ' | القيمة القديمة: ' || old_product_value ||
                ' | القيمة الجديدة: ' || new_product_value || ' ج.م'
            );
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- إنشاء trigger لربط المنتجات بالصندوق
CREATE OR REPLACE TRIGGER products_cash_sync_trigger
    AFTER INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION sync_products_with_cash();

-- إنشاء function للتعامل مع حذف المنتجات
CREATE OR REPLACE FUNCTION handle_product_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    product_value NUMERIC;
BEGIN
    -- حساب قيمة المنتج المحذوف
    product_value := OLD.stock * OLD.cost;
    
    -- إضافة معاملة دخل لاسترداد قيمة المنتج المحذوف
    IF product_value > 0 THEN
        INSERT INTO cash_transactions (
            user_id,
            transaction_type,
            amount,
            description,
            category,
            subcategory,
            payment_method,
            reference_id,
            reference_type,
            notes
        ) VALUES (
            OLD.user_id,
            'income',
            product_value,
            'حذف منتج - ' || OLD.name,
            'inventory',
            'product_deletion',
            'cash',
            OLD.id::text,
            'product_deletion',
            'منتج محذوف: ' || OLD.name || ' | الكمية: ' || OLD.stock || ' | التكلفة: ' || OLD.cost || ' ج.م'
        );
    END IF;
    
    RETURN OLD;
END;
$$;

-- إنشاء trigger لحذف المنتجات
CREATE OR REPLACE TRIGGER products_deletion_trigger
    AFTER DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_product_deletion();