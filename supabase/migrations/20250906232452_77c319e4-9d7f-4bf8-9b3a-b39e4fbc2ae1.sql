-- إضافة profile للمستخدم الحالي المسجل دخوله
-- لحل مشكلة "Cannot coerce the result to a single JSON object"

INSERT INTO public.profiles (user_id, full_name, username)
VALUES (
  '07045e5c-0528-4561-9c0b-dbc47313a19b',
  'tr@gmail.com',
  'tr'
) 
ON CONFLICT (user_id) DO NOTHING;