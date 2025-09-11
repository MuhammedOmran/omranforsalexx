-- إنشاء دالة حساب إجمالي الكمية لفاتورة شراء
CREATE OR REPLACE FUNCTION public.calculate_purchase_invoice_total_quantity(p_invoice_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    total_quantity INTEGER := 0;
BEGIN
    -- حساب إجمالي الكمية لجميع عناصر فاتورة الشراء
    SELECT COALESCE(SUM(quantity), 0) INTO total_quantity
    FROM public.purchase_invoice_items
    WHERE invoice_id = p_invoice_id;
    
    RETURN total_quantity;
END;
$function$;