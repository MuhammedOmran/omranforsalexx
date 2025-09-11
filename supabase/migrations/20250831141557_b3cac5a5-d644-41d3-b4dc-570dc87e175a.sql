-- Fix critical security issue: Enable RLS and add policies for session tables

-- Enable RLS on safe_active_sessions table
ALTER TABLE public.safe_active_sessions ENABLE ROW LEVEL SECURITY;

-- Enable RLS on safe_user_sessions table  
ALTER TABLE public.safe_user_sessions ENABLE ROW LEVEL SECURITY;

-- Add policies for safe_active_sessions table
-- Users can only view their own sessions
CREATE POLICY "Users can view their own active sessions" 
ON public.safe_active_sessions 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can only insert their own sessions
CREATE POLICY "Users can insert their own active sessions" 
ON public.safe_active_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Users can only update their own sessions
CREATE POLICY "Users can update their own active sessions" 
ON public.safe_active_sessions 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Users can only delete their own sessions
CREATE POLICY "Users can delete their own active sessions" 
ON public.safe_active_sessions 
FOR DELETE 
USING (user_id = auth.uid());

-- Add policies for safe_user_sessions table
-- Users can only view their own sessions
CREATE POLICY "Users can view their own user sessions" 
ON public.safe_user_sessions 
FOR SELECT 
USING (user_id = auth.uid());

-- Users can only insert their own sessions
CREATE POLICY "Users can insert their own user sessions" 
ON public.safe_user_sessions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Users can only update their own sessions
CREATE POLICY "Users can update their own user sessions" 
ON public.safe_user_sessions 
FOR UPDATE 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Users can only delete their own sessions
CREATE POLICY "Users can delete their own user sessions" 
ON public.safe_user_sessions 
FOR DELETE 
USING (user_id = auth.uid());

-- Add system/admin policies for session management (optional)
-- Only admins can view all sessions for security monitoring
CREATE POLICY "Admins can view all active sessions" 
ON public.safe_active_sessions 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can view all user sessions" 
ON public.safe_user_sessions 
FOR SELECT 
USING (is_admin());

-- Log this security fix
INSERT INTO public.advanced_security_logs (
  event_type, 
  event_category, 
  severity, 
  description, 
  metadata,
  success
) VALUES (
  'security_fix_applied',
  'data_protection',
  'high',
  'Applied RLS policies to session tables to prevent unauthorized access',
  jsonb_build_object(
    'tables_secured', ARRAY['safe_active_sessions', 'safe_user_sessions'],
    'policies_added', 10,
    'fix_type', 'row_level_security',
    'security_level', 'critical'
  ),
  true
);