-- إضافة حقل due_date المفقود في جدول purchase_invoices
ALTER TABLE public.purchase_invoices 
ADD COLUMN IF NOT EXISTS due_date date;