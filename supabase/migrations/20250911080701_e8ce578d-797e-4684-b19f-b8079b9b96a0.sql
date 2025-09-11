-- إصلاح التحذيرات الأمنية بإضافة search_path للدوال الجديدة
CREATE OR REPLACE FUNCTION handle_inventory_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
    stock_change INTEGER;
    product_cost NUMERIC;
    total_cost NUMERIC;
    product_name TEXT;
    product_code TEXT;
BEGIN
    -- التحقق من أن المنتج له تكلفة
    SELECT cost, name, code INTO product_cost, product_name, product_code
    FROM products 
    WHERE id = COALESCE(NEW.id, OLD.id);
    
    IF product_cost IS NULL OR product_cost = 0 THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- حساب التغيير في المخزون
    IF TG_OP = 'INSERT' THEN
        -- منتج جديد - إضافة رصيد افتتاحي إذا كان المخزون أكبر من 0
        IF NEW.stock > 0 THEN
            total_cost := NEW.stock * product_cost;
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
                NEW.user_id,
                'expense',
                total_cost,
                'شراء مخزون - ' || product_name,
                'inventory',
                'stock_purchase',
                'cash',
                NEW.id::text,
                'product_inventory',
                'مصروف تلقائي لشراء مخزون منتج: ' || product_name || ' (كود: ' || COALESCE(product_code, 'غير محدد') || ') بكمية ' || NEW.stock || ' وتكلفة إجمالية ' || total_cost || ' ج.م'
            );
        END IF;
        
    ELSIF TG_OP = 'UPDATE' THEN
        -- تحديث المنتج - حساب الفرق في المخزون
        stock_change := NEW.stock - OLD.stock;
        
        IF stock_change != 0 THEN
            total_cost := ABS(stock_change) * product_cost;
            
            -- إذا زاد المخزون (شراء)
            IF stock_change > 0 THEN
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
                    NEW.user_id,
                    'expense',
                    total_cost,
                    'إضافة مخزون - ' || product_name,
                    'inventory',
                    'stock_purchase',
                    'cash',
                    NEW.id::text,
                    'product_inventory',
                    'مصروف تلقائي لإضافة مخزون منتج: ' || product_name || ' (كود: ' || COALESCE(product_code, 'غير محدد') || ') بكمية ' || stock_change || ' وتكلفة إجمالية ' || total_cost || ' ج.م'
                );
            END IF;
        END IF;
        
    ELSIF TG_OP = 'DELETE' THEN
        -- حذف المنتج - حذف المعاملات المرتبطة به
        DELETE FROM cash_transactions 
        WHERE reference_id = OLD.id::text 
        AND reference_type = 'product_inventory'
        AND user_id = OLD.user_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- إصلاح دالة المبيعات
CREATE OR REPLACE FUNCTION handle_sales_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
    invoice_total NUMERIC;
    invoice_number TEXT;
    customer_name TEXT;
    invoice_date DATE;
BEGIN
    -- فقط للفواتير المدفوعة
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        -- الحصول على معلومات الفاتورة
        SELECT 
            i.total_amount, 
            i.invoice_number, 
            i.invoice_date,
            COALESCE(c.name, 'عميل غير محدد') as customer_name
        INTO invoice_total, invoice_number, invoice_date, customer_name
        FROM invoices i
        LEFT JOIN customers c ON i.customer_id = c.id
        WHERE i.id = NEW.id;
        
        -- إضافة إيراد للصندوق
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
            NEW.user_id,
            'income',
            invoice_total,
            'بيع - فاتورة رقم ' || invoice_number,
            'sales',
            'invoice_payment',
            'cash',
            invoice_number,
            'sales_invoice',
            'إيراد من بيع فاتورة رقم ' || invoice_number || ' للعميل: ' || customer_name || ' بتاريخ ' || invoice_date || ' بمبلغ ' || invoice_total || ' ج.م'
        );
        
    -- إذا تم إلغاء الدفع
    ELSIF OLD.status = 'paid' AND NEW.status != 'paid' THEN
        -- حذف المعاملة المالية
        DELETE FROM cash_transactions 
        WHERE reference_id = NEW.invoice_number 
        AND reference_type = 'sales_invoice'
        AND user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- إصلاح دالة فواتير الشراء
CREATE OR REPLACE FUNCTION handle_purchase_cash_transaction()
RETURNS TRIGGER AS $$
DECLARE
    invoice_total NUMERIC;
    invoice_number TEXT;
    supplier_name TEXT;
    invoice_date DATE;
BEGIN
    -- فقط للفواتير المدفوعة
    IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
        -- الحصول على معلومات الفاتورة
        SELECT 
            pi.total_amount, 
            pi.invoice_number, 
            pi.invoice_date,
            COALESCE(pi.supplier_name, s.name, 'مورد غير محدد') as supplier_name
        INTO invoice_total, invoice_number, invoice_date, supplier_name
        FROM purchase_invoices pi
        LEFT JOIN suppliers s ON pi.supplier_id = s.id
        WHERE pi.id = NEW.id;
        
        -- إضافة مصروف للصندوق
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
            NEW.user_id,
            'expense',
            invoice_total,
            'شراء - فاتورة رقم ' || invoice_number,
            'purchases',
            'purchase_payment',
            'cash',
            NEW.id::text,
            'purchase_invoice',
            'مصروف شراء فاتورة رقم ' || invoice_number || ' من المورد: ' || supplier_name || ' بتاريخ ' || invoice_date || ' بمبلغ ' || invoice_total || ' ج.م'
        );
        
    -- إذا تم إلغاء الدفع
    ELSIF OLD.status = 'paid' AND NEW.status != 'paid' THEN
        -- حذف المعاملة المالية
        DELETE FROM cash_transactions 
        WHERE reference_id = OLD.id::text 
        AND reference_type = 'purchase_invoice'
        AND user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;