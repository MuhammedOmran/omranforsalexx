-- Fix security linter warnings
-- Fix function search path for prevent_role_escalation function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;