-- دالة لتحديث مخزون المنتجات عند إنشاء/تحديث فاتورة بيع
CREATE OR REPLACE FUNCTION public.handle_invoice_inventory()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- عند إنشاء فاتورة جديدة (INSERT) أو تغيير حالتها إلى paid
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'paid' AND NEW.status = 'paid') THEN
        -- تحديث مخزون كل منتج في الفاتورة (خصم الكمية)
        FOR item IN 
            SELECT product_id, quantity 
            FROM public.invoice_items 
            WHERE invoice_id = NEW.id AND product_id IS NOT NULL
        LOOP
            UPDATE public.products 
            SET stock = stock - item.quantity,
                updated_at = NOW()
            WHERE id = item.product_id 
            AND user_id = NEW.user_id;
        END LOOP;
        
    -- عند إلغاء الفاتورة أو تغيير حالتها من paid إلى غير paid
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'paid' AND NEW.status != 'paid' THEN
        -- إعادة الكمية إلى المخزون
        FOR item IN 
            SELECT product_id, quantity 
            FROM public.invoice_items 
            WHERE invoice_id = NEW.id AND product_id IS NOT NULL
        LOOP
            UPDATE public.products 
            SET stock = stock + item.quantity,
                updated_at = NOW()
            WHERE id = item.product_id 
            AND user_id = NEW.user_id;
        END LOOP;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- دالة للتعامل مع حذف الفواتير نهائياً
CREATE OR REPLACE FUNCTION public.handle_invoice_deletion()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    -- إذا كانت الفاتورة مدفوعة، أعد الكمية إلى المخزون
    IF OLD.status = 'paid' THEN
        FOR item IN 
            SELECT product_id, quantity 
            FROM public.invoice_items 
            WHERE invoice_id = OLD.id AND product_id IS NOT NULL
        LOOP
            UPDATE public.products 
            SET stock = stock + item.quantity,
                updated_at = NOW()
            WHERE id = item.product_id 
            AND user_id = OLD.user_id;
        END LOOP;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء triggers للفواتير
DROP TRIGGER IF EXISTS trigger_invoice_inventory ON public.invoices;
CREATE TRIGGER trigger_invoice_inventory
    AFTER INSERT OR UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invoice_inventory();

DROP TRIGGER IF EXISTS trigger_invoice_deletion_inventory ON public.invoices;
CREATE TRIGGER trigger_invoice_deletion_inventory
    BEFORE DELETE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_invoice_deletion();

-- دالة محدثة للحذف النهائي للفواتير مع إعادة المخزون
CREATE OR REPLACE FUNCTION public.permanently_delete_invoice(p_user_id uuid, p_invoice_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $function$
DECLARE
    v_invoice_number TEXT;
    v_total_amount NUMERIC;
    v_status TEXT;
    item RECORD;
BEGIN
    -- التحقق من وجود الفاتورة والصلاحية
    SELECT invoice_number, total_amount, status
    INTO v_invoice_number, v_total_amount, v_status
    FROM public.invoices 
    WHERE id = p_invoice_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'الفاتورة غير موجودة أو غير محذوفة';
        RETURN;
    END IF;

    -- إعادة الكمية إلى المخزون إذا كانت الفاتورة مدفوعة
    IF v_status = 'paid' THEN
        FOR item IN 
            SELECT ii.product_id, ii.quantity 
            FROM public.invoice_items ii
            WHERE ii.invoice_id = p_invoice_id AND ii.product_id IS NOT NULL
        LOOP
            UPDATE public.products 
            SET stock = stock + item.quantity,
                updated_at = NOW()
            WHERE id = item.product_id 
            AND user_id = p_user_id;
        END LOOP;
    END IF;

    -- حذف المعاملة المالية المرتبطة بالفاتورة من جدول cash_transactions
    DELETE FROM public.cash_transactions 
    WHERE user_id = p_user_id 
    AND reference_type = 'sales_invoice'
    AND reference_id = v_invoice_number;

    -- حذف عناصر الفاتورة أولاً
    DELETE FROM public.invoice_items 
    WHERE invoice_id = p_invoice_id;

    -- حذف الفاتورة نهائياً
    DELETE FROM public.invoices 
    WHERE id = p_invoice_id AND user_id = p_user_id;

    RETURN QUERY SELECT TRUE, 'تم حذف الفاتورة وإعادة الكمية إلى المخزون نهائياً';
END;
$function$;