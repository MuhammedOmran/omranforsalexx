-- إنشاء دالة لتحديث المخزون عند تغيير فواتير الشراء
CREATE OR REPLACE FUNCTION public.handle_purchase_invoice_stock_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    item RECORD;
BEGIN
    -- عند إنشاء فاتورة شراء جديدة أو تحديث حالتها إلى مدفوعة/مستلمة
    IF (TG_OP = 'INSERT' AND NEW.status IN ('paid', 'received')) OR 
       (TG_OP = 'UPDATE' AND OLD.status NOT IN ('paid', 'received') AND NEW.status IN ('paid', 'received')) THEN
        
        -- إضافة كمية العناصر إلى المخزون
        FOR item IN 
            SELECT pii.product_id, pii.quantity 
            FROM purchase_invoice_items pii
            WHERE pii.invoice_id = NEW.id AND pii.product_id IS NOT NULL
        LOOP
            UPDATE products 
            SET stock = stock + item.quantity,
                updated_at = NOW()
            WHERE id = item.product_id 
            AND user_id = NEW.user_id;
        END LOOP;
        
    -- عند إلغاء الفاتورة أو تغيير حالتها من مدفوعة/مستلمة إلى حالة أخرى
    ELSIF TG_OP = 'UPDATE' AND OLD.status IN ('paid', 'received') AND NEW.status NOT IN ('paid', 'received') THEN
        
        -- خصم كمية العناصر من المخزون
        FOR item IN 
            SELECT pii.product_id, pii.quantity 
            FROM purchase_invoice_items pii
            WHERE pii.invoice_id = NEW.id AND pii.product_id IS NOT NULL
        LOOP
            UPDATE products 
            SET stock = GREATEST(stock - item.quantity, 0),
                updated_at = NOW()
            WHERE id = item.product_id 
            AND user_id = NEW.user_id;
        END LOOP;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- إنشاء محفز على جدول فواتير الشراء
CREATE OR REPLACE TRIGGER purchase_invoice_stock_trigger
    AFTER INSERT OR UPDATE ON purchase_invoices
    FOR EACH ROW
    EXECUTE FUNCTION handle_purchase_invoice_stock_update();

-- إنشاء دالة لتحديث المخزون عند تغيير عناصر فاتورة الشراء
CREATE OR REPLACE FUNCTION public.handle_purchase_invoice_items_stock_update()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    invoice_status TEXT;
BEGIN
    -- الحصول على حالة الفاتورة
    SELECT status INTO invoice_status
    FROM purchase_invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- تحديث المخزون فقط للفواتير المدفوعة/المستلمة
    IF invoice_status IN ('paid', 'received') THEN
        
        IF TG_OP = 'INSERT' THEN
            -- إضافة عنصر جديد - زيادة في المخزون
            IF NEW.product_id IS NOT NULL AND NEW.quantity > 0 THEN
                UPDATE products 
                SET stock = stock + NEW.quantity,
                    updated_at = NOW()
                WHERE id = NEW.product_id;
            END IF;
            
        ELSIF TG_OP = 'UPDATE' THEN
            -- تعديل عنصر - حساب الفرق وتطبيقه
            IF NEW.product_id IS NOT NULL THEN
                UPDATE products 
                SET stock = stock - COALESCE(OLD.quantity, 0) + COALESCE(NEW.quantity, 0),
                    updated_at = NOW()
                WHERE id = NEW.product_id;
            END IF;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- حذف عنصر - خصم من المخزون
            IF OLD.product_id IS NOT NULL AND OLD.quantity > 0 THEN
                UPDATE products 
                SET stock = GREATEST(stock - OLD.quantity, 0),
                    updated_at = NOW()
                WHERE id = OLD.product_id;
            END IF;
            
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- إنشاء محفز على جدول عناصر فواتير الشراء
CREATE OR REPLACE TRIGGER purchase_invoice_items_stock_trigger
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION handle_purchase_invoice_items_stock_update();