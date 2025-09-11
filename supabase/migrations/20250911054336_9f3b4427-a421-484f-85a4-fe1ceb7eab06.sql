-- حل مشكلة unique constraint في cash_transactions لفواتير الشراء

-- أولاً، دعنا نتحقق من الـ constraint الموجود ونحذفه إذا كان يسبب مشاكل
DROP INDEX IF EXISTS uniq_cash_sales_invoice_active;

-- إنشاء unique constraint أكثر دقة يمنع التكرار فقط للمعاملات غير المحذوفة
CREATE UNIQUE INDEX IF NOT EXISTS uniq_cash_transaction_reference 
ON cash_transactions (user_id, reference_type, reference_id) 
WHERE deleted_at IS NULL;

-- تحديث trigger لفواتير الشراء لحل مشكلة التكرار
CREATE OR REPLACE FUNCTION sync_purchase_invoices_with_cash()
RETURNS TRIGGER AS $$
BEGIN
  -- إذا كان هناك مبلغ مدفوع وكانت الفاتورة ليست محذوفة
  IF NEW.paid_amount > 0 AND NEW.deleted_at IS NULL THEN
    -- حذف أي معاملة موجودة أولاً لتجنب الـ unique constraint
    DELETE FROM cash_transactions 
    WHERE reference_id = NEW.id::text 
    AND reference_type = 'purchase_invoice'
    AND user_id = NEW.user_id;
    
    -- إضافة معاملة مصروف جديدة للصندوق
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
      COALESCE(NEW.payment_method, 'cash'),
      NEW.id::text,
      'purchase_invoice',
      'فاتورة شراء رقم ' || NEW.invoice_number || ' من المورد ' || NEW.supplier_name
    );
    
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;