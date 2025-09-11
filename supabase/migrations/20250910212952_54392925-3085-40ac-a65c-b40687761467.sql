-- حذف جميع الـ triggers الموجودة المتعلقة بتحديث المخزون
DROP TRIGGER IF EXISTS update_product_stock_from_purchase_trigger ON public.purchase_invoice_items;
DROP TRIGGER IF EXISTS update_product_stock_accurate_trigger ON public.purchase_invoice_items;
DROP TRIGGER IF EXISTS update_product_stock_trigger ON public.purchase_invoice_items;
DROP TRIGGER IF EXISTS update_stock_on_invoice_status_change_trigger ON public.purchase_invoices;

-- إنشاء trigger لتحديث مخزون المنتج عند إضافة/تعديل/حذف عناصر فاتورة الشراء
CREATE OR REPLACE FUNCTION public.update_product_stock_from_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invoice_status TEXT;
    product_exists BOOLEAN;
BEGIN
    -- التحقق من وجود المنتج
    SELECT EXISTS(SELECT 1 FROM public.products WHERE id = COALESCE(NEW.product_id, OLD.product_id)) INTO product_exists;
    
    IF NOT product_exists THEN
        RETURN COALESCE(NEW, OLD);
    END IF;

    -- الحصول على حالة فاتورة الشراء
    SELECT status INTO invoice_status
    FROM public.purchase_invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

    -- تحديث المخزون فقط إذا كانت الفاتورة مدفوعة أو مستلمة
    IF invoice_status IN ('paid', 'received') THEN
        
        IF TG_OP = 'INSERT' THEN
            -- إضافة الكمية الجديدة إلى المخزون
            UPDATE public.products 
            SET stock = stock + NEW.quantity,
                updated_at = NOW()
            WHERE id = NEW.product_id;
            
        ELSIF TG_OP = 'UPDATE' THEN
            -- تحديث المخزون بالفرق بين الكمية الجديدة والقديمة
            UPDATE public.products 
            SET stock = stock - COALESCE(OLD.quantity, 0) + COALESCE(NEW.quantity, 0),
                updated_at = NOW()
            WHERE id = NEW.product_id;
            
        ELSIF TG_OP = 'DELETE' THEN
            -- طرح الكمية المحذوفة من المخزون
            UPDATE public.products 
            SET stock = GREATEST(stock - OLD.quantity, 0),
                updated_at = NOW()
            WHERE id = OLD.product_id;
        END IF;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$;

-- إنشاء trigger جديد لعناصر فاتورة الشراء
CREATE TRIGGER update_product_stock_from_purchase_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_stock_from_purchase();