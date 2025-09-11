-- إزالة جميع triggers المرتبطة بمزامنة فواتير الشراء مع الصندوق
DROP TRIGGER IF EXISTS sync_purchase_cash_on_insert ON public.purchase_invoices;
DROP TRIGGER IF EXISTS sync_purchase_cash_on_update ON public.purchase_invoices;
DROP TRIGGER IF EXISTS purchase_invoice_cash_sync_trigger ON public.purchase_invoices;

-- الآن يمكن إزالة الدالة
DROP FUNCTION IF EXISTS public.sync_purchase_invoices_with_cash();