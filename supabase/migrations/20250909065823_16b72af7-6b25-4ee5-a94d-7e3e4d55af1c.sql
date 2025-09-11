-- دالة لتحديث أسعار المنتجات الموجودة من فواتير الشراء الحالية
CREATE OR REPLACE FUNCTION sync_existing_products_pricing()
RETURNS TABLE(updated_products_count INTEGER, message TEXT) AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_margin_percentage NUMERIC := 0.30; -- هامش ربح افتراضي 30%
BEGIN
  -- تحديث أسعار المنتجات من أحدث فواتير الشراء
  UPDATE products 
  SET 
    cost = latest_costs.unit_cost,
    price = latest_costs.unit_cost * (1 + v_margin_percentage),
    updated_at = now()
  FROM (
    SELECT DISTINCT ON (pii.product_id) 
      pii.product_id,
      pii.unit_cost,
      pi.invoice_date
    FROM purchase_invoice_items pii
    JOIN purchase_invoices pi ON pii.invoice_id = pi.id
    WHERE pii.product_id IS NOT NULL
      AND pi.deleted_at IS NULL
    ORDER BY pii.product_id, pi.invoice_date DESC, pi.created_at DESC
  ) AS latest_costs
  WHERE products.id = latest_costs.product_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_updated_count, ('تم تحديث أسعار ' || v_updated_count || ' منتج من فواتير الشراء')::TEXT;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path TO 'public';

-- تشغيل الدالة لتحديث الأسعار الحالية
SELECT * FROM sync_existing_products_pricing();