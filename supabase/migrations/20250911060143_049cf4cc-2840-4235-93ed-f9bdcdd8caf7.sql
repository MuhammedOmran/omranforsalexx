-- إضافة trigger لربط المخزون بالصندوق تلقائياً
CREATE OR REPLACE FUNCTION public.handle_product_stock_update()
RETURNS TRIGGER AS $$
DECLARE
    stock_difference INTEGER;
    cost_difference NUMERIC;
    expense_description TEXT;
    existing_transaction_id UUID;
BEGIN
    -- حساب الفرق في الكمية
    stock_difference := NEW.stock - OLD.stock;
    
    -- إذا تغيرت الكمية
    IF stock_difference != 0 THEN
        -- البحث عن المعاملة المالية الأصلية
        SELECT id INTO existing_transaction_id
        FROM public.cash_transactions
        WHERE user_id = NEW.user_id
          AND reference_id = NEW.id::text
          AND reference_type = 'inventory_value_adjustment'
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- إذا وجدت معاملة أصلية، قم بتحديثها لتعكس الكمية الجديدة
        IF existing_transaction_id IS NOT NULL THEN
            UPDATE public.cash_transactions
            SET 
                amount = NEW.stock * NEW.cost,
                description = 'تحديث مخزون - ' || NEW.name || ' (كمية: ' || NEW.stock || ')',
                notes = 'مصروف تلقائي محدث لمخزون منتج: ' || NEW.name || ' بتكلفة إجمالية: ' || (NEW.stock * NEW.cost) || ' ج.م',
                updated_at = now()
            WHERE id = existing_transaction_id;
        ELSE
            -- إنشاء معاملة مالية جديدة لقيمة المخزون الإجمالية
            INSERT INTO public.cash_transactions (
                user_id,
                transaction_type,
                amount,
                description,
                category,
                subcategory,
                payment_method,
                reference_type,
                reference_id,
                notes,
                metadata
            ) VALUES (
                NEW.user_id,
                'expense',
                NEW.stock * NEW.cost,
                'مخزون - ' || NEW.name || ' (كمية: ' || NEW.stock || ')',
                'مخزون',
                'قيمة المخزون',
                'cash',
                'inventory_value_adjustment',
                NEW.id::text,
                'مصروف تلقائي لمخزون منتج: ' || NEW.name || ' بتكلفة إجمالية: ' || (NEW.stock * NEW.cost) || ' ج.م',
                jsonb_build_object(
                    'product_id', NEW.id,
                    'product_name', NEW.name,
                    'stock_quantity', NEW.stock,
                    'cost_per_unit', NEW.cost,
                    'total_value', NEW.stock * NEW.cost,
                    'auto_generated', true,
                    'calculation_type', 'inventory_value'
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء trigger للمنتجات
DROP TRIGGER IF EXISTS product_stock_cash_update_trigger ON public.products;
CREATE TRIGGER product_stock_cash_update_trigger
    AFTER UPDATE OF stock, cost ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_product_stock_update();

-- دالة لحساب إجمالي قيمة المخزون
CREATE OR REPLACE FUNCTION public.get_total_inventory_value(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
    total_value NUMERIC := 0;
BEGIN
    SELECT COALESCE(SUM(stock * cost), 0) INTO total_value
    FROM public.products
    WHERE user_id = p_user_id
      AND is_active = true
      AND stock > 0;
      
    RETURN total_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- دالة لإنشاء معاملة مالية لتعديل قيمة المخزون
CREATE OR REPLACE FUNCTION public.create_inventory_value_transaction(
    p_user_id UUID,
    p_product_id UUID,
    p_product_name TEXT,
    p_adjustment_amount NUMERIC,
    p_reason TEXT DEFAULT 'تعديل قيمة المخزون',
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    transaction_id UUID;
BEGIN
    INSERT INTO public.cash_transactions (
        user_id,
        transaction_type,
        amount,
        description,
        category,
        subcategory,
        payment_method,
        reference_type,
        reference_id,
        notes,
        metadata
    ) VALUES (
        p_user_id,
        CASE WHEN p_adjustment_amount > 0 THEN 'expense' ELSE 'income' END,
        ABS(p_adjustment_amount),
        p_reason || ' - ' || p_product_name,
        'مخزون',
        'تعديل قيمة',
        'cash',
        'inventory_adjustment',
        p_product_id::text,
        COALESCE(p_notes, 'تعديل قيمة مخزون المنتج: ' || p_product_name),
        jsonb_build_object(
            'product_id', p_product_id,
            'product_name', p_product_name,
            'adjustment_amount', p_adjustment_amount,
            'reason', p_reason,
            'auto_generated', false
        )
    )
    RETURNING id INTO transaction_id;
    
    RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- دالة لحذف المعاملات المالية الخاصة بمنتج محذوف
CREATE OR REPLACE FUNCTION public.handle_product_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- حذف المعاملات المالية المرتبطة بالمنتج المحذوف
    UPDATE public.cash_transactions
    SET deleted_at = now()
    WHERE reference_id = OLD.id::text
      AND reference_type IN ('inventory_value_adjustment', 'inventory_adjustment')
      AND user_id = OLD.user_id
      AND deleted_at IS NULL;
      
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- trigger للتعامل مع حذف المنتجات
DROP TRIGGER IF EXISTS product_deletion_cash_cleanup_trigger ON public.products;
CREATE TRIGGER product_deletion_cash_cleanup_trigger
    BEFORE DELETE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_product_deletion();