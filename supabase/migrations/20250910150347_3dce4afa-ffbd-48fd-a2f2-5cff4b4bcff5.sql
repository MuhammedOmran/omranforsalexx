-- Drop the existing function and recreate it with proper enum casting
DROP FUNCTION IF EXISTS public.add_user_license(uuid, integer, text);

CREATE OR REPLACE FUNCTION public.add_user_license(p_user_id uuid, p_duration_days integer, p_license_type text DEFAULT 'yearly')
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    new_end_date TIMESTAMP WITH TIME ZONE;
    license_id UUID;
BEGIN
    -- حساب تاريخ انتهاء الترخيص
    new_end_date := now() + (p_duration_days || ' days')::INTERVAL;
    
    -- إدراج الترخيص الجديد مع التحويل الصحيح للنوع
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
        (CASE 
            WHEN p_license_type = 'yearly' THEN 'premium'
            WHEN p_license_type = 'monthly' THEN 'basic'
            ELSE 'trial'
        END)::license_tier,  -- Cast to license_tier enum
        now(),
        new_end_date,
        p_duration_days,
        true
    ) RETURNING id INTO license_id;
    
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
            'license_id', license_id,
            'license_type', p_license_type,
            'duration_days', p_duration_days,
            'end_date', new_end_date
        ),
        'medium'
    );
    
    RETURN license_id;
END;
$function$