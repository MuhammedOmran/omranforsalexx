-- إصلاح قيد التحقق على عمود status لإضافة القيمة 'unpaid'
ALTER TABLE public.invoices 
DROP CONSTRAINT invoices_status_check;

ALTER TABLE public.invoices 
ADD CONSTRAINT invoices_status_check 
CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'paid'::text, 'unpaid'::text, 'overdue'::text, 'cancelled'::text]));