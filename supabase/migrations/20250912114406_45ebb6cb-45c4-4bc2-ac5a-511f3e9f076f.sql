-- حذف جميع المعاملات المالية المرتبطة بفواتير الشراء لحل مشكلة الحساب المكرر
DELETE FROM public.cash_transactions 
WHERE reference_type = 'purchase_invoice';

-- تنظيف أي معاملات شراء مكررة أخرى
DELETE FROM public.cash_transactions 
WHERE category = 'purchases' 
AND (description LIKE '%شراء%' OR description LIKE '%مشتريات%')
AND subcategory IN ('inventory_purchase', 'purchase_payment');

-- إضافة تعليق للتوضيح
COMMENT ON TABLE public.cash_transactions IS 'معاملات الصندوق - تم تنظيفها من فواتير الشراء المكررة';