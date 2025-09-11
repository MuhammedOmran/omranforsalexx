-- تحديث دالة فحص الترخيص لإرجاع نوع الترخيص الصحيح
CREATE OR REPLACE FUNCTION public.check_user_license(p_user_id uuid)
RETURNS TABLE(has_active_license boolean, license_type text, end_date timestamp with time zone, days_remaining integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        CASE WHEN ul.id IS NOT NULL AND ul.end_date > now() THEN true ELSE false END as has_active_license,
        CASE 
            WHEN ul.id IS NOT NULL THEN ul.license_type
            ELSE 'free'
        END as license_type,
        ul.end_date,
        CASE 
            WHEN ul.end_date > now() 
            THEN EXTRACT(days FROM ul.end_date - now())::INTEGER
            ELSE 0
        END as days_remaining
    FROM public.user_licenses ul
    WHERE ul.user_id = p_user_id 
    AND ul.is_active = true
    ORDER BY ul.created_at DESC
    LIMIT 1;
END;
$function$;