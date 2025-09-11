-- إنشاء جدول الموردين
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  company TEXT,
  contact_person TEXT,
  tax_number TEXT,
  payment_terms TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين Row Level Security للموردين
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للموردين
CREATE POLICY "المستخدمون يمكنهم رؤية موردينهم فقط" 
ON public.suppliers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إنشاء موردين جدد" 
ON public.suppliers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث موردينهم فقط" 
ON public.suppliers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف موردينهم فقط" 
ON public.suppliers 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء جدول فواتير الشراء
CREATE TABLE public.purchase_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID,
  supplier_name TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  payment_method TEXT DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_purchase_invoices_supplier 
    FOREIGN KEY (supplier_id) 
    REFERENCES public.suppliers(id) 
    ON DELETE SET NULL
);

-- تمكين Row Level Security لفواتير الشراء
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لفواتير الشراء
CREATE POLICY "المستخدمون يمكنهم رؤية فواتير الشراء الخاصة بهم فقط" 
ON public.purchase_invoices 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إنشاء فواتير شراء جديدة" 
ON public.purchase_invoices 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث فواتير الشراء الخاصة بهم فقط" 
ON public.purchase_invoices 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف فواتير الشراء الخاصة بهم فقط" 
ON public.purchase_invoices 
FOR DELETE 
USING (auth.uid() = user_id);

-- إنشاء جدول عناصر فواتير الشراء
CREATE TABLE public.purchase_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL,
  product_id UUID,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_purchase_invoice_items_invoice 
    FOREIGN KEY (invoice_id) 
    REFERENCES public.purchase_invoices(id) 
    ON DELETE CASCADE,
  CONSTRAINT fk_purchase_invoice_items_product 
    FOREIGN KEY (product_id) 
    REFERENCES public.products(id) 
    ON DELETE SET NULL
);

-- تمكين Row Level Security لعناصر فواتير الشراء
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لعناصر فواتير الشراء
CREATE POLICY "المستخدمون يمكنهم رؤية عناصر فواتير الشراء الخاصة بهم" 
ON public.purchase_invoice_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.purchase_invoices 
  WHERE purchase_invoices.id = purchase_invoice_items.invoice_id 
  AND purchase_invoices.user_id = auth.uid()
));

CREATE POLICY "المستخدمون يمكنهم إنشاء عناصر لفواتير الشراء الخاصة بهم" 
ON public.purchase_invoice_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.purchase_invoices 
  WHERE purchase_invoices.id = purchase_invoice_items.invoice_id 
  AND purchase_invoices.user_id = auth.uid()
));

CREATE POLICY "المستخدمون يمكنهم تحديث عناصر فواتير الشراء الخاصة بهم" 
ON public.purchase_invoice_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.purchase_invoices 
  WHERE purchase_invoices.id = purchase_invoice_items.invoice_id 
  AND purchase_invoices.user_id = auth.uid()
));

CREATE POLICY "المستخدمون يمكنهم حذف عناصر فواتير الشراء الخاصة بهم" 
ON public.purchase_invoice_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.purchase_invoices 
  WHERE purchase_invoices.id = purchase_invoice_items.invoice_id 
  AND purchase_invoices.user_id = auth.uid()
));

-- إنشاء مؤشرات لتحسين الأداء
CREATE INDEX idx_suppliers_user_id ON public.suppliers(user_id);
CREATE INDEX idx_purchase_invoices_user_id ON public.purchase_invoices(user_id);
CREATE INDEX idx_purchase_invoices_supplier_id ON public.purchase_invoices(supplier_id);
CREATE INDEX idx_purchase_invoice_items_invoice_id ON public.purchase_invoice_items(invoice_id);
CREATE INDEX idx_purchase_invoice_items_product_id ON public.purchase_invoice_items(product_id);

-- إنشاء triggers لتحديث updated_at تلقائياً
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_purchase_invoices_updated_at
  BEFORE UPDATE ON public.purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء دالة لحساب إحصائيات المشتريات
CREATE OR REPLACE FUNCTION public.get_purchase_statistics(
  p_user_id UUID,
  p_period_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_purchases NUMERIC,
  pending_payments NUMERIC,
  overdue_payments NUMERIC,
  active_suppliers INTEGER,
  top_supplier_name TEXT,
  top_supplier_amount NUMERIC,
  period_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH purchase_stats AS (
    SELECT 
      COALESCE(SUM(pi.total_amount), 0) as total_purchases,
      COALESCE(SUM(CASE WHEN pi.status = 'pending' THEN (pi.total_amount - pi.paid_amount) END), 0) as pending_payments,
      COALESCE(SUM(CASE WHEN pi.status = 'overdue' THEN (pi.total_amount - pi.paid_amount) END), 0) as overdue_payments,
      COUNT(DISTINCT pi.supplier_id) as active_suppliers
    FROM public.purchase_invoices pi
    WHERE pi.user_id = p_user_id
      AND pi.created_at >= (CURRENT_DATE - INTERVAL '1 day' * p_period_days)
  ),
  top_supplier AS (
    SELECT 
      pi.supplier_name,
      SUM(pi.total_amount) as supplier_amount
    FROM public.purchase_invoices pi
    WHERE pi.user_id = p_user_id
      AND pi.created_at >= (CURRENT_DATE - INTERVAL '1 day' * p_period_days)
    GROUP BY pi.supplier_name
    ORDER BY SUM(pi.total_amount) DESC
    LIMIT 1
  )
  SELECT 
    ps.total_purchases,
    ps.pending_payments,
    ps.overdue_payments,
    ps.active_suppliers,
    COALESCE(ts.supplier_name, '') as top_supplier_name,
    COALESCE(ts.supplier_amount, 0) as top_supplier_amount,
    p_period_days
  FROM purchase_stats ps
  LEFT JOIN top_supplier ts ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;