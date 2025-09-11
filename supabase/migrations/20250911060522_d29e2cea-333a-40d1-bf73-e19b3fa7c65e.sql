-- إصلاح trigger المخزون ليعمل مع إضافة المنتجات الجديدة أيضاً
DROP TRIGGER IF EXISTS product_stock_cash_update_trigger ON public.products;

CREATE OR REPLACE FUNCTION public.handle_product_stock_update()
RETURNS TRIGGER AS $$
DECLARE
    stock_difference INTEGER;
    existing_transaction_id UUID;
    new_total_value NUMERIC;
    old_total_value NUMERIC;
BEGIN
    -- حساب القيم الجديدة والقديمة
    new_total_value := COALESCE(NEW.stock, 0) * COALESCE(NEW.cost, 0);
    old_total_value := CASE 
        WHEN TG_OP = 'INSERT' THEN 0 
        ELSE COALESCE(OLD.stock, 0) * COALESCE(OLD.cost, 0) 
    END;
    
    -- التحقق من وجود تغيير في القيمة الإجمالية للمخزون
    IF new_total_value != old_total_value AND new_total_value > 0 THEN
        -- البحث عن المعاملة المالية الأصلية للمنتج
        SELECT id INTO existing_transaction_id
        FROM public.cash_transactions
        WHERE user_id = NEW.user_id
          AND reference_id = NEW.id::text
          AND reference_type = 'inventory_value_adjustment'
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- إذا وجدت معاملة أصلية، قم بتحديثها
        IF existing_transaction_id IS NOT NULL THEN
            UPDATE public.cash_transactions
            SET 
                amount = new_total_value,
                description = 'مخزون - ' || NEW.name || ' (كمية: ' || NEW.stock || ')',
                notes = 'مصروف تلقائي محدث لمخزون منتج: ' || NEW.name || ' بتكلفة إجمالية: ' || new_total_value || ' ج.م',
                updated_at = now()
            WHERE id = existing_transaction_id;
        ELSE
            -- إنشاء معاملة مالية جديدة
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
                new_total_value,
                'مخزون - ' || NEW.name || ' (كمية: ' || NEW.stock || ')',
                'مخزون',
                'قيمة المخزون',
                'cash',
                'inventory_value_adjustment',
                NEW.id::text,
                'مصروف تلقائي لمخزون منتج: ' || NEW.name || ' بتكلفة إجمالية: ' || new_total_value || ' ج.م',
                jsonb_build_object(
                    'product_id', NEW.id,
                    'product_name', NEW.name,
                    'stock_quantity', NEW.stock,
                    'cost_per_unit', NEW.cost,
                    'total_value', new_total_value,
                    'auto_generated', true,
                    'calculation_type', 'inventory_value',
                    'operation_type', TG_OP
                )
            );
        END IF;
    -- إذا أصبحت القيمة صفر أو سالبة، احذف المعاملة المالية
    ELSIF new_total_value <= 0 AND TG_OP = 'UPDATE' THEN
        UPDATE public.cash_transactions
        SET deleted_at = now()
        WHERE user_id = NEW.user_id
          AND reference_id = NEW.id::text
          AND reference_type = 'inventory_value_adjustment'
          AND deleted_at IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء trigger للمنتجات (INSERT و UPDATE)
CREATE TRIGGER product_stock_cash_update_trigger
    AFTER INSERT OR UPDATE OF stock, cost ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_product_stock_update();

-- دالة لمزامنة المخزون الحالي مع الصندوق (للمنتجات الموجودة بالفعل)
CREATE OR REPLACE FUNCTION public.sync_existing_inventory_with_cash(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    product_record RECORD;
    synced_count INTEGER := 0;
BEGIN
    -- مزامنة كل منتج موجود مع الصندوق
    FOR product_record IN 
        SELECT id, name, stock, cost, user_id
        FROM public.products 
        WHERE user_id = p_user_id 
          AND is_active = true 
          AND stock > 0 
          AND cost > 0
    LOOP
        -- تشغيل آلية الـ trigger يدوياً للمنتجات الموجودة
        PERFORM public.handle_product_stock_update_manual(
            product_record.id,
            product_record.name,
            product_record.stock,
            product_record.cost,
            product_record.user_id
        );
        
        synced_count := synced_count + 1;
    END LOOP;
    
    RETURN synced_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- دالة مساعدة لتطبيق منطق الـ trigger يدوياً
CREATE OR REPLACE FUNCTION public.handle_product_stock_update_manual(
    p_product_id UUID,
    p_product_name TEXT,
    p_stock INTEGER,
    p_cost NUMERIC,
    p_user_id UUID
)
RETURNS VOID AS $$
DECLARE
    existing_transaction_id UUID;
    total_value NUMERIC;
BEGIN
    total_value := p_stock * p_cost;
    
    -- البحث عن المعاملة المالية الأصلية
    SELECT id INTO existing_transaction_id
    FROM public.cash_transactions
    WHERE user_id = p_user_id
      AND reference_id = p_product_id::text
      AND reference_type = 'inventory_value_adjustment'
      AND deleted_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- إذا وجدت معاملة أصلية، قم بتحديثها
    IF existing_transaction_id IS NOT NULL THEN
        UPDATE public.cash_transactions
        SET 
            amount = total_value,
            description = 'مخزون - ' || p_product_name || ' (كمية: ' || p_stock || ')',
            notes = 'مصروف تلقائي محدث لمخزون منتج: ' || p_product_name || ' بتكلفة إجمالية: ' || total_value || ' ج.م',
            updated_at = now()
        WHERE id = existing_transaction_id;
    ELSE
        -- إنشاء معاملة مالية جديدة
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
            'expense',
            total_value,
            'مخزون - ' || p_product_name || ' (كمية: ' || p_stock || ')',
            'مخزون',
            'قيمة المخزون',
            'cash',
            'inventory_value_adjustment',
            p_product_id::text,
            'مصروف تلقائي لمخزون منتج: ' || p_product_name || ' بتكلفة إجمالية: ' || total_value || ' ج.م',
            jsonb_build_object(
                'product_id', p_product_id,
                'product_name', p_product_name,
                'stock_quantity', p_stock,
                'cost_per_unit', p_cost,
                'total_value', total_value,
                'auto_generated', true,
                'calculation_type', 'inventory_value',
                'operation_type', 'MANUAL_SYNC'
            )
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;