-- إصلاح خطأ ON CONFLICT في جدول cash_balances
-- إضافة unique constraint للـ user_id و balance_date
ALTER TABLE public.cash_balances 
ADD CONSTRAINT unique_user_balance_date 
UNIQUE (user_id, balance_date);

-- تحديث دالة تحديث الرصيد لتستخدم ON CONFLICT بشكل صحيح
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