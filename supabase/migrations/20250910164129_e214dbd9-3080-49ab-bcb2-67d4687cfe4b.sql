-- إنشاء دالة لحساب إجمالي تكاليف المخزون للمستخدم
CREATE OR REPLACE FUNCTION public.calculate_user_inventory_costs(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE(
    total_inventory_value numeric,
    total_products_count integer,
    breakdown jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_total_value numeric := 0;
    v_product_count integer := 0;
    v_breakdown jsonb := '[]'::jsonb;
    product_record RECORD;
BEGIN
    -- التحقق من المصادقة
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'غير مصرح بالوصول';
    END IF;
    
    -- حساب قيمة المخزون لكل منتج
    FOR product_record IN 
        SELECT id, name, stock, cost, (stock * cost) as value
        FROM public.products 
        WHERE user_id = p_user_id 
        AND is_active = true
        AND stock > 0
        AND cost > 0
    LOOP
        v_total_value := v_total_value + product_record.value;
        v_product_count := v_product_count + 1;
        
        -- إضافة تفاصيل المنتج للتفصيل
        v_breakdown := v_breakdown || jsonb_build_object(
            'product_id', product_record.id,
            'product_name', product_record.name,
            'stock', product_record.stock,
            'cost', product_record.cost,
            'value', product_record.value
        );
    END LOOP;
    
    RETURN QUERY SELECT v_total_value, v_product_count, v_breakdown;
END;
$$;

-- إنشاء دالة لحساب إجمالي التكاليف شاملة المخزون
CREATE OR REPLACE FUNCTION public.calculate_total_business_costs(
    p_user_id uuid DEFAULT auth.uid(),
    p_date_from date DEFAULT NULL,
    p_date_to date DEFAULT NULL
)
RETURNS TABLE(
    inventory_costs numeric,
    purchase_costs numeric,
    operating_costs numeric,
    total_costs numeric,
    cost_breakdown jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_inventory_costs numeric := 0;
    v_purchase_costs numeric := 0;
    v_operating_costs numeric := 0;
    v_total_costs numeric := 0;
    v_breakdown jsonb := '{}'::jsonb;
    inventory_data RECORD;
BEGIN
    -- التحقق من المصادقة
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'غير مصرح بالوصول';
    END IF;
    
    -- حساب تكاليف المخزون
    SELECT total_inventory_value INTO v_inventory_costs
    FROM public.calculate_user_inventory_costs(p_user_id);
    
    -- حساب تكاليف المشتريات
    SELECT COALESCE(SUM(total_amount), 0) INTO v_purchase_costs
    FROM public.purchase_invoices
    WHERE user_id = p_user_id
    AND deleted_at IS NULL
    AND (p_date_from IS NULL OR invoice_date >= p_date_from)
    AND (p_date_to IS NULL OR invoice_date <= p_date_to);
    
    -- حساب التكاليف التشغيلية من معاملات النقدية
    SELECT COALESCE(SUM(amount), 0) INTO v_operating_costs
    FROM public.cash_transactions
    WHERE user_id = p_user_id
    AND transaction_type = 'expense'
    AND category != 'purchases'  -- استثناء المشتريات لتجنب التكرار
    AND deleted_at IS NULL
    AND (p_date_from IS NULL OR created_at::date >= p_date_from)
    AND (p_date_to IS NULL OR created_at::date <= p_date_to);
    
    -- حساب إجمالي التكاليف
    v_total_costs := v_inventory_costs + v_purchase_costs + v_operating_costs;
    
    -- إنشاء تفصيل التكاليف
    v_breakdown := jsonb_build_object(
        'inventory_costs', v_inventory_costs,
        'purchase_costs', v_purchase_costs,
        'operating_costs', v_operating_costs,
        'calculation_date', now(),
        'user_id', p_user_id
    );
    
    RETURN QUERY SELECT v_inventory_costs, v_purchase_costs, v_operating_costs, v_total_costs, v_breakdown;
END;
$$;