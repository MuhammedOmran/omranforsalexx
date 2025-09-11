-- إنشاء دالة عامة لإنشاء الإشعارات
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_category TEXT,
    p_priority TEXT,
    p_title TEXT,
    p_message TEXT,
    p_related_entity_id TEXT DEFAULT NULL,
    p_related_entity_type TEXT DEFAULT NULL,
    p_action_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        category,
        priority,
        title,
        message,
        related_entity_id,
        related_entity_type,
        action_url,
        action_required,
        is_read,
        auto_resolve
    ) VALUES (
        p_user_id,
        p_type,
        p_category,
        p_priority,
        p_title,
        p_message,
        p_related_entity_id,
        p_related_entity_type,
        p_action_url,
        CASE WHEN p_priority IN ('critical', 'high') THEN true ELSE false END,
        false,
        true
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$function$;

-- دالة Trigger لفواتير البيع
CREATE OR REPLACE FUNCTION public.handle_invoice_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_customer_name TEXT;
    v_notification_title TEXT;
    v_notification_message TEXT;
    v_notification_type TEXT;
    v_priority TEXT;
BEGIN
    -- الحصول على اسم العميل
    SELECT name INTO v_customer_name
    FROM customers
    WHERE id = COALESCE(NEW.customer_id, OLD.customer_id);
    
    IF v_customer_name IS NULL THEN
        v_customer_name := 'عميل غير محدد';
    END IF;
    
    -- تحديد نوع الإشعار بناءً على العملية
    IF TG_OP = 'INSERT' THEN
        v_notification_title := 'فاتورة بيع جديدة';
        v_notification_message := format('تم إنشاء فاتورة بيع جديدة رقم %s للعميل %s بقيمة %s ج.م', 
            NEW.invoice_number, v_customer_name, NEW.total_amount);
        v_notification_type := 'invoice_created';
        v_priority := 'medium';
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- إشعار عند تغيير حالة الفاتورة
        IF OLD.status != NEW.status THEN
            v_notification_title := 'تغيير حالة فاتورة';
            
            CASE NEW.status
                WHEN 'paid' THEN
                    v_notification_message := format('تم دفع الفاتورة رقم %s للعميل %s بقيمة %s ج.م', 
                        NEW.invoice_number, v_customer_name, NEW.total_amount);
                    v_priority := 'high';
                WHEN 'overdue' THEN
                    v_notification_message := format('الفاتورة رقم %s للعميل %s متأخرة السداد', 
                        NEW.invoice_number, v_customer_name);
                    v_priority := 'critical';
                WHEN 'cancelled' THEN
                    v_notification_message := format('تم إلغاء الفاتورة رقم %s للعميل %s', 
                        NEW.invoice_number, v_customer_name);
                    v_priority := 'low';
                ELSE
                    v_notification_message := format('تم تحديث حالة الفاتورة رقم %s إلى %s', 
                        NEW.invoice_number, NEW.status);
                    v_priority := 'medium';
            END CASE;
            
            v_notification_type := 'invoice_status_changed';
        ELSE
            -- إشعار عند تحديث مبلغ الفاتورة
            IF OLD.total_amount != NEW.total_amount THEN
                v_notification_title := 'تحديث فاتورة';
                v_notification_message := format('تم تحديث الفاتورة رقم %s - المبلغ الجديد: %s ج.م', 
                    NEW.invoice_number, NEW.total_amount);
                v_notification_type := 'invoice_updated';
                v_priority := 'medium';
            ELSE
                RETURN NEW; -- لا داعي لإشعار
            END IF;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_notification_title := 'حذف فاتورة';
        v_notification_message := format('تم حذف الفاتورة رقم %s', OLD.invoice_number);
        v_notification_type := 'invoice_deleted';
        v_priority := 'low';
    END IF;
    
    -- إنشاء الإشعار
    PERFORM create_notification(
        COALESCE(NEW.user_id, OLD.user_id),
        v_notification_type,
        'sales',
        v_priority,
        v_notification_title,
        v_notification_message,
        COALESCE(NEW.id, OLD.id)::TEXT,
        'invoice',
        format('/invoices/%s', COALESCE(NEW.id, OLD.id))
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- دالة Trigger لفواتير الشراء
CREATE OR REPLACE FUNCTION public.handle_purchase_invoice_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_supplier_name TEXT;
    v_notification_title TEXT;
    v_notification_message TEXT;
    v_notification_type TEXT;
    v_priority TEXT;
BEGIN
    -- الحصول على اسم المورد
    v_supplier_name := COALESCE(NEW.supplier_name, OLD.supplier_name, 'مورد غير محدد');
    
    -- تحديد نوع الإشعار بناءً على العملية
    IF TG_OP = 'INSERT' THEN
        v_notification_title := 'فاتورة شراء جديدة';
        v_notification_message := format('تم إنشاء فاتورة شراء جديدة رقم %s من المورد %s بقيمة %s ج.م', 
            NEW.invoice_number, v_supplier_name, NEW.total_amount);
        v_notification_type := 'purchase_invoice_created';
        v_priority := 'medium';
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- إشعار عند تغيير حالة الفاتورة
        IF OLD.status != NEW.status THEN
            v_notification_title := 'تغيير حالة فاتورة شراء';
            
            CASE NEW.status
                WHEN 'paid' THEN
                    v_notification_message := format('تم دفع فاتورة الشراء رقم %s للمورد %s بقيمة %s ج.م', 
                        NEW.invoice_number, v_supplier_name, NEW.paid_amount);
                    v_priority := 'high';
                WHEN 'partial' THEN
                    v_notification_message := format('دفع جزئي لفاتورة الشراء رقم %s - المدفوع: %s من %s ج.م', 
                        NEW.invoice_number, NEW.paid_amount, NEW.total_amount);
                    v_priority := 'medium';
                ELSE
                    v_notification_message := format('تم تحديث حالة فاتورة الشراء رقم %s إلى %s', 
                        NEW.invoice_number, NEW.status);
                    v_priority := 'medium';
            END CASE;
            
            v_notification_type := 'purchase_invoice_status_changed';
        ELSE
            -- إشعار عند استحقاق الفاتورة
            IF NEW.due_date IS NOT NULL AND NEW.due_date <= CURRENT_DATE AND NEW.status != 'paid' THEN
                v_notification_title := 'فاتورة شراء مستحقة';
                v_notification_message := format('فاتورة الشراء رقم %s للمورد %s مستحقة السداد', 
                    NEW.invoice_number, v_supplier_name);
                v_notification_type := 'purchase_invoice_due';
                v_priority := 'critical';
            ELSE
                RETURN NEW; -- لا داعي لإشعار
            END IF;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_notification_title := 'حذف فاتورة شراء';
        v_notification_message := format('تم حذف فاتورة الشراء رقم %s', OLD.invoice_number);
        v_notification_type := 'purchase_invoice_deleted';
        v_priority := 'low';
    END IF;
    
    -- إنشاء الإشعار
    PERFORM create_notification(
        COALESCE(NEW.user_id, OLD.user_id),
        v_notification_type,
        'purchases',
        v_priority,
        v_notification_title,
        v_notification_message,
        COALESCE(NEW.id, OLD.id)::TEXT,
        'purchase_invoice',
        format('/purchases/%s', COALESCE(NEW.id, OLD.id))
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- دالة Trigger للعملاء
CREATE OR REPLACE FUNCTION public.handle_customer_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_notification_title TEXT;
    v_notification_message TEXT;
    v_notification_type TEXT;
    v_priority TEXT;
BEGIN
    -- تحديد نوع الإشعار بناءً على العملية
    IF TG_OP = 'INSERT' THEN
        v_notification_title := 'عميل جديد';
        v_notification_message := format('تم إضافة عميل جديد: %s', NEW.name);
        v_notification_type := 'customer_created';
        v_priority := 'low';
        
        -- إشعار إضافي إذا كان للعميل معلومات اتصال
        IF NEW.phone IS NOT NULL OR NEW.email IS NOT NULL THEN
            v_notification_message := format('تم إضافة عميل جديد: %s - هاتف: %s - بريد: %s', 
                NEW.name, COALESCE(NEW.phone, 'غير محدد'), COALESCE(NEW.email, 'غير محدد'));
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- إشعار فقط عند تحديثات مهمة
        IF OLD.name != NEW.name OR OLD.phone != NEW.phone OR OLD.email != NEW.email THEN
            v_notification_title := 'تحديث بيانات عميل';
            v_notification_message := format('تم تحديث بيانات العميل: %s', NEW.name);
            v_notification_type := 'customer_updated';
            v_priority := 'low';
        ELSE
            RETURN NEW; -- لا داعي لإشعار
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_notification_title := 'حذف عميل';
        v_notification_message := format('تم حذف العميل: %s', OLD.name);
        v_notification_type := 'customer_deleted';
        v_priority := 'low';
    END IF;
    
    -- إنشاء الإشعار
    PERFORM create_notification(
        COALESCE(NEW.user_id, OLD.user_id),
        v_notification_type,
        'customers',
        v_priority,
        v_notification_title,
        v_notification_message,
        COALESCE(NEW.id, OLD.id)::TEXT,
        'customer',
        format('/customers/%s', COALESCE(NEW.id, OLD.id))
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- دالة Trigger للموردين
CREATE OR REPLACE FUNCTION public.handle_supplier_notifications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_notification_title TEXT;
    v_notification_message TEXT;
    v_notification_type TEXT;
    v_priority TEXT;
BEGIN
    -- تحديد نوع الإشعار بناءً على العملية
    IF TG_OP = 'INSERT' THEN
        v_notification_title := 'مورد جديد';
        v_notification_message := format('تم إضافة مورد جديد: %s', NEW.name);
        v_notification_type := 'supplier_created';
        v_priority := 'low';
        
        -- إشعار إضافي إذا كان للمورد معلومات اتصال
        IF NEW.phone IS NOT NULL OR NEW.email IS NOT NULL THEN
            v_notification_message := format('تم إضافة مورد جديد: %s - هاتف: %s - بريد: %s', 
                NEW.name, COALESCE(NEW.phone, 'غير محدد'), COALESCE(NEW.email, 'غير محدد'));
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- إشعار عند تحديث حالة المورد
        IF OLD.is_active != NEW.is_active THEN
            IF NEW.is_active = false THEN
                v_notification_title := 'تعطيل مورد';
                v_notification_message := format('تم تعطيل المورد: %s', NEW.name);
                v_priority := 'medium';
            ELSE
                v_notification_title := 'تفعيل مورد';
                v_notification_message := format('تم تفعيل المورد: %s', NEW.name);
                v_priority := 'low';
            END IF;
            v_notification_type := 'supplier_status_changed';
        ELSIF OLD.name != NEW.name OR OLD.phone != NEW.phone OR OLD.email != NEW.email THEN
            v_notification_title := 'تحديث بيانات مورد';
            v_notification_message := format('تم تحديث بيانات المورد: %s', NEW.name);
            v_notification_type := 'supplier_updated';
            v_priority := 'low';
        ELSE
            RETURN NEW; -- لا داعي لإشعار
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        v_notification_title := 'حذف مورد';
        v_notification_message := format('تم حذف المورد: %s', OLD.name);
        v_notification_type := 'supplier_deleted';
        v_priority := 'low';
    END IF;
    
    -- إنشاء الإشعار
    PERFORM create_notification(
        COALESCE(NEW.user_id, OLD.user_id),
        v_notification_type,
        'suppliers',
        v_priority,
        v_notification_title,
        v_notification_message,
        COALESCE(NEW.id, OLD.id)::TEXT,
        'supplier',
        format('/suppliers/%s', COALESCE(NEW.id, OLD.id))
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- إنشاء Triggers لفواتير البيع
DROP TRIGGER IF EXISTS invoice_notifications_trigger ON invoices;
CREATE TRIGGER invoice_notifications_trigger
    AFTER INSERT OR UPDATE OR DELETE ON invoices
    FOR EACH ROW EXECUTE FUNCTION handle_invoice_notifications();

-- إنشاء Triggers لفواتير الشراء
DROP TRIGGER IF EXISTS purchase_invoice_notifications_trigger ON purchase_invoices;
CREATE TRIGGER purchase_invoice_notifications_trigger
    AFTER INSERT OR UPDATE OR DELETE ON purchase_invoices
    FOR EACH ROW EXECUTE FUNCTION handle_purchase_invoice_notifications();

-- إنشاء Triggers للعملاء
DROP TRIGGER IF EXISTS customer_notifications_trigger ON customers;
CREATE TRIGGER customer_notifications_trigger
    AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION handle_customer_notifications();

-- إنشاء Triggers للموردين
DROP TRIGGER IF EXISTS supplier_notifications_trigger ON suppliers;
CREATE TRIGGER supplier_notifications_trigger
    AFTER INSERT OR UPDATE OR DELETE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION handle_supplier_notifications();

-- دالة لإنشاء إشعارات تنبيه المخزون عند انخفاض كمية المنتج
CREATE OR REPLACE FUNCTION public.check_low_stock_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    -- التحقق من انخفاض المخزون عن الحد الأدنى
    IF NEW.stock <= COALESCE(NEW.min_stock, 5) AND OLD.stock > COALESCE(NEW.min_stock, 5) THEN
        PERFORM create_notification(
            NEW.user_id,
            'low_stock_alert',
            'inventory',
            'high',
            'تحذير: نفاد المخزون',
            format('المنتج "%s" وصل إلى الحد الأدنى للمخزون (%s قطعة متبقية)', NEW.name, NEW.stock),
            NEW.id::TEXT,
            'product',
            format('/products/%s', NEW.id)
        );
    END IF;
    
    -- التحقق من نفاد المخزون تماماً
    IF NEW.stock = 0 AND OLD.stock > 0 THEN
        PERFORM create_notification(
            NEW.user_id,
            'out_of_stock_alert',
            'inventory',
            'critical',
            'تحذير حرج: نفاد المخزون',
            format('المنتج "%s" نفد من المخزون تماماً!', NEW.name),
            NEW.id::TEXT,
            'product',
            format('/products/%s', NEW.id)
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- إنشاء Trigger لتنبيهات المخزون
DROP TRIGGER IF EXISTS check_low_stock_trigger ON products;
CREATE TRIGGER check_low_stock_trigger
    AFTER UPDATE OF stock ON products
    FOR EACH ROW EXECUTE FUNCTION check_low_stock_notification();