-- إصلاح trigger لتحديث المعاملات المالية عند تعديل كمية المنتجات

-- حذف الـ trigger القديم إذا كان موجود
DROP TRIGGER IF EXISTS update_cash_on_product_stock_change ON public.products;
DROP FUNCTION IF EXISTS public.handle_product_stock_update();

-- إنشاء دالة محدثة لمعالجة تغيير المخزون
CREATE OR REPLACE FUNCTION public.handle_product_stock_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    stock_difference INTEGER;
    cost_difference NUMERIC;
    expense_description TEXT;
    existing_transaction_id UUID;
BEGIN
    -- فقط إذا تغيرت الكمية
    IF OLD.stock IS DISTINCT FROM NEW.stock THEN
        stock_difference := NEW.stock - OLD.stock;
        
        -- إذا تمت زيادة الكمية
        IF stock_difference > 0 THEN
            cost_difference := stock_difference * NEW.cost;
            
            IF cost_difference > 0 THEN
                expense_description := 'زيادة مخزون - ' || NEW.name || ' (كمية إضافية: ' || stock_difference || ')';
                
                -- إضافة معاملة مصروف جديدة للزيادة
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
            
        -- إذا تم تقليل الكمية
        ELSIF stock_difference < 0 THEN
            cost_difference := ABS(stock_difference) * NEW.cost;
            
            IF cost_difference > 0 THEN
                expense_description := 'تقليل مخزون - ' || NEW.name || ' (كمية منقوصة: ' || ABS(stock_difference) || ')';
                
                -- إضافة معاملة إيراد لاسترداد قيمة المخزون المنقوص
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
                    'إيراد تلقائي لاسترداد قيمة مخزون منقوص: ' || NEW.name || ' بقيمة: ' || cost_difference || ' ج.م'
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- إنشاء الـ trigger الجديد
CREATE TRIGGER update_cash_on_product_stock_change
    AFTER UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_product_stock_update();