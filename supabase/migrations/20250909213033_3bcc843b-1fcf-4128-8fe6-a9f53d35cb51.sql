-- إنشاء trigger لتحديث المعاملات المالية عند تغيير كمية المخزون
CREATE OR REPLACE FUNCTION public.handle_product_stock_update_financial()
RETURNS TRIGGER AS $$
DECLARE
    stock_difference INTEGER;
    cost_difference NUMERIC;
    expense_description TEXT;
    existing_transaction_id UUID;
    new_total_cost NUMERIC;
BEGIN
    -- حساب الفرق في الكمية
    stock_difference := NEW.stock - OLD.stock;
    
    -- إذا تغيرت الكمية
    IF stock_difference != 0 THEN
        -- حساب التكلفة الإجمالية الجديدة
        new_total_cost := NEW.stock * NEW.cost;
        
        -- البحث عن المعاملة المالية الأصلية للمنتج
        SELECT id INTO existing_transaction_id
        FROM public.cash_transactions
        WHERE user_id = NEW.user_id
          AND reference_id = NEW.id::text
          AND reference_type = 'product_inventory'
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- إذا وجدت معاملة أصلية، قم بتحديثها
        IF existing_transaction_id IS NOT NULL THEN
            UPDATE public.cash_transactions
            SET 
                amount = new_total_cost,
                description = 'تحديث مخزون - ' || NEW.name || ' (كمية: ' || NEW.stock || ')',
                notes = 'تحديث تلقائي لمخزون منتج: ' || NEW.name || ' - الكمية الجديدة: ' || NEW.stock || ' - التكلفة الإجمالية: ' || new_total_cost || ' ج.م',
                updated_at = now()
            WHERE id = existing_transaction_id;
        
        -- إذا لم توجد معاملة أصلية وتمت زيادة الكمية
        ELSIF stock_difference > 0 AND new_total_cost > 0 THEN
            cost_difference := stock_difference * NEW.cost;
            expense_description := 'زيادة مخزون - ' || NEW.name || ' (كمية إضافية: ' || stock_difference || ')';
            
            INSERT INTO public.cash_transactions (
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
                cost_difference,
                expense_description,
                'inventory',
                'stock_increase',
                'cash',
                NEW.id::text,
                'product_stock_update',
                'مصروف تلقائي لزيادة مخزون منتج: ' || NEW.name || ' بتكلفة إضافية: ' || cost_difference || ' ج.م'
            );
        
        -- إذا تم تقليل الكمية بشكل كبير، أضف معاملة دخل
        ELSIF stock_difference < 0 AND ABS(stock_difference) * NEW.cost > 0 THEN
            cost_difference := ABS(stock_difference) * NEW.cost;
            expense_description := 'تقليل مخزون - ' || NEW.name || ' (كمية مخفضة: ' || ABS(stock_difference) || ')';
            
            INSERT INTO public.cash_transactions (
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
                'income',
                cost_difference,
                expense_description,
                'inventory',
                'stock_decrease',
                'cash',
                NEW.id::text,
                'product_stock_update',
                'دخل تلقائي من تقليل مخزون منتج: ' || NEW.name || ' - قيمة التخفيض: ' || cost_difference || ' ج.م'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- حذف الـ trigger القديم إن وجد
DROP TRIGGER IF EXISTS update_product_stock_financial ON public.products;

-- إنشاء trigger جديد لتحديث المعاملات المالية عند تغيير المخزون
CREATE TRIGGER update_product_stock_financial
    AFTER UPDATE OF stock ON public.products
    FOR EACH ROW
    WHEN (OLD.stock IS DISTINCT FROM NEW.stock)
    EXECUTE FUNCTION public.handle_product_stock_update_financial();