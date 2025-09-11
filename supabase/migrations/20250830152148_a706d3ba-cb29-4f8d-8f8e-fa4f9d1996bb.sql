-- إصلاح المشاكل الأمنية - نظام عمران للمبيعات (النسخة المصححة)

-- 1. تفعيل RLS لجدول employee_basic_info
ALTER TABLE public.employee_basic_info ENABLE ROW LEVEL SECURITY;

-- إضافة سياسات RLS لجدول employee_basic_info
CREATE POLICY "HR can view all basic employee info" 
ON public.employee_basic_info 
FOR SELECT 
USING (is_hr_manager());

CREATE POLICY "Employees can view their own basic info" 
ON public.employee_basic_info 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Department managers can view their team basic info" 
ON public.employee_basic_info 
FOR SELECT 
USING (is_department_manager_for_employee(user_id, department));

CREATE POLICY "HR can insert basic employee info" 
ON public.employee_basic_info 
FOR INSERT 
WITH CHECK (is_hr_manager());

CREATE POLICY "HR can update basic employee info" 
ON public.employee_basic_info 
FOR UPDATE 
USING (is_hr_manager());

CREATE POLICY "HR can delete basic employee info" 
ON public.employee_basic_info 
FOR DELETE 
USING (is_hr_manager());

-- 2. تفعيل RLS لجدول employee_directory
ALTER TABLE public.employee_directory ENABLE ROW LEVEL SECURITY;

-- إضافة سياسات RLS لجدول employee_directory
CREATE POLICY "HR can view all employee directory" 
ON public.employee_directory 
FOR SELECT 
USING (is_hr_manager());

CREATE POLICY "Employees can view their own directory info" 
ON public.employee_directory 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Department managers can view their team directory" 
ON public.employee_directory 
FOR SELECT 
USING (is_department_manager_for_employee(user_id, department));

CREATE POLICY "HR can insert employee directory" 
ON public.employee_directory 
FOR INSERT 
WITH CHECK (is_hr_manager());

CREATE POLICY "HR can update employee directory" 
ON public.employee_directory 
FOR UPDATE 
USING (is_hr_manager());

CREATE POLICY "Employees can update their own contact info" 
ON public.employee_directory 
FOR UPDATE 
USING (auth.uid() = user_id AND is_active = true);

CREATE POLICY "HR can delete employee directory" 
ON public.employee_directory 
FOR DELETE 
USING (is_hr_manager());

-- 3. تحسين دالة التحقق من صلاحيات المدير للقسم
CREATE OR REPLACE FUNCTION public.is_department_manager_for_employee(employee_user_id uuid, employee_department text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_user_role user_role;
  is_manager boolean := false;
BEGIN
  -- الحصول على دور المستخدم الحالي
  SELECT public.get_current_user_role() INTO current_user_role;
  
  -- إذا كان المستخدم مدير HR أو مدير عام، يُسمح له بالوصول
  IF current_user_role IN ('admin', 'hr_manager') THEN
    RETURN true;
  END IF;
  
  -- التحقق من كون المستخدم مدير القسم
  SELECT EXISTS (
    SELECT 1 FROM public.employees 
    WHERE user_id = employee_user_id 
      AND department = employee_department 
      AND manager_id = auth.uid()
      AND is_active = true
  ) INTO is_manager;
  
  RETURN is_manager;
END;
$function$;

-- 4. إضافة دالة للتحقق من الأذونات المتقدمة
CREATE OR REPLACE FUNCTION public.check_advanced_permissions(
  required_permission text,
  resource_type text DEFAULT 'general',
  resource_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_role user_role;
  has_permission boolean := false;
BEGIN
  -- الحصول على دور المستخدم
  SELECT public.get_current_user_role() INTO user_role;
  
  -- تسجيل محاولة الوصول
  INSERT INTO public.advanced_security_logs (
    user_id, event_type, event_category, severity, description,
    metadata, success
  ) VALUES (
    auth.uid(),
    'permission_check',
    'access_control',
    'low',
    'فحص الأذونات: ' || required_permission,
    jsonb_build_object(
      'required_permission', required_permission,
      'resource_type', resource_type,
      'resource_id', resource_id,
      'user_role', user_role
    ),
    true
  );
  
  -- منطق فحص الأذونات
  CASE required_permission
    WHEN 'view_sensitive_data' THEN
      has_permission := user_role IN ('admin', 'hr_manager');
    WHEN 'modify_employee_data' THEN
      has_permission := user_role IN ('admin', 'hr_manager');
    WHEN 'view_financial_data' THEN
      has_permission := user_role IN ('admin', 'manager');
    WHEN 'export_data' THEN
      has_permission := user_role IN ('admin', 'manager');
    ELSE
      has_permission := user_role = 'admin';
  END CASE;
  
  RETURN has_permission;
END;
$function$;

-- 5. دالة لتسجيل الوصول للبيانات الحساسة (بدون محفزات)
CREATE OR REPLACE FUNCTION public.log_sensitive_data_access(
  table_name text,
  operation text,
  user_id_accessed uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- تسجيل الوصول للبيانات الحساسة
  INSERT INTO public.advanced_security_logs (
    user_id, event_type, event_category, severity, description,
    metadata, success
  ) VALUES (
    auth.uid(),
    'sensitive_data_access',
    'data_access',
    'medium',
    'تم الوصول لبيانات الموظفين الحساسة',
    jsonb_build_object(
      'table_name', table_name,
      'operation', operation,
      'user_id_accessed', user_id_accessed,
      'accessed_at', now()
    ),
    true
  );
END;
$function$;