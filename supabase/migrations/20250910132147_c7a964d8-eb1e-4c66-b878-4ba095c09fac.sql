-- حذف البيانات الموجودة في جدول license_tiers
DELETE FROM public.license_tiers;

-- إضافة أنواع التراخيص الجديدة
INSERT INTO public.license_tiers (tier_name, tier_name_ar, description, duration_days, max_users, max_devices, price, features, is_active) VALUES
('trial', 'تجريبي', 'ترخيص تجريبي لمدة 5 أيام', 5, 1, 1, 0, 
 '["إنشاء حتى 50 فاتورة", "إدارة العملاء الأساسية", "تقارير أساسية", "دعم عبر البريد الإلكتروني"]'::jsonb, 
 true),

('basic', 'أساسي', 'ترخيص أساسي لمدة 30 يوم', 30, 3, null, 150, 
 '["فواتير غير محدودة", "إدارة متقدمة للعملاء", "تقارير مفصلة", "دعم فني", "3 مستخدمين", "أجهزة غير محدودة"]'::jsonb, 
 true),

('standard', 'معياري', 'ترخيص معياري لمدة 90 يوم', 90, 5, null, 400, 
 '["جميع ميزات الأساسي", "تقارير متقدمة", "نسخ احتياطي تلقائي", "5 مستخدمين", "أجهزة غير محدودة", "دعم فني مخصص"]'::jsonb, 
 true),

('premium', 'مميز', 'ترخيص مميز لمدة سنة كاملة', 365, 5, null, 1200, 
 '["جميع ميزات المعياري", "تحديثات مجانية", "دعم فني 24/7", "تدريب مخصص", "5 مستخدمين", "أجهزة غير محدودة"]'::jsonb, 
 true),

('lifetime', 'مدى الحياة', 'ترخيص مدى الحياة بمزايا كاملة', 365000, null, null, 5000, 
 '["جميع الميزات", "مستخدمين غير محدودين", "أجهزة غير محدودة", "دعم مدى الحياة", "تحديثات مجانية مدى الحياة", "أولوية في الدعم"]'::jsonb, 
 true);

-- تحديث دالة إضافة الترخيص لتتعامل مع الحدود الجديدة
CREATE OR REPLACE FUNCTION public.add_user_license(
    p_user_id uuid, 
    p_duration_days integer, 
    p_license_type text DEFAULT 'premium'::text, 
    p_features jsonb DEFAULT '{}'::jsonb,
    p_max_users integer DEFAULT null,
    p_max_devices integer DEFAULT null
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_license_id UUID;
    license_end_date TIMESTAMP WITH TIME ZONE;
    tier_data RECORD;
BEGIN
    -- الحصول على معلومات نوع الترخيص
    SELECT max_users, max_devices INTO tier_data
    FROM public.license_tiers 
    WHERE tier_name = p_license_type AND is_active = true
    LIMIT 1;
    
    -- حساب تاريخ انتهاء الترخيص
    license_end_date := now() + (p_duration_days || ' days')::INTERVAL;
    
    -- إلغاء تفعيل التراخيص القديمة للمستخدم
    UPDATE public.user_licenses 
    SET is_active = false, updated_at = now()
    WHERE user_id = p_user_id AND is_active = true;
    
    -- إدراج الترخيص الجديد
    INSERT INTO public.user_licenses (
        user_id,
        license_type,
        license_duration,
        start_date,
        end_date,
        is_active,
        features,
        max_users,
        max_devices
    ) VALUES (
        p_user_id,
        p_license_type,
        p_duration_days,
        now(),
        license_end_date,
        true,
        p_features,
        COALESCE(p_max_users, tier_data.max_users),
        COALESCE(p_max_devices, tier_data.max_devices)
    ) RETURNING id INTO new_license_id;
    
    -- تسجيل العملية في سجل التدقيق
    INSERT INTO public.audit_logs (
        event_type,
        event_description,
        user_id,
        metadata,
        severity
    ) VALUES (
        'LICENSE_ADDED',
        'تم إضافة ترخيص جديد للمستخدم',
        p_user_id,
        jsonb_build_object(
            'license_id', new_license_id,
            'license_type', p_license_type,
            'duration_days', p_duration_days,
            'end_date', license_end_date,
            'max_users', COALESCE(p_max_users, tier_data.max_users),
            'max_devices', COALESCE(p_max_devices, tier_data.max_devices)
        ),
        'medium'
    );
    
    RETURN new_license_id;
END;
$function$;

-- إضافة أعمدة max_users و max_devices إلى جدول user_licenses إذا لم تكن موجودة
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_licenses' AND column_name='max_users') THEN
        ALTER TABLE public.user_licenses ADD COLUMN max_users integer;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_licenses' AND column_name='max_devices') THEN
        ALTER TABLE public.user_licenses ADD COLUMN max_devices integer;
    END IF;
END $$;

-- دالة للتحقق من حدود المستخدمين والأجهزة
CREATE OR REPLACE FUNCTION public.check_license_limits(p_license_id uuid, p_user_count integer DEFAULT 1, p_device_count integer DEFAULT 1)
RETURNS TABLE(can_add_user boolean, can_add_device boolean, max_users_reached boolean, max_devices_reached boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    license_record RECORD;
    current_users INTEGER;
    current_devices INTEGER;
BEGIN
    -- الحصول على معلومات الترخيص
    SELECT max_users, max_devices, user_id INTO license_record
    FROM public.user_licenses 
    WHERE id = p_license_id AND is_active = true AND end_date > now();
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, false, true, true;
        RETURN;
    END IF;
    
    -- حساب عدد المستخدمين الحاليين
    SELECT COUNT(*) INTO current_users
    FROM public.licensed_users
    WHERE license_id = p_license_id AND is_active = true;
    
    -- حساب عدد الأجهزة الحالية
    SELECT COUNT(*) INTO current_devices
    FROM public.licensed_devices
    WHERE license_id = p_license_id AND is_active = true;
    
    RETURN QUERY SELECT 
        -- يمكن إضافة مستخدم
        CASE 
            WHEN license_record.max_users IS NULL THEN true
            ELSE (current_users + p_user_count) <= license_record.max_users
        END,
        -- يمكن إضافة جهاز
        CASE 
            WHEN license_record.max_devices IS NULL THEN true
            ELSE (current_devices + p_device_count) <= license_record.max_devices
        END,
        -- تم الوصول لحد المستخدمين
        CASE 
            WHEN license_record.max_users IS NULL THEN false
            ELSE current_users >= license_record.max_users
        END,
        -- تم الوصول لحد الأجهزة
        CASE 
            WHEN license_record.max_devices IS NULL THEN false
            ELSE current_devices >= license_record.max_devices
        END;
END;
$function$;