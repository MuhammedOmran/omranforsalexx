-- تحسين trigger تحديث المخزون لفواتير الشراء لتحسين الأداء
DROP TRIGGER IF EXISTS purchase_invoice_stock_trigger ON purchase_invoice_items;

-- إنشاء trigger محسن يعمل بكفاءة أكبر
CREATE OR REPLACE FUNCTION public.update_product_stock_batch()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    invoice_status TEXT;
    purchase_date DATE;
    affected_products UUID[];
BEGIN
    -- الحصول على معلومات الفاتورة
    SELECT pi.status, pi.invoice_date INTO invoice_status, purchase_date
    FROM public.purchase_invoices pi
    WHERE pi.id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- تحديث المخزون فقط للفواتير المدفوعة/المستلمة
    IF invoice_status IN ('paid', 'received') THEN
        IF TG_OP = 'INSERT' THEN
            -- إضافة كمية جديدة للمخزون
            IF NEW.product_id IS NOT NULL AND NEW.quantity > 0 THEN
                UPDATE public.products 
                SET stock = stock + NEW.quantity,
                    updated_at = now()
                WHERE id = NEW.product_id;
            END IF;
            RETURN NEW;
            
        ELSIF TG_OP = 'UPDATE' THEN
            -- تحديث الكمية - طرح القديمة وإضافة الجديدة
            IF NEW.product_id IS NOT NULL THEN
                UPDATE public.products 
                SET stock = stock - COALESCE(OLD.quantity, 0) + COALESCE(NEW.quantity, 0),
                    updated_at = now()
                WHERE id = NEW.product_id;
            END IF;
            RETURN NEW;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- حذف الكمية من المخزون
            IF OLD.product_id IS NOT NULL AND OLD.quantity > 0 THEN
                UPDATE public.products 
                SET stock = GREATEST(stock - OLD.quantity, 0),
                    updated_at = now()
                WHERE id = OLD.product_id;
            END IF;
            RETURN OLD;
        END IF;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- إنشاء trigger محسن للمعالجة السريعة
CREATE TRIGGER purchase_invoice_stock_trigger_optimized
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock_batch();

-- إنشاء index لتسريع الاستعلامات
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_product_id ON purchase_invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoice_items_invoice_id ON purchase_invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_status ON purchase_invoices(status);

-- دالة لمزامنة المخزون بشكل مجمع (batch) لتحسين الأداء
CREATE OR REPLACE FUNCTION public.sync_product_stock_batch(p_product_ids UUID[] DEFAULT NULL)
RETURNS TABLE(product_id UUID, old_stock INTEGER, new_stock INTEGER, updated BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    product_record RECORD;
    total_purchased INTEGER;
    total_sold INTEGER;
    calculated_stock INTEGER;
    old_stock_value INTEGER;
BEGIN
    -- إذا لم يتم تحديد منتجات معينة، قم بمعالجة جميع المنتجات
    IF p_product_ids IS NULL THEN
        FOR product_record IN 
            SELECT p.id, p.stock FROM public.products p
        LOOP
            -- حساب إجمالي المشتريات
            SELECT COALESCE(SUM(pii.quantity), 0) INTO total_purchased
            FROM public.purchase_invoice_items pii
            JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
            WHERE pii.product_id = product_record.id
              AND pi.status IN ('paid', 'received')
              AND pi.deleted_at IS NULL;
            
            -- حساب إجمالي المبيعات
            SELECT COALESCE(SUM(ii.quantity), 0) INTO total_sold
            FROM public.invoice_items ii
            JOIN public.invoices i ON ii.invoice_id = i.id
            WHERE ii.product_id = product_record.id
              AND i.status = 'paid'
              AND i.deleted_at IS NULL;
            
            calculated_stock := GREATEST(total_purchased - total_sold, 0);
            old_stock_value := product_record.stock;
            
            -- تحديث المخزون فقط إذا اختلف
            IF calculated_stock != old_stock_value THEN
                UPDATE public.products 
                SET stock = calculated_stock,
                    updated_at = now()
                WHERE id = product_record.id;
                
                RETURN QUERY SELECT product_record.id, old_stock_value, calculated_stock, true;
            ELSE
                RETURN QUERY SELECT product_record.id, old_stock_value, calculated_stock, false;
            END IF;
        END LOOP;
    ELSE
        -- معالجة المنتجات المحددة فقط
        FOR product_record IN 
            SELECT p.id, p.stock FROM public.products p
            WHERE p.id = ANY(p_product_ids)
        LOOP
            SELECT COALESCE(SUM(pii.quantity), 0) INTO total_purchased
            FROM public.purchase_invoice_items pii
            JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
            WHERE pii.product_id = product_record.id
              AND pi.status IN ('paid', 'received')
              AND pi.deleted_at IS NULL;
            
            SELECT COALESCE(SUM(ii.quantity), 0) INTO total_sold
            FROM public.invoice_items ii
            JOIN public.invoices i ON ii.invoice_id = i.id
            WHERE ii.product_id = product_record.id
              AND i.status = 'paid'
              AND i.deleted_at IS NULL;
            
            calculated_stock := GREATEST(total_purchased - total_sold, 0);
            old_stock_value := product_record.stock;
            
            IF calculated_stock != old_stock_value THEN
                UPDATE public.products 
                SET stock = calculated_stock,
                    updated_at = now()
                WHERE id = product_record.id;
                
                RETURN QUERY SELECT product_record.id, old_stock_value, calculated_stock, true;
            ELSE
                RETURN QUERY SELECT product_record.id, old_stock_value, calculated_stock, false;
            END IF;
        END LOOP;
    END IF;
END;
$function$;