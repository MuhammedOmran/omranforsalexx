-- تحديث دالة إضافة الترخيص لضمان حفظ النوع الصحيح
CREATE OR REPLACE FUNCTION public.add_user_license(p_user_id uuid, p_duration_days integer, p_license_type text DEFAULT 'yearly')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_end_date TIMESTAMP WITH TIME ZONE;
    current_license_id UUID;
BEGIN
    -- حساب تاريخ الانتهاء
    new_end_date := now() + (p_duration_days || ' days')::INTERVAL;
    
    -- إلغاء تفعيل التراخيص السابقة
    UPDATE public.user_licenses
    SET is_active = false, updated_at = now()
    WHERE user_id = p_user_id AND is_active = true;
    
    -- إنشاء ترخيص جديد
    INSERT INTO public.user_licenses (
        user_id,
        license_type,
        tier,
        start_date,
        end_date,
        license_duration,
        is_active
    ) VALUES (
        p_user_id,
        p_license_type,
        CASE 
            WHEN p_license_type = 'yearly' THEN 'premium'
            WHEN p_license_type = 'monthly' THEN 'basic'
            ELSE 'trial'
        END,
        now(),
        new_end_date,
        p_duration_days,
        true
    ) RETURNING id INTO current_license_id;
    
    -- تسجيل العملية
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
            'license_id', current_license_id,
            'license_type', p_license_type,
            'duration_days', p_duration_days,
            'end_date', new_end_date
        ),
        'medium'
    );
    
    RETURN true;
END;
$function$;