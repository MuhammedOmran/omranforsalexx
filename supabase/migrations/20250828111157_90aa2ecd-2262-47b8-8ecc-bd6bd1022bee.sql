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

-- Create a trigger function to prevent role changes by non-admins
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow admins to change any role
  IF is_admin() THEN
    RETURN NEW;
  END IF;
  
  -- For non-admins, preserve the old role
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    NEW.role := OLD.role;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON profiles;
CREATE TRIGGER prevent_role_escalation_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_escalation();

-- Simple update policy for profiles
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

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