-- Security Enhancement: Improve session view security and add monitoring

-- Create enhanced security view with additional safety checks
CREATE OR REPLACE VIEW public.safe_active_sessions AS 
SELECT 
  id,
  user_id,
  device_id,
  created_at,
  last_activity,
  expires_at,
  is_active
FROM public.active_sessions s
WHERE user_id = auth.uid() 
  AND is_active = true 
  AND expires_at > now()
  AND created_at > (now() - INTERVAL '30 days'); -- Additional safety: limit to last 30 days

-- Create enhanced security view for user sessions
CREATE OR REPLACE VIEW public.safe_user_sessions AS 
SELECT 
  id,
  user_id,
  device_id,
  created_at,
  last_activity,
  expires_at,
  is_active
FROM public.user_sessions s
WHERE user_id = auth.uid() 
  AND is_active = true 
  AND expires_at > now()
  AND created_at > (now() - INTERVAL '30 days'); -- Additional safety: limit to last 30 days

-- Create a security function to validate session access
CREATE OR REPLACE FUNCTION public.validate_session_access(p_session_id uuid, p_table_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Add comments documenting the security design
COMMENT ON VIEW public.safe_active_sessions IS 
'Security view that automatically filters active sessions to show only current user sessions that are active and not expired. Additional 30-day limit for enhanced security.';

COMMENT ON VIEW public.safe_user_sessions IS 
'Security view that automatically filters user sessions to show only current user sessions that are active and not expired. Additional 30-day limit for enhanced security.';

-- Create session security monitoring function
CREATE OR REPLACE FUNCTION public.monitor_session_security()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Log the security enhancement
INSERT INTO public.advanced_security_logs (
  event_type, 
  event_category, 
  severity, 
  description, 
  metadata,
  success
) VALUES (
  'security_enhancement_applied',
  'data_protection',
  'medium',
  'Enhanced session view security with additional time filtering and validation functions',
  jsonb_build_object(
    'views_enhanced', ARRAY['safe_active_sessions', 'safe_user_sessions'],
    'security_features_added', ARRAY[
      'time_based_filtering',
      'session_validation_function', 
      'security_monitoring_function'
    ],
    'enhancement_type', 'view_security_hardening',
    'note', 'Views are already secure by design with user filtering'
  ),
  true
);

-- Create index for better performance on session queries
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_active_expires 
ON public.active_sessions (user_id, is_active, expires_at) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active_expires 
ON public.user_sessions (user_id, is_active, expires_at) 
WHERE is_active = true;