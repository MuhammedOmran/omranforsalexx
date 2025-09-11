-- إضافة فئة جديدة لزيادة قيمة المخزون في المعاملات المالية

-- أولاً، دعم فئة inventory_increase في جدول cash_transactions
-- لا نحتاج لتعديل الجدول لأنه يدعم بالفعل أي نص في category

-- إضافة وظيفة لحساب قيمة المخزون الإجمالية للمنتج
CREATE OR REPLACE FUNCTION public.calculate_product_inventory_value(p_product_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_stock INTEGER := 0;
    v_cost NUMERIC := 0;
    v_total_value NUMERIC := 0;
BEGIN
    -- الحصول على الكمية الحالية والتكلفة من جدول المنتجات
    SELECT stock, COALESCE(cost, price * 0.7) -- إذا لم تكن التكلفة محددة، نحسبها كنسبة من السعر
    INTO v_stock, v_cost
    FROM products 
    WHERE id = p_product_id;
    
    -- حساب إجمالي قيمة المخزون
    v_total_value := v_stock * v_cost;
    
    RETURN COALESCE(v_total_value, 0);
END;
$$;

-- إضافة وظيفة لإنشاء معاملة زيادة قيمة المخزون تلقائياً
CREATE OR REPLACE FUNCTION public.create_inventory_value_transaction(
    p_user_id UUID,
    p_product_id UUID,
    p_product_name TEXT,
    p_adjustment_amount NUMERIC,
    p_reason TEXT DEFAULT 'تعديل قيمة المخزون',
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_transaction_id UUID;
    v_description TEXT;
BEGIN
    -- بناء وصف المعاملة
    v_description := 'زيادة قيمة المخزون - ' || p_product_name;
    
    -- إضافة المعاملة إلى جدول cash_transactions
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
        p_user_id,
        'expense', -- نعتبرها مصروف لأنها زيادة في قيمة الأصول
        ABS(p_adjustment_amount), -- نأخذ القيمة المطلقة
        v_description,
        'inventory_increase', -- فئة جديدة لزيادة قيمة المخزون
        p_product_name, -- اسم المنتج كفئة فرعية
        'adjustment', -- نوع الدفع كتعديل
        p_product_id::TEXT, -- معرف المنتج
        'inventory_value_adjustment', -- نوع المرجع
        COALESCE(p_notes, p_reason)
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$;

-- إضافة trigger لتسجيل تغييرات قيمة المخزون عند تحديث تكلفة المنتجات
CREATE OR REPLACE FUNCTION public.track_inventory_value_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_old_value NUMERIC;
    v_new_value NUMERIC;
    v_difference NUMERIC;
BEGIN
    -- حساب القيمة القديمة والجديدة
    v_old_value := OLD.stock * COALESCE(OLD.cost, OLD.price * 0.7);
    v_new_value := NEW.stock * COALESCE(NEW.cost, NEW.price * 0.7);
    v_difference := v_new_value - v_old_value;
    
    -- إذا كان هناك فرق معتبر (أكبر من 1 جنيه)، سجل المعاملة
    IF ABS(v_difference) > 1 AND (OLD.cost != NEW.cost OR OLD.stock != NEW.stock) THEN
        PERFORM create_inventory_value_transaction(
            NEW.user_id,
            NEW.id,
            NEW.name,
            v_difference,
            CASE 
                WHEN OLD.cost != NEW.cost THEN 'تحديث تكلفة المنتج'
                WHEN OLD.stock != NEW.stock THEN 'تحديث كمية المخزون'
                ELSE 'تحديث قيمة المخزون'
            END,
            'تم التحديث تلقائياً عند تغيير بيانات المنتج'
        );
    END IF;
    
    RETURN NEW;
END;
$$;

-- إضافة الـ trigger إلى جدول المنتجات
DROP TRIGGER IF EXISTS track_inventory_value_trigger ON products;
CREATE TRIGGER track_inventory_value_trigger
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION track_inventory_value_changes();

-- إضافة فئات جديدة لأنواع المعاملات المختلفة في تعليقات الجدول للمرجعية
COMMENT ON COLUMN cash_transactions.category IS 'فئات المعاملات: sales, purchases, expenses, income, inventory_increase, salary, maintenance, utilities, marketing, other';
COMMENT ON COLUMN cash_transactions.reference_type IS 'أنواع المراجع: sale, purchase, adjustment, return, investor_purchase, investor_sale, inventory_value_adjustment, salary_payment, expense_payment';

-- إضافة فهرس لتحسين أداء البحث في معاملات المخزون
CREATE INDEX IF NOT EXISTS idx_cash_transactions_inventory 
ON cash_transactions (user_id, category, reference_type) 
WHERE category = 'inventory_increase';

-- إضافة وظيفة لحساب إجمالي قيمة المخزون للمستخدم
CREATE OR REPLACE FUNCTION public.get_total_inventory_value(p_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_total_value NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(stock * COALESCE(cost, price * 0.7)), 0)
    INTO v_total_value
    FROM products 
    WHERE user_id = p_user_id 
    AND stock > 0;
    
    RETURN v_total_value;
END;
$$;