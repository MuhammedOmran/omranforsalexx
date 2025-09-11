-- إنشاء جدول التراخيص إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.user_licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    license_type TEXT NOT NULL DEFAULT 'premium',
    license_duration INTEGER NOT NULL, -- بالأيام
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    features JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_user_licenses_user_id ON public.user_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_licenses_active ON public.user_licenses(is_active, end_date);

-- تفعيل RLS
ALTER TABLE public.user_licenses ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
CREATE POLICY "Users can view their own licenses" 
ON public.user_licenses 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own licenses" 
ON public.user_licenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own licenses" 
ON public.user_licenses 
FOR UPDATE 
USING (auth.uid() = user_id);

-- إنشاء دالة إضافة ترخيص للمستخدم
CREATE OR REPLACE FUNCTION public.add_user_license(
    p_user_id UUID,
    p_duration_days INTEGER,
    p_license_type TEXT DEFAULT 'premium',
    p_features JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

-- إنشاء دالة فحص صحة الترخيص
CREATE OR REPLACE FUNCTION public.check_user_license(p_user_id UUID)
RETURNS TABLE(
    has_active_license BOOLEAN,
    license_type TEXT,
    end_date TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE WHEN ul.id IS NOT NULL AND ul.end_date > now() THEN true ELSE false END as has_active_license,
        ul.license_type,
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
$$;

-- إنشاء دالة تجديد الترخيص
CREATE OR REPLACE FUNCTION public.extend_user_license(
    p_user_id UUID,
    p_additional_days INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_license_id UUID;
    current_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- البحث عن الترخيص النشط
    SELECT id, end_date INTO current_license_id, current_end_date
    FROM public.user_licenses
    WHERE user_id = p_user_id AND is_active = true
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF current_license_id IS NULL THEN
        RAISE EXCEPTION 'No active license found for user';
    END IF;
    
    -- تمديد الترخيص
    UPDATE public.user_licenses
    SET 
        end_date = end_date + (p_additional_days || ' days')::INTERVAL,
        license_duration = license_duration + p_additional_days,
        updated_at = now()
    WHERE id = current_license_id;
    
    -- تسجيل العملية
    INSERT INTO public.audit_logs (
        event_type,
        event_description,
        user_id,
        metadata,
        severity
    ) VALUES (
        'LICENSE_EXTENDED',
        'تم تمديد الترخيص',
        p_user_id,
        jsonb_build_object(
            'license_id', current_license_id,
            'additional_days', p_additional_days,
            'new_end_date', current_end_date + (p_additional_days || ' days')::INTERVAL
        ),
        'medium'
    );
    
    RETURN true;
END;
$$;

-- إنشاء دالة تنظيف التراخيص المنتهية الصلاحية
CREATE OR REPLACE FUNCTION public.cleanup_expired_licenses()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    -- إلغاء تفعيل التراخيص المنتهية الصلاحية
    UPDATE public.user_licenses
    SET is_active = false, updated_at = now()
    WHERE end_date < now() AND is_active = true;
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    
    -- تسجيل العملية
    INSERT INTO public.audit_logs (
        event_type,
        event_description,
        metadata,
        severity
    ) VALUES (
        'LICENSES_CLEANUP',
        'تنظيف التراخيص المنتهية الصلاحية',
        jsonb_build_object('expired_licenses_count', expired_count),
        'low'
    );
    
    RETURN expired_count;
END;
$$;

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_licenses()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_licenses_updated_at
    BEFORE UPDATE ON public.user_licenses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_licenses();