-- Update the get_inventory_report function to include min_stock_level and stock_status
CREATE OR REPLACE FUNCTION public.get_inventory_report()
 RETURNS TABLE(
   product_id uuid, 
   product_name text, 
   sku text, 
   current_stock integer, 
   reserved_stock integer, 
   available_stock integer, 
   min_stock_level integer,
   unit_price numeric, 
   total_value numeric,
   stock_status text
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as product_id,
    p.name as product_name,
    p.sku,
    COALESCE(i.current_stock, 0) as current_stock,
    COALESCE(i.reserved_stock, 0) as reserved_stock,
    COALESCE(i.available_stock, 0) as available_stock,
    p.min_stock_level,
    p.unit_price,
    (COALESCE(i.current_stock, 0) * p.unit_price) as total_value,
    CASE 
      WHEN COALESCE(i.current_stock, 0) = 0 THEN 'نفد'
      WHEN COALESCE(i.current_stock, 0) <= p.min_stock_level THEN 'منخفض'
      ELSE 'متوفر'
    END as stock_status
  FROM public.products p
  LEFT JOIN public.inventory i ON p.id = i.product_id
  WHERE p.is_active = true
  ORDER BY p.name;
END;
$function$

-- Create user_devices table for device management
CREATE TABLE IF NOT EXISTS public.user_devices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  device_id TEXT NOT NULL,
  device_name TEXT NOT NULL,
  platform TEXT NOT NULL,
  browser_info TEXT,
  last_login TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, device_id)
);

-- Enable RLS on user_devices
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Create policies for user_devices
CREATE POLICY "Users can view their own devices" 
ON public.user_devices 
FOR SELECT 
USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can manage their own devices" 
ON public.user_devices 
FOR ALL 
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- Create updated_at trigger for user_devices
CREATE TRIGGER update_user_devices_updated_at
BEFORE UPDATE ON public.user_devices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create is_device_authorized function
CREATE OR REPLACE FUNCTION public.is_device_authorized(p_user_id uuid, p_device_id text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.user_devices 
    WHERE user_id = p_user_id 
    AND device_id = p_device_id 
    AND is_active = true
  );
END;
$function$