-- إزالة company_id من الجداول بعد حذف السياسات
ALTER TABLE public.customers DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.products DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.user_sessions DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.invoices DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.employees DROP COLUMN IF EXISTS company_id;
ALTER TABLE public.cash_transactions DROP COLUMN IF EXISTS company_id;