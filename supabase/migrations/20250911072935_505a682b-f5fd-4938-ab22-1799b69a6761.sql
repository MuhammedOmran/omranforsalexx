-- إزالة الـ trigger المسؤول عن إنشاء معاملة مالية عند تحديث المخزون
DROP TRIGGER IF EXISTS handle_product_stock_update_trigger ON public.products;

-- حذف الدالة التي تُنشئ معاملة مالية عند تحديث المخزون
DROP FUNCTION IF EXISTS public.handle_product_stock_update();