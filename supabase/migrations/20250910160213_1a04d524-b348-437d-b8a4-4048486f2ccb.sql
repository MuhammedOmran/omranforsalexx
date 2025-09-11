-- 1) Wrapper: add_user_license with 3 args (sets limits by license type)
CREATE OR REPLACE FUNCTION public.add_user_license(
  p_user_id uuid,
  p_duration_days integer,
  p_license_type text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_max_users int;
  v_max_devices int;
  v_start_date timestamptz := now();
  v_end_date timestamptz := v_start_date + (p_duration_days || ' days')::interval;
  v_license_id uuid;
BEGIN
  -- Determine defaults by license type
  CASE lower(p_license_type)
    WHEN 'trial' THEN v_max_users := 1; v_max_devices := 1;
    WHEN 'monthly' THEN v_max_users := 3; v_max_devices := 3;
    WHEN 'quarterly' THEN v_max_users := 5; v_max_devices := 5;
    WHEN 'yearly' THEN v_max_users := 50; v_max_devices := 1000000;
    WHEN 'premium' THEN v_max_users := 1000000; v_max_devices := 1000000;
    ELSE v_max_users := 1; v_max_devices := 1;
  END CASE;

  -- Deactivate existing active licenses for the user
  UPDATE public.user_licenses 
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id AND is_active = true;

  -- Create the new license
  INSERT INTO public.user_licenses (
    user_id, start_date, end_date, is_active, license_duration, license_type,
    max_users, max_devices, created_at, updated_at
  ) VALUES (
    p_user_id, v_start_date, v_end_date, true, p_duration_days, lower(p_license_type),
    v_max_users, v_max_devices, now(), now()
  ) RETURNING id INTO v_license_id;

  -- Optional: audit log
  INSERT INTO public.audit_logs (
    event_type, event_description, user_id, severity, metadata
  ) VALUES (
    'LICENSE_CREATED', 'إنشاء ترخيص جديد عبر واجهة 3 وسائط', p_user_id, 'low',
    jsonb_build_object('license_id', v_license_id, 'duration_days', p_duration_days, 'license_type', lower(p_license_type), 'max_users', v_max_users, 'max_devices', v_max_devices)
  );

  RETURN v_license_id;
END;
$$;

-- 2) Overload: add_user_license with explicit limits (5 args)
CREATE OR REPLACE FUNCTION public.add_user_license(
  p_user_id uuid,
  p_duration_days integer,
  p_license_type text,
  p_max_users integer,
  p_max_devices integer
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_start_date timestamptz := now();
  v_end_date timestamptz := v_start_date + (p_duration_days || ' days')::interval;
  v_license_id uuid;
BEGIN
  -- Deactivate existing active licenses for the user
  UPDATE public.user_licenses 
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id AND is_active = true;

  -- Create the new license with provided limits
  INSERT INTO public.user_licenses (
    user_id, start_date, end_date, is_active, license_duration, license_type,
    max_users, max_devices, created_at, updated_at
  ) VALUES (
    p_user_id, v_start_date, v_end_date, true, p_duration_days, lower(p_license_type),
    GREATEST(1, p_max_users), GREATEST(1, p_max_devices), now(), now()
  ) RETURNING id INTO v_license_id;

  -- Optional: audit log
  INSERT INTO public.audit_logs (
    event_type, event_description, user_id, severity, metadata
  ) VALUES (
    'LICENSE_CREATED', 'إنشاء ترخيص جديد عبر واجهة 5 وسائط', p_user_id, 'low',
    jsonb_build_object('license_id', v_license_id, 'duration_days', p_duration_days, 'license_type', lower(p_license_type), 'max_users', p_max_users, 'max_devices', p_max_devices)
  );

  RETURN v_license_id;
END;
$$;

-- 3) Reporting function used by the UI: check_user_license
CREATE OR REPLACE FUNCTION public.check_user_license(
  p_user_id uuid
)
RETURNS TABLE (
  has_active_license boolean,
  license_type text,
  end_date timestamptz,
  days_remaining integer,
  max_users integer,
  max_devices integer,
  current_users integer,
  current_devices integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = 'public'
AS $$
  WITH active_license AS (
    SELECT ul.*
    FROM public.user_licenses ul
    WHERE ul.user_id = p_user_id AND ul.is_active = true
    ORDER BY ul.created_at DESC
    LIMIT 1
  ),
  counts AS (
    SELECT 
      COALESCE((SELECT COUNT(*) FROM public.licensed_users lu JOIN active_license al ON lu.license_id = al.id WHERE lu.is_active = true), 0) AS current_users,
      COALESCE((SELECT COUNT(*) FROM public.licensed_devices ld JOIN active_license al ON ld.license_id = al.id WHERE ld.is_active = true), 0) AS current_devices
  )
  SELECT
    COALESCE(al.id IS NOT NULL AND al.end_date > now(), false) AS has_active_license,
    al.license_type,
    al.end_date,
    CASE WHEN al.end_date IS NULL THEN 0 ELSE GREATEST(0, CEIL(EXTRACT(EPOCH FROM (al.end_date - now())) / 86400.0))::int END AS days_remaining,
    al.max_users,
    al.max_devices,
    c.current_users,
    c.current_devices
  FROM active_license al
  CROSS JOIN counts c;
$$;

-- Ensure minimal execute grant for RPC if needed (optional, depends on RLS; functions are SECURITY DEFINER)
-- no explicit grants required here.
