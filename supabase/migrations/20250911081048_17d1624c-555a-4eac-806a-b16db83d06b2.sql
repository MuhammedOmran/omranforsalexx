-- التحقق من حالة التريجر الحالي وإصلاحه
-- أولاً، دعونا نتحقق من وجود التريجر ونعيد إنشاؤه

-- حذف التريجر الحالي إذا كان موجوداً
DROP TRIGGER IF EXISTS products_inventory_cash_trigger ON products;

-- إعادة إنشاء الدالة مع تحسينات وإضافة رسائل تشخيصية
CREATE OR REPLACE FUNCTION handle_inventory_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
    stock_change INTEGER;
    product_cost NUMERIC;
    total_cost NUMERIC;
    product_name TEXT;
    product_code TEXT;
    debug_info TEXT;
BEGIN
    -- إضافة معلومات تشخيصية
    debug_info := 'TG_OP: ' || TG_OP;
    
    -- التحقق من أن المنتج له تكلفة
    SELECT cost, name, code INTO product_cost, product_name, product_code
    FROM products 
    WHERE id = COALESCE(NEW.id, OLD.id);
    
    -- إضافة معلومات إضافية للتشخيص
    debug_info := debug_info || ', Product Cost: ' || COALESCE(product_cost::text, 'NULL');
    
    IF product_cost IS NULL OR product_cost = 0 THEN
        -- تسجيل رسالة تشخيصية
        RAISE NOTICE 'Product cost is null or zero for product: %', COALESCE(product_name, 'Unknown');
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- حساب التغيير في المخزون
    IF TG_OP = 'INSERT' THEN
        -- منتج جديد - إضافة رصيد افتتاحي إذا كان المخزون أكبر من 0
        IF NEW.stock > 0 THEN
            total_cost := NEW.stock * product_cost;
            
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
                total_cost,
                'شراء مخزون - ' || product_name,
                'inventory',
                'stock_purchase',
                'cash',
                NEW.id::text,
                'product_inventory',
                'مصروف تلقائي لشراء مخزون منتج: ' || product_name || ' (كود: ' || COALESCE(product_code, 'غير محدد') || ') بكمية ' || NEW.stock || ' وتكلفة إجمالية ' || total_cost || ' ج.م'
            );
            
            RAISE NOTICE 'Created cash transaction for new product: %, Stock: %, Cost: %', product_name, NEW.stock, total_cost;
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- تحديث المنتج - حساب الفرق في المخزون
        stock_change := NEW.stock - OLD.stock;
        
        debug_info := debug_info || ', Stock Change: ' || stock_change;
        RAISE NOTICE 'Stock update detected: %, Old Stock: %, New Stock: %, Change: %', product_name, OLD.stock, NEW.stock, stock_change;
        
        IF stock_change != 0 THEN
            total_cost := ABS(stock_change) * product_cost;
            
            -- إذا زاد المخزون (شراء)
            IF stock_change > 0 THEN
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
                    total_cost,
                    'إضافة مخزون - ' || product_name,
                    'inventory',
                    'stock_purchase',
                    'cash',
                    NEW.id::text,
                    'product_inventory',
                    'مصروف تلقائي لإضافة مخزون منتج: ' || product_name || ' (كود: ' || COALESCE(product_code, 'غير محدد') || ') بكمية ' || stock_change || ' وتكلفة إجمالية ' || total_cost || ' ج.م'
                );
                
                RAISE NOTICE 'Created expense transaction for stock increase: %, Amount: %', product_name, total_cost;
            END IF;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- حذف المنتج - حذف المعاملات المرتبطة به
        DELETE FROM cash_transactions 
        WHERE reference_id = OLD.id::text 
        AND reference_type = 'product_inventory'
        AND user_id = OLD.user_id;
        
        RAISE NOTICE 'Deleted cash transactions for product: %', product_name;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- تسجيل أي أخطاء
        RAISE NOTICE 'Error in inventory cash transaction trigger: %, Debug: %', SQLERRM, debug_info;
        -- إرجاع القيمة حتى لا نعطل العملية
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- إعادة إنشاء التريجر
CREATE TRIGGER products_inventory_cash_trigger
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_inventory_cash_transaction();

-- تفعيل رسائل الإشعار لجلسة المستخدم الحالي
SET client_min_messages = NOTICE;