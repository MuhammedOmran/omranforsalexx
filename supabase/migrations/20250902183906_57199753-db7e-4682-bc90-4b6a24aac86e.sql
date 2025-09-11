-- Fix ambiguous column reference in security functions
CREATE OR REPLACE FUNCTION is_suspicious_activity(
  p_ip_address text,
  p_email text DEFAULT NULL,
  p_activity_type text DEFAULT 'failed_login'
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  suspicious_count integer := 0;
  blocked_until timestamp;
BEGIN
  -- Check if IP is blocked
  SELECT sa.blocked_until 
  INTO blocked_until
  FROM suspicious_activities sa
  WHERE sa.ip_address = p_ip_address 
    AND sa.is_blocked = true 
    AND sa.blocked_until > NOW()
  LIMIT 1;

  -- If blocked, return true
  IF blocked_until IS NOT NULL THEN
    RETURN true;
  END IF;

  -- Check for recent suspicious activity
  SELECT COUNT(*)
  INTO suspicious_count
  FROM suspicious_activities sa
  WHERE sa.ip_address = p_ip_address
    AND sa.activity_type = p_activity_type
    AND sa.created_at > NOW() - INTERVAL '15 minutes';

  -- Return true if more than 5 attempts in 15 minutes
  RETURN suspicious_count > 5;
END;
$$;

-- Create RLS policies for active_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS active_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_token text UNIQUE NOT NULL,
  device_id text NOT NULL,
  device_name text,
  platform text,
  browser_info jsonb,
  ip_address text,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for active_sessions
DROP POLICY IF EXISTS "Users can access their own sessions" ON active_sessions;
CREATE POLICY "Users can access their own sessions"
ON active_sessions
FOR ALL
USING (auth.uid() = user_id);

-- Create or replace session validation function
CREATE OR REPLACE FUNCTION validate_session(
  p_session_token text,
  p_user_id uuid
)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  session_exists boolean := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM active_sessions 
    WHERE session_token = p_session_token 
      AND user_id = p_user_id 
      AND is_active = true 
      AND expires_at > NOW()
  ) INTO session_exists;

  RETURN session_exists;
END;
$$;