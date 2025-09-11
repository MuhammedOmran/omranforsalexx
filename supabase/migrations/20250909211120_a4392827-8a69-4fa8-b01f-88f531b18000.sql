-- إزالة company_id من جدول user_sessions وجعل النظام يعتمد على user_id فقط
ALTER TABLE public.user_sessions 
DROP COLUMN IF EXISTS company_id;

-- إزالة company_id من جدول profiles إذا كان موجود
ALTER TABLE public.profiles 
DROP COLUMN IF EXISTS company_id;

-- إزالة company_id من جدول customers والاعتماد على user_id فقط
ALTER TABLE public.customers 
DROP COLUMN IF EXISTS company_id;

-- إزالة company_id من جدول products والاعتماد على user_id فقط  
ALTER TABLE public.products 
DROP COLUMN IF EXISTS company_id;

-- إزالة company_id من جدول invoices والاعتماد على user_id فقط
ALTER TABLE public.invoices 
DROP COLUMN IF EXISTS company_id;

-- إزالة company_id من جدول employees والاعتماد على user_id فقط
ALTER TABLE public.employees 
DROP COLUMN IF EXISTS company_id;

-- إزالة company_id من جدول cash_transactions والاعتماد على user_id فقط
ALTER TABLE public.cash_transactions 
DROP COLUMN IF EXISTS company_id;