-- تحديث جدول الشركات لدعم معالج الإعداد
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS name_en text,
ADD COLUMN IF NOT EXISTS industry text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS commercial_register text;

-- إنشاء وظيفة لإنشاء شركة مع مالك جديد
CREATE OR REPLACE FUNCTION public.create_company_and_setup(
  p_company_data jsonb,
  p_user_id uuid DEFAULT auth.uid()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_company_id UUID;
BEGIN
  -- إنشاء الشركة الجديدة
  INSERT INTO public.companies (
    name,
    phone,
    email,
    address,
    website,
    tax_number,
    currency,
    timezone,
    settings
  ) VALUES (
    p_company_data->>'name',
    p_company_data->>'phone',
    p_company_data->>'email',
    p_company_data->>'address',
    p_company_data->>'website',
    p_company_data->>'taxNumber',
    p_company_data->>'currency',
    COALESCE(p_company_data->>'timezone', 'Asia/Riyadh'),
    jsonb_build_object(
      'industry', p_company_data->>'industry',
      'description', p_company_data->>'description',
      'logo', p_company_data->>'logo',
      'nameEn', p_company_data->>'nameEn',
      'commercialRegister', p_company_data->>'commercialRegister',
      'setupCompleted', true,
      'setupDate', now()
    )
  ) RETURNING id INTO new_company_id;
  
  -- ربط المستخدم كمالك للشركة
  INSERT INTO public.user_companies (user_id, company_id, role, is_active)
  VALUES (p_user_id, new_company_id, 'owner', true)
  ON CONFLICT (user_id, company_id) DO UPDATE SET
    role = 'owner',
    is_active = true;
    
  -- تحديث الملف الشخصي للمستخدم
  UPDATE public.profiles 
  SET 
    full_name = COALESCE(full_name, p_company_data->>'name'),
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN new_company_id;
END;
$$;

-- إنشاء وظيفة لإنشاء بيانات تجريبية
CREATE OR REPLACE FUNCTION public.create_sample_data(
  p_company_id uuid,
  p_user_id uuid DEFAULT auth.uid(),
  p_industry text DEFAULT 'عام'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- إنشاء عملاء تجريبيين
  INSERT INTO public.customers (user_id, name, email, phone, address, notes) VALUES
  (p_user_id, 'أحمد محمد علي', 'ahmed@example.com', '+966501234567', 'الرياض، المملكة العربية السعودية', 'عميل تجريبي'),
  (p_user_id, 'فاطمة عبدالله', 'fatma@example.com', '+966509876543', 'جدة، المملكة العربية السعودية', 'عميل تجريبي'),
  (p_user_id, 'محمد الأحمد', 'mohammed@example.com', '+966555123456', 'الدمام، المملكة العربية السعودية', 'عميل تجريبي');

  -- إنشاء موردين تجريبيين
  INSERT INTO public.suppliers (user_id, name, email, phone, address, notes) VALUES
  (p_user_id, 'شركة التقنية المتقدمة', 'info@techcompany.com', '+966112345678', 'الرياض، حي العليا', 'مورد تجريبي'),
  (p_user_id, 'مصنع المنسوجات الحديثة', 'orders@textile.com', '+966126789012', 'جدة، المنطقة الصناعية', 'مورد تجريبي');

  -- إنشاء منتجات تجريبية حسب نوع النشاط
  IF p_industry = 'تجارة التجزئة' THEN
    INSERT INTO public.products (user_id, name, code, price, cost, stock, min_stock, category, description) VALUES
    (p_user_id, 'قميص قطني رجالي', 'PRD001', 85, 50, 100, 10, 'ملابس رجالية', 'قميص قطني عالي الجودة'),
    (p_user_id, 'فستان نسائي', 'PRD002', 180, 120, 50, 5, 'ملابس نسائية', 'فستان أنيق للمناسبات');
  ELSIF p_industry = 'الإلكترونيات والتقنية' THEN
    INSERT INTO public.products (user_id, name, code, price, cost, stock, min_stock, category, description) VALUES
    (p_user_id, 'لابتوب HP EliteBook', 'PRD001', 3500, 2800, 25, 3, 'أجهزة كمبيوتر', 'لابتوب للأعمال التجارية'),
    (p_user_id, 'ماوس لاسلكي', 'PRD002', 95, 60, 200, 20, 'ملحقات', 'ماوس لاسلكي مريح');
  ELSE
    -- منتجات عامة
    INSERT INTO public.products (user_id, name, code, price, cost, stock, min_stock, category, description) VALUES
    (p_user_id, 'منتج تجريبي 1', 'PRD001', 100, 70, 50, 5, 'عام', 'منتج تجريبي للاختبار'),
    (p_user_id, 'منتج تجريبي 2', 'PRD002', 200, 150, 30, 3, 'عام', 'منتج تجريبي آخر للاختبار');
  END IF;

  -- إنشاء إعدادات تطبيق للمستخدم
  INSERT INTO public.app_settings (user_id, setting_key, setting_value, category) VALUES
  (p_user_id, 'initial_setup_completed', 'true', 'setup'),
  (p_user_id, 'setup_completion_date', to_jsonb(now()), 'setup'),
  (p_user_id, 'default_currency', jsonb_build_object('code', 'SAR', 'symbol', 'ر.س'), 'financial');
END;
$$;