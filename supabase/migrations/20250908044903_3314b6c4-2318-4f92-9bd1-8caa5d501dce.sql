-- إصلاح باقي الدوال التي لا تزال بحاجة لإعداد search_path
CREATE OR REPLACE FUNCTION public.calculate_cash_balance(p_user_id uuid)
RETURNS numeric
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT 
    COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END), 0)
  INTO v_balance
  FROM public.cash_transactions
  WHERE user_id = p_user_id;
  
  RETURN v_balance;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- إنشاء profile جديد للمستخدم
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data ->> 'username', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;