-- إزالة الـ trigger أولاً ثم الدالة
DROP TRIGGER IF EXISTS product_stock_cash_update_trigger ON public.products CASCADE;

-- حذف الدالة التي تُنشئ معاملة مالية عند تحديث المخزون
DROP FUNCTION IF EXISTS public.handle_product_stock_update() CASCADE;