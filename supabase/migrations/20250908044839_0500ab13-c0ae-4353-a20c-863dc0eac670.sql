-- إصلاح التحذيرات الأمنية
-- 1. إصلاح search_path للدوال الموجودة
CREATE OR REPLACE FUNCTION public.check_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = _user_id
            AND ur.is_active = true
            AND r.is_active = true
            AND (
                r.permissions ? '*' OR
                r.permissions ? _permission OR
                r.permissions ? (split_part(_permission, '.', 1) || '.*')
            )
    )
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role_name text, role_name_ar text, permissions jsonb, level integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT r.name, r.name_ar, r.permissions, r.level
    FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = _user_id
        AND ur.is_active = true
        AND r.is_active = true
    ORDER BY r.level ASC
$$;

-- إصلاح search_path للدوال الأخرى الموجودة
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _company_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
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

CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _company_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
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

CREATE OR REPLACE FUNCTION public.get_user_company(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
    SELECT company_id
    FROM public.user_roles
    WHERE user_id = _user_id
        AND is_active = true
    LIMIT 1
$$;