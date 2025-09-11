-- إصلاح مشاكل الأمان للدوال الجديدة بإضافة search_path

-- دالة للحصول على الفواتير المحذوفة مع إعداد أمني محسن
CREATE OR REPLACE FUNCTION public.get_deleted_invoices(
    p_user_id UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    id UUID,
    invoice_number TEXT,
    total_amount DECIMAL,
    status TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    customers JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.invoice_number,
        i.total_amount,
        i.status,
        i.deleted_at,
        i.created_at,
        CASE 
            WHEN c.id IS NOT NULL THEN 
                jsonb_build_object(
                    'name', c.name,
                    'phone', c.phone
                )
            ELSE NULL
        END as customers
    FROM public.invoices i
    LEFT JOIN public.customers c ON i.customer_id = c.id
    WHERE i.user_id = p_user_id
    AND i.deleted_at IS NOT NULL
    AND i.deleted_at >= NOW() - (p_days_back || ' days')::INTERVAL
    ORDER BY i.deleted_at DESC;
END;
$$;

-- دالة لاستعادة فاتورة واحدة مع إعداد أمني محسن
CREATE OR REPLACE FUNCTION public.restore_single_invoice(
    p_user_id UUID,
    p_invoice_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- التحقق من وجود الفاتورة والصلاحية
    IF NOT EXISTS (
        SELECT 1 FROM public.invoices 
        WHERE id = p_invoice_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT FALSE, 'الفاتورة غير موجودة أو غير محذوفة';
        RETURN;
    END IF;

    -- استعادة الفاتورة
    UPDATE public.invoices 
    SET deleted_at = NULL
    WHERE id = p_invoice_id AND user_id = p_user_id;

    RETURN QUERY SELECT TRUE, 'تم استعادة الفاتورة بنجاح';
END;
$$;

-- دالة لاستعادة جميع الفواتير المحذوفة مع إعداد أمني محسن
CREATE OR REPLACE FUNCTION public.restore_deleted_invoices(
    p_user_id UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
    restored_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- استعادة جميع الفواتير المحذوفة خلال الفترة المحددة
    UPDATE public.invoices 
    SET deleted_at = NULL
    WHERE user_id = p_user_id
    AND deleted_at IS NOT NULL
    AND deleted_at >= NOW() - (p_days_back || ' days')::INTERVAL;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    RETURN QUERY SELECT v_count;
END;
$$;

-- دالة للحذف النهائي للفاتورة مع إعداد أمني محسن
CREATE OR REPLACE FUNCTION public.permanently_delete_invoice(
    p_user_id UUID,
    p_invoice_id UUID
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- التحقق من وجود الفاتورة والصلاحية
    IF NOT EXISTS (
        SELECT 1 FROM public.invoices 
        WHERE id = p_invoice_id 
        AND user_id = p_user_id 
        AND deleted_at IS NOT NULL
    ) THEN
        RETURN QUERY SELECT FALSE, 'الفاتورة غير موجودة أو غير محذوفة';
        RETURN;
    END IF;

    -- حذف عناصر الفاتورة أولاً
    DELETE FROM public.invoice_items 
    WHERE invoice_id = p_invoice_id;

    -- حذف الفاتورة نهائياً
    DELETE FROM public.invoices 
    WHERE id = p_invoice_id AND user_id = p_user_id;

    RETURN QUERY SELECT TRUE, 'تم حذف الفاتورة نهائياً';
END;
$$;