-- إنشاء نوع بيانات لأنواع التراخيص
CREATE TYPE license_tier AS ENUM ('trial', 'basic', 'standard', 'premium', 'enterprise');

-- إنشاء جدول أنواع التراخيص
CREATE TABLE public.license_tiers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_name license_tier NOT NULL UNIQUE,
    tier_name_ar TEXT NOT NULL,
    duration_days INTEGER NOT NULL,
    max_users INTEGER, -- NULL = لا نهائي
    max_devices INTEGER, -- NULL = لا نهائي
    price NUMERIC DEFAULT 0,
    description TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إدراج أنواع التراخيص
INSERT INTO public.license_tiers (tier_name, tier_name_ar, duration_days, max_users, max_devices, price, description, features) VALUES
('trial', 'تجريبي', 5, 1, 1, 0, 'ترخيص تجريبي لمدة 5 أيام', '["basic_features"]'::jsonb),
('basic', 'أساسي', 30, 3, NULL, 100, 'ترخيص أساسي لمدة شهر', '["basic_features", "reports"]'::jsonb),
('standard', 'قياسي', 90, 5, NULL, 250, 'ترخيص قياسي لمدة 3 أشهر', '["basic_features", "reports", "advanced_analytics"]'::jsonb),
('premium', 'مميز', 365, 5, NULL, 800, 'ترخيص مميز لمدة سنة', '["basic_features", "reports", "advanced_analytics", "priority_support"]'::jsonb),
('enterprise', 'المؤسسات', 365000, NULL, NULL, 5000, 'ترخيص المؤسسات - دائم', '["all_features", "unlimited_support", "custom_integration"]'::jsonb);

-- تحديث جدول user_licenses لإضافة معلومات القيود
ALTER TABLE public.user_licenses 
ADD COLUMN IF NOT EXISTS tier license_tier DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS max_users INTEGER,
ADD COLUMN IF NOT EXISTS max_devices INTEGER,
ADD COLUMN IF NOT EXISTS current_users INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_devices INTEGER DEFAULT 0;

-- إنشاء جدول لتتبع الأجهزة المرخصة
CREATE TABLE public.licensed_devices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    license_id UUID NOT NULL REFERENCES public.user_licenses(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    device_type TEXT DEFAULT 'unknown',
    browser_info TEXT,
    os_info TEXT,
    ip_address INET,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(license_id, device_id)
);

-- إنشاء جدول لتتبع المستخدمين المرخصين
CREATE TABLE public.licensed_users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    license_owner_id UUID NOT NULL,
    licensed_user_id UUID NOT NULL,
    license_id UUID NOT NULL REFERENCES public.user_licenses(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'user',
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    granted_by UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(license_id, licensed_user_id)
);

-- دالة للتحقق من حدود المستخدمين
CREATE OR REPLACE FUNCTION check_user_license_limits(p_license_id UUID, p_new_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_max_users INTEGER;
    v_current_users INTEGER;
    v_tier license_tier;
BEGIN
    -- الحصول على معلومات الترخيص
    SELECT max_users, current_users, tier
    INTO v_max_users, v_current_users, v_tier
    FROM public.user_licenses
    WHERE id = p_license_id AND is_active = true;
    
    -- إذا لم يوجد ترخيص نشط
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- إذا كان الحد لا نهائي (NULL)
    IF v_max_users IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- التحقق من عدم تجاوز الحد الأقصى
    IF v_current_users >= v_max_users THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- دالة للتحقق من حدود الأجهزة
CREATE OR REPLACE FUNCTION check_device_license_limits(p_license_id UUID, p_device_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_max_devices INTEGER;
    v_current_devices INTEGER;
    v_tier license_tier;
BEGIN
    -- الحصول على معلومات الترخيص
    SELECT max_devices, current_devices, tier
    INTO v_max_devices, v_current_devices, v_tier
    FROM public.user_licenses
    WHERE id = p_license_id AND is_active = true;
    
    -- إذا لم يوجد ترخيص نشط
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- إذا كان الحد لا نهائي (NULL)
    IF v_max_devices IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- التحقق من وجود الجهاز مسبقاً
    IF EXISTS (
        SELECT 1 FROM public.licensed_devices 
        WHERE license_id = p_license_id AND device_id = p_device_id AND is_active = true
    ) THEN
        RETURN TRUE;
    END IF;
    
    -- التحقق من عدم تجاوز الحد الأقصى
    IF v_current_devices >= v_max_devices THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- دالة محدثة لإضافة ترخيص مع القيود
CREATE OR REPLACE FUNCTION add_user_license_with_limits(
    p_user_id UUID, 
    p_tier license_tier, 
    p_custom_duration_days INTEGER DEFAULT NULL,
    p_features JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_license_id UUID;
    license_end_date TIMESTAMP WITH TIME ZONE;
    tier_info RECORD;
BEGIN
    -- الحصول على معلومات نوع الترخيص
    SELECT duration_days, max_users, max_devices, features
    INTO tier_info
    FROM public.license_tiers
    WHERE tier_name = p_tier AND is_active = true;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'نوع ترخيص غير صالح: %', p_tier;
    END IF;
    
    -- استخدام المدة المخصصة أو الافتراضية
    license_end_date := now() + (COALESCE(p_custom_duration_days, tier_info.duration_days) || ' days')::INTERVAL;
    
    -- إلغاء تفعيل التراخيص القديمة للمستخدم
    UPDATE public.user_licenses 
    SET is_active = false, updated_at = now()
    WHERE user_id = p_user_id AND is_active = true;
    
    -- إدراج الترخيص الجديد
    INSERT INTO public.user_licenses (
        user_id,
        license_type,
        tier,
        license_duration,
        start_date,
        end_date,
        max_users,
        max_devices,
        current_users,
        current_devices,
        is_active,
        features
    ) VALUES (
        p_user_id,
        p_tier::text,
        p_tier,
        COALESCE(p_custom_duration_days, tier_info.duration_days),
        now(),
        license_end_date,
        tier_info.max_users,
        tier_info.max_devices,
        1, -- صاحب الترخيص يحسب كمستخدم
        0,
        true,
        COALESCE(p_features, tier_info.features)
    ) RETURNING id INTO new_license_id;
    
    -- إضافة صاحب الترخيص كمستخدم مرخص
    INSERT INTO public.licensed_users (
        license_owner_id,
        licensed_user_id,
        license_id,
        role,
        granted_by
    ) VALUES (
        p_user_id,
        p_user_id,
        new_license_id,
        'owner',
        p_user_id
    );
    
    -- تسجيل العملية في سجل التدقيق
    INSERT INTO public.audit_logs (
        event_type,
        event_description,
        user_id,
        metadata,
        severity
    ) VALUES (
        'LICENSE_CREATED',
        'تم إنشاء ترخيص جديد',
        p_user_id,
        jsonb_build_object(
            'license_id', new_license_id,
            'tier', p_tier,
            'duration_days', COALESCE(p_custom_duration_days, tier_info.duration_days),
            'max_users', tier_info.max_users,
            'max_devices', tier_info.max_devices,
            'end_date', license_end_date
        ),
        'medium'
    );
    
    RETURN new_license_id;
END;
$$;

-- دالة لإضافة مستخدم إلى ترخيص
CREATE OR REPLACE FUNCTION add_user_to_license(
    p_license_id UUID,
    p_user_id UUID,
    p_granted_by UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_license_owner UUID;
BEGIN
    -- التحقق من حدود المستخدمين
    IF NOT check_user_license_limits(p_license_id, p_user_id) THEN
        RAISE EXCEPTION 'تم تجاوز الحد الأقصى للمستخدمين في هذا الترخيص';
    END IF;
    
    -- الحصول على مالك الترخيص
    SELECT user_id INTO v_license_owner
    FROM public.user_licenses
    WHERE id = p_license_id;
    
    -- إضافة المستخدم
    INSERT INTO public.licensed_users (
        license_owner_id,
        licensed_user_id,
        license_id,
        granted_by
    ) VALUES (
        v_license_owner,
        p_user_id,
        p_license_id,
        p_granted_by
    );
    
    -- تحديث عدد المستخدمين الحالي
    UPDATE public.user_licenses
    SET current_users = current_users + 1,
        updated_at = now()
    WHERE id = p_license_id;
    
    RETURN TRUE;
END;
$$;

-- دالة لإضافة جهاز إلى ترخيص
CREATE OR REPLACE FUNCTION add_device_to_license(
    p_license_id UUID,
    p_user_id UUID,
    p_device_id TEXT,
    p_device_name TEXT DEFAULT NULL,
    p_device_type TEXT DEFAULT 'unknown',
    p_browser_info TEXT DEFAULT NULL,
    p_os_info TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- التحقق من حدود الأجهزة
    IF NOT check_device_license_limits(p_license_id, p_device_id) THEN
        RAISE EXCEPTION 'تم تجاوز الحد الأقصى للأجهزة في هذا الترخيص';
    END IF;
    
    -- إضافة الجهاز أو تحديثه إذا كان موجوداً
    INSERT INTO public.licensed_devices (
        user_id,
        license_id,
        device_id,
        device_name,
        device_type,
        browser_info,
        os_info,
        ip_address
    ) VALUES (
        p_user_id,
        p_license_id,
        p_device_id,
        p_device_name,
        p_device_type,
        p_browser_info,
        p_os_info,
        p_ip_address
    )
    ON CONFLICT (license_id, device_id)
    DO UPDATE SET
        last_activity = now(),
        is_active = true,
        updated_at = now();
    
    -- تحديث عدد الأجهزة الحالي إذا كان جهازاً جديداً
    IF NOT EXISTS (
        SELECT 1 FROM public.licensed_devices 
        WHERE license_id = p_license_id AND device_id = p_device_id
    ) THEN
        UPDATE public.user_licenses
        SET current_devices = current_devices + 1,
            updated_at = now()
        WHERE id = p_license_id;
    END IF;
    
    RETURN TRUE;
END;
$$;

-- دالة محدثة لفحص الترخيص مع القيود
CREATE OR REPLACE FUNCTION check_user_license_with_limits(p_user_id UUID)
RETURNS TABLE(
    has_active_license BOOLEAN,
    license_type TEXT,
    tier license_tier,
    end_date TIMESTAMP WITH TIME ZONE,
    days_remaining INTEGER,
    max_users INTEGER,
    current_users INTEGER,
    max_devices INTEGER,
    current_devices INTEGER,
    can_add_users BOOLEAN,
    can_add_devices BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE WHEN ul.id IS NOT NULL AND ul.end_date > now() THEN true ELSE false END as has_active_license,
        ul.license_type,
        ul.tier,
        ul.end_date,
        CASE 
            WHEN ul.end_date > now() 
            THEN EXTRACT(days FROM ul.end_date - now())::INTEGER
            ELSE 0
        END as days_remaining,
        ul.max_users,
        ul.current_users,
        ul.max_devices,
        ul.current_devices,
        CASE 
            WHEN ul.max_users IS NULL THEN true
            WHEN ul.current_users < ul.max_users THEN true
            ELSE false
        END as can_add_users,
        CASE 
            WHEN ul.max_devices IS NULL THEN true
            WHEN ul.current_devices < ul.max_devices THEN true
            ELSE false
        END as can_add_devices
    FROM public.user_licenses ul
    WHERE ul.user_id = p_user_id 
    AND ul.is_active = true
    ORDER BY ul.created_at DESC
    LIMIT 1;
END;
$$;

-- تريجر لتحديث عداد المستخدمين عند الحذف
CREATE OR REPLACE FUNCTION update_license_user_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.user_licenses
        SET current_users = current_users - 1,
            updated_at = now()
        WHERE id = OLD.license_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- تريجر لتحديث عداد الأجهزة عند الحذف
CREATE OR REPLACE FUNCTION update_license_device_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.user_licenses
        SET current_devices = current_devices - 1,
            updated_at = now()
        WHERE id = OLD.license_id;
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' AND OLD.is_active = true AND NEW.is_active = false THEN
        UPDATE public.user_licenses
        SET current_devices = current_devices - 1,
            updated_at = now()
        WHERE id = NEW.license_id;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;

-- إنشاء التريجرز
CREATE TRIGGER trigger_update_license_user_count
    AFTER DELETE ON public.licensed_users
    FOR EACH ROW
    EXECUTE FUNCTION update_license_user_count();

CREATE TRIGGER trigger_update_license_device_count
    AFTER DELETE OR UPDATE ON public.licensed_devices
    FOR EACH ROW
    EXECUTE FUNCTION update_license_device_count();

-- إنشاء فهارس للأداء
CREATE INDEX IF NOT EXISTS idx_licensed_users_license_id ON public.licensed_users(license_id);
CREATE INDEX IF NOT EXISTS idx_licensed_users_user_id ON public.licensed_users(licensed_user_id);
CREATE INDEX IF NOT EXISTS idx_licensed_devices_license_id ON public.licensed_devices(license_id);
CREATE INDEX IF NOT EXISTS idx_licensed_devices_user_id ON public.licensed_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_licensed_devices_device_id ON public.licensed_devices(device_id);

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.license_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licensed_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.licensed_users ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للجداول الجديدة
CREATE POLICY "Everyone can view license tiers" ON public.license_tiers FOR SELECT USING (true);

CREATE POLICY "Users can view their licensed devices" ON public.licensed_devices 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their licensed devices" ON public.licensed_devices 
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "License owners can view licensed users" ON public.licensed_users 
FOR SELECT USING (auth.uid() = license_owner_id OR auth.uid() = licensed_user_id);

CREATE POLICY "License owners can manage licensed users" ON public.licensed_users 
FOR ALL USING (auth.uid() = license_owner_id);

-- أمثلة لإنشاء التراخيص
-- ترخيص تجريبي: SELECT add_user_license_with_limits('USER_ID', 'trial');
-- ترخيص أساسي: SELECT add_user_license_with_limits('USER_ID', 'basic');  
-- ترخيص قياسي: SELECT add_user_license_with_limits('USER_ID', 'standard');
-- ترخيص مميز: SELECT add_user_license_with_limits('USER_ID', 'premium');
-- ترخيص المؤسسات: SELECT add_user_license_with_limits('USER_ID', 'enterprise');