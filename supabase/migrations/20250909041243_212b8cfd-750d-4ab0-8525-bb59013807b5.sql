-- إنشاء enum للأدوار
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'employee', 'user');

-- إنشاء جدول ربط المستخدمين بالأدوار
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, role_id, company_id)
);

-- تفعيل RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان
CREATE POLICY "المستخدمون يمكنهم رؤية أدوارهم" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "المديرون يمكنهم إضافة أدوار للمستخدمين" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND ur.company_id = user_roles.company_id
        AND ur.is_active = true
        AND r.level <= 2
    )
);

CREATE POLICY "المديرون يمكنهم تحديث أدوار المستخدمين" 
ON public.user_roles 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND ur.company_id = user_roles.company_id
        AND ur.is_active = true
        AND r.level <= 2
    )
);

CREATE POLICY "المديرون يمكنهم حذف أدوار المستخدمين" 
ON public.user_roles 
FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() 
        AND ur.company_id = user_roles.company_id
        AND ur.is_active = true
        AND r.level <= 2
    )
);

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_roles_updated_at
    BEFORE UPDATE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_roles_updated_at();

-- إنشاء دالة للتحقق من صلاحيات المستخدم
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _company_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = _user_id
        AND ur.company_id = _company_id
        AND ur.is_active = true
        AND r.is_active = true
        AND r.name = _role::text
    )
$$;

-- إنشاء دالة للحصول على شركة المستخدم
CREATE OR REPLACE FUNCTION public.get_user_company(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT company_id
    FROM public.profiles
    WHERE user_id = _user_id
    LIMIT 1
$$;

-- إنشاء دالة للتحقق من الصلاحيات
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = _user_id
        AND ur.is_active = true
        AND r.is_active = true
        AND (
            r.permissions @> ARRAY[_permission]::text[] OR
            r.permissions @> to_jsonb(ARRAY[_permission])
        )
    )
$$;

-- إدراج أدوار أساسية
INSERT INTO public.roles (name, name_ar, description, level, permissions, is_system, is_active) VALUES
('owner', 'مالك النظام', 'مالك النظام له كامل الصلاحيات', 1, 
 '["users.create", "users.read", "users.update", "users.delete", "roles.create", "roles.read", "roles.update", "roles.delete", "settings.read", "settings.update", "reports.read", "reports.export", "sales.create", "sales.read", "sales.update", "sales.delete", "purchases.create", "purchases.read", "purchases.update", "purchases.delete", "inventory.create", "inventory.read", "inventory.update", "inventory.delete", "customers.create", "customers.read", "customers.update", "customers.delete", "suppliers.create", "suppliers.read", "suppliers.update", "suppliers.delete"]'::jsonb, 
 true, true),

('admin', 'مدير النظام', 'مدير النظام له صلاحيات إدارية شاملة', 2, 
 '["users.read", "users.update", "roles.read", "settings.read", "settings.update", "reports.read", "reports.export", "sales.create", "sales.read", "sales.update", "sales.delete", "purchases.create", "purchases.read", "purchases.update", "purchases.delete", "inventory.create", "inventory.read", "inventory.update", "inventory.delete", "customers.create", "customers.read", "customers.update", "customers.delete", "suppliers.create", "suppliers.read", "suppliers.update", "suppliers.delete"]'::jsonb, 
 true, true),

('manager', 'مدير', 'مدير له صلاحيات تشغيلية متقدمة', 3, 
 '["reports.read", "sales.create", "sales.read", "sales.update", "purchases.create", "purchases.read", "purchases.update", "inventory.create", "inventory.read", "inventory.update", "customers.create", "customers.read", "customers.update", "suppliers.create", "suppliers.read", "suppliers.update"]'::jsonb, 
 true, true),

('employee', 'موظف', 'موظف له صلاحيات أساسية للعمل', 4, 
 '["sales.create", "sales.read", "purchases.read", "inventory.read", "customers.read", "suppliers.read"]'::jsonb, 
 true, true),

('user', 'مستخدم', 'مستخدم عادي له صلاحيات محدودة', 5, 
 '["sales.read", "inventory.read", "customers.read"]'::jsonb, 
 true, true);