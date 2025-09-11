-- إصلاح مسارات البحث الآمنة للدوال
-- تحديث الدوال التي تفتقر لمسار البحث الآمن

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;