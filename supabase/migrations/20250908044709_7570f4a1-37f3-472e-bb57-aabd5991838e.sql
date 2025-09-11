-- إنشاء جدول الأدوار والصلاحيات
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  name_ar TEXT NOT NULL,
  description TEXT,
  level INTEGER NOT NULL DEFAULT 3,
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إدراج الأدوار الأساسية
INSERT INTO public.roles (name, name_ar, description, level, permissions, is_system) VALUES
  ('owner', 'المالك', 'مالك النظام - جميع الصلاحيات', 1, '["*"]'::jsonb, true),
  ('admin', 'مدير النظام', 'مدير عام - صلاحيات إدارية شاملة', 2, '["users.*", "system.*", "reports.*", "settings.*", "cash.*", "inventory.*", "sales.*", "purchases.*"]'::jsonb, true),
  ('manager', 'مدير', 'مدير إدارة - صلاحيات محدودة', 3, '["sales.*", "inventory.read", "reports.read", "cash.read"]'::jsonb, true),
  ('employee', 'موظف', 'موظف عادي - صلاحيات أساسية', 4, '["sales.read", "inventory.read", "cash.read"]'::jsonb, true),
  ('user', 'مستخدم', 'مستخدم عادي - صلاحيات قراءة فقط', 5, '["dashboard.read"]'::jsonb, true);

-- تحديث جدول user_roles ليستخدم roles الجديد
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

-- إنشاء دالة للتحقق من الصلاحيات المحسنة
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

-- إنشاء دالة لجلب أدوار المستخدم
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

-- تعيين دور admin للمستخدم الحالي (إذا لم يكن له دور)
DO $$
DECLARE
    current_user_id uuid;
    admin_role_id uuid;
BEGIN
    -- الحصول على المستخدم الحالي
    current_user_id := auth.uid();
    
    IF current_user_id IS NOT NULL THEN
        -- الحصول على role_id للـ admin
        SELECT id INTO admin_role_id FROM public.roles WHERE name = 'admin';
        
        -- تعيين دور admin للمستخدم إذا لم يكن له دور
        INSERT INTO public.user_roles (user_id, role_id, is_active, assigned_at)
        VALUES (current_user_id, admin_role_id, true, now())
        ON CONFLICT (user_id, role_id) DO NOTHING;
    END IF;
END $$;

-- RLS policies للـ roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "المستخدمون يمكنهم رؤية الأدوار"
ON public.roles FOR SELECT
TO authenticated
USING (true);

-- تحديث RLS policies لـ user_roles
DROP POLICY IF EXISTS "الإداريون يمكنهم إدارة الأدوار" ON public.user_roles;
DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية أدوار شركتهم" ON public.user_roles;

CREATE POLICY "الإداريون يمكنهم إدارة الأدوار"
ON public.user_roles FOR ALL
TO authenticated
USING (check_permission(auth.uid(), 'users.*') OR check_permission(auth.uid(), '*'))
WITH CHECK (check_permission(auth.uid(), 'users.*') OR check_permission(auth.uid(), '*'));

CREATE POLICY "المستخدمون يمكنهم رؤية أدوارهم"
ON public.user_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR check_permission(auth.uid(), 'users.read') OR check_permission(auth.uid(), '*'));

-- Trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_roles()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_roles();