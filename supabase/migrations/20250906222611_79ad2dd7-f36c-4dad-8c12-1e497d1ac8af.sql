-- إنشاء جدول الأقساط
CREATE TABLE public.installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  paid_amount NUMERIC NOT NULL DEFAULT 0,
  remaining_amount NUMERIC NOT NULL DEFAULT 0,
  installment_amount NUMERIC NOT NULL DEFAULT 0,
  installment_period INTEGER NOT NULL DEFAULT 12,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'overdue', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول دفعات الأقساط
CREATE TABLE public.installment_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id UUID NOT NULL REFERENCES public.installments(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL DEFAULT 0,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول إعدادات التطبيق
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL DEFAULT '{}',
  is_encrypted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category, setting_key)
);

-- إنشاء جدول البيانات الأوف لاين
CREATE TABLE public.offline_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  data_type TEXT NOT NULL,
  data_id TEXT NOT NULL,
  data_content JSONB NOT NULL,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, data_type, data_id)
);

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_data ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للأقساط
CREATE POLICY "المستخدمون يمكنهم رؤية أقساطهم فقط"
  ON public.installments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة أقساط جديدة"
  ON public.installments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث أقساطهم"
  ON public.installments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف أقساطهم"
  ON public.installments FOR DELETE
  USING (auth.uid() = user_id);

-- سياسات RLS لدفعات الأقساط
CREATE POLICY "المستخدمون يمكنهم رؤية دفعات أقساطهم"
  ON public.installment_payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.installments 
    WHERE installments.id = installment_payments.installment_id 
    AND installments.user_id = auth.uid()
  ));

CREATE POLICY "المستخدمون يمكنهم إضافة دفعات لأقساطهم"
  ON public.installment_payments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.installments 
    WHERE installments.id = installment_payments.installment_id 
    AND installments.user_id = auth.uid()
  ));

CREATE POLICY "المستخدمون يمكنهم تحديث دفعات أقساطهم"
  ON public.installment_payments FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.installments 
    WHERE installments.id = installment_payments.installment_id 
    AND installments.user_id = auth.uid()
  ));

CREATE POLICY "المستخدمون يمكنهم حذف دفعات أقساطهم"
  ON public.installment_payments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.installments 
    WHERE installments.id = installment_payments.installment_id 
    AND installments.user_id = auth.uid()
  ));

-- سياسات RLS للإعدادات
CREATE POLICY "المستخدمون يمكنهم رؤية إعداداتهم فقط"
  ON public.app_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة إعدادات جديدة"
  ON public.app_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث إعداداتهم"
  ON public.app_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف إعداداتهم"
  ON public.app_settings FOR DELETE
  USING (auth.uid() = user_id);

-- سياسات RLS للبيانات الأوف لاين
CREATE POLICY "المستخدمون يمكنهم رؤية بياناتهم الأوف لاين"
  ON public.offline_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم إضافة بيانات أوف لاين"
  ON public.offline_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم تحديث بياناتهم الأوف لاين"
  ON public.offline_data FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "المستخدمون يمكنهم حذف بياناتهم الأوف لاين"
  ON public.offline_data FOR DELETE
  USING (auth.uid() = user_id);

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_offline_data_updated_at
  BEFORE UPDATE ON public.offline_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_installments_user_id ON public.installments(user_id);
CREATE INDEX idx_installments_status ON public.installments(status);
CREATE INDEX idx_installments_due_date ON public.installments(due_date);
CREATE INDEX idx_installment_payments_installment_id ON public.installment_payments(installment_id);
CREATE INDEX idx_app_settings_user_category ON public.app_settings(user_id, category);
CREATE INDEX idx_offline_data_user_type ON public.offline_data(user_id, data_type);
CREATE INDEX idx_offline_data_sync_status ON public.offline_data(sync_status);