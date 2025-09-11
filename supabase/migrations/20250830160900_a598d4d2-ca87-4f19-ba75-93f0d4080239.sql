-- دالة لإضافة ترخيص جديد لمستخدم
CREATE OR REPLACE FUNCTION public.add_user_license(
  p_user_id uuid,
  p_days integer DEFAULT 365
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  license_id uuid;
BEGIN
  -- التأكد من أن المستخدم موجود
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
    RAISE EXCEPTION 'المستخدم غير موجود';
  END IF;

  -- إضافة ترخيص جديد
  INSERT INTO public.licenses (
    user_id, 
    start_date, 
    end_date, 
    status
  ) VALUES (
    p_user_id,
    CURRENT_DATE,
    CURRENT_DATE + (p_days || ' days')::interval,
    'active'
  ) RETURNING id INTO license_id;

  RETURN license_id;
END;
$$;

-- دالة لتمديد ترخيص مستخدم بأيام إضافية
CREATE OR REPLACE FUNCTION public.extend_user_license(
  p_user_id uuid,
  p_additional_days integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_license_id uuid;
BEGIN
  -- البحث عن الترخيص النشط الأحدث
  SELECT id INTO current_license_id
  FROM public.licenses
  WHERE user_id = p_user_id AND status = 'active'
  ORDER BY end_date DESC
  LIMIT 1;

  IF current_license_id IS NULL THEN
    RAISE EXCEPTION 'لا يوجد ترخيص نشط للمستخدم';
  END IF;

  -- تمديد الترخيص
  UPDATE public.licenses
  SET end_date = end_date + (p_additional_days || ' days')::interval
  WHERE id = current_license_id;

  RETURN TRUE;
END;
$$;

-- دالة لتحديث تاريخ انتهاء ترخيص مستخدم
CREATE OR REPLACE FUNCTION public.update_license_end_date(
  p_user_id uuid,
  p_new_end_date date
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.licenses
  SET end_date = p_new_end_date
  WHERE user_id = p_user_id AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'لا يوجد ترخيص نشط للمستخدم';
  END IF;

  RETURN TRUE;
END;
$$;

-- دالة لإلغاء تفعيل ترخيص مستخدم
CREATE OR REPLACE FUNCTION public.deactivate_user_license(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.licenses
  SET status = 'inactive'
  WHERE user_id = p_user_id AND status = 'active';

  RETURN TRUE;
END;
$$;

-- دالة لتفعيل ترخيص مستخدم
CREATE OR REPLACE FUNCTION public.activate_user_license(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  latest_license_id uuid;
BEGIN
  -- العثور على أحدث ترخيص
  SELECT id INTO latest_license_id
  FROM public.licenses
  WHERE user_id = p_user_id 
  ORDER BY end_date DESC
  LIMIT 1;

  IF latest_license_id IS NOT NULL THEN
    UPDATE public.licenses
    SET status = 'active'
    WHERE id = latest_license_id;
  END IF;

  RETURN TRUE;
END;
$$;