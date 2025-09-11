-- إزالة حقول الربح من جدول عناصر فواتير الشراء
ALTER TABLE public.purchase_invoice_items 
DROP COLUMN IF EXISTS profit_margin_amount,
DROP COLUMN IF EXISTS profit_margin_percentage;