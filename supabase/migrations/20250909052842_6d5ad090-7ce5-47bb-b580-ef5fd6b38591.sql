-- تحديث دالة حساب الرصيد لتتجاهل المعاملات المحذوفة
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
  WHERE user_id = p_user_id 
    AND deleted_at IS NULL; -- تجاهل المعاملات المحذوفة
  
  RETURN v_balance;
END;
$function$