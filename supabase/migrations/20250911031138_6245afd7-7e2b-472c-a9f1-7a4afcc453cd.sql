-- إزالة الدالة التي تحاول تحديث عمود غير موجود
DROP FUNCTION IF EXISTS public.update_purchase_invoice_total_quantity() CASCADE;

-- إزالة أي محفزات قد تكون مرتبطة بهذه الدالة
DROP TRIGGER IF EXISTS update_purchase_invoice_quantity_trigger ON purchase_invoice_items;