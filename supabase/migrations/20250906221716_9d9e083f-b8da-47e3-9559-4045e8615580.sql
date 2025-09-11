-- إنشاء enum للأدوار
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'employee', 'viewer');

-- إنشاء enum لحالة الجلسات
CREATE TYPE public.session_status AS ENUM ('active', 'inactive', 'expired', 'terminated');

-- إنشاء enum لمستوى الأمان في السجلات
CREATE TYPE public.security_level AS ENUM ('low', 'medium', 'high', 'critical');

-- جدول الشركات
CREATE TABLE public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    tax_number TEXT,
    license_number TEXT,
    currency TEXT NOT NULL DEFAULT 'EGP',
    country TEXT NOT NULL DEFAULT 'Egypt',
    timezone TEXT NOT NULL DEFAULT 'Africa/Cairo',
    settings JSONB NOT NULL DEFAULT '{
        "language": "ar",
        "dateFormat": "dd/MM/yyyy",
        "numberFormat": "ar-EG",
        "fiscalYearStart": "01/01",
        "autoBackup": true,
        "maxUsers": 10,
        "features": ["sales", "inventory", "purchases", "cash", "reports"]
    }',
    subscription JSONB NOT NULL DEFAULT '{
        "plan": "basic",
        "status": "active",
        "maxUsers": 10,
        "maxStorage": 1024
    }',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول أدوار المستخدمين
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'employee',
    permissions JSONB NOT NULL DEFAULT '[]',
    assigned_by UUID REFERENCES auth.users(id),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_active BOOLEAN NOT NULL DEFAULT true,
    UNIQUE(user_id, company_id)
);

-- جدول الجلسات النشطة
CREATE TABLE public.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    device_id TEXT NOT NULL,
    device_name TEXT,
    device_info JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    location TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '30 days')
);

-- جدول سجل الأمان والنشاط
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.user_sessions(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_description TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    severity security_level NOT NULL DEFAULT 'low',
    risk_score INTEGER DEFAULT 0 CHECK (risk_score >= 0 AND risk_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تحديث جدول profiles ليشمل company_id كـ UUID
ALTER TABLE public.profiles 
ALTER COLUMN company_id TYPE UUID USING company_id::UUID,
ADD COLUMN department TEXT,
ADD COLUMN phone_number TEXT,
ADD COLUMN hire_date DATE,
ADD COLUMN salary NUMERIC DEFAULT 0,
ADD COLUMN emergency_contact JSONB DEFAULT '{}';

-- إضافة foreign key للـ company_id في profiles
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_company_id_fkey 
FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE SET NULL;

-- إنشاء الفهارس للأداء
CREATE INDEX idx_user_roles_user_company ON public.user_roles(user_id, company_id);
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active) WHERE is_active = true;
CREATE INDEX idx_user_sessions_expires ON public.user_sessions(expires_at);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON public.audit_logs(severity);

-- تفعيل RLS على الجداول
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- دالة للتحقق من دور المستخدم
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _company_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
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

-- دالة للتحقق من صلاحية المستخدم
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _company_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
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
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT company_id
    FROM public.user_roles
    WHERE user_id = _user_id
        AND is_active = true
    LIMIT 1
$$;

-- RLS policies للشركات
CREATE POLICY "المستخدمون يمكنهم رؤية شركتهم فقط"
ON public.companies FOR SELECT
TO authenticated
USING (
    id = public.get_user_company(auth.uid())
);

CREATE POLICY "أصحاب الشركات يمكنهم تحديث شركتهم"
ON public.companies FOR UPDATE
TO authenticated
USING (
    public.has_role(auth.uid(), id, 'owner')
)
WITH CHECK (
    public.has_role(auth.uid(), id, 'owner')
);

CREATE POLICY "يمكن إنشاء شركات جديدة"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (true);

-- RLS policies لأدوار المستخدمين
CREATE POLICY "المستخدمون يمكنهم رؤية أدوار شركتهم"
ON public.user_roles FOR SELECT
TO authenticated
USING (
    company_id = public.get_user_company(auth.uid())
);

CREATE POLICY "الإداريون يمكنهم إدارة الأدوار"
ON public.user_roles FOR ALL
TO authenticated
USING (
    public.has_role(auth.uid(), company_id, 'owner') OR
    public.has_role(auth.uid(), company_id, 'admin')
)
WITH CHECK (
    public.has_role(auth.uid(), company_id, 'owner') OR
    public.has_role(auth.uid(), company_id, 'admin')
);

-- RLS policies للجلسات
CREATE POLICY "المستخدمون يمكنهم رؤية جلساتهم"
ON public.user_sessions FOR SELECT
TO authenticated
USING (
    user_id = auth.uid() OR
    public.has_role(auth.uid(), company_id, 'admin') OR
    public.has_role(auth.uid(), company_id, 'owner')
);

CREATE POLICY "المستخدمون يمكنهم إنشاء جلسات"
ON public.user_sessions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "المستخدمون يمكنهم تحديث جلساتهم"
ON public.user_sessions FOR UPDATE
TO authenticated
USING (
    user_id = auth.uid() OR
    public.has_role(auth.uid(), company_id, 'admin') OR
    public.has_role(auth.uid(), company_id, 'owner')
)
WITH CHECK (
    user_id = auth.uid() OR
    public.has_role(auth.uid(), company_id, 'admin') OR
    public.has_role(auth.uid(), company_id, 'owner')
);

CREATE POLICY "الإداريون يمكنهم حذف الجلسات"
ON public.user_sessions FOR DELETE
TO authenticated
USING (
    user_id = auth.uid() OR
    public.has_role(auth.uid(), company_id, 'admin') OR
    public.has_role(auth.uid(), company_id, 'owner')
);

-- RLS policies لسجل الأمان
CREATE POLICY "المستخدمون يمكنهم رؤية سجلات شركتهم"
ON public.audit_logs FOR SELECT
TO authenticated
USING (
    public.has_role(auth.uid(), company_id, 'admin') OR
    public.has_role(auth.uid(), company_id, 'owner') OR
    user_id = auth.uid()
);

CREATE POLICY "يمكن إضافة سجلات الأمان"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Triggers لتحديث الوقت
CREATE TRIGGER update_companies_updated_at
    BEFORE UPDATE ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_sessions_last_activity
    BEFORE UPDATE ON public.user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- دالة تنظيف الجلسات المنتهية الصلاحية
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