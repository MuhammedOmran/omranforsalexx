-- إضافة حقل deleted_at لجدول المرتجعات للحذف الناعم
ALTER TABLE public.returns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- تحديث RLS policy للـ return_items INSERT
DROP POLICY IF EXISTS "المستخدمون يمكنهم إضافة عناصر لمر" ON public.return_items;
CREATE POLICY "المستخدمون يمكنهم إضافة عناصر مرتجعاتهم" 
ON public.return_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.returns 
    WHERE returns.id = return_items.return_id 
    AND returns.user_id = auth.uid()
  )
);

-- تمكين الـ realtime للجداول
ALTER TABLE public.returns REPLICA IDENTITY FULL;
ALTER TABLE public.return_items REPLICA IDENTITY FULL;

-- إضافة الجداول إلى publication للـ realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.returns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.return_items;