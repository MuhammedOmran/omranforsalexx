-- Harden functions by setting search_path and security
CREATE OR REPLACE FUNCTION public.update_product_stock_on_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    old_quantity INTEGER DEFAULT 0;
    new_quantity INTEGER DEFAULT 0;
    quantity_diff INTEGER;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.product_id IS NOT NULL THEN
          UPDATE public.products 
          SET stock = stock + NEW.quantity,
              updated_at = now()
          WHERE id = NEW.product_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        old_quantity := COALESCE(OLD.quantity, 0);
        new_quantity := COALESCE(NEW.quantity, 0);
        quantity_diff := new_quantity - old_quantity;
        IF NEW.product_id IS NOT NULL THEN
          UPDATE public.products 
          SET stock = stock + quantity_diff,
              updated_at = now()
          WHERE id = NEW.product_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.product_id IS NOT NULL THEN
          UPDATE public.products 
          SET stock = stock - OLD.quantity,
              updated_at = now()
          WHERE id = OLD.product_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_existing_product_stock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    product_record RECORD;
    total_purchased INTEGER;
    total_sold INTEGER;
    calculated_stock INTEGER;
BEGIN
    FOR product_record IN SELECT id FROM public.products LOOP
        SELECT COALESCE(SUM(pii.quantity), 0) INTO total_purchased
        FROM public.purchase_invoice_items pii
        JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
        WHERE pii.product_id = product_record.id
          AND pi.deleted_at IS NULL;
        
        SELECT COALESCE(SUM(ii.quantity), 0) INTO total_sold
        FROM public.invoice_items ii
        JOIN public.invoices i ON ii.invoice_id = i.id
        WHERE ii.product_id = product_record.id
          AND i.deleted_at IS NULL;
        
        calculated_stock := total_purchased - total_sold;
        
        UPDATE public.products 
        SET stock = GREATEST(calculated_stock, 0),
            updated_at = now()
        WHERE id = product_record.id;
    END LOOP;
END;
$$;

-- Ensure trigger exists (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_stock_on_purchase'
  ) THEN
    CREATE TRIGGER trigger_update_stock_on_purchase
      AFTER INSERT OR UPDATE OR DELETE ON public.purchase_invoice_items
      FOR EACH ROW EXECUTE FUNCTION public.update_product_stock_on_purchase();
  END IF;
END;
$$;