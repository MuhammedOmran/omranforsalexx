-- حذف جميع الدوال المكررة لـ add_user_license أولاً
DROP FUNCTION IF EXISTS public.add_user_license(uuid, integer, text);
DROP FUNCTION IF EXISTS public.add_user_license(uuid, integer);

-- إنشاء الدالة من جديد بشكل واضح ومحدد
CREATE OR REPLACE FUNCTION public.add_user_license(p_user_id uuid, p_duration_days integer, p_license_type text DEFAULT 'premium')
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    new_end_date TIMESTAMP WITH TIME ZONE;
    current_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- حساب تاريخ الانتهاء الجديد
    IF p_license_type = 'lifetime' THEN
        -- للترخيص مدى الحياة نضع تاريخ بعيد جداً (1000 سنة)
        new_end_date := now() + (p_duration_days || ' days')::INTERVAL;
    ELSE
        new_end_date := now() + (p_duration_days || ' days')::INTERVAL;
    END IF;
    
    -- البحث عن ترخيص نشط موجود
    SELECT end_date INTO current_end_date
    FROM public.user_licenses
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- إلغاء تفعيل التراخيص السابقة
    UPDATE public.user_licenses
    SET is_active = false, updated_at = now()
    WHERE user_id = p_user_id AND is_active = true;
    
    -- إضافة الترخيص الجديد
    INSERT INTO public.user_licenses (
        user_id,
        license_type,
        license_duration,
        start_date,
        end_date,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        p_license_type,
        p_duration_days,
        now(),
        new_end_date,
        true,
        now(),
        now()
    );
    
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
            'license_type', p_license_type,
            'duration_days', p_duration_days,
            'end_date', new_end_date
        ),
        'medium'
    );
    
    RETURN true;
END;
$function$;