-- Function to automatically link products by name in purchase invoice items
CREATE OR REPLACE FUNCTION public.link_purchase_item_to_product()
RETURNS TRIGGER AS $$
DECLARE
    matched_product_id UUID;
    invoice_user_id UUID;
BEGIN
    -- Get the user_id from the purchase invoice
    SELECT user_id INTO invoice_user_id 
    FROM purchase_invoices 
    WHERE id = NEW.invoice_id;
    
    -- If product_id is null, try to find matching product by name
    IF NEW.product_id IS NULL AND NEW.product_name IS NOT NULL THEN
        SELECT id INTO matched_product_id
        FROM products 
        WHERE LOWER(TRIM(name)) = LOWER(TRIM(NEW.product_name))
        AND user_id = invoice_user_id
        AND is_active = true
        LIMIT 1;
        
        -- Update the purchase_invoice_item with the found product_id
        IF matched_product_id IS NOT NULL THEN
            NEW.product_id := matched_product_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to run before insert/update on purchase_invoice_items
DROP TRIGGER IF EXISTS trigger_link_purchase_item_to_product ON purchase_invoice_items;
CREATE TRIGGER trigger_link_purchase_item_to_product
    BEFORE INSERT OR UPDATE ON purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.link_purchase_item_to_product();

-- Update existing purchase invoice items that don't have product_id
UPDATE purchase_invoice_items 
SET product_id = (
    SELECT p.id 
    FROM products p
    JOIN purchase_invoices pi ON pi.user_id = p.user_id
    WHERE pi.id = purchase_invoice_items.invoice_id
    AND LOWER(TRIM(p.name)) = LOWER(TRIM(purchase_invoice_items.product_name))
    AND p.is_active = true
    LIMIT 1
)
WHERE product_id IS NULL AND product_name IS NOT NULL;