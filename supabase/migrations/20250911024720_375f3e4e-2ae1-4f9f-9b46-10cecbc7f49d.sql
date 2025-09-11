-- حذف عمود total_quantity من جدول products
ALTER TABLE public.products DROP COLUMN IF EXISTS total_quantity;

-- حذف عمود total_quantity من جدول purchase_invoices إذا كان موجوداً
ALTER TABLE public.purchase_invoices DROP COLUMN IF EXISTS total_quantity;

-- حذف الدالة التي تحدث total_quantity في فواتير الشراء
DROP FUNCTION IF EXISTS public.update_purchase_invoice_totals() CASCADE;