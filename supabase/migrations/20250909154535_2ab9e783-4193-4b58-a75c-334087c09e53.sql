-- إصلاح معاملة المخزون لتعكس الكمية الحالية للمنتج
UPDATE cash_transactions 
SET 
  amount = 5000.00,  -- 50 × 100 = 5000 ج.م
  description = 'شراء مخزون - تيشرت (كمية: 50)',
  notes = 'مصروف تلقائي لشراء مخزون منتج: تيشرت بتكلفة إجمالية: 5000.00 ج.م - تم تحديث المبلغ ليعكس الكمية الحالية',
  updated_at = now()
WHERE reference_id = '69f0f512-ff4f-4f1c-9f6a-7f69f502a9d3' 
  AND reference_type = 'product_inventory'
  AND user_id = '07045e5c-0528-4561-9c0b-dbc47313a19b';

-- إصلاح وتحسين trigger function لتحديث المعاملات المالية عند تغيير المخزون
CREATE OR REPLACE FUNCTION public.handle_product_stock_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
          AND reference_type = 'product_inventory'
          AND deleted_at IS NULL
        LIMIT 1;
        
        -- إذا وجدت معاملة أصلية، قم بتحديثها لتعكس الكمية الجديدة
        IF existing_transaction_id IS NOT NULL THEN
            UPDATE public.cash_transactions
            SET 
                amount = NEW.stock * NEW.cost,
                description = 'شراء مخزون - ' || NEW.name || ' (كمية: ' || NEW.stock || ')',
                notes = 'مصروف تلقائي لشراء مخزون منتج: ' || NEW.name || ' بتكلفة إجمالية: ' || (NEW.stock * NEW.cost) || ' ج.م - تم تحديث المبلغ ليعكس الكمية الحالية',
                updated_at = now()
            WHERE id = existing_transaction_id;
        
        -- إذا تمت زيادة الكمية ولم توجد معاملة أصلية
        ELSIF stock_difference > 0 THEN
            cost_difference := stock_difference * NEW.cost;
            
            IF cost_difference > 0 THEN
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
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;