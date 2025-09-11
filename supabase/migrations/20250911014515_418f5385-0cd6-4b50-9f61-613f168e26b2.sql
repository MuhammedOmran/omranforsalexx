-- تحديث دالة إشعارات فواتير البيع لاستخدام المسار الصحيح
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
    
    -- إنشاء الإشعار مع المسار الصحيح
    PERFORM create_notification(
        COALESCE(NEW.user_id, OLD.user_id),
        v_notification_type,
        'sales',
        v_priority,
        v_notification_title,
        v_notification_message,
        COALESCE(NEW.id, OLD.id)::TEXT,
        'invoice',
        format('/sales/invoices/%s', COALESCE(NEW.id, OLD.id)) -- المسار الصحيح
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- تحديث دالة إشعارات فواتير الشراء لاستخدام المسار الصحيح
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
    
    -- إنشاء الإشعار مع المسار الصحيح
    PERFORM create_notification(
        COALESCE(NEW.user_id, OLD.user_id),
        v_notification_type,
        'purchases',
        v_priority,
        v_notification_title,
        v_notification_message,
        COALESCE(NEW.id, OLD.id)::TEXT,
        'purchase_invoice',
        format('/purchases/invoices/%s', COALESCE(NEW.id, OLD.id)) -- المسار الصحيح
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$function$;

-- تحديث دالة إشعارات المنتجات لاستخدام المسار الصحيح
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
            format('/inventory/products/%s', NEW.id) -- المسار الصحيح
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
            format('/inventory/products/%s', NEW.id) -- المسار الصحيح
        );
    END IF;
    
    RETURN NEW;
END;
$function$;

-- تحديث الإشعارات الموجودة حالياً لتصحيح الروابط
UPDATE notifications 
SET action_url = REPLACE(action_url, '/invoices/', '/sales/invoices/')
WHERE action_url LIKE '/invoices/%' 
  AND related_entity_type = 'invoice';

UPDATE notifications 
SET action_url = REPLACE(action_url, '/purchases/', '/purchases/invoices/')
WHERE action_url LIKE '/purchases/%' 
  AND related_entity_type = 'purchase_invoice'
  AND action_url NOT LIKE '/purchases/invoices/%';

UPDATE notifications 
SET action_url = REPLACE(action_url, '/products/', '/inventory/products/')
WHERE action_url LIKE '/products/%' 
  AND related_entity_type = 'product';