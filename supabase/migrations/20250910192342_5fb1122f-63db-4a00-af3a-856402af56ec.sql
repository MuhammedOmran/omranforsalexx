-- إصلاح دالة حذف فواتير الشراء نهائياً لتجنب إنشاء معاملات مالية بمبلغ صفر
CREATE OR REPLACE FUNCTION public.permanently_delete_purchase_invoice(p_user_id uuid, p_invoice_id uuid)
 RETURNS TABLE(success boolean, message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_invoice_record RECORD; 
    v_item_record RECORD;
BEGIN
    -- التحقق من أن المستخدم يطلب حذف فاتورته الخاصة
    IF p_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access';
    END IF;
    
    -- الحصول على بيانات الفاتورة
    SELECT * INTO v_invoice_record
    FROM purchase_invoices 
    WHERE id = p_invoice_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'فاتورة الشراء غير موجودة أو لم يتم حذفها بعد'::text;
        RETURN;
    END IF;

    -- إزالة الكمية من المخزون لكل عنصر في الفاتورة
    FOR v_item_record IN 
        SELECT pii.product_id, pii.quantity, pii.unit_cost
        FROM purchase_invoice_items pii
        WHERE pii.invoice_id = p_invoice_id AND pii.product_id IS NOT NULL
    LOOP
        UPDATE products 
        SET 
            stock = GREATEST(0, stock - v_item_record.quantity),
            updated_at = NOW()
        WHERE id = v_item_record.product_id 
        AND user_id = p_user_id;
    END LOOP;

    -- حذف المعاملة المالية المرتبطة بفاتورة الشراء من جدول النقدية
    DELETE FROM cash_transactions 
    WHERE user_id = p_user_id 
    AND reference_type = 'purchase_invoice'
    AND reference_id = p_invoice_id::text;

    -- حذف عناصر فاتورة الشراء أولاً
    DELETE FROM purchase_invoice_items 
    WHERE invoice_id = p_invoice_id;

    -- حذف فاتورة الشراء نهائياً
    DELETE FROM purchase_invoices 
    WHERE id = p_invoice_id 
    AND user_id = p_user_id 
    AND deleted_at IS NOT NULL;

    RETURN QUERY SELECT TRUE, 'تم حذف فاتورة الشراء نهائياً'::text;
END;
$function$;

-- تعديل دالة تحديث المخزون المالي لتجنب إنشاء معاملات بمبلغ صفر
CREATE OR REPLACE FUNCTION public.handle_product_stock_update_financial()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    stock_difference INTEGER;
    cost_difference NUMERIC;
    expense_description TEXT;
    existing_transaction_id UUID;
    new_total_cost NUMERIC;
BEGIN
    -- حساب الفرق في الكمية
    stock_difference := NEW.stock - OLD.stock;
    
    -- إذا تغيرت الكمية
    IF stock_difference != 0 THEN
        -- حساب التكلفة الإجمالية الجديدة
        new_total_cost := NEW.stock * NEW.cost;
        
        -- البحث عن المعاملة المالية الأصلية للمنتج
        SELECT id INTO existing_transaction_id
        FROM public.cash_transactions
        WHERE user_id = NEW.user_id
          AND reference_id = NEW.id::text
          AND reference_type = 'product_inventory'
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1;
        
        -- إذا وجدت معاملة أصلية، قم بتحديثها (فقط إذا كان المبلغ الجديد أكبر من صفر)
        IF existing_transaction_id IS NOT NULL THEN
            IF new_total_cost > 0 THEN
                UPDATE public.cash_transactions
                SET 
                    amount = new_total_cost,
                    description = 'تحديث مخزون - ' || NEW.name || ' (كمية: ' || NEW.stock || ')',
                    notes = 'تحديث تلقائي لمخزون منتج: ' || NEW.name || ' - الكمية الجديدة: ' || NEW.stock || ' - التكلفة الإجمالية: ' || new_total_cost || ' ج.م',
                    updated_at = now()
                WHERE id = existing_transaction_id;
            ELSE
                -- إذا أصبحت التكلفة صفر، احذف المعاملة
                DELETE FROM public.cash_transactions WHERE id = existing_transaction_id;
            END IF;
        
        -- إذا لم توجد معاملة أصلية وتمت زيادة الكمية وكانت التكلفة أكبر من صفر
        ELSIF stock_difference > 0 AND new_total_cost > 0 THEN
            cost_difference := stock_difference * NEW.cost;
            expense_description := 'زيادة مخزون - ' || NEW.name || ' (كمية إضافية: ' || stock_difference || ')';
            
            INSERT INTO public.cash_transactions (
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
                NEW.user_id,
                'expense',
                cost_difference,
                expense_description,
                'inventory',
                'stock_increase',
                'cash',
                NEW.id::text,
                'product_stock_update',
                'مصروف تلقائي لزيادة مخزون منتج: ' || NEW.name || ' بتكلفة إضافية: ' || cost_difference || ' ج.م'
            );
        
        -- إذا تم تقليل الكمية بشكل كبير، أضف معاملة دخل (فقط إذا كان المبلغ أكبر من صفر)
        ELSIF stock_difference < 0 AND ABS(stock_difference) * NEW.cost > 0 THEN
            cost_difference := ABS(stock_difference) * NEW.cost;
            expense_description := 'تقليل مخزون - ' || NEW.name || ' (كمية مخفضة: ' || ABS(stock_difference) || ')';
            
            INSERT INTO public.cash_transactions (
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
                NEW.user_id,
                'income',
                cost_difference,
                expense_description,
                'inventory',
                'stock_decrease',
                'cash',
                NEW.id::text,
                'product_stock_update',
                'دخل تلقائي من تقليل مخزون منتج: ' || NEW.name || ' - قيمة التخفيض: ' || cost_difference || ' ج.م'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;