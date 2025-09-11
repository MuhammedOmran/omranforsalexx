-- Drop unused duplicate function to avoid confusion
DROP FUNCTION IF EXISTS public.add_user_license_with_limits(uuid, license_tier, integer, jsonb);