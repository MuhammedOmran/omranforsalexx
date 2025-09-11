-- إضافة قيود فريدة لمنع الازدواجية في الموردين
-- قيد فريد للاسم والمستخدم (مورد واحد بنفس الاسم لكل مستخدم)
ALTER TABLE public.suppliers ADD CONSTRAINT unique_supplier_name_per_user 
UNIQUE (name, user_id);

-- قيد فريد للبريد الإلكتروني والمستخدم (إذا كان البريد موجود)
ALTER TABLE public.suppliers ADD CONSTRAINT unique_supplier_email_per_user 
UNIQUE (email, user_id) DEFERRABLE INITIALLY DEFERRED;

-- قيد فريد لرقم الهاتف والمستخدم (إذا كان الهاتف موجود)
ALTER TABLE public.suppliers ADD CONSTRAINT unique_supplier_phone_per_user 
UNIQUE (phone, user_id) DEFERRABLE INITIALLY DEFERRED;

-- إنشاء دالة للتحقق من وجود مورد مشابه
CREATE OR REPLACE FUNCTION public.check_duplicate_supplier(
    p_user_id UUID,
    p_name TEXT,
    p_email TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_exclude_id UUID DEFAULT NULL
) RETURNS TABLE(
    duplicate_type TEXT,
    existing_supplier_id UUID,
    existing_supplier_name TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- التحقق من الاسم
    IF EXISTS (
        SELECT 1 FROM public.suppliers 
        WHERE user_id = p_user_id 
          AND name = p_name 
          AND is_active = true
          AND (p_exclude_id IS NULL OR id != p_exclude_id)
    ) THEN
        RETURN QUERY
        SELECT 
            'name'::TEXT as duplicate_type,
            s.id as existing_supplier_id,
            s.name as existing_supplier_name
        FROM public.suppliers s
        WHERE s.user_id = p_user_id 
          AND s.name = p_name 
          AND s.is_active = true
          AND (p_exclude_id IS NULL OR s.id != p_exclude_id)
        LIMIT 1;
        RETURN;
    END IF;

    -- التحقق من البريد الإلكتروني (إذا كان موجود)
    IF p_email IS NOT NULL AND p_email != '' AND EXISTS (
        SELECT 1 FROM public.suppliers 
        WHERE user_id = p_user_id 
          AND email = p_email 
          AND is_active = true
          AND (p_exclude_id IS NULL OR id != p_exclude_id)
    ) THEN
        RETURN QUERY
        SELECT 
            'email'::TEXT as duplicate_type,
            s.id as existing_supplier_id,
            s.name as existing_supplier_name
        FROM public.suppliers s
        WHERE s.user_id = p_user_id 
          AND s.email = p_email 
          AND s.is_active = true
          AND (p_exclude_id IS NULL OR s.id != p_exclude_id)
        LIMIT 1;
        RETURN;
    END IF;

    -- التحقق من رقم الهاتف (إذا كان موجود)
    IF p_phone IS NOT NULL AND p_phone != '' AND EXISTS (
        SELECT 1 FROM public.suppliers 
        WHERE user_id = p_user_id 
          AND phone = p_phone 
          AND is_active = true
          AND (p_exclude_id IS NULL OR id != p_exclude_id)
    ) THEN
        RETURN QUERY
        SELECT 
            'phone'::TEXT as duplicate_type,
            s.id as existing_supplier_id,
            s.name as existing_supplier_name
        FROM public.suppliers s
        WHERE s.user_id = p_user_id 
          AND s.phone = p_phone 
          AND s.is_active = true
          AND (p_exclude_id IS NULL OR s.id != p_exclude_id)
        LIMIT 1;
        RETURN;
    END IF;

    -- لا يوجد تكرار
    RETURN;
END;
$$;