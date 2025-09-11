-- إنشاء دالة لربط فواتير الشراء المدفوعة مع الصندوق تلقائياً
CREATE OR REPLACE FUNCTION sync_purchase_invoices_with_cash()
RETURNS trigger AS $$
BEGIN
  -- إذا كان هناك مبلغ مدفوع وكانت الفاتورة ليست محذوفة
  IF NEW.paid_amount > 0 AND NEW.deleted_at IS NULL THEN
    -- التحقق من عدم وجود معاملة مرتبطة بهذه الفاتورة مسبقاً
    IF NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE reference_id = NEW.id::text 
      AND reference_type = 'purchase_invoice'
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
      AND deleted_at IS NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger للفواتير الجديدة والمحدثة
DROP TRIGGER IF EXISTS sync_purchase_cash_on_insert ON purchase_invoices;
CREATE TRIGGER sync_purchase_cash_on_insert
  AFTER INSERT ON purchase_invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_purchase_invoices_with_cash();

DROP TRIGGER IF EXISTS sync_purchase_cash_on_update ON purchase_invoices;
CREATE TRIGGER sync_purchase_cash_on_update
  AFTER UPDATE ON purchase_invoices
  FOR EACH ROW
  WHEN (OLD.paid_amount IS DISTINCT FROM NEW.paid_amount OR OLD.deleted_at IS DISTINCT FROM NEW.deleted_at)
  EXECUTE FUNCTION sync_purchase_invoices_with_cash();

-- ربط الفواتير الموجودة مع الصندوق
DO $$
DECLARE
  invoice_record RECORD;
BEGIN
  -- جلب فواتير الشراء المدفوعة التي لا توجد لها معاملات في الصندوق
  FOR invoice_record IN 
    SELECT * FROM purchase_invoices 
    WHERE paid_amount > 0 
    AND deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM cash_transactions 
      WHERE reference_id = purchase_invoices.id::text 
      AND reference_type = 'purchase_invoice'
      AND deleted_at IS NULL
    )
  LOOP
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
      invoice_record.user_id,
      'expense',
      invoice_record.paid_amount,
      'فاتورة شراء - ' || invoice_record.supplier_name || ' - ' || invoice_record.invoice_number,
      'purchases',
      invoice_record.supplier_name,
      invoice_record.payment_method,
      invoice_record.id::text,
      'purchase_invoice',
      'فاتورة شراء رقم ' || invoice_record.invoice_number || ' من المورد ' || invoice_record.supplier_name
    );
  END LOOP;
END $$;