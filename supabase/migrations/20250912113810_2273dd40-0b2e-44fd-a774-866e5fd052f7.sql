-- إزالة الربط بين فواتير الشراء والصندوق
-- حذف أي معاملات مالية مرتبطة بفواتير الشراء من جدول cash_transactions
DELETE FROM public.cash_transactions 
WHERE reference_type = 'purchase_invoice';

-- التأكد من عدم وجود triggers تربط فواتير الشراء بالصندوق
-- (في حالة وجود أي triggers مستقبلية، يتم حذفها هنا)

-- إضافة تعليق لتوضيح أن فواتير الشراء لا ترتبط بالصندوق
COMMENT ON TABLE public.purchase_invoices IS 'فواتير الشراء - لا يتم ربطها تلقائياً بمعاملات الصندوق';