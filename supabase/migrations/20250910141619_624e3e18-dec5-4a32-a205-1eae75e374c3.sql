-- حذف الدوال المتعارضة وإعادة إنشاء دالة موحدة
DROP FUNCTION IF EXISTS public.add_user_license CASCADE;

-- إنشاء دالة add_user_license المحدثة مع تحديد صريح للأنواع
CREATE OR REPLACE FUNCTION public.add_user_license(
    p_user_id uuid, 
    p_duration_days integer, 
    p_license_type text DEFAULT 'premium',
    p_features jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    new_license_id UUID;
    license_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
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
        features
    ) VALUES (
        p_user_id,
        p_license_type,
        p_duration_days,
        now(),
        license_end_date,
        true,
        p_features
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
            'end_date', license_end_date
        ),
        'medium'
    );
    
    RETURN new_license_id;
END;
$function$;