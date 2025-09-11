-- إنشاء الجداول المطلوبة لنظام المشتريات والموردين بشكل شامل

-- جدول تفاصيل الموردين المحسن
CREATE TABLE IF NOT EXISTS public.supplier_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  total_purchases DECIMAL(15,2) DEFAULT 0,
  total_debt DECIMAL(15,2) DEFAULT 0,
  credit_limit DECIMAL(15,2) DEFAULT 0,
  risk_level TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high')),
  last_purchase_date DATE,
  registration_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  pending_checks_amount DECIMAL(15,2) DEFAULT 0,
  overdue_installments_amount DECIMAL(15,2) DEFAULT 0,
  average_order_value DECIMAL(15,2) DEFAULT 0,
  delivery_rating DECIMAL(3,2) DEFAULT 5.0 CHECK (delivery_rating >= 0 AND delivery_rating <= 5),
  quality_rating DECIMAL(3,2) DEFAULT 5.0 CHECK (quality_rating >= 0 AND quality_rating <= 5),
  price_competitiveness DECIMAL(3,2) DEFAULT 5.0 CHECK (price_competitiveness >= 0 AND price_competitiveness <= 5),
  payment_history JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول فواتير الشراء
CREATE TABLE IF NOT EXISTS public.purchase_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_number TEXT NOT NULL,
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(15,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'check', 'installment', 'bank_transfer')),
  items_data JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- جدول عناصر فواتير الشراء
CREATE TABLE IF NOT EXISTS public.purchase_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  purchase_invoice_id UUID NOT NULL REFERENCES public.purchase_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_code TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(15,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- تمكين RLS للجداول الجديدة
ALTER TABLE public.supplier_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_invoice_items ENABLE ROW LEVEL SECURITY;

-- سياسات RLS لجدول تفاصيل الموردين
CREATE POLICY "Users can manage their supplier details" 
  ON public.supplier_details 
  FOR ALL 
  USING (auth.uid() = user_id);

-- سياسات RLS لجدول فواتير الشراء
CREATE POLICY "Users can manage their purchase invoices" 
  ON public.purchase_invoices 
  FOR ALL 
  USING (auth.uid() = user_id);

-- سياسات RLS لجدول عناصر فواتير الشراء
CREATE POLICY "Users can manage their purchase invoice items" 
  ON public.purchase_invoice_items 
  FOR ALL 
  USING (auth.uid() = user_id);

-- فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_supplier_details_user_id ON public.supplier_details(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_details_supplier_id ON public.supplier_details(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_user_id ON public.purchase_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id ON public.purchase_invoices(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON public.purchase_invoices(status);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_user_id ON public.purchase_invoice_items(user_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice_id ON public.purchase_invoice_items(purchase_invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_product_id ON public.purchase_invoice_items(product_id);

-- دالة لحساب إجمالي الفاتورة تلقائياً
CREATE OR REPLACE FUNCTION calculate_purchase_invoice_total()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث إجمالي الفاتورة بناء على مجموع العناصر
  UPDATE public.purchase_invoices 
  SET total_amount = (
    SELECT COALESCE(SUM(total_cost), 0) 
    FROM public.purchase_invoice_items 
    WHERE purchase_invoice_id = COALESCE(NEW.purchase_invoice_id, OLD.purchase_invoice_id)
  )
  WHERE id = COALESCE(NEW.purchase_invoice_id, OLD.purchase_invoice_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- تطبيق الدالة على إدراج وتحديث وحذف عناصر الفاتورة
DROP TRIGGER IF EXISTS trigger_calculate_purchase_total ON public.purchase_invoice_items;
CREATE TRIGGER trigger_calculate_purchase_total
  AFTER INSERT OR UPDATE OR DELETE ON public.purchase_invoice_items
  FOR EACH ROW EXECUTE FUNCTION calculate_purchase_invoice_total();

-- دالة لتحديث تفاصيل المورد بعد عملية الشراء
CREATE OR REPLACE FUNCTION update_supplier_details_on_purchase()
RETURNS TRIGGER AS $$
DECLARE
  supplier_details_record RECORD;
BEGIN
  -- التأكد من وجود المورد في الفاتورة
  IF NEW.supplier_id IS NOT NULL THEN
    -- البحث عن أو إنشاء سجل تفاصيل المورد
    SELECT * INTO supplier_details_record 
    FROM public.supplier_details 
    WHERE supplier_id = NEW.supplier_id AND user_id = NEW.user_id;
    
    IF supplier_details_record IS NULL THEN
      -- إنشاء سجل جديد
      INSERT INTO public.supplier_details (
        user_id, supplier_id, total_purchases, last_purchase_date
      ) VALUES (
        NEW.user_id, NEW.supplier_id, NEW.total_amount, NEW.invoice_date
      );
    ELSE
      -- تحديث السجل الموجود
      UPDATE public.supplier_details 
      SET 
        total_purchases = total_purchases + (NEW.total_amount - COALESCE(OLD.total_amount, 0)),
        last_purchase_date = NEW.invoice_date,
        average_order_value = (total_purchases + (NEW.total_amount - COALESCE(OLD.total_amount, 0))) / 
          (SELECT COUNT(*) FROM public.purchase_invoices WHERE supplier_id = NEW.supplier_id AND user_id = NEW.user_id),
        updated_at = now()
      WHERE supplier_id = NEW.supplier_id AND user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق دالة تحديث المورد على فواتير الشراء
DROP TRIGGER IF EXISTS trigger_update_supplier_on_purchase ON public.purchase_invoices;
CREATE TRIGGER trigger_update_supplier_on_purchase
  AFTER INSERT OR UPDATE ON public.purchase_invoices
  FOR EACH ROW EXECUTE FUNCTION update_supplier_details_on_purchase();

-- دالة لحساب مستوى المخاطر للمورد
CREATE OR REPLACE FUNCTION calculate_supplier_risk_level(supplier_details_id UUID)
RETURNS TEXT AS $$
DECLARE
  risk_score INTEGER := 0;
  debt_ratio DECIMAL;
  supplier_record RECORD;
BEGIN
  -- جلب بيانات المورد
  SELECT * INTO supplier_record FROM public.supplier_details WHERE id = supplier_details_id;
  
  IF supplier_record IS NULL THEN
    RETURN 'low';
  END IF;
  
  -- حساب نسبة المديونية
  debt_ratio = CASE 
    WHEN supplier_record.total_purchases > 0 THEN supplier_record.total_debt / supplier_record.total_purchases
    ELSE 0
  END;
  
  -- إضافة نقاط المخاطر بناء على المديونية
  IF debt_ratio > 0.3 THEN risk_score = risk_score + 2;
  ELSIF debt_ratio > 0.1 THEN risk_score = risk_score + 1;
  END IF;
  
  -- الشيكات المعلقة
  IF supplier_record.pending_checks_amount > 20000 THEN risk_score = risk_score + 2;
  ELSIF supplier_record.pending_checks_amount > 10000 THEN risk_score = risk_score + 1;
  END IF;
  
  -- التقييمات المنخفضة
  IF (supplier_record.delivery_rating + supplier_record.quality_rating + supplier_record.price_competitiveness) / 3 < 3 THEN 
    risk_score = risk_score + 2;
  ELSIF (supplier_record.delivery_rating + supplier_record.quality_rating + supplier_record.price_competitiveness) / 3 < 4 THEN 
    risk_score = risk_score + 1;
  END IF;
  
  -- إرجاع مستوى المخاطر
  IF risk_score >= 4 THEN RETURN 'high';
  ELSIF risk_score >= 2 THEN RETURN 'medium';
  ELSE RETURN 'low';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- تسجيل إتمام النظام
INSERT INTO public.advanced_security_logs (
  event_type,
  event_category,
  severity,
  description,
  metadata,
  success
) VALUES (
  'supplier_purchase_system_setup',
  'system_enhancement',
  'info',
  'تم إنشاء نظام المشتريات والموردين المحسن بالكامل',
  jsonb_build_object(
    'tables_created', ARRAY['supplier_details', 'purchase_invoices', 'purchase_invoice_items'],
    'functions_created', ARRAY['calculate_purchase_invoice_total', 'update_supplier_details_on_purchase', 'calculate_supplier_risk_level'],
    'triggers_created', ARRAY['trigger_calculate_purchase_total', 'trigger_update_supplier_on_purchase'],
    'rls_enabled', true,
    'timestamp', now()
  ),
  true
);