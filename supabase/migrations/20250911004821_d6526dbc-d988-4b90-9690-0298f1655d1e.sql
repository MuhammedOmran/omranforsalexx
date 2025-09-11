-- ضمان عدم تكرار معاملة الصندوق لنفس الفاتورة
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cash_sales_invoice_active
ON public.cash_transactions (user_id, reference_type, reference_id)
WHERE deleted_at IS NULL;