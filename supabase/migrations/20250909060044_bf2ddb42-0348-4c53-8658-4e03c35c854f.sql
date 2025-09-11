-- دالة لإنشاء معاملة مالية تلقائياً عند إنشاء/تحديث فاتورة مبيعات
CREATE OR REPLACE FUNCTION public.handle_invoice_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
    customer_name_var TEXT;
BEGIN
    -- الحصول على اسم العميل
    SELECT name INTO customer_name_var 
    FROM public.customers 
    WHERE id = NEW.customer_id;
    
    -- إذا لم يتم العثور على العميل، استخدم "عميل غير محدد"
    IF customer_name_var IS NULL THEN
        customer_name_var := 'عميل غير محدد';
    END IF;

    -- إذا كانت الفاتورة مدفوعة ولم تكن محذوفة
    IF NEW.status = 'paid' AND NEW.deleted_at IS NULL THEN
        -- التحقق من عدم وجود معاملة مالية مسبقة لهذه الفاتورة
        IF NOT EXISTS (
            SELECT 1 FROM public.cash_transactions 
            WHERE reference_type = 'sales_invoice' 
            AND reference_id = NEW.invoice_number 
            AND user_id = NEW.user_id
        ) THEN
            -- إنشاء معاملة دخل في الصندوق
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
        END IF;
    ELSIF NEW.status != 'paid' OR NEW.deleted_at IS NOT NULL THEN
        -- إذا تم إلغاء دفع الفاتورة أو حذفها، احذف المعاملة المالية المرتبطة
        UPDATE public.cash_transactions 
        SET deleted_at = NOW()
        WHERE reference_type = 'sales_invoice' 
        AND reference_id = NEW.invoice_number 
        AND user_id = NEW.user_id
        AND deleted_at IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء trigger للفواتير الجديدة والمحدثة
DROP TRIGGER IF EXISTS trigger_invoice_cash_transaction ON public.invoices;
CREATE TRIGGER trigger_invoice_cash_transaction
    AFTER INSERT OR UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invoice_cash_transaction();

-- دالة لحساب الرصيد المحدث بعد كل معاملة
CREATE OR REPLACE FUNCTION public.update_cash_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث رصيد الصندوق بعد إضافة معاملة جديدة
    INSERT INTO public.cash_balances (
        user_id,
        balance_date,
        current_balance,
        last_transaction_id
    ) 
    VALUES (
        NEW.user_id,
        CURRENT_DATE,
        public.calculate_cash_balance(NEW.user_id),
        NEW.id
    )
    ON CONFLICT (user_id, balance_date) 
    DO UPDATE SET 
        current_balance = public.calculate_cash_balance(NEW.user_id),
        last_transaction_id = NEW.id,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء trigger لتحديث الرصيد عند إضافة معاملة مالية
DROP TRIGGER IF EXISTS trigger_update_cash_balance ON public.cash_transactions;
CREATE TRIGGER trigger_update_cash_balance
    AFTER INSERT OR UPDATE ON public.cash_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_cash_balance();