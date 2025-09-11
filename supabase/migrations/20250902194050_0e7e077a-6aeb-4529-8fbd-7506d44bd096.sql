-- إضافة جدول لتتبع مديونيات العملاء
CREATE TABLE public.customer_debts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  credit_limit NUMERIC NOT NULL DEFAULT 0,
  overdue_amount NUMERIC NOT NULL DEFAULT 0,
  total_purchases NUMERIC NOT NULL DEFAULT 0,
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  last_payment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول لنقاط الولاء والخصومات
CREATE TABLE public.customer_loyalty (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  total_earned_points INTEGER NOT NULL DEFAULT 0,
  total_redeemed_points INTEGER NOT NULL DEFAULT 0,
  current_tier TEXT DEFAULT 'bronze',
  discount_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول للتنبيهات الذكية
CREATE TABLE public.smart_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  reference_id UUID,
  reference_type TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  auto_generated BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- إضافة جدول لربط الشيكات بأصحابها
CREATE TABLE public.check_owners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  check_id UUID NOT NULL,
  owner_type TEXT NOT NULL, -- 'customer', 'supplier', 'employee'
  owner_id UUID NOT NULL,
  owner_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إضافة جدول لربط الأقساط بالعملاء
CREATE TABLE public.installment_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  installment_id UUID NOT NULL,
  customer_id UUID,
  customer_name TEXT,
  invoice_reference TEXT,
  is_overdue BOOLEAN NOT NULL DEFAULT false,
  overdue_days INTEGER DEFAULT 0,
  penalty_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.customer_debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_details ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للعملاء
CREATE POLICY "Users can manage own customer debts" ON public.customer_debts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own customer loyalty" ON public.customer_loyalty
  FOR ALL USING (auth.uid() = user_id);

-- سياسات RLS للتنبيهات
CREATE POLICY "Users can manage own smart alerts" ON public.smart_alerts
  FOR ALL USING (auth.uid() = user_id);

-- سياسات RLS للشيكات
CREATE POLICY "Users can manage own check owners" ON public.check_owners
  FOR ALL USING (auth.uid() = user_id);

-- سياسات RLS للأقساط
CREATE POLICY "Users can manage own installment details" ON public.installment_details
  FOR ALL USING (auth.uid() = user_id);

-- دالة لتحديث المديونيات تلقائياً
CREATE OR REPLACE FUNCTION public.update_customer_debt_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث إجمالي المشتريات ونقاط الولاء
  INSERT INTO public.customer_debts (user_id, customer_id, total_purchases)
  VALUES (NEW.user_id, NEW.customer_id, NEW.total_amount)
  ON CONFLICT (user_id, customer_id) 
  DO UPDATE SET 
    total_purchases = customer_debts.total_purchases + NEW.total_amount,
    updated_at = now();
    
  -- إضافة نقاط الولاء (1 نقطة لكل 10 ريال)
  INSERT INTO public.customer_loyalty (user_id, customer_id, points, total_earned_points)
  VALUES (NEW.user_id, NEW.customer_id, FLOOR(NEW.total_amount / 10), FLOOR(NEW.total_amount / 10))
  ON CONFLICT (user_id, customer_id)
  DO UPDATE SET 
    points = customer_loyalty.points + FLOOR(NEW.total_amount / 10),
    total_earned_points = customer_loyalty.total_earned_points + FLOOR(NEW.total_amount / 10),
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لتحديث حالة الأقساط المتأخرة
CREATE OR REPLACE FUNCTION public.update_overdue_installments()
RETURNS TRIGGER AS $$
BEGIN
  -- تحديث حالة الأقساط المتأخرة
  UPDATE public.installment_details 
  SET 
    is_overdue = (NEW.due_date < CURRENT_DATE AND NOT NEW.paid),
    overdue_days = CASE 
      WHEN NEW.due_date < CURRENT_DATE AND NOT NEW.paid 
      THEN CURRENT_DATE - NEW.due_date 
      ELSE 0 
    END,
    penalty_amount = CASE 
      WHEN NEW.due_date < CURRENT_DATE AND NOT NEW.paid 
      THEN (CURRENT_DATE - NEW.due_date) * (NEW.amount * 0.01) -- 1% غرامة يومية
      ELSE 0 
    END,
    updated_at = now()
  WHERE installment_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- دالة لإنشاء التنبيهات الذكية
CREATE OR REPLACE FUNCTION public.generate_smart_alerts(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  alert_count INTEGER := 0;
BEGIN
  -- تنبيهات المخزون المنخفض
  INSERT INTO public.smart_alerts (user_id, alert_type, title, message, severity, reference_type)
  SELECT 
    p_user_id,
    'low_stock',
    'تنبيه مخزون منخفض',
    'المنتج "' || name || '" وصل لمستوى المخزون المنخفض (' || stock || ' قطعة)',
    CASE WHEN stock = 0 THEN 'high' ELSE 'medium' END,
    'product'
  FROM public.products 
  WHERE user_id = p_user_id 
    AND stock <= 5 
    AND NOT EXISTS (
      SELECT 1 FROM public.smart_alerts 
      WHERE user_id = p_user_id 
        AND alert_type = 'low_stock' 
        AND reference_id = products.id::UUID
        AND created_at > now() - INTERVAL '24 hours'
    );
    
  GET DIAGNOSTICS alert_count = ROW_COUNT;
  
  -- تنبيهات الأقساط المستحقة
  INSERT INTO public.smart_alerts (user_id, alert_type, title, message, severity, reference_id, reference_type)
  SELECT 
    p_user_id,
    'installment_due',
    'تنبيه قسط مستحق',
    'قسط بقيمة ' || amount || ' ريال مستحق في ' || due_date,
    CASE WHEN due_date < CURRENT_DATE THEN 'high' ELSE 'medium' END,
    id,
    'installment'
  FROM public.installments 
  WHERE user_id = p_user_id 
    AND NOT paid 
    AND due_date <= CURRENT_DATE + INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.smart_alerts 
      WHERE user_id = p_user_id 
        AND alert_type = 'installment_due' 
        AND reference_id = installments.id
        AND created_at > now() - INTERVAL '24 hours'
    );
    
  -- تنبيهات الشيكات المستحقة
  INSERT INTO public.smart_alerts (user_id, alert_type, title, message, severity, reference_id, reference_type)
  SELECT 
    p_user_id,
    'check_due',
    'تنبيه شيك مستحق',
    'شيك رقم ' || check_number || ' بقيمة ' || amount || ' ريال مستحق في ' || due_date,
    CASE WHEN due_date < CURRENT_DATE THEN 'high' ELSE 'medium' END,
    id,
    'check'
  FROM public.checks 
  WHERE user_id = p_user_id 
    AND status = 'pending'
    AND due_date <= CURRENT_DATE + INTERVAL '7 days'
    AND NOT EXISTS (
      SELECT 1 FROM public.smart_alerts 
      WHERE user_id = p_user_id 
        AND alert_type = 'check_due' 
        AND reference_id = checks.id
        AND created_at > now() - INTERVAL '24 hours'
    );
  
  RETURN alert_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers للتحديث التلقائي
CREATE TRIGGER update_customer_debt_trigger
  AFTER INSERT ON public.invoices
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_customer_debt_on_sale();

CREATE TRIGGER update_overdue_installments_trigger
  AFTER UPDATE ON public.installments
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_overdue_installments();

-- Triggers للتحديث التلقائي للوقت
CREATE TRIGGER update_customer_debts_updated_at
  BEFORE UPDATE ON public.customer_debts
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_customer_loyalty_updated_at
  BEFORE UPDATE ON public.customer_loyalty
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_installment_details_updated_at
  BEFORE UPDATE ON public.installment_details
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_updated_at();