-- إزالة دالة مزامنة فواتير الشراء مع الصندوق
DROP FUNCTION IF EXISTS public.sync_purchase_invoices_with_cash();

-- حذف المعاملات النقدية المرتبطة بفواتير الشراء الموجودة (اختياري - يمكن الاحتفاظ بها)
-- DELETE FROM public.cash_transactions WHERE reference_type = 'purchase_invoice';