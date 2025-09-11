-- إزالة البيانات القديمة من license_tiers إذا وجدت
DELETE FROM public.license_tiers;

-- إدراج أنواع التراخيص الجديدة
INSERT INTO public.license_tiers (
    tier_name,
    tier_name_ar,
    description,
    duration_days,
    max_users,
    max_devices,
    price,
    features,
    is_active
) VALUES 
(
    'trial',
    'تجريبي',
    'ترخيص تجريبي لمدة 5 أيام',
    5,
    1,
    1,
    0,
    '["basic_features", "limited_support"]'::jsonb,
    true
),
(
    'monthly',
    'شهري',
    'ترخيص شهري لمدة 30 يوم',
    30,
    3,
    3,
    100,
    '["all_features", "email_support", "data_backup"]'::jsonb,
    true
),
(
    'quarterly',
    'ربع سنوي',
    'ترخيص لمدة 3 أشهر (90 يوم)',
    90,
    5,
    5,
    250,
    '["all_features", "priority_support", "data_backup", "advanced_reports"]'::jsonb,
    true
),
(
    'yearly',
    'سنوي',
    'ترخيص سنوي لمدة 365 يوم',
    365,
    5,
    -1,
    800,
    '["all_features", "priority_support", "data_backup", "advanced_reports", "unlimited_devices"]'::jsonb,
    true
),
(
    'premium',
    'مميز',
    'ترخيص مميز مدى الحياة',
    36500,
    -1,
    -1,
    2500,
    '["all_features", "premium_support", "data_backup", "advanced_reports", "unlimited_devices", "unlimited_users", "lifetime_updates"]'::jsonb,
    true
);

-- إنشاء دالة للتحقق من صحة الترخيص مع عدد المستخدمين والأجهزة
CREATE OR REPLACE FUNCTION public.validate_license_limits(p_user_id uuid)
RETURNS TABLE(
    is_valid boolean,
    license_type text,
    users_count integer,
    max_users integer,
    devices_count integer,
    max_devices integer,
    days_remaining integer,
    error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    license_record RECORD;
    current_users_count INTEGER;
    current_devices_count INTEGER;
BEGIN
    -- الحصول على الترخيص النشط
    SELECT 
        ul.license_type,
        ul.end_date,
        lt.max_users,
        lt.max_devices,
        EXTRACT(days FROM ul.end_date - now())::INTEGER as days_left
    INTO license_record
    FROM public.user_licenses ul
    JOIN public.license_tiers lt ON ul.license_type = lt.tier_name
    WHERE ul.user_id = p_user_id 
    AND ul.is_active = true
    AND ul.end_date > now()
    ORDER BY ul.created_at DESC
    LIMIT 1;
    
    -- إذا لم يوجد ترخيص صالح
    IF license_record IS NULL THEN
        RETURN QUERY SELECT 
            false,
            ''::text,
            0,
            0,
            0,
            0,
            0,
            'لا يوجد ترخيص صالح'::text;
        RETURN;
    END IF;
    
    -- حساب عدد المستخدمين المرخصين حالياً
    SELECT COALESCE(COUNT(*), 0) INTO current_users_count
    FROM public.licensed_users lu
    JOIN public.user_licenses ul ON lu.license_id = ul.id
    WHERE ul.user_id = p_user_id 
    AND lu.is_active = true
    AND ul.is_active = true;
    
    -- حساب عدد الأجهزة المرخصة حالياً
    SELECT COALESCE(COUNT(*), 0) INTO current_devices_count
    FROM public.licensed_devices ld
    JOIN public.user_licenses ul ON ld.license_id = ul.id
    WHERE ul.user_id = p_user_id 
    AND ld.is_active = true
    AND ul.is_active = true;
    
    -- التحقق من الحدود
    RETURN QUERY SELECT 
        true,
        license_record.license_type,
        current_users_count,
        CASE WHEN license_record.max_users = -1 THEN 999999 ELSE license_record.max_users END,
        current_devices_count,
        CASE WHEN license_record.max_devices = -1 THEN 999999 ELSE license_record.max_devices END,
        license_record.days_left,
        CASE 
            WHEN license_record.max_users != -1 AND current_users_count >= license_record.max_users THEN
                'تم الوصول للحد الأقصى من المستخدمين'
            WHEN license_record.max_devices != -1 AND current_devices_count >= license_record.max_devices THEN
                'تم الوصول للحد الأقصى من الأجهزة'
            ELSE ''
        END::text;
END;
$$;

-- إنشاء دالة لإضافة مستخدم مرخص
CREATE OR REPLACE FUNCTION public.add_licensed_user(
    p_license_owner_id uuid,
    p_licensed_user_id uuid,
    p_role text DEFAULT 'user'
)
RETURNS TABLE(success boolean, message text, license_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    license_check RECORD;
    new_license_id UUID;
BEGIN
    -- التحقق من صحة الترخيص وحدود المستخدمين
    SELECT * INTO license_check
    FROM public.validate_license_limits(p_license_owner_id)
    LIMIT 1;
    
    IF NOT license_check.is_valid THEN
        RETURN QUERY SELECT false, license_check.error_message, NULL::uuid;
        RETURN;
    END IF;
    
    -- التحقق من عدم تجاوز الحد الأقصى للمستخدمين
    IF license_check.max_users != 999999 AND license_check.users_count >= license_check.max_users THEN
        RETURN QUERY SELECT false, 'تم الوصول للحد الأقصى من المستخدمين المسموح بهم'::text, NULL::uuid;
        RETURN;
    END IF;
    
    -- الحصول على معرف الترخيص
    SELECT ul.id INTO new_license_id
    FROM public.user_licenses ul
    WHERE ul.user_id = p_license_owner_id 
    AND ul.is_active = true
    AND ul.end_date > now()
    ORDER BY ul.created_at DESC
    LIMIT 1;
    
    -- إضافة المستخدم المرخص
    INSERT INTO public.licensed_users (
        license_owner_id,
        licensed_user_id,
        license_id,
        role,
        granted_by,
        is_active
    ) VALUES (
        p_license_owner_id,
        p_licensed_user_id,
        new_license_id,
        p_role,
        p_license_owner_id,
        true
    );
    
    RETURN QUERY SELECT true, 'تم إضافة المستخدم بنجاح'::text, new_license_id;
END;
$$;

-- إنشاء دالة لإضافة جهاز مرخص
CREATE OR REPLACE FUNCTION public.add_licensed_device(
    p_user_id uuid,
    p_device_id text,
    p_device_name text DEFAULT NULL,
    p_device_type text DEFAULT 'unknown',
    p_browser_info text DEFAULT NULL,
    p_os_info text DEFAULT NULL,
    p_ip_address inet DEFAULT NULL
)
RETURNS TABLE(success boolean, message text, device_uuid uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    license_check RECORD;
    current_license_id UUID;
    new_device_id UUID;
BEGIN
    -- التحقق من صحة الترخيص وحدود الأجهزة
    SELECT * INTO license_check
    FROM public.validate_license_limits(p_user_id)
    LIMIT 1;
    
    IF NOT license_check.is_valid THEN
        RETURN QUERY SELECT false, license_check.error_message, NULL::uuid;
        RETURN;
    END IF;
    
    -- التحقق من عدم تجاوز الحد الأقصى للأجهزة
    IF license_check.max_devices != 999999 AND license_check.devices_count >= license_check.max_devices THEN
        RETURN QUERY SELECT false, 'تم الوصول للحد الأقصى من الأجهزة المسموح بها'::text, NULL::uuid;
        RETURN;
    END IF;
    
    -- الحصول على معرف الترخيص
    SELECT ul.id INTO current_license_id
    FROM public.user_licenses ul
    WHERE ul.user_id = p_user_id 
    AND ul.is_active = true
    AND ul.end_date > now()
    ORDER BY ul.created_at DESC
    LIMIT 1;
    
    -- التحقق من عدم وجود الجهاز مسبقاً
    IF EXISTS (
        SELECT 1 FROM public.licensed_devices ld
        JOIN public.user_licenses ul ON ld.license_id = ul.id
        WHERE ul.user_id = p_user_id 
        AND ld.device_id = p_device_id
        AND ld.is_active = true
        AND ul.is_active = true
    ) THEN
        -- تحديث آخر نشاط للجهاز الموجود
        UPDATE public.licensed_devices 
        SET last_activity = now(), ip_address = p_ip_address
        WHERE device_id = p_device_id AND is_active = true;
        
        SELECT id INTO new_device_id 
        FROM public.licensed_devices 
        WHERE device_id = p_device_id AND is_active = true
        LIMIT 1;
        
        RETURN QUERY SELECT true, 'تم تحديث بيانات الجهاز'::text, new_device_id;
        RETURN;
    END IF;
    
    -- إضافة الجهاز الجديد
    INSERT INTO public.licensed_devices (
        user_id,
        license_id,
        device_id,
        device_name,
        device_type,
        browser_info,
        os_info,
        ip_address,
        is_active
    ) VALUES (
        p_user_id,
        current_license_id,
        p_device_id,
        p_device_name,
        p_device_type,
        p_browser_info,
        p_os_info,
        p_ip_address,
        true
    ) RETURNING id INTO new_device_id;
    
    RETURN QUERY SELECT true, 'تم تسجيل الجهاز بنجاح'::text, new_device_id;
END;
$$;

-- إنشاء دالة للحصول على إحصائيات الترخيص
CREATE OR REPLACE FUNCTION public.get_license_statistics(p_user_id uuid)
RETURNS TABLE(
    license_type text,
    license_type_ar text,
    days_remaining integer,
    users_used integer,
    users_limit integer,
    devices_used integer,
    devices_limit integer,
    is_unlimited_users boolean,
    is_unlimited_devices boolean,
    end_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ul.license_type,
        lt.tier_name_ar,
        EXTRACT(days FROM ul.end_date - now())::INTEGER,
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM public.licensed_users lu2 
            WHERE lu2.license_id = ul.id AND lu2.is_active = true
        ), 0),
        CASE WHEN lt.max_users = -1 THEN 999999 ELSE lt.max_users END,
        COALESCE((
            SELECT COUNT(*)::INTEGER 
            FROM public.licensed_devices ld2 
            WHERE ld2.license_id = ul.id AND ld2.is_active = true
        ), 0),
        CASE WHEN lt.max_devices = -1 THEN 999999 ELSE lt.max_devices END,
        lt.max_users = -1,
        lt.max_devices = -1,
        ul.end_date
    FROM public.user_licenses ul
    JOIN public.license_tiers lt ON ul.license_type = lt.tier_name
    WHERE ul.user_id = p_user_id 
    AND ul.is_active = true
    AND ul.end_date > now()
    ORDER BY ul.created_at DESC
    LIMIT 1;
END;
$$;