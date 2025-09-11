-- إنشاء دالة لعرض جميع المستخدمين مع تراخيصهم (إن وجدت)
CREATE OR REPLACE FUNCTION public.get_all_users_with_licenses()
RETURNS TABLE(
  user_id uuid,
  email text,
  start_date date,
  end_date date,
  status text,
  days_left integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    u.id as user_id,
    u.email::text,
    l.start_date,
    l.end_date,
    COALESCE(l.status, 'no_license') as status,
    CASE 
      WHEN l.end_date IS NOT NULL THEN (l.end_date::date - now()::date)
      ELSE NULL
    END as days_left
  FROM auth.users u
  LEFT JOIN public.licenses l ON u.id = l.user_id
  ORDER BY 
    CASE WHEN l.end_date IS NOT NULL THEN (l.end_date::date - now()::date) END ASC NULLS LAST,
    u.created_at DESC;
$$;