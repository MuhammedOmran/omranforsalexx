-- إزالة trigger أولاً ثم function ربط فواتير الشراء مع الصندوق

-- إزالة trigger حذف معاملة فاتورة شراء من الصندوق
DROP TRIGGER IF EXISTS trigger_purchase_invoice_cash_transaction ON purchase_invoices;

-- إزالة function إدارة معاملات فواتير الشراء في الصندوق
DROP FUNCTION IF EXISTS handle_purchase_invoice_cash_transaction() CASCADE;

-- إزالة triggers أخرى مرتبطة بفواتير الشراء والصندوق
DROP TRIGGER IF EXISTS trigger_purchase_invoice_cash_transaction_insert ON purchase_invoices;
DROP TRIGGER IF EXISTS trigger_purchase_invoice_cash_transaction_update ON purchase_invoices;
DROP TRIGGER IF EXISTS trigger_purchase_payment_status_update ON purchase_invoices;
DROP TRIGGER IF EXISTS trigger_purchase_invoice_cash_sync ON purchase_invoices;
DROP TRIGGER IF EXISTS trigger_purchase_invoice_cash_delete ON purchase_invoices;

-- إزالة functions أخرى مرتبطة
DROP FUNCTION IF EXISTS update_purchase_invoice_cash_transaction() CASCADE;
DROP FUNCTION IF EXISTS sync_purchase_invoice_with_cash() CASCADE;