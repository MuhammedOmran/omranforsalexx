-- إصلاح مشكلة الأمان في دالة تفعيل الجهاز
CREATE OR REPLACE FUNCTION public.is_device_authorized(p_user_id UUID, p_device_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_devices 
    WHERE user_id = p_user_id 
    AND device_id = p_device_id 
    AND is_active = true
  );
END;
$$;