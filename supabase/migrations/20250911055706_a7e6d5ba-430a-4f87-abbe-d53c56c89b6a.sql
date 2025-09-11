-- ربط المخزون بالصندوق - تسجيل قيمة المخزون كرصيد سالب
-- إنشاء نظام متكامل لربط المخزون مع التدفق النقدي

-- 1. تحديث function معالجة المخزون لربطه بالصندوق
CREATE OR REPLACE FUNCTION public.handle_inventory_cash_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    existing_transaction_id UUID;
    total_inventory_value NUMERIC;
    transaction_description TEXT;
BEGIN
    -- حساب القيمة الإجمالية للمخزون (الكمية × التكلفة)
    total_inventory_value := NEW.stock * COALESCE(NEW.cost, NEW.price, 0);
    
    -- إنشاء وصف المعاملة
    transaction_description := 'قيمة مخزون - ' || NEW.name || ' (كمية: ' || NEW.stock || ' × ' || COALESCE(NEW.cost, NEW.price, 0) || ')';
    
    -- في حالة الإدراج الجديد للمنتج
    IF TG_OP = 'INSERT' AND NEW.stock > 0 THEN
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
            'expense',  -- مصروف (رصيد سالب)
            total_inventory_value,
            transaction_description,
            'inventory_purchase',
            NEW.name,
            'inventory_adjustment',
            NEW.id::text,
            'inventory_value',
            'تم إضافة مخزون جديد - قيمة إجمالية: ' || total_inventory_value || ' ج.م'
        );
        
    -- في حالة التحديث
    ELSIF TG_OP = 'UPDATE' AND (OLD.stock != NEW.stock OR OLD.cost != NEW.cost OR OLD.price != NEW.price) THEN
        
        -- البحث عن المعاملة الموجودة
        SELECT id INTO existing_transaction_id
        FROM public.cash_transactions
        WHERE user_id = NEW.user_id
          AND reference_id = NEW.id::text
          AND reference_type = 'inventory_value'
          AND deleted_at IS NULL
        ORDER BY created_at DESC
        LIMIT 1;
        
        IF existing_transaction_id IS NOT NULL THEN
            -- تحديث المعاملة الموجودة
            UPDATE public.cash_transactions
            SET 
                amount = total_inventory_value,
                description = transaction_description,
                notes = 'تم تحديث قيمة المخزون - القيمة الجديدة: ' || total_inventory_value || ' ج.م (القديمة: ' || (OLD.stock * COALESCE(OLD.cost, OLD.price, 0)) || ' ج.م)',
                updated_at = now()
            WHERE id = existing_transaction_id;
        ELSE
            -- إنشاء معاملة جديدة إذا لم توجد
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
                total_inventory_value,
                transaction_description,
                'inventory_purchase',
                NEW.name,
                'inventory_adjustment',
                NEW.id::text,
                'inventory_value',
                'تم تحديث قيمة المخزون - القيمة الجديدة: ' || total_inventory_value || ' ج.م'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- 2. ربط الـ trigger بجدول المنتجات
DROP TRIGGER IF EXISTS trigger_inventory_cash_flow ON products;
CREATE TRIGGER trigger_inventory_cash_flow
    AFTER INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_inventory_cash_flow();

-- 3. إنشاء function لمعالجة حركات المخزون وربطها بالصندوق
CREATE OR REPLACE FUNCTION public.handle_stock_movement_cash_flow()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
    product_record RECORD;
    movement_value NUMERIC;
    transaction_description TEXT;
BEGIN
    -- الحصول على معلومات المنتج
    SELECT * INTO product_record 
    FROM public.products 
    WHERE id = NEW.product_id;
    
    IF product_record IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- حساب قيمة الحركة
    movement_value := NEW.quantity * COALESCE(NEW.unit_price, product_record.cost, product_record.price, 0);
    
    -- تحديد نوع المعاملة ووصفها حسب نوع الحركة
    CASE NEW.movement_type
        WHEN 'in' THEN
            transaction_description := 'إضافة مخزون - ' || product_record.name || ' (كمية: ' || NEW.quantity || ')';
            
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
                'expense',  -- مصروف عند الإضافة
                movement_value,
                transaction_description,
                'inventory_movement',
                product_record.name,
                'stock_adjustment',
                NEW.id::text,
                'stock_movement_in',
                'حركة إضافة مخزون - ' || NEW.notes
            );
            
        WHEN 'out' THEN
            transaction_description := 'خروج مخزون - ' || product_record.name || ' (كمية: ' || NEW.quantity || ')';
            
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
                'income',  -- دخل عند البيع/الخروج
                movement_value,
                transaction_description,
                'inventory_movement',
                product_record.name,
                'stock_adjustment',
                NEW.id::text,
                'stock_movement_out',
                'حركة خروج مخزون - ' || NEW.notes
            );
            
        WHEN 'adjustment' THEN
            -- في حالة التسوية، نتعامل مع الفرق
            IF NEW.quantity > 0 THEN
                -- زيادة = مصروف
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
                    movement_value,
                    'تسوية مخزون (زيادة) - ' || product_record.name,
                    'inventory_adjustment',
                    product_record.name,
                    'adjustment',
                    NEW.id::text,
                    'stock_adjustment',
                    'تسوية مخزون - ' || NEW.notes
                );
            ELSE
                -- نقص = دخل (استرداد القيمة)
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
                    ABS(movement_value),
                    'تسوية مخزون (نقص) - ' || product_record.name,
                    'inventory_adjustment',
                    product_record.name,
                    'adjustment',
                    NEW.id::text,
                    'stock_adjustment',
                    'تسوية مخزون - ' || NEW.notes
                );
            END IF;
    END CASE;

    RETURN NEW;
END;
$function$;

-- 4. ربط الـ trigger بجدول حركات المخزون
DROP TRIGGER IF EXISTS trigger_stock_movement_cash_flow ON stock_movements;
CREATE TRIGGER trigger_stock_movement_cash_flow
    AFTER INSERT ON stock_movements
    FOR EACH ROW
    EXECUTE FUNCTION handle_stock_movement_cash_flow();

-- 5. مزامنة المخزون الموجود مع الصندوق
-- إنشاء معاملات للمنتجات الموجودة التي لها قيمة مخزون
DO $$
DECLARE
    product_record RECORD;
    total_value NUMERIC;
BEGIN
    FOR product_record IN 
        SELECT p.* 
        FROM public.products p
        WHERE p.stock > 0 
          AND p.is_active = true
          AND NOT EXISTS (
              SELECT 1 FROM public.cash_transactions ct
              WHERE ct.reference_id = p.id::text 
                AND ct.reference_type = 'inventory_value'
                AND ct.deleted_at IS NULL
          )
    LOOP
        total_value := product_record.stock * COALESCE(product_record.cost, product_record.price, 0);
        
        IF total_value > 0 THEN
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
                product_record.user_id,
                'expense',
                total_value,
                'قيمة مخزون موجود - ' || product_record.name || ' (كمية: ' || product_record.stock || ')',
                'inventory_purchase',
                product_record.name,
                'inventory_adjustment',
                product_record.id::text,
                'inventory_value',
                'مزامنة قيمة المخزون الموجود - قيمة إجمالية: ' || total_value || ' ج.م'
            );
        END IF;
    END LOOP;
END $$;

-- 6. إنشاء view لعرض ملخص قيم المخزون في الصندوق
CREATE OR REPLACE VIEW public.inventory_cash_summary AS
SELECT 
    p.user_id,
    p.id as product_id,
    p.name as product_name,
    p.stock,
    p.cost,
    p.price,
    (p.stock * COALESCE(p.cost, p.price, 0)) as total_inventory_value,
    ct.amount as cash_transaction_amount,
    ct.created_at as last_cash_update
FROM public.products p
LEFT JOIN public.cash_transactions ct ON (
    ct.reference_id = p.id::text 
    AND ct.reference_type = 'inventory_value'
    AND ct.deleted_at IS NULL
)
WHERE p.is_active = true
ORDER BY p.name;