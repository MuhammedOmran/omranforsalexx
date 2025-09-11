-- حذف الدوال المتعلقة بالكمية الإجمالية
DROP FUNCTION IF EXISTS public.calculate_purchase_invoice_total_quantity(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_purchase_invoice_total_quantity(text) CASCADE;