-- Fix security warnings from the previous migration

-- Fix Warning: Function Search Path Mutable
-- Update functions to include proper search_path setting
CREATE OR REPLACE FUNCTION public.validate_session_access(p_session_id uuid, p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  session_user_id uuid;
  current_user_id uuid := auth.uid();
BEGIN
  -- Return false if no authenticated user
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Get session owner based on table
  IF p_table_name = 'active_sessions' THEN
    SELECT user_id INTO session_user_id 
    FROM public.active_sessions 
    WHERE id = p_session_id;
  ELSIF p_table_name = 'user_sessions' THEN
    SELECT user_id INTO session_user_id 
    FROM public.user_sessions 
    WHERE id = p_session_id;
  ELSE
    RETURN false;
  END IF;
  
  -- Return true only if session belongs to current user
  RETURN session_user_id = current_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.monitor_session_security()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb := '{}'::jsonb;
  expired_sessions_count integer;
  active_sessions_count integer;
  suspicious_sessions_count integer;
BEGIN
  -- Count expired sessions that should be cleaned up
  SELECT COUNT(*) INTO expired_sessions_count
  FROM public.active_sessions
  WHERE expires_at < now() AND is_active = true;
  
  -- Count active sessions for current user
  SELECT COUNT(*) INTO active_sessions_count
  FROM public.active_sessions
  WHERE user_id = auth.uid() AND is_active = true AND expires_at > now();
  
  -- Count potentially suspicious sessions (multiple devices, unusual activity)
  SELECT COUNT(*) INTO suspicious_sessions_count
  FROM public.active_sessions
  WHERE user_id = auth.uid() 
    AND is_active = true 
    AND last_activity < (now() - INTERVAL '7 days');
  
  result := jsonb_build_object(
    'user_id', auth.uid(),
    'active_sessions', active_sessions_count,
    'expired_sessions_needing_cleanup', expired_sessions_count,
    'suspicious_sessions', suspicious_sessions_count,
    'security_status', 
      CASE 
        WHEN suspicious_sessions_count > 0 THEN 'review_needed'
        WHEN active_sessions_count > 5 THEN 'multiple_devices'
        ELSE 'normal'
      END,
    'check_time', now()
  );
  
  RETURN result;
END;
$$;

-- Alternative approach: Convert security views to regular functions that enforce RLS
-- This addresses the Security Definer View warnings

-- Create secure function to get user's active sessions
CREATE OR REPLACE FUNCTION public.get_user_active_sessions()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  device_id text,
  created_at timestamp with time zone,
  last_activity timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only return sessions for the authenticated user
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.device_id,
    s.created_at,
    s.last_activity,
    s.expires_at,
    s.is_active
  FROM public.active_sessions s
  WHERE s.user_id = auth.uid() 
    AND s.is_active = true 
    AND s.expires_at > now()
    AND s.created_at > (now() - INTERVAL '30 days');
END;
$$;

-- Create secure function to get user's user sessions
CREATE OR REPLACE FUNCTION public.get_user_sessions()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  device_id text,
  created_at timestamp with time zone,
  last_activity timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only return sessions for the authenticated user
  RETURN QUERY
  SELECT 
    s.id,
    s.user_id,
    s.device_id,
    s.created_at,
    s.last_activity,
    s.expires_at,
    s.is_active
  FROM public.user_sessions s
  WHERE s.user_id = auth.uid() 
    AND s.is_active = true 
    AND s.expires_at > now()
    AND s.created_at > (now() - INTERVAL '30 days');
END;
$$;

-- Update comments to reflect the new security approach
COMMENT ON FUNCTION public.get_user_active_sessions() IS 
'Secure function that returns only the authenticated user''s active sessions. Replaces the safe_active_sessions view to avoid Security Definer View warnings.';

COMMENT ON FUNCTION public.get_user_sessions() IS 
'Secure function that returns only the authenticated user''s user sessions. Replaces the safe_user_sessions view to avoid Security Definer View warnings.';

-- Log the security fixes
INSERT INTO public.advanced_security_logs (
  event_type, 
  event_category, 
  severity, 
  description, 
  metadata,
  success
) VALUES (
  'security_warnings_fixed',
  'data_protection',
  'high',
  'Fixed security linter warnings: added search_path to functions and created secure session access functions',
  jsonb_build_object(
    'warnings_fixed', ARRAY[
      'function_search_path_mutable',
      'security_definer_view_alternative'
    ],
    'functions_updated', ARRAY[
      'validate_session_access',
      'monitor_session_security'
    ],
    'functions_created', ARRAY[
      'get_user_active_sessions',
      'get_user_sessions'
    ],
    'security_enhancement', 'comprehensive_session_security'
  ),
  true
);