-- إصلاح باقي الدوال بإعادة إنشائها مع search_path الصحيح
CREATE OR REPLACE FUNCTION public.get_purchase_statistics(p_user_id uuid, p_period_days integer DEFAULT 30)
RETURNS TABLE(total_purchases numeric, pending_payments numeric, overdue_payments numeric, active_suppliers integer, top_supplier_name text, top_supplier_amount numeric, period_days integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH purchase_stats AS (
    SELECT 
      COALESCE(SUM(pi.total_amount), 0) as total_purchases,
      COALESCE(SUM(CASE WHEN pi.status = 'pending' THEN (pi.total_amount - pi.paid_amount) END), 0) as pending_payments,
      COALESCE(SUM(CASE WHEN pi.status = 'overdue' THEN (pi.total_amount - pi.paid_amount) END), 0) as overdue_payments,
      COUNT(DISTINCT pi.supplier_id) as active_suppliers
    FROM public.purchase_invoices pi
    WHERE pi.user_id = p_user_id
      AND pi.created_at >= (CURRENT_DATE - INTERVAL '1 day' * p_period_days)
  ),
  top_supplier AS (
    SELECT 
      pi.supplier_name,
      SUM(pi.total_amount) as supplier_amount
    FROM public.purchase_invoices pi
    WHERE pi.user_id = p_user_id
      AND pi.created_at >= (CURRENT_DATE - INTERVAL '1 day' * p_period_days)
    GROUP BY pi.supplier_name
    ORDER BY SUM(pi.total_amount) DESC
    LIMIT 1
  )
  SELECT 
    ps.total_purchases,
    ps.pending_payments,
    ps.overdue_payments,
    ps.active_suppliers,
    COALESCE(ts.supplier_name, '') as top_supplier_name,
    COALESCE(ts.supplier_amount, 0) as top_supplier_amount,
    p_period_days
  FROM purchase_stats ps
  LEFT JOIN top_supplier ts ON true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_supplier_statistics(p_supplier_id uuid, p_user_id uuid)
RETURNS TABLE(total_invoices integer, total_amount numeric, paid_amount numeric, pending_amount numeric, last_purchase_date date, average_order_value numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.get_top_suppliers(p_user_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(supplier_id uuid, supplier_name text, total_purchases numeric, invoice_count integer, last_purchase date)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

CREATE OR REPLACE FUNCTION public.check_duplicate_supplier(p_user_id uuid, p_name text, p_email text DEFAULT NULL::text, p_phone text DEFAULT NULL::text, p_exclude_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(duplicate_type text, existing_supplier_id uuid, existing_supplier_name text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- التحقق من الاسم
    IF EXISTS (
        SELECT 1 FROM public.suppliers 
        WHERE user_id = p_user_id 
          AND name = p_name 
          AND is_active = true
          AND (p_exclude_id IS NULL OR id != p_exclude_id)
    ) THEN
        RETURN QUERY
        SELECT 
            'name'::TEXT as duplicate_type,
            s.id as existing_supplier_id,
            s.name as existing_supplier_name
        FROM public.suppliers s
        WHERE s.user_id = p_user_id 
          AND s.name = p_name 
          AND s.is_active = true
          AND (p_exclude_id IS NULL OR s.id != p_exclude_id)
        LIMIT 1;
        RETURN;
    END IF;

    -- التحقق من البريد الإلكتروني (إذا كان موجود)
    IF p_email IS NOT NULL AND p_email != '' AND EXISTS (
        SELECT 1 FROM public.suppliers 
        WHERE user_id = p_user_id 
          AND email = p_email 
          AND is_active = true
          AND (p_exclude_id IS NULL OR id != p_exclude_id)
    ) THEN
        RETURN QUERY
        SELECT 
            'email'::TEXT as duplicate_type,
            s.id as existing_supplier_id,
            s.name as existing_supplier_name
        FROM public.suppliers s
        WHERE s.user_id = p_user_id 
          AND s.email = p_email 
          AND s.is_active = true
          AND (p_exclude_id IS NULL OR s.id != p_exclude_id)
        LIMIT 1;
        RETURN;
    END IF;

    -- التحقق من رقم الهاتف (إذا كان موجود)
    IF p_phone IS NOT NULL AND p_phone != '' AND EXISTS (
        SELECT 1 FROM public.suppliers 
        WHERE user_id = p_user_id 
          AND phone = p_phone 
          AND is_active = true
          AND (p_exclude_id IS NULL OR id != p_exclude_id)
    ) THEN
        RETURN QUERY
        SELECT 
            'phone'::TEXT as duplicate_type,
            s.id as existing_supplier_id,
            s.name as existing_supplier_name
        FROM public.suppliers s
        WHERE s.user_id = p_user_id 
          AND s.phone = p_phone 
          AND s.is_active = true
          AND (p_exclude_id IS NULL OR s.id != p_exclude_id)
        LIMIT 1;
        RETURN;
    END IF;

    -- لا يوجد تكرار
    RETURN;
END;
$$;