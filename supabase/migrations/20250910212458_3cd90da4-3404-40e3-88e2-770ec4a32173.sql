-- إنشاء دالة لجلب المنتجات مع الكميات الإجمالية
CREATE OR REPLACE FUNCTION public.get_products_with_total_quantities(p_user_id UUID)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    name TEXT,
    code TEXT,
    barcode TEXT,
    description TEXT,
    category TEXT,
    price NUMERIC,
    cost NUMERIC,
    stock INTEGER,
    min_stock INTEGER,
    max_stock INTEGER,
    unit TEXT,
    location TEXT,
    supplier TEXT,
    image_url TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    total_quantity INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.user_id,
        p.name,
        p.code,
        p.barcode,
        p.description,
        p.category,
        p.price,
        p.cost,
        p.stock,
        p.min_stock,
        p.max_stock,
        p.unit,
        p.location,
        p.supplier,
        p.image_url,
        p.is_active,
        p.created_at,
        p.updated_at,
        COALESCE(p.stock, 0) as total_quantity
    FROM public.products p
    WHERE p.user_id = p_user_id
        AND p.is_active = true
    ORDER BY p.created_at DESC;
END;
$$;