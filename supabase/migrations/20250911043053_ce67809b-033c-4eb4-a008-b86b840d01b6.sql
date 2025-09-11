-- إصلاح مشكلة فشل إضافة عناصر الفاتورة - تحديث قيود طريقة الدفع

-- حذف القيد الحالي
ALTER TABLE public.cash_transactions DROP CONSTRAINT IF EXISTS cash_transactions_payment_method_check;

-- إضافة القيد الجديد مع دعم طريقة الدفع "adjustment"
ALTER TABLE public.cash_transactions 
ADD CONSTRAINT cash_transactions_payment_method_check 
CHECK (payment_method = ANY (ARRAY['cash'::text, 'bank'::text, 'credit'::text, 'check'::text, 'adjustment'::text]));

-- تحديث الوظيفة لاستخدام طريقة دفع صحيحة كبديل إضافي
CREATE OR REPLACE FUNCTION public.create_inventory_value_transaction(
    p_user_id UUID,
    p_product_id UUID,
    p_product_name TEXT,
    p_adjustment_amount NUMERIC,
    p_reason TEXT DEFAULT 'تعديل قيمة المخزون',
    p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    v_transaction_id UUID;
    v_description TEXT;
BEGIN
    -- بناء وصف المعاملة
    v_description := 'زيادة قيمة المخزون - ' || p_product_name;
    
    -- إضافة المعاملة إلى جدول cash_transactions
    INSERT INTO cash_transactions (
        user_id,
        transaction_type,
        amount,
        description,
        category,
        subcategory,
        payment_method,
        reference_id,
        reference_type,
        notes
    ) VALUES (
        p_user_id,
        'expense', -- نعتبرها مصروف لأنها زيادة في قيمة الأصول
        ABS(p_adjustment_amount), -- نأخذ القيمة المطلقة
        v_description,
        'inventory_increase', -- فئة جديدة لزيادة قيمة المخزون
        p_product_name, -- اسم المنتج كفئة فرعية
        'adjustment', -- استخدام طريقة الدفع الجديدة المسموحة
        p_product_id::TEXT, -- معرف المنتج
        'inventory_value_adjustment', -- نوع المرجع
        COALESCE(p_notes, p_reason)
    ) RETURNING id INTO v_transaction_id;
    
    RETURN v_transaction_id;
END;
$$;