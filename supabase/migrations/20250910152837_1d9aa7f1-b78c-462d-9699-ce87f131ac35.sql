-- حذف الدالة الموجودة
DROP FUNCTION IF EXISTS public.check_user_license(uuid);

-- إنشاء دالة محدثة لفحص الترخيص تشمل معلومات المستخدمين والأجهزة
CREATE OR REPLACE FUNCTION public.check_user_license(p_user_id uuid)
RETURNS TABLE(
    has_active_license boolean,
    license_type text,
    end_date timestamp with time zone,
    days_remaining integer,
    max_users integer,
    max_devices integer,
    current_users integer,
    current_devices integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    license_record RECORD;
    current_user_count INTEGER := 0;
    current_device_count INTEGER := 0;
BEGIN
    -- البحث عن الترخيص النشط
    SELECT 
        ul.license_type,
        ul.end_date,
        ul.is_active,
        COALESCE(ul.max_users, 1) as max_users,
        COALESCE(ul.max_devices, 1) as max_devices,
        EXTRACT(DAY FROM (ul.end_date - now()))::integer as days_remaining
    INTO license_record
    FROM public.user_licenses ul
    WHERE ul.user_id = p_user_id 
    AND ul.is_active = true
    AND ul.end_date > now()
    ORDER BY ul.created_at DESC
    LIMIT 1;
    
    -- إذا لم يوجد ترخيص نشط، إرجاع القيم الافتراضية
    IF license_record IS NULL THEN
        RETURN QUERY SELECT 
            false as has_active_license,
            'free'::text as license_type,
            null::timestamp with time zone as end_date,
            0 as days_remaining,
            1 as max_users,
            1 as max_devices,
            0 as current_users,
            0 as current_devices;
        RETURN;
    END IF;
    
    -- حساب عدد المستخدمين المرخصين الحاليين
    SELECT COUNT(*)::integer INTO current_user_count
    FROM public.licensed_users lu
    WHERE lu.license_owner_id = p_user_id
    AND lu.is_active = true;
    
    -- حساب عدد الأجهزة المرخصة الحالية
    SELECT COUNT(*)::integer INTO current_device_count
    FROM public.licensed_devices ld
    WHERE ld.user_id = p_user_id
    AND ld.is_active = true;
    
    -- إرجاع النتائج
    RETURN QUERY SELECT 
        true as has_active_license,
        license_record.license_type,
        license_record.end_date,
        GREATEST(0, license_record.days_remaining) as days_remaining,
        license_record.max_users,
        license_record.max_devices,
        current_user_count,
        current_device_count;
END;
$$;