-- إضافة حقل deleted_at لجدول cash_transactions لتطبيق soft delete
ALTER TABLE public.cash_transactions 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- إضافة فهرس للبحث السريع في المعاملات المحذوفة
CREATE INDEX idx_cash_transactions_deleted_at ON public.cash_transactions (deleted_at);

-- إضافة فهرس مركب للمعاملات النشطة
CREATE INDEX idx_cash_transactions_active ON public.cash_transactions (user_id, created_at) 
WHERE deleted_at IS NULL;

-- حذف جميع سياسات RLS الموجودة للجدول
DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية معاملاتهم فقط" ON public.cash_transactions;
DROP POLICY IF EXISTS "المستخدمون يمكنهم رؤية معاملاتهم " ON public.cash_transactions;
DROP POLICY IF EXISTS "المستخدمون يمكنهم إضافة معاملات جديدة" ON public.cash_transactions;
DROP POLICY IF EXISTS "المستخدمون يمكنهم تحديث معاملاتهم" ON public.cash_transactions;
DROP POLICY IF EXISTS "المستخدمون يمكنهم حذف معاملاتهم" ON public.cash_transactions;

-- إنشاء سياسات RLS جديدة
CREATE POLICY "cash_transactions_select_active" 
ON public.cash_transactions FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "cash_transactions_select_deleted" 
ON public.cash_transactions FOR SELECT 
USING (auth.uid() = user_id AND deleted_at IS NOT NULL);

CREATE POLICY "cash_transactions_insert" 
ON public.cash_transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "cash_transactions_update" 
ON public.cash_transactions FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "cash_transactions_delete" 
ON public.cash_transactions FOR DELETE 
USING (auth.uid() = user_id);

-- دالة لاستعادة المعاملات المحذوفة
CREATE OR REPLACE FUNCTION restore_deleted_transactions(
    p_user_id uuid,
    p_days_back integer DEFAULT 30
)
RETURNS TABLE (
    restored_count integer,
    transactions jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count integer;
    v_transactions jsonb;
BEGIN
    -- التحقق من أن المستخدم يطلب استعادة معاملاته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- جلب المعاملات المحذوفة خلال فترة محددة
    WITH deleted_transactions AS (
        SELECT *
        FROM cash_transactions
        WHERE user_id = p_user_id 
        AND deleted_at IS NOT NULL
        AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
        ORDER BY deleted_at DESC
    )
    SELECT COUNT(*), json_agg(to_json(deleted_transactions.*))
    INTO v_count, v_transactions
    FROM deleted_transactions;
    
    -- استعادة المعاملات (إزالة تاريخ الحذف)
    UPDATE cash_transactions 
    SET deleted_at = NULL, updated_at = NOW()
    WHERE user_id = p_user_id 
    AND deleted_at IS NOT NULL
    AND deleted_at >= NOW() - INTERVAL '1 day' * p_days_back;
    
    RETURN QUERY SELECT v_count, COALESCE(v_transactions, '[]'::jsonb);
END;
$$;

-- دالة للحصول على قائمة المعاملات المحذوفة دون استعادتها
CREATE OR REPLACE FUNCTION get_deleted_transactions(
    p_user_id uuid,
    p_days_back integer DEFAULT 30
)
RETURNS TABLE (
    id uuid,
    transaction_type text,
    amount numeric,
    description text,
    category text,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- التحقق من أن المستخدم يطلب معاملاته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    RETURN QUERY 
    SELECT 
        ct.id,
        ct.transaction_type,
        ct.amount,
        ct.description,
        ct.category,
        ct.deleted_at,
        ct.created_at
    FROM cash_transactions ct
    WHERE ct.user_id = p_user_id 
    AND ct.deleted_at IS NOT NULL
    AND ct.deleted_at >= NOW() - INTERVAL '1 day' * p_days_back
    ORDER BY ct.deleted_at DESC;
END;
$$;