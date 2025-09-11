-- حذف الدالة القديمة وإنشاء الجديدة مع الحقول الإضافية
DROP FUNCTION IF EXISTS public.check_user_license(uuid);

CREATE OR REPLACE FUNCTION public.check_user_license(p_user_id uuid)
RETURNS TABLE(has_active_license boolean, license_type text, end_date timestamp with time zone, days_remaining integer, max_users integer, max_devices integer)
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
        END as days_remaining,
        COALESCE(ul.max_users, 1) as max_users,
        COALESCE(ul.max_devices, 1) as max_devices
    FROM public.user_licenses ul
    WHERE ul.user_id = p_user_id 
    AND ul.is_active = true
    ORDER BY ul.created_at DESC
    LIMIT 1;
END;
$function$;