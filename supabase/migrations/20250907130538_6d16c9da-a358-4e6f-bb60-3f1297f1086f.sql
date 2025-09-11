-- إصلاح ربط فواتير الشراء بالموردين
-- تحديث الفواتير الموجودة لربطها بالـ supplier_id الصحيح

UPDATE purchase_invoices 
SET supplier_id = suppliers.id
FROM suppliers 
WHERE purchase_invoices.supplier_name = suppliers.name 
  AND purchase_invoices.supplier_id IS NULL
  AND suppliers.is_active = true;

-- تحسين دالة get_supplier_statistics لتعمل مع supplier_name أيضاً
CREATE OR REPLACE FUNCTION public.get_supplier_statistics(p_supplier_id uuid, p_user_id uuid)
 RETURNS TABLE(total_invoices integer, total_amount numeric, paid_amount numeric, pending_amount numeric, last_purchase_date date, average_order_value numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::integer as total_invoices,
        COALESCE(SUM(pi.total_amount), 0) as total_amount,
        COALESCE(SUM(pi.paid_amount), 0) as paid_amount,
        COALESCE(SUM(pi.total_amount - pi.paid_amount), 0) as pending_amount,
        MAX(pi.invoice_date) as last_purchase_date,
        CASE 
            WHEN COUNT(*) > 0 THEN COALESCE(SUM(pi.total_amount) / COUNT(*), 0)
            ELSE 0
        END as average_order_value
    FROM public.purchase_invoices pi
    LEFT JOIN public.suppliers s ON s.id = p_supplier_id
    WHERE pi.user_id = p_user_id
      AND (pi.supplier_id = p_supplier_id OR (pi.supplier_name = s.name AND pi.supplier_id IS NULL));
END;
$function$

-- تحسين دالة get_top_suppliers لتعمل مع supplier_name أيضاً  
CREATE OR REPLACE FUNCTION public.get_top_suppliers(p_user_id uuid, p_limit integer DEFAULT 10)
 RETURNS TABLE(supplier_id uuid, supplier_name text, total_purchases numeric, invoice_count integer, last_purchase date)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT 
        s.id as supplier_id,
        s.name as supplier_name,
        COALESCE(SUM(pi.total_amount), 0) as total_purchases,
        COUNT(pi.id)::integer as invoice_count,
        MAX(pi.invoice_date) as last_purchase
    FROM public.suppliers s
    LEFT JOIN public.purchase_invoices pi ON (s.id = pi.supplier_id OR (s.name = pi.supplier_name AND pi.supplier_id IS NULL))
    WHERE s.user_id = p_user_id 
      AND s.is_active = true
      AND (pi.user_id = p_user_id OR pi.user_id IS NULL)
    GROUP BY s.id, s.name
    ORDER BY total_purchases DESC
    LIMIT p_limit;
END;
$function$

-- إنشاء trigger لضمان ربط supplier_id تلقائياً عند إنشاء فاتورة جديدة
CREATE OR REPLACE FUNCTION public.auto_link_supplier_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- إذا كان supplier_id فارغ ولكن supplier_name موجود
    IF NEW.supplier_id IS NULL AND NEW.supplier_name IS NOT NULL THEN
        -- البحث عن المورد بالاسم
        SELECT id INTO NEW.supplier_id
        FROM public.suppliers
        WHERE name = NEW.supplier_name 
          AND user_id = NEW.user_id
          AND is_active = true
        LIMIT 1;
    END IF;
    
    -- إذا كان supplier_id موجود ولكن supplier_name فارغ
    IF NEW.supplier_id IS NOT NULL AND (NEW.supplier_name IS NULL OR NEW.supplier_name = '') THEN
        -- جلب اسم المورد
        SELECT name INTO NEW.supplier_name
        FROM public.suppliers
        WHERE id = NEW.supplier_id
          AND user_id = NEW.user_id
          AND is_active = true
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$function$

-- إضافة الـ trigger على جدول purchase_invoices
CREATE TRIGGER trigger_auto_link_supplier_id
    BEFORE INSERT OR UPDATE ON public.purchase_invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_link_supplier_id();