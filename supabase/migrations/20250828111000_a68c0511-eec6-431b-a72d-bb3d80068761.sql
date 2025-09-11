-- Security Fix 1: Fix employees RLS to remove profiles.role trust and use only role functions
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Allow HR and Admins only" ON employees;
DROP POLICY IF EXISTS "Only HR/Admin can view employees" ON employees;

-- Create secure policies that only use role functions
CREATE POLICY "Secure employee read access" 
ON employees FOR SELECT 
USING (
  is_hr_manager() OR 
  auth.uid() = user_id OR 
  is_department_manager_for_employee(user_id, department)
);

CREATE POLICY "Secure employee write access" 
ON employees FOR INSERT 
WITH CHECK (
  is_hr_manager() OR 
  auth.uid() = user_id
);

CREATE POLICY "Secure employee update access" 
ON employees FOR UPDATE 
USING (
  is_hr_manager() OR 
  auth.uid() = user_id OR 
  is_department_manager_for_employee(user_id, department)
);

CREATE POLICY "Secure employee delete access" 
ON employees FOR DELETE 
USING (
  is_hr_manager() OR 
  auth.uid() = user_id
);

-- Security Fix 2: Lock down profiles.role updates
-- Drop existing update policy and create restricted one
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update profile except role" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = OLD.role);

CREATE POLICY "Admins can update any profile role" 
ON profiles FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- Security Fix 3: Fix definer-views that bypass RLS
-- Make views use security invoker to respect RLS
ALTER VIEW employee_directory SET (security_invoker = on);
ALTER VIEW employee_basic_info SET (security_invoker = on);

-- Security Fix 9: Create table for secure audit logging with proper RLS
CREATE TABLE IF NOT EXISTS secure_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on secure audit events
ALTER TABLE secure_audit_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit events
CREATE POLICY "Admins can view audit events" 
ON secure_audit_events FOR SELECT 
USING (is_admin());

-- System can insert audit events (for edge functions)
CREATE POLICY "System can insert audit events" 
ON secure_audit_events FOR INSERT 
WITH CHECK (true);