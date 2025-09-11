-- إنشاء دالة لحذف المعاملات المالية المرتبطة بفاتورة الشراء عند الحذف النهائي
CREATE OR REPLACE FUNCTION handle_purchase_invoice_permanent_deletion()
RETURNS trigger AS $$
BEGIN
  -- حذف المعاملات المالية المرتبطة بفاتورة الشراء المحذوفة نهائياً
  DELETE FROM cash_transactions 
  WHERE reference_id = OLD.id::text 
  AND reference_type = 'purchase_invoice'
  AND user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- إنشاء trigger يتم تشغيله عند الحذف النهائي لفاتورة الشراء
CREATE TRIGGER trigger_purchase_invoice_permanent_deletion
  AFTER DELETE ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_purchase_invoice_permanent_deletion();