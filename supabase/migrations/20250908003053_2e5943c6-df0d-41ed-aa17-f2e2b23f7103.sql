-- إنشاء دالة لجلب الشيكات المحذوفة
CREATE OR REPLACE FUNCTION public.get_deleted_checks(p_user_id uuid, p_days_back integer DEFAULT 30)
RETURNS TABLE(
    id uuid,
    check_number text,
    amount numeric,
    customer_name text,
    bank_name text,
    due_date date,
    date_received date,
    status text,
    description text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- التحقق من أن المستخدم يطلب شيكاته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    RETURN QUERY 
    SELECT 
        c.id,
        c.check_number,
        c.amount,
        c.customer_name,
        c.bank_name,
        c.due_date,
        c.date_received,
        c.status,
        c.description,
        c.deleted_at,
        c.created_at
    FROM checks c
    WHERE c.user_id = p_user_id 
    AND c.deleted_at IS NOT NULL
    AND c.deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
    ORDER BY c.deleted_at DESC;
END;
$function$