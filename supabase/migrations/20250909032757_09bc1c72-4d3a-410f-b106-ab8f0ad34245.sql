-- حذف السياسات المعقدة الحالية وإنشاء سياسات بسيطة لجدول user_sessions
DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية جلساتهم" ON public.user_sessions;
DROP POLICY IF EXISTS "الإداريون يمكنهم حذف الجلسات" ON public.user_sessions;
DROP POLICY IF EXISTS "المستخدمون يمكنهم تحديث جلساتهم" ON public.user_sessions;
DROP POLICY IF EXISTS "المستخدمون يمكنهم إنشاء جلسات" ON public.user_sessions;

-- إنشاء سياسات بسيطة للمستخدمين فقط
CREATE POLICY "users_can_view_own_sessions" 
ON public.user_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "users_can_create_sessions" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_update_own_sessions" 
ON public.user_sessions 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_delete_own_sessions" 
ON public.user_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- التأكد من تفعيل RLS على الجدول
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;