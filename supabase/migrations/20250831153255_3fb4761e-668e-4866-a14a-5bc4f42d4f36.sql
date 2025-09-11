-- إضافة عمود المورد لجدول المنتجات
ALTER TABLE public.products 
ADD COLUMN supplier_id uuid REFERENCES public.suppliers(id);

-- إضافة فهرس للأداء
CREATE INDEX idx_products_supplier_id ON public.products(supplier_id);

-- تحديث منتج trigger لتسجيل تغيير المورد
CREATE OR REPLACE FUNCTION public.log_product_supplier_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- تسجيل تغييرات المورد للمنتجات
  IF OLD.supplier_id IS DISTINCT FROM NEW.supplier_id THEN
    INSERT INTO public.advanced_security_logs (
      user_id, event_type, event_category, severity, description,
      metadata, success
    ) VALUES (
      auth.uid(),
      'product_supplier_change',
      'data_access', 
      'low',
      'تم تغيير مورد المنتج: ' || NEW.name,
      jsonb_build_object(
        'product_id', NEW.id,
        'product_name', NEW.name,
        'old_supplier_id', OLD.supplier_id,
        'new_supplier_id', NEW.supplier_id
      ),
      true
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- إنشاء trigger
CREATE TRIGGER trigger_log_product_supplier_changes
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.log_product_supplier_changes();