-- إنشاء دالة لاستعادة المعاملات المالية عند استعادة المنتج
CREATE OR REPLACE FUNCTION public.handle_product_restoration_cash_recovery()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- إذا تم استعادة المنتج (تغيير is_active من false إلى true)
  IF OLD.is_active = false AND NEW.is_active = true THEN
    -- استعادة المعاملات المالية المرتبطة بهذا المنتج
    UPDATE public.cash_transactions
    SET deleted_at = NULL,
        updated_at = now(),
        notes = COALESCE(notes, '') || ' | تم استعادة المصروف بسبب استعادة المنتج'
    WHERE user_id = NEW.user_id
      AND reference_id = NEW.id::text
      AND reference_type IN ('product_inventory', 'product_stock_update')
      AND deleted_at IS NOT NULL;
  END IF;

  RETURN NEW;
END;
$function$;

-- إنشاء trigger لاستعادة المعاملات المالية عند استعادة المنتج
DROP TRIGGER IF EXISTS product_restoration_cash_recovery_trigger ON products;

CREATE TRIGGER product_restoration_cash_recovery_trigger
  AFTER UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_product_restoration_cash_recovery();