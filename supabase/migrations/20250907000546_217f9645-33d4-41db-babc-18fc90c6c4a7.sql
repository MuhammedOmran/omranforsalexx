-- إضافة دوال إحصائيات الموردين فقط
-- إضافة دالة لحساب إحصائيات المورد
CREATE OR REPLACE FUNCTION get_supplier_statistics(p_supplier_id uuid, p_user_id uuid)
RETURNS TABLE(
    total_invoices integer,
    total_amount numeric,
    paid_amount numeric,
    pending_amount numeric,
    last_purchase_date date,
    average_order_value numeric
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer as total_invoices,
        COALESCE(SUM(pi.total_amount), 0) as total_amount,
        COALESCE(SUM(pi.paid_amount), 0) as paid_amount,
        COALESCE(SUM(pi.total_amount - pi.paid_amount), 0) as pending_amount,
        MAX(pi.invoice_date) as last_purchase_date,
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(pi.total_amount) / COUNT(*), 0)
            ELSE 0
        END as average_order_value
    FROM public.purchase_invoices pi
    WHERE pi.supplier_id = p_supplier_id 
      AND pi.user_id = p_user_id;
END;
$$;

-- إضافة دالة لجلب أفضل الموردين
CREATE OR REPLACE FUNCTION get_top_suppliers(p_user_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(
    supplier_id uuid,
    supplier_name text,
    total_purchases numeric,
    invoice_count integer,
    last_purchase date
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as supplier_id,
        s.name as supplier_name,
        COALESCE(SUM(pi.total_amount), 0) as total_purchases,
        COUNT(pi.id)::integer as invoice_count,
        MAX(pi.invoice_date) as last_purchase
    FROM public.suppliers s
    LEFT JOIN public.purchase_invoices pi ON s.id = pi.supplier_id
    WHERE s.user_id = p_user_id 
      AND s.is_active = true
    GROUP BY s.id, s.name
    ORDER BY total_purchases DESC
    LIMIT p_limit;
END;
$$;

-- إضافة indexes إذا لم تكن موجودة
CREATE INDEX IF NOT EXISTS idx_purchase_invoices_supplier_id 
ON public.purchase_invoices(supplier_id);

CREATE INDEX IF NOT EXISTS idx_suppliers_user_id_active 
ON public.suppliers(user_id, is_active);