-- إنشاء function لربط فواتير الشراء بالصندوق
CREATE OR REPLACE FUNCTION sync_purchase_invoices_with_cash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- إذا كان هناك مبلغ مدفوع وكانت الفاتورة ليست محذوفة
  IF NEW.paid_amount > 0 AND NEW.deleted_at IS NULL THEN
    -- التحقق من عدم وجود معاملة مرتبطة بهذه الفاتورة مسبقاً
    IF NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE reference_id = NEW.id::text 
      AND reference_type = 'purchase_invoice'
      AND user_id = NEW.user_id
      AND deleted_at IS NULL
    ) THEN
      -- إضافة معاملة مصروف للصندوق
      INSERT INTO cash_transactions (
        user_id,
        transaction_type,
        amount,
        description,
        category,
        subcategory,
        payment_method,
        reference_id,
        reference_type,
        notes
      ) VALUES (
        NEW.user_id,
        'expense',
        NEW.paid_amount,
        'فاتورة شراء - ' || NEW.supplier_name || ' - ' || NEW.invoice_number,
        'purchases',
        NEW.supplier_name,
        NEW.payment_method,
        NEW.id::text,
        'purchase_invoice',
        'فاتورة شراء رقم ' || NEW.invoice_number || ' من المورد ' || NEW.supplier_name
      );
    ELSE
      -- تحديث المعاملة الموجودة إذا تغير المبلغ
      UPDATE cash_transactions 
      SET 
        amount = NEW.paid_amount,
        notes = 'تم تحديث المبلغ المدفوع إلى ' || NEW.paid_amount || ' ج.م',
        updated_at = now()
      WHERE reference_id = NEW.id::text 
      AND reference_type = 'purchase_invoice'
      AND user_id = NEW.user_id
      AND deleted_at IS NULL;
    END IF;
  ELSIF NEW.paid_amount = 0 OR NEW.deleted_at IS NOT NULL THEN
    -- إذا كان المبلغ المدفوع صفر أو تم حذف الفاتورة، احذف المعاملة
    UPDATE cash_transactions 
    SET deleted_at = now()
    WHERE reference_id = NEW.id::text 
    AND reference_type = 'purchase_invoice'
    AND user_id = NEW.user_id
    AND deleted_at IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

-- إنشاء trigger لربط فواتير الشراء بالصندوق
CREATE OR REPLACE TRIGGER purchase_invoice_cash_sync_trigger
  AFTER INSERT OR UPDATE ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_purchase_invoices_with_cash();

-- إنشاء function للتعامل مع الحذف النهائي لفواتير الشراء
CREATE OR REPLACE FUNCTION handle_purchase_invoice_permanent_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- حذف المعاملات المالية المرتبطة بفاتورة الشراء المحذوفة نهائياً
  DELETE FROM cash_transactions 
  WHERE reference_id = OLD.id::text 
  AND reference_type = 'purchase_invoice'
  AND user_id = OLD.user_id;
  
  RETURN OLD;
END;
$$;

-- إنشاء trigger للحذف النهائي
CREATE OR REPLACE TRIGGER purchase_invoice_permanent_deletion_trigger
  AFTER DELETE ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION handle_purchase_invoice_permanent_deletion();