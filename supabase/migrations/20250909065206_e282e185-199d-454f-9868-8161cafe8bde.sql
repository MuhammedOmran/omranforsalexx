-- إزالة التكرار في المعاملات المالية من فواتير الشراء
-- أولاً نحذف المعاملات المكررة
WITH duplicate_transactions AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY reference_id, reference_type, user_id, amount 
           ORDER BY created_at DESC
         ) as rn
  FROM cash_transactions 
  WHERE reference_type = 'purchase_invoice'
)
DELETE FROM cash_transactions 
WHERE id IN (
  SELECT id FROM duplicate_transactions WHERE rn > 1
);

-- تعديل الـ trigger ليتحقق من وجود المعاملة قبل الإدراج
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
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public';