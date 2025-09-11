-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_inventory_report()
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  current_stock INTEGER,
  reserved_stock INTEGER,
  available_stock INTEGER,
  unit_price DECIMAL,
  total_value DECIMAL
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku,
    COALESCE(i.current_stock, 0) as current_stock,
    COALESCE(i.reserved_stock, 0) as reserved_stock,
    COALESCE(i.available_stock, 0) as available_stock,
    p.unit_price,
    (COALESCE(i.current_stock, 0) * p.unit_price) as total_value
  FROM public.products p
  LEFT JOIN public.inventory i ON p.id = i.product_id
  WHERE p.is_active = true
  ORDER BY p.name;
END;
$$;