-- Create a function to get user license (needed for license manager)
CREATE OR REPLACE FUNCTION get_user_license(user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  start_date date,
  end_date date,
  status text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.id, l.user_id, l.start_date, l.end_date, l.status
  FROM licenses l
  WHERE l.user_id = $1 AND l.status = 'active'
  ORDER BY l.end_date DESC
  LIMIT 1;
$$;