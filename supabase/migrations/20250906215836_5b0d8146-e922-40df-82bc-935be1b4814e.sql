-- إنشاء جدول الشيكات
CREATE TABLE public.checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  check_number TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  customer_id UUID,
  supplier_id UUID,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  bank_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cashed', 'bounced', 'returned')),
  description TEXT,
  date_received DATE NOT NULL DEFAULT CURRENT_DATE,
  cashed_date DATE,
  bounced_date DATE,
  notes TEXT,
  related_invoice_id UUID,
  entity_type TEXT CHECK (entity_type IN ('customer', 'supplier')),
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.checks ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للشيكات
CREATE POLICY "المستخدمون يمكنهم رؤية شيكاتهم فقط" 
ON public.checks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة شيكات جديدة" 
ON public.checks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث شيكاتهم" 
ON public.checks 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف شيكاتهم" 
ON public.checks 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء جدول المرتجعات
CREATE TABLE public.returns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  return_number TEXT NOT NULL,
  customer_id UUID,
  customer_name TEXT NOT NULL,
  original_invoice_id UUID,
  original_invoice_number TEXT NOT NULL,
  return_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processed', 'rejected')),
  reason TEXT NOT NULL,
  notes TEXT,
  processed_by TEXT,
  processed_date TIMESTAMP WITH TIME ZONE,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمرتجعات
CREATE POLICY "المستخدمون يمكنهم رؤية مرتجعاتهم فقط" 
ON public.returns 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة مرتجعات جديدة" 
ON public.returns 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث مرتجعاتهم" 
ON public.returns 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف مرتجعاتهم" 
ON public.returns 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء جدول عناصر المرتجعات
CREATE TABLE public.return_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  return_id UUID NOT NULL,
  product_id UUID,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لعناصر المرتجعات
CREATE POLICY "المستخدمون يمكنهم رؤية عناصر مرتجعاتهم" 
ON public.return_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.returns 
  WHERE returns.id = return_items.return_id 
  AND returns.user_id = auth.uid()
));

CREATE POLICY "المستخدمون يمكنهم إضافة عناصر لمرتجعاتهم" 
ON public.return_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.returns 
  WHERE returns.id = return_items.return_id 
  AND returns.user_id = auth.uid()
));

CREATE POLICY "المستخدمون يمكنهم تحديث عناصر مرتجعاتهم" 
ON public.return_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.returns 
  WHERE returns.id = return_items.return_id 
  AND returns.user_id = auth.uid()
));

CREATE POLICY "المستخدمون يمكنهم حذف عناصر مرتجعاتهم" 
ON public.return_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.returns 
  WHERE returns.id = return_items.return_id 
  AND returns.user_id = auth.uid()
));

-- إنشاء triggers للتحديث التلقائي للوقت
CREATE TRIGGER update_checks_updated_at
BEFORE UPDATE ON public.checks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_returns_updated_at
BEFORE UPDATE ON public.returns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_checks_user_id ON public.checks(user_id);
CREATE INDEX idx_checks_status ON public.checks(status);
CREATE INDEX idx_checks_due_date ON public.checks(due_date);
CREATE INDEX idx_checks_customer_id ON public.checks(customer_id);
CREATE INDEX idx_checks_supplier_id ON public.checks(supplier_id);

CREATE INDEX idx_returns_user_id ON public.returns(user_id);
CREATE INDEX idx_returns_status ON public.returns(status);
CREATE INDEX idx_returns_date ON public.returns(return_date);
CREATE INDEX idx_returns_customer_id ON public.returns(customer_id);

CREATE INDEX idx_return_items_return_id ON public.return_items(return_id);
CREATE INDEX idx_return_items_product_id ON public.return_items(product_id);