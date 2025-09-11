-- إنشاء دالة لتحديث أسعار المنتجات من فواتير الشراء
CREATE OR REPLACE FUNCTION update_product_cost_from_purchase()
RETURNS trigger AS $$
DECLARE
  v_margin_percentage NUMERIC := 0.30; -- هامش ربح افتراضي 30%
BEGIN
  -- تحديث تكلفة وسعر بيع المنتج عند إضافة أو تحديث عنصر فاتورة شراء
  IF NEW.product_id IS NOT NULL THEN
    UPDATE products 
    SET 
      cost = NEW.unit_cost,
      price = NEW.unit_cost * (1 + v_margin_percentage), -- إضافة هامش ربح 30%
      updated_at = now()
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public';

-- إنشاء trigger لتحديث أسعار المنتجات عند إضافة عناصر فاتورة شراء
CREATE TRIGGER trigger_update_product_cost_on_insert
  AFTER INSERT ON purchase_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_product_cost_from_purchase();

-- إنشاء trigger لتحديث أسعار المنتجات عند تحديث عناصر فاتورة شراء
CREATE TRIGGER trigger_update_product_cost_on_update
  AFTER UPDATE ON purchase_invoice_items
  FOR EACH ROW
  WHEN (OLD.unit_cost IS DISTINCT FROM NEW.unit_cost OR OLD.product_id IS DISTINCT FROM NEW.product_id)
  EXECUTE FUNCTION update_product_cost_from_purchase();