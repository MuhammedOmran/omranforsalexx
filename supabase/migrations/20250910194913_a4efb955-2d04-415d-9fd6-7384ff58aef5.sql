-- حل مشكلة تضاعف تحديث المخزون
-- أولاً، نحذف جميع الـ triggers المضاعفة على جدول المنتجات
DROP TRIGGER IF EXISTS product_stock_update_trigger ON products;
DROP TRIGGER IF EXISTS update_product_stock_financial ON products;

-- نحذف أي triggers قديمة على purchase_invoice_items قد تسبب مشاكل
DROP TRIGGER IF EXISTS purchase_inventory_sync ON purchase_invoice_items;
DROP TRIGGER IF EXISTS handle_purchase_item_inventory_trigger ON purchase_invoice_items;
DROP TRIGGER IF EXISTS update_product_stock_on_purchase_trigger ON purchase_invoice_items;

-- نبقي فقط على trigger واحد محدث وصحيح لتحديث المخزون عند إضافة/تعديل/حذف عناصر فواتير الشراء
DROP TRIGGER IF EXISTS purchase_item_stock_sync ON purchase_invoice_items;

-- إنشاء trigger جديد ونظيف لتحديث المخزون
CREATE TRIGGER purchase_item_stock_sync
  AFTER INSERT OR UPDATE OR DELETE ON purchase_invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION handle_purchase_item_inventory();

-- التأكد من أن function handle_purchase_item_inventory تعمل بشكل صحيح
-- إعادة إنشاء الfunction بشكل محسن لتجنب التضاعف
CREATE OR REPLACE FUNCTION public.handle_purchase_item_inventory()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    invoice_user_id UUID;
    margin_percentage NUMERIC := 0.30;
BEGIN
    -- الحصول على user_id من الفاتورة
    IF TG_OP = 'DELETE' THEN
        SELECT user_id INTO invoice_user_id 
        FROM purchase_invoices 
        WHERE id = OLD.invoice_id;
    ELSE
        SELECT user_id INTO invoice_user_id 
        FROM purchase_invoices 
        WHERE id = NEW.invoice_id;
    END IF;
    
    IF TG_OP = 'INSERT' THEN
        -- عند إضافة عنصر جديد للفاتورة
        IF NEW.product_id IS NOT NULL THEN
            UPDATE products 
            SET 
                stock = stock + NEW.quantity,
                cost = NEW.unit_cost,
                price = NEW.unit_cost * (1 + margin_percentage),
                updated_at = NOW()
            WHERE id = NEW.product_id AND user_id = invoice_user_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- عند تحديث عنصر موجود
        IF NEW.product_id IS NOT NULL AND OLD.product_id IS NOT NULL THEN
            -- إزالة الكمية القديمة وإضافة الجديدة
            UPDATE products 
            SET 
                stock = stock - OLD.quantity + NEW.quantity,
                cost = NEW.unit_cost,
                price = NEW.unit_cost * (1 + margin_percentage),
                updated_at = NOW()
            WHERE id = NEW.product_id AND user_id = invoice_user_id;
        END IF;
        RETURN NEW;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- عند حذف عنصر من الفاتورة
        IF OLD.product_id IS NOT NULL THEN
            UPDATE products 
            SET 
                stock = stock - OLD.quantity,
                updated_at = NOW()
            WHERE id = OLD.product_id AND user_id = invoice_user_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$function$;

-- تنظيف أي duplicated triggers على products
DROP TRIGGER IF EXISTS product_inventory_expense_trigger ON products;

-- إعادة تزامن المخزون الحالي لإصلاح أي تضاعف
-- هذا سيحسب المخزون الصحيح لكل منتج بناءً على فواتير الشراء والبيع
CREATE OR REPLACE FUNCTION public.fix_duplicate_stock()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    product_record RECORD;
    total_purchased INTEGER;
    total_sold INTEGER;
    calculated_stock INTEGER;
BEGIN
    FOR product_record IN SELECT id, user_id, stock FROM public.products LOOP
        -- حساب إجمالي المشتريات
        SELECT COALESCE(SUM(pii.quantity), 0) INTO total_purchased
        FROM public.purchase_invoice_items pii
        JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
        WHERE pii.product_id = product_record.id
          AND pi.user_id = product_record.user_id
          AND pi.deleted_at IS NULL;
        
        -- حساب إجمالي المبيعات 
        SELECT COALESCE(SUM(ii.quantity), 0) INTO total_sold
        FROM public.invoice_items ii
        JOIN public.invoices i ON ii.invoice_id = i.id
        WHERE ii.product_id = product_record.id
          AND i.user_id = product_record.user_id
          AND i.deleted_at IS NULL
          AND i.status = 'paid';
        
        calculated_stock := total_purchased - total_sold;
        
        -- تحديث المخزون إذا كان مختلف عن المخزون المحسوب
        IF product_record.stock != calculated_stock THEN
            UPDATE public.products 
            SET stock = GREATEST(calculated_stock, 0),
                updated_at = now()
            WHERE id = product_record.id;
            
            RAISE NOTICE 'Fixed stock for product %: was %, now %', 
                product_record.id, product_record.stock, calculated_stock;
        END IF;
    END LOOP;
END;
$function$;

-- تطبيق الإصلاح
SELECT fix_duplicate_stock();