-- إضافة عمود deleted_at لتمكين الحذف المنطقي للفواتير
ALTER TABLE public.purchase_invoices 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- إنشاء فهرس لتحسين الأداء عند البحث عن الفواتير المحذوفة وغير المحذوفة
CREATE INDEX idx_purchase_invoices_deleted_at ON public.purchase_invoices(deleted_at);

-- تحديث السياسات لتستثني الفواتير المحذوفة من الاستعلامات العادية
DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية فواتير الش" ON public.purchase_invoices;

CREATE POLICY "المستخدمون يمكنهم رؤية فواتير الش" 
ON public.purchase_invoices 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NULL);

-- إضافة سياسة جديدة للوصول إلى الفواتير المحذوفة
CREATE POLICY "المستخدمون يمكنهم رؤية فواتيرهم المحذوفة" 
ON public.purchase_invoices 
FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NOT NULL);