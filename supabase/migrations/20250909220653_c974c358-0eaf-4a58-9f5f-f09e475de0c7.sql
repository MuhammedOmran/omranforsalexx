-- حذف جميع الجلسات الموجودة وإعادة تعيين الجدول
DELETE FROM public.user_sessions;

-- إعادة تعيين التسلسل إن وجد
-- تنظيف أي بيانات تجريبية أو افتراضية أخرى قد تكون موجودة في جداول إدارة الأجهزة

-- إضافة فهرس للأداء إذا لم يكن موجوداً
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_device 
ON public.user_sessions(user_id, device_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_active 
ON public.user_sessions(user_id, is_active, expires_at);

-- إضافة تعليق للتوضيح
COMMENT ON TABLE public.user_sessions IS 'جدول إدارة جلسات الأجهزة للمستخدمين - تم تنظيفه من البيانات الافتراضية';