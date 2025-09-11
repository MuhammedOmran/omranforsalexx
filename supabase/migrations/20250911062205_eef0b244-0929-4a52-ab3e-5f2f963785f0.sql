-- إزالة triggers ربط فواتير الشراء مع الصندوق

-- إزالة trigger إضافة معاملة عند إدراج فاتورة شراء
DROP TRIGGER IF EXISTS trigger_purchase_invoice_cash_transaction_insert ON purchase_invoices;

-- إزالة trigger تحديث معاملة عند تحديث فاتورة شراء
DROP TRIGGER IF EXISTS trigger_purchase_invoice_cash_transaction_update ON purchase_invoices;

-- إزالة trigger إضافة معاملة عند تحديث حالة دفع فاتورة شراء
DROP TRIGGER IF EXISTS trigger_purchase_payment_status_update ON purchase_invoices;

-- إزالة أي triggers أخرى مرتبطة بفواتير الشراء والصندوق
DROP TRIGGER IF EXISTS trigger_purchase_invoice_cash_sync ON purchase_invoices;

-- إزالة trigger حذف معاملة عند حذف فاتورة شراء
DROP TRIGGER IF EXISTS trigger_purchase_invoice_cash_delete ON purchase_invoices;

-- إزالة function إضافة معاملة فاتورة شراء للصندوق إن وجدت
DROP FUNCTION IF EXISTS handle_purchase_invoice_cash_transaction();

-- إزالة function تحديث معاملة فاتورة شراء في الصندوق إن وجدت  
DROP FUNCTION IF EXISTS update_purchase_invoice_cash_transaction();

-- إزالة function مزامنة فواتير الشراء مع الصندوق إن وجدت
DROP FUNCTION IF EXISTS sync_purchase_invoice_with_cash();