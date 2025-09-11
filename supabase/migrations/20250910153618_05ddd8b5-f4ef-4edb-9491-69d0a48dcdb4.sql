-- حذف الدوال القديمة التي لا تعمل
DROP FUNCTION IF EXISTS public.check_user_license_limits(uuid);
DROP FUNCTION IF EXISTS public.add_user_license_with_limits(uuid, integer, text, integer, integer);
DROP FUNCTION IF EXISTS public.check_user_license_with_limits(uuid);

-- التأكد من أن الدوال الحديثة تعمل بشكل صحيح
-- إعادة إنشاء دالة فحص الترخيص
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
    days_left INTEGER;
    user_count INTEGER;
    device_count INTEGER;
BEGIN
    -- البحث عن الترخيص النشط
    SELECT ul.*, lt.max_users, lt.max_devices
    INTO license_record
    FROM public.user_licenses ul
    LEFT JOIN public.license_tiers lt ON ul.license_type::text = lt.tier_name::text
    WHERE ul.user_id = p_user_id 
    AND ul.is_active = true
    ORDER BY ul.created_at DESC
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- لا يوجد ترخيص نشط
        RETURN QUERY SELECT 
            false as has_active_license,
            'free'::text as license_type,
            null::timestamp with time zone as end_date,
            30 as days_remaining,
            1 as max_users,
            1 as max_devices,
            0 as current_users,
            0 as current_devices;
        RETURN;
    END IF;
    
    -- حساب الأيام المتبقية
    days_left := GREATEST(0, EXTRACT(day FROM (license_record.end_date - now()))::integer);
    
    -- حساب عدد المستخدمين الحاليين
    SELECT COUNT(*)::integer INTO user_count
    FROM public.licensed_users
    WHERE license_id = license_record.id AND is_active = true;
    
    -- حساب عدد الأجهزة الحالية
    SELECT COUNT(*)::integer INTO device_count  
    FROM public.licensed_devices
    WHERE license_id = license_record.id AND is_active = true;
    
    -- إرجاع النتائج
    RETURN QUERY SELECT 
        (license_record.end_date > now()) as has_active_license,
        license_record.license_type as license_type,
        license_record.end_date as end_date,
        days_left as days_remaining,
        COALESCE(license_record.max_users, 1) as max_users,
        COALESCE(license_record.max_devices, 1) as max_devices,
        user_count as current_users,
        device_count as current_devices;
END;
$$;

-- إعادة إنشاء دالة إضافة الترخيص
CREATE OR REPLACE FUNCTION public.add_user_license(
    p_user_id uuid,
    p_duration_days integer,
    p_license_type text DEFAULT 'yearly',
    p_max_users integer DEFAULT 1,
    p_max_devices integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_license_id UUID;
    existing_license_id UUID;
BEGIN
    -- البحث عن ترخيص نشط موجود
    SELECT id INTO existing_license_id
    FROM public.user_licenses
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- إلغاء تفعيل التراخيص السابقة
    UPDATE public.user_licenses
    SET is_active = false, updated_at = now()
    WHERE user_id = p_user_id AND is_active = true;
    
    -- إنشاء ترخيص جديد
    INSERT INTO public.user_licenses (
        user_id,
        license_type,
        license_duration,
        start_date,
        end_date,
        max_users,
        max_devices,
        is_active
    ) VALUES (
        p_user_id,
        p_license_type::license_tier,
        p_duration_days,
        now(),
        now() + (p_duration_days || ' days')::INTERVAL,
        p_max_users,
        p_max_devices,
        true
    ) RETURNING id INTO new_license_id;
    
    -- تسجيل العملية في سجل الأمان
    INSERT INTO public.audit_logs (
        event_type,
        event_description,
        user_id,
        metadata,
        severity
    ) VALUES (
        'LICENSE_ADDED',
        'تم إضافة ترخيص جديد',
        p_user_id,
        jsonb_build_object(
            'license_id', new_license_id,
            'license_type', p_license_type,
            'duration_days', p_duration_days,
            'max_users', p_max_users,
            'max_devices', p_max_devices
        ),
        'medium'
    );
    
    RETURN true;
END;
$$;