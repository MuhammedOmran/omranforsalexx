-- إنشاء enum للأدوار
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'employee', 'viewer');

-- إنشاء enum لمستوى الأمان
CREATE TYPE public.security_level AS ENUM ('low', 'medium', 'high', 'critical');

-- جدول الشركات (إذا لم يكن موجود بالفعل)
-- (تم إنشاؤه مسبقاً)

-- جدول أدوار المستخدمين
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    role app_role NOT NULL DEFAULT 'employee',
    permissions JSONB NOT NULL DEFAULT '[]',
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(user_id, company_id)
);

-- تمكين RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- دالة للتحقق من الأدوار (مع أمان معزز)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _company_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
            AND company_id = _company_id
            AND role = _role
            AND is_active = true
    )
$$;

-- دالة للتحقق من الصلاحيات
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _company_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
            AND company_id = _company_id
            AND is_active = true
            AND (
                role = 'owner' OR
                permissions ? _permission
            )
    )
$$;

-- دالة للحصول على شركة المستخدم
CREATE OR REPLACE FUNCTION public.get_user_company(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT company_id
    FROM public.user_roles
    WHERE user_id = _user_id
        AND is_active = true
    LIMIT 1
$$;

-- إنشاء policies للـ user_roles
CREATE POLICY "المستخدمون يمكنهم رؤية أدوار شركتهم"
    ON public.user_roles
    FOR SELECT
    USING (company_id = get_user_company(auth.uid()));

CREATE POLICY "الإداريون يمكنهم إدارة الأدوار"
    ON public.user_roles
    FOR ALL
    USING (has_role(auth.uid(), company_id, 'owner') OR has_role(auth.uid(), company_id, 'admin'))
    WITH CHECK (has_role(auth.uid(), company_id, 'owner') OR has_role(auth.uid(), company_id, 'admin'));

-- إنشاء جدول جلسات المستخدمين للمراقبة
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    ip_address INET,
    user_agent TEXT,
    location TEXT,
    device_info JSONB NOT NULL DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days'),
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS لجدول الجلسات
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- policies لجدول الجلسات
CREATE POLICY "المستخدمون يمكنهم رؤية جلساتهم"
    ON public.user_sessions
    FOR SELECT
    USING (
        user_id = auth.uid() OR 
        has_role(auth.uid(), company_id, 'admin') OR 
        has_role(auth.uid(), company_id, 'owner')
    );

CREATE POLICY "المستخدمون يمكنهم إنشاء جلسات"
    ON public.user_sessions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "المستخدمون يمكنهم تحديث جلساتهم"
    ON public.user_sessions
    FOR UPDATE
    USING (
        user_id = auth.uid() OR 
        has_role(auth.uid(), company_id, 'admin') OR 
        has_role(auth.uid(), company_id, 'owner')
    )
    WITH CHECK (
        user_id = auth.uid() OR 
        has_role(auth.uid(), company_id, 'admin') OR 
        has_role(auth.uid(), company_id, 'owner')
    );

CREATE POLICY "الإداريون يمكنهم حذف الجلسات"
    ON public.user_sessions
    FOR DELETE
    USING (
        user_id = auth.uid() OR 
        has_role(auth.uid(), company_id, 'admin') OR 
        has_role(auth.uid(), company_id, 'owner')
    );

-- إنشاء جدول سجل الأمان
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    company_id UUID,
    session_id UUID,
    event_type TEXT NOT NULL,
    event_description TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    severity security_level NOT NULL DEFAULT 'low',
    risk_score INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS لسجل الأمان
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- policies لسجل الأمان
CREATE POLICY "يمكن إضافة سجلات الأمان"
    ON public.audit_logs
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "المستخدمون يمكنهم رؤية سجلات شركتهم"
    ON public.audit_logs
    FOR SELECT
    USING (
        has_role(auth.uid(), company_id, 'admin') OR 
        has_role(auth.uid(), company_id, 'owner') OR
        user_id = auth.uid()
    );

-- دالة لتنظيف الجلسات المنتهية الصلاحية
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    UPDATE public.user_sessions
    SET is_active = false,
        last_activity = now()
    WHERE expires_at < now()
        AND is_active = true;
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    
    -- تسجيل العملية في سجل الأمان
    INSERT INTO public.audit_logs (
        event_type,
        event_description,
        severity,
        metadata
    ) VALUES (
        'SYSTEM_CLEANUP',
        'تنظيف الجلسات المنتهية الصلاحية',
        'low',
        jsonb_build_object('cleaned_sessions', cleaned_count)
    );
    
    RETURN cleaned_count;
END;
$$;

-- إضافة المستخدم الحالي كصاحب الشركة (إذا لم يكن موجود)
DO $$
DECLARE
    default_company_id UUID;
    current_user_id UUID;
BEGIN
    -- الحصول على معرف المستخدم الحالي
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        -- إنشاء شركة افتراضية إذا لم تكن موجودة
        INSERT INTO public.companies (
            name,
            settings,
            subscription
        ) VALUES (
            'الشركة الافتراضية',
            '{"features": ["sales", "inventory", "purchases", "cash", "reports"], "language": "ar", "maxUsers": 10, "autoBackup": true, "dateFormat": "dd/MM/yyyy", "numberFormat": "ar-EG", "fiscalYearStart": "01/01"}',
            '{"plan": "basic", "status": "active", "maxUsers": 10, "maxStorage": 1024}'
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO default_company_id;
        
        -- الحصول على معرف الشركة إذا كانت موجودة
        IF default_company_id IS NULL THEN
            SELECT id INTO default_company_id FROM public.companies LIMIT 1;
        END IF;
        
        -- إضافة المستخدم كصاحب الشركة
        INSERT INTO public.user_roles (
            user_id,
            company_id,
            role,
            permissions,
            assigned_by
        ) VALUES (
            current_user_id,
            default_company_id,
            'owner',
            '["users.create", "users.read", "users.update", "users.delete", "users.export", "admin.all"]',
            current_user_id
        )
        ON CONFLICT (user_id, company_id) DO UPDATE SET
            role = 'owner',
            permissions = '["users.create", "users.read", "users.update", "users.delete", "users.export", "admin.all"]',
            is_active = true;
    END IF;
END $$;