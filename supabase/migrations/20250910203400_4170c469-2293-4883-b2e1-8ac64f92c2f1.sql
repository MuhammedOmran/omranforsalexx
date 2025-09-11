-- Stop auto-changing sale price on purchase and make stock updates deterministic

-- 1) Do not auto-update price from purchase items (only cost)
CREATE OR REPLACE FUNCTION public.update_product_cost_from_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.product_id IS NOT NULL THEN
    UPDATE products 
    SET 
      cost = NEW.unit_cost,
      updated_at = now()
    WHERE id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- 2) Deterministic stock recalculation helpers
CREATE OR REPLACE FUNCTION public.recalculate_product_stock(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_total_purchased integer := 0;
  v_total_sold integer := 0;
  v_new_stock integer := 0;
BEGIN
  IF p_product_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(pii.quantity), 0) INTO v_total_purchased
  FROM public.purchase_invoice_items pii
  JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
  WHERE pii.product_id = p_product_id
    AND pi.deleted_at IS NULL
    AND pi.status IN ('paid', 'received');

  SELECT COALESCE(SUM(ii.quantity), 0) INTO v_total_sold
  FROM public.invoice_items ii
  JOIN public.invoices i ON ii.invoice_id = i.id
  WHERE ii.product_id = p_product_id
    AND i.deleted_at IS NULL
    AND i.status = 'paid';

  v_new_stock := GREATEST(v_total_purchased - v_total_sold, 0);

  UPDATE public.products 
  SET stock = v_new_stock,
      updated_at = now()
  WHERE id = p_product_id;
END;
$function$;

-- Trigger function to call the recalculation for affected product(s)
CREATE OR REPLACE FUNCTION public.trigger_recalc_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.recalculate_product_stock(NEW.product_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.product_id IS DISTINCT FROM OLD.product_id THEN
      PERFORM public.recalculate_product_stock(OLD.product_id);
    END IF;
    PERFORM public.recalculate_product_stock(NEW.product_id);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM public.recalculate_product_stock(OLD.product_id);
    RETURN OLD;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- 3) Attach triggers to both purchase and sales items tables
DROP TRIGGER IF EXISTS trg_recalc_stock_on_purchase_items ON public.purchase_invoice_items;
CREATE TRIGGER trg_recalc_stock_on_purchase_items
AFTER INSERT OR UPDATE OR DELETE ON public.purchase_invoice_items
FOR EACH ROW EXECUTE FUNCTION public.trigger_recalc_product_stock();

DROP TRIGGER IF EXISTS trg_recalc_stock_on_sales_items ON public.invoice_items;
CREATE TRIGGER trg_recalc_stock_on_sales_items
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW EXECUTE FUNCTION public.trigger_recalc_product_stock();

-- 4) Utility to fix a whole user's inventory in one call
CREATE OR REPLACE FUNCTION public.fix_user_inventory_stock(p_user_id uuid)
RETURNS TABLE(product_id uuid, product_name text, old_stock integer, new_stock integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  rec record;
  v_total_purchased integer;
  v_total_sold integer;
  v_new_stock integer;
  v_old_stock integer;
BEGIN
  FOR rec IN SELECT id, name FROM public.products WHERE user_id = p_user_id LOOP
    SELECT COALESCE(SUM(pii.quantity), 0) INTO v_total_purchased
    FROM public.purchase_invoice_items pii
    JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
    WHERE pii.product_id = rec.id
      AND pi.deleted_at IS NULL
      AND pi.status IN ('paid', 'received');

    SELECT COALESCE(SUM(ii.quantity), 0) INTO v_total_sold
    FROM public.invoice_items ii
    JOIN public.invoices i ON ii.invoice_id = i.id
    WHERE ii.product_id = rec.id
      AND i.deleted_at IS NULL
      AND i.status = 'paid';

    v_new_stock := GREATEST(v_total_purchased - v_total_sold, 0);

    SELECT stock INTO v_old_stock FROM public.products WHERE id = rec.id;

    UPDATE public.products
    SET stock = v_new_stock,
        updated_at = now()
    WHERE id = rec.id;

    RETURN QUERY SELECT rec.id, rec.name, v_old_stock, v_new_stock;
  END LOOP;
END;
$function$;