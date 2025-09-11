-- إزالة القيود الحالية على حالة الشيك
ALTER TABLE checks DROP CONSTRAINT IF EXISTS checks_status_check;

-- إضافة قيد جديد يتضمن جميع الحالات المطلوبة
ALTER TABLE checks ADD CONSTRAINT checks_status_check 
CHECK (status IN ('pending', 'cashed', 'bounced', 'paid', 'returned'));

-- تحديث أي شيكات موجودة قد تحتوي على حالات غير صحيحة
UPDATE checks 
SET status = 'pending' 
WHERE status NOT IN ('pending', 'cashed', 'bounced', 'paid', 'returned');