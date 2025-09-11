-- حل مشكلة تكرار المعاملات المالية للفواتير

-- أولاً، حذف المعاملات المكررة (نحتفظ بالأقدم فقط)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY reference_id, reference_type, user_id, amount 
      ORDER BY created_at
    ) as row_num
  FROM cash_transactions
  WHERE reference_type = 'sales_invoice'
    AND deleted_at IS NULL
)
UPDATE cash_transactions 
SET deleted_at = NOW()
WHERE id IN (
  SELECT id FROM duplicates WHERE row_num > 1
);

-- إعادة تعريف الدالة مع تحسين منطق التحقق من التكرار
CREATE OR REPLACE FUNCTION public.handle_invoice_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
    customer_name_var TEXT;
    existing_transaction_id UUID;
BEGIN
    -- تسجيل المحاولة في السجل للمراقبة
    RAISE LOG 'Invoice cash transaction trigger called for invoice % with status %', NEW.invoice_number, NEW.status;
    
    -- الحصول على اسم العميل
    SELECT name INTO customer_name_var 
    FROM public.customers 
    WHERE id = NEW.customer_id;
    
    -- إذا لم يتم العثور على العميل، استخدم "عميل غير محدد"
    IF customer_name_var IS NULL THEN
        customer_name_var := 'عميل غير محدد';
    END IF;

    -- البحث عن معاملة موجودة بالفعل
    SELECT id INTO existing_transaction_id
    FROM public.cash_transactions 
    WHERE reference_type = 'sales_invoice' 
    AND reference_id = NEW.invoice_number 
    AND user_id = NEW.user_id
    AND deleted_at IS NULL;

    -- إذا كانت الفاتورة مدفوعة ولم تكن محذوفة
    IF NEW.status = 'paid' AND NEW.deleted_at IS NULL THEN
        -- إذا لم توجد معاملة، أنشئها
        IF existing_transaction_id IS NULL THEN
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
                NEW.total_amount,
                'مبيعات - فاتورة رقم ' || NEW.invoice_number,
                'sales',
                NULL,
                'cash',
                NEW.invoice_number,
                'sales_invoice',
                'ربط تلقائي مع الصندوق - عميل: ' || customer_name_var
            );
            RAISE LOG 'Created new cash transaction for invoice %', NEW.invoice_number;
        ELSE
            -- إذا وجدت معاملة، حدث المبلغ إذا تغير
            UPDATE public.cash_transactions 
            SET 
                amount = NEW.total_amount,
                description = 'مبيعات - فاتورة رقم ' || NEW.invoice_number,
                notes = 'ربط تلقائي مع الصندوق - عميل: ' || customer_name_var,
                updated_at = NOW()
            WHERE id = existing_transaction_id
            AND amount != NEW.total_amount;
            RAISE LOG 'Updated existing cash transaction for invoice %', NEW.invoice_number;
        END IF;
    ELSIF (NEW.status != 'paid' OR NEW.deleted_at IS NOT NULL) AND existing_transaction_id IS NOT NULL THEN
        -- إذا تم إلغاء دفع الفاتورة أو حذفها، احذف المعاملة المالية المرتبطة
        UPDATE public.cash_transactions 
        SET deleted_at = NOW()
        WHERE id = existing_transaction_id;
        RAISE LOG 'Deleted cash transaction for invoice %', NEW.invoice_number;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إعادة إنشاء الـ trigger للتأكد من عدم وجود تداخل
DROP TRIGGER IF EXISTS trigger_invoice_cash_transaction ON public.invoices;
CREATE TRIGGER trigger_invoice_cash_transaction
    AFTER INSERT OR UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invoice_cash_transaction();