-- تعديل function الحذف النهائي لتجنب التأثير المضاعف على المخزون
CREATE OR REPLACE FUNCTION handle_purchase_invoice_deletion_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- فقط إذا كانت الفاتورة غير محذوفة منطقياً (deleted_at IS NULL)
    -- لأن الحذف المنطقي يتولى تحديث المخزون بالفعل
    IF OLD.deleted_at IS NULL AND OLD.status IN ('paid', 'received') THEN
        -- تحديث المخزون لكل منتج في الفاتورة المحذوفة
        UPDATE products 
        SET stock = GREATEST(stock - pii.quantity, 0),
            updated_at = NOW()
        FROM purchase_invoice_items pii
        WHERE products.id = pii.product_id 
        AND pii.invoice_id = OLD.id
        AND products.user_id = OLD.user_id;
    END IF;
    
    -- إذا كانت الفاتورة محذوفة منطقياً بالفعل (deleted_at IS NOT NULL)
    -- فلا نقوم بأي تحديث للمخزون لأنه تم تحديثه عند الحذف المنطقي
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;