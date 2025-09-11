-- تحديث التراخيص الموجودة بمدة 365 يوم لتكون من نوع سنوي
UPDATE public.user_licenses 
SET license_type = 'yearly', updated_at = now()
WHERE license_duration = 365 
AND license_type != 'yearly' 
AND is_active = true;