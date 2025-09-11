-- تحديث دالة تحديث الرصيد لتعمل مع unique constraint الموجود
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