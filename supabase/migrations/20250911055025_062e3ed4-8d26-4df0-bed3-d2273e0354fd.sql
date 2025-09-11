-- حل مشكلة فشل إضافة عناصر الفاتورة
-- المشكلة: القيد الفريد uniq_cash_transaction_reference يمنع إضافة معاملة مالية مكررة

-- 1. حذف القيد الفريد الذي يسبب المشكلة
DROP INDEX IF EXISTS uniq_cash_transaction_reference;

-- 2. إنشاء قيد فريد جديد يسمح بمعاملات متعددة لنفس المرجع ولكن مع تواريخ مختلفة
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cash_transaction_reference_with_timestamp 
ON cash_transactions (user_id, reference_type, reference_id, created_at);

-- 3. تحديث trigger المنتجات لمنع إنشاء معاملات مكررة
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
            -- إنشاء معاملة جديدة فقط إذا لم توجد واحدة
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
                NEW.stock * NEW.cost,
                'شراء مخزون - ' || NEW.name || ' (كمية: ' || NEW.stock || ')',
                'inventory_increase',
                NEW.name,
                'adjustment',
                NEW.id::text,
                'inventory_value_adjustment',
                'مصروف تلقائي لشراء مخزون منتج: ' || NEW.name || ' بتكلفة إجمالية: ' || (NEW.stock * NEW.cost) || ' ج.م'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- 4. إنشاء function لمعالجة فواتير الشراء بدون تضارب
CREATE OR REPLACE FUNCTION public.handle_purchase_invoice_cash_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    existing_transaction_id UUID;
BEGIN
    -- إذا كانت الفاتورة مدفوعة جزئياً أو كاملة، أضف/حدث المعاملة المالية
    IF NEW.paid_amount > 0 AND (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.paid_amount != NEW.paid_amount)) THEN
        
        -- البحث عن معاملة موجودة
        SELECT id INTO existing_transaction_id
        FROM public.cash_transactions
        WHERE user_id = NEW.user_id
          AND reference_id = NEW.id::text
          AND reference_type = 'purchase_invoice'
          AND deleted_at IS NULL
        LIMIT 1;
        
        IF existing_transaction_id IS NOT NULL THEN
            -- تحديث المعاملة الموجودة
            UPDATE public.cash_transactions
            SET 
                amount = NEW.paid_amount,
                description = 'فاتورة شراء - ' || NEW.supplier_name || ' - ' || NEW.invoice_number,
                notes = 'فاتورة شراء رقم ' || NEW.invoice_number || ' من المورد ' || NEW.supplier_name || ' - مدفوع: ' || NEW.paid_amount || ' من أصل ' || NEW.total_amount,
                updated_at = now()
            WHERE id = existing_transaction_id;
        ELSE
            -- إنشاء معاملة جديدة
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
                NEW.paid_amount,
                'فاتورة شراء - ' || NEW.supplier_name || ' - ' || NEW.invoice_number,
                'purchases',
                NEW.supplier_name,
                NEW.payment_method,
                NEW.id::text,
                'purchase_invoice',
                'فاتورة شراء رقم ' || NEW.invoice_number || ' من المورد ' || NEW.supplier_name
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- 5. ربط الـ trigger بجدول فواتير الشراء
DROP TRIGGER IF EXISTS trigger_purchase_invoice_cash_transaction ON purchase_invoices;
CREATE TRIGGER trigger_purchase_invoice_cash_transaction
    AFTER INSERT OR UPDATE ON purchase_invoices
    FOR EACH ROW
    EXECUTE FUNCTION handle_purchase_invoice_cash_transaction();

-- 6. تنظيف المعاملات المكررة الموجودة
WITH duplicated_transactions AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, reference_type, reference_id 
            ORDER BY created_at DESC
        ) as rn
    FROM cash_transactions
    WHERE reference_type IN ('inventory_value_adjustment', 'purchase_invoice')
)
UPDATE cash_transactions 
SET deleted_at = now()
WHERE id IN (
    SELECT id FROM duplicated_transactions WHERE rn > 1
);