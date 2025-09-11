-- إنشاء جدول معاملات الصندوق
CREATE TABLE public.cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  payment_method TEXT NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'bank', 'credit', 'check')),
  reference_id TEXT,
  reference_type TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول أرصدة الصندوق  
CREATE TABLE public.cash_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  current_balance NUMERIC NOT NULL DEFAULT 0,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  last_transaction_id UUID,
  balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين Row Level Security
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_balances ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول معاملات الصندوق
CREATE POLICY "المستخدمون يمكنهم رؤية معاملاتهم فقط" 
ON public.cash_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة معاملات جديدة" 
ON public.cash_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث معاملاتهم" 
ON public.cash_transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف معاملاتهم" 
ON public.cash_transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- سياسات الأمان لجدول أرصدة الصندوق
CREATE POLICY "المستخدمون يمكنهم رؤية أرصدتهم فقط" 
ON public.cash_balances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة أرصدة جديدة" 
ON public.cash_balances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث أرصدتهم" 
ON public.cash_balances 
FOR UPDATE 
USING (auth.uid() = user_id);

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_cash_transactions_updated_at
BEFORE UPDATE ON public.cash_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_balances_updated_at
BEFORE UPDATE ON public.cash_balances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_cash_transactions_user_id ON public.cash_transactions(user_id);
CREATE INDEX idx_cash_transactions_date ON public.cash_transactions(created_at);
CREATE INDEX idx_cash_transactions_type ON public.cash_transactions(transaction_type);
CREATE INDEX idx_cash_balances_user_id ON public.cash_balances(user_id);
CREATE INDEX idx_cash_balances_date ON public.cash_balances(balance_date);

-- دالة لحساب الرصيد التلقائي
CREATE OR REPLACE FUNCTION public.calculate_cash_balance(p_user_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT 
    COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END), 0)
  INTO v_balance
  FROM public.cash_transactions
  WHERE user_id = p_user_id;
  
  RETURN v_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;