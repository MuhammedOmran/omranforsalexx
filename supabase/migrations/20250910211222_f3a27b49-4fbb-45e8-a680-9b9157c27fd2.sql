-- إنشاء دالة لحساب الكمية الإجمالية للمنتجات (مخزون + مشتريات)
CREATE OR REPLACE FUNCTION public.get_products_with_total_quantities(p_user_id uuid)
RETURNS TABLE(
    id uuid,
    name text,
    code text,
    category text,
    stock integer,
    min_stock integer,
    price numeric,
    cost numeric,
    is_active boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    user_id uuid,
    barcode text,
    description text,
    unit text,
    location text,
    supplier text,
    image_url text,
    max_stock integer,
    total_quantity integer
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.*,
        COALESCE(
            p.stock + COALESCE(purchase_quantities.total_purchased, 0), 
            p.stock
        ) as total_quantity
    FROM public.products p
    LEFT JOIN (
        SELECT 
            pii.product_id,
            SUM(pii.quantity) as total_purchased
        FROM public.purchase_invoice_items pii
        JOIN public.purchase_invoices pi ON pii.invoice_id = pi.id
        WHERE pi.user_id = p_user_id
          AND pi.deleted_at IS NULL
          AND pi.status IN ('paid', 'received')
        GROUP BY pii.product_id
    ) purchase_quantities ON p.id = purchase_quantities.product_id
    WHERE p.user_id = p_user_id
      AND p.is_active = true
    ORDER BY p.name ASC;
END;
$$;