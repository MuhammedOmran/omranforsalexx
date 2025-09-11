-- إضافة عمود الكمية الإجمالية لفواتير الشراء
ALTER TABLE purchase_invoices 
ADD COLUMN IF NOT EXISTS total_quantity INTEGER DEFAULT 0;

-- إزالة عمود تاريخ الاستحقاق إذا كان موجوداً
ALTER TABLE purchase_invoices 
DROP COLUMN IF EXISTS due_date;

-- إنشاء function لحساب الكمية الإجمالية للفاتورة
CREATE OR REPLACE FUNCTION public.calculate_purchase_invoice_total_quantity(invoice_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    total_qty INTEGER := 0;
BEGIN
    SELECT COALESCE(SUM(quantity), 0) INTO total_qty
    FROM purchase_invoice_items
    WHERE invoice_id = invoice_id_param;
    
    RETURN total_qty;
END;
$function$;

-- إنشاء trigger لتحديث الكمية الإجمالية عند تغيير عناصر الفاتورة
CREATE OR REPLACE FUNCTION public.update_purchase_invoice_total_quantity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    invoice_id_to_update UUID;
    new_total_quantity INTEGER;
BEGIN
    -- تحديد ID الفاتورة التي نحتاج لتحديثها
    IF TG_OP = 'DELETE' THEN
        invoice_id_to_update := OLD.invoice_id;
    ELSE
        invoice_id_to_update := NEW.invoice_id;
    END IF;
    
    -- حساب الكمية الإجمالية الجديدة
    new_total_quantity := calculate_purchase_invoice_total_quantity(invoice_id_to_update);
    
    -- تحديث الكمية الإجمالية في جدول الفواتير
    UPDATE purchase_invoices 
    SET total_quantity = new_total_quantity,
        updated_at = NOW()
    WHERE id = invoice_id_to_update;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$;

-- حذف أي trigger قديم بنفس الاسم
DROP TRIGGER IF EXISTS update_purchase_invoice_quantity_trigger ON purchase_invoice_items;

-- إنشاء trigger جديد
CREATE TRIGGER update_purchase_invoice_quantity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_purchase_invoice_total_quantity();

-- تحديث الكمية الإجمالية لجميع الفواتير الموجودة
UPDATE purchase_invoices 
SET total_quantity = (
    SELECT COALESCE(SUM(pii.quantity), 0)
    FROM purchase_invoice_items pii
    WHERE pii.invoice_id = purchase_invoices.id
),
updated_at = NOW()
WHERE id IN (
    SELECT DISTINCT invoice_id 
    FROM purchase_invoice_items
);