-- إصلاح مشاكل search_path في الوظائف الموجودة
CREATE OR REPLACE FUNCTION public.calculate_cash_balance(p_user_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_balance NUMERIC;
BEGIN
  SELECT 
    COALESCE(SUM(CASE WHEN transaction_type = 'income' THEN amount ELSE -amount END), 0)
  INTO v_balance
  FROM public.cash_transactions
  WHERE user_id = p_user_id;
  
  RETURN v_balance;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_purchase_statistics(p_user_id uuid, p_period_days integer DEFAULT 30)
 RETURNS TABLE(total_purchases numeric, pending_payments numeric, overdue_payments numeric, active_suppliers integer, top_supplier_name text, top_supplier_amount numeric, period_days integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;