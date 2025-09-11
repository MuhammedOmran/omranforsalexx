-- حذف الدالة القديمة التي تحتوي على معاملات إضافية
DROP FUNCTION IF EXISTS public.add_user_license(uuid, integer, text, jsonb, integer, integer) CASCADE;

-- الآن يمكن استخدام الدالة الصحيحة بدون تعارض
-- اختبار الدالة الصحيحة
SELECT add_user_license('07045e5c-0528-4561-9c0b-dbc47313a19b'::uuid, 365, 'yearly') as license_id;