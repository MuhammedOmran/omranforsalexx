-- إضافة حقلي عدد المستخدمين وعدد الأجهزة لجدول التراخيص
ALTER TABLE public.user_licenses 
ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_devices INTEGER DEFAULT 1;

-- تحديث التراخيص الموجودة بقيم افتراضية
UPDATE public.user_licenses 
SET max_users = 1, max_devices = 1 
WHERE max_users IS NULL OR max_devices IS NULL;