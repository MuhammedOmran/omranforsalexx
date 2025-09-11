-- إنشاء function لتحديث total_quantity في فواتير الشراء
CREATE OR REPLACE FUNCTION public.update_purchase_invoice_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث total_quantity في فاتورة الشراء
    UPDATE public.purchase_invoices 
    SET total_quantity = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM public.purchase_invoice_items 
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
    ),
    updated_at = now()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- إنشاء trigger للعمليات على purchase_invoice_items
DROP TRIGGER IF EXISTS trigger_update_purchase_totals_insert ON public.purchase_invoice_items;
CREATE TRIGGER trigger_update_purchase_totals_insert
    AFTER INSERT ON public.purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_purchase_invoice_totals();

DROP TRIGGER IF EXISTS trigger_update_purchase_totals_update ON public.purchase_invoice_items;
CREATE TRIGGER trigger_update_purchase_totals_update
    AFTER UPDATE ON public.purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_purchase_invoice_totals();

DROP TRIGGER IF EXISTS trigger_update_purchase_totals_delete ON public.purchase_invoice_items;
CREATE TRIGGER trigger_update_purchase_totals_delete
    AFTER DELETE ON public.purchase_invoice_items
    FOR EACH ROW
    EXECUTE FUNCTION public.update_purchase_invoice_totals();

-- تحديث جميع فواتير الشراء الموجودة لحساب total_quantity بشكل صحيح
UPDATE public.purchase_invoices 
SET total_quantity = (
    SELECT COALESCE(SUM(pii.quantity), 0)
    FROM public.purchase_invoice_items pii
    WHERE pii.invoice_id = purchase_invoices.id
),
updated_at = now()
WHERE id IN (
    SELECT DISTINCT pi.id 
    FROM public.purchase_invoices pi
    WHERE EXISTS (
        SELECT 1 FROM public.purchase_invoice_items pii 
        WHERE pii.invoice_id = pi.id
    )
);