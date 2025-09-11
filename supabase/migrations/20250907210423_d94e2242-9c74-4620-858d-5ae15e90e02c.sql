-- إنشاء جدول cash_transactions إذا لم يكن موجود
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank', 'credit', 'check')),
  reference_id TEXT,
  reference_type TEXT,
  notes TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول cash_balances إذا لم يكن موجود
CREATE TABLE IF NOT EXISTS public.cash_balances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  opening_balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  last_transaction_id UUID REFERENCES public.cash_transactions(id),
  balance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, balance_date)
);

-- تفعيل Row Level Security
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_balances ENABLE ROW LEVEL SECURITY;

-- إنشاء السياسات الأمنية لجدول cash_transactions
CREATE POLICY "Users can view their own cash transactions" 
ON public.cash_transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cash transactions" 
ON public.cash_transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash transactions" 
ON public.cash_transactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash transactions" 
ON public.cash_transactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء السياسات الأمنية لجدول cash_balances
CREATE POLICY "Users can view their own cash balances" 
ON public.cash_balances 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cash balances" 
ON public.cash_balances 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cash balances" 
ON public.cash_balances 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cash balances" 
ON public.cash_balances 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء دالة لحساب الرصيد
CREATE OR REPLACE FUNCTION public.calculate_cash_balance(p_user_id UUID)
RETURNS DECIMAL(15,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_income DECIMAL(15,2) := 0;
  total_expenses DECIMAL(15,2) := 0;
  balance DECIMAL(15,2) := 0;
BEGIN
  -- حساب إجمالي الدخل
  SELECT COALESCE(SUM(amount), 0) INTO total_income
  FROM cash_transactions
  WHERE user_id = p_user_id AND transaction_type = 'income';
  
  -- حساب إجمالي المصروفات
  SELECT COALESCE(SUM(amount), 0) INTO total_expenses
  FROM cash_transactions
  WHERE user_id = p_user_id AND transaction_type = 'expense';
  
  -- حساب الرصيد
  balance := total_income - total_expenses;
  
  RETURN balance;
END;
$$;

-- إنشاء دالة تحديث الوقت
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- إنشاء المحفزات لتحديث updated_at
CREATE TRIGGER update_cash_transactions_updated_at
  BEFORE UPDATE ON public.cash_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cash_balances_updated_at
  BEFORE UPDATE ON public.cash_balances
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_cash_transactions_user_id ON public.cash_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_created_at ON public.cash_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_type ON public.cash_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_cash_balances_user_id ON public.cash_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_cash_balances_date ON public.cash_balances(balance_date DESC);