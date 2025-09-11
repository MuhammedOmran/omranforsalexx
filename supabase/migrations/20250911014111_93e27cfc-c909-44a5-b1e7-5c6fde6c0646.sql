-- إزالة القيد القديم المحدود
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- السماح بأي قيمة نصية في حقل type
-- هذا يعطي مرونة أكبر للإشعارات المختلفة
ALTER TABLE notifications ALTER COLUMN type TYPE TEXT;

-- إضافة قيد للتأكد من أن type ليس فارغاً
ALTER TABLE notifications ADD CONSTRAINT notifications_type_not_empty 
CHECK (type IS NOT NULL AND length(trim(type)) > 0);