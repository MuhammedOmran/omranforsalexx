-- الخطوة الأولى: إضافة القيم الجديدة للـ enum فقط
ALTER TYPE license_tier ADD VALUE IF NOT EXISTS 'basic';
ALTER TYPE license_tier ADD VALUE IF NOT EXISTS 'standard'; 
ALTER TYPE license_tier ADD VALUE IF NOT EXISTS 'lifetime';

-- إضافة أعمدة max_users و max_devices إلى جدول user_licenses إذا لم تكن موجودة
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_licenses' AND column_name='max_users') THEN
        ALTER TABLE public.user_licenses ADD COLUMN max_users integer;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_licenses' AND column_name='max_devices') THEN
        ALTER TABLE public.user_licenses ADD COLUMN max_devices integer;
    END IF;
END $$;