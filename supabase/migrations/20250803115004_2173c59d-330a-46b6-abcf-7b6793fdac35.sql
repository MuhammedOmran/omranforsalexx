-- إصلاح التحذيرات الأمنية - تثبيت search_path للدوال

-- إصلاح دالة get_user_role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = $1;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = '';

-- إصلاح دالة update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- إصلاح دالة update_inventory_stock
CREATE OR REPLACE FUNCTION public.update_inventory_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- التأكد من وجود سجل في جدول المخزون
  INSERT INTO public.inventory (product_id, current_stock, updated_by)
  VALUES (NEW.product_id, 0, NEW.created_by)
  ON CONFLICT (product_id) DO NOTHING;
  
  -- تحديث المخزون حسب نوع الحركة
  IF NEW.movement_type IN ('purchase', 'return', 'adjustment') THEN
    -- زيادة المخزون
    UPDATE public.inventory
    SET current_stock = current_stock + NEW.quantity,
        last_updated = NOW(),
        updated_by = NEW.created_by
    WHERE product_id = NEW.product_id;
  ELSIF NEW.movement_type IN ('sale') THEN
    -- تقليل المخزون
    UPDATE public.inventory
    SET current_stock = current_stock - NEW.quantity,
        last_updated = NOW(),
        updated_by = NEW.created_by
    WHERE product_id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- إصلاح دالة create_inventory_movements_from_invoice
CREATE OR REPLACE FUNCTION public.create_inventory_movements_from_invoice()
RETURNS TRIGGER AS $$
BEGIN
  -- إنشاء حركات المخزون عند تأكيد الفاتورة
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    INSERT INTO public.inventory_movements (
      product_id,
      movement_type,
      quantity,
      unit_price,
      total_amount,
      reference_id,
      reference_type,
      notes,
      created_by
    )
    SELECT 
      ii.product_id,
      CASE 
        WHEN NEW.invoice_type = 'sale' THEN 'sale'
        WHEN NEW.invoice_type = 'purchase' THEN 'purchase'
        WHEN NEW.invoice_type = 'return' THEN 'return'
      END,
      CASE 
        WHEN NEW.invoice_type = 'sale' THEN -ii.quantity
        ELSE ii.quantity
      END,
      ii.unit_price,
      ii.total_price,
      NEW.id,
      'invoice',
      'تم إنشاؤها تلقائياً من الفاتورة رقم: ' || NEW.invoice_number,
      NEW.created_by
    FROM public.invoice_items ii
    WHERE ii.invoice_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- إصلاح دالة handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- إصلاح دالة get_inventory_report
CREATE OR REPLACE FUNCTION public.get_inventory_report()
RETURNS TABLE (
  product_id UUID,
  product_name TEXT,
  sku TEXT,
  current_stock INTEGER,
  reserved_stock INTEGER,
  available_stock INTEGER,
  min_stock_level INTEGER,
  unit_price DECIMAL,
  total_value DECIMAL,
  stock_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.sku,
    COALESCE(i.current_stock, 0),
    COALESCE(i.reserved_stock, 0),
    COALESCE(i.available_stock, 0),
    p.min_stock_level,
    p.unit_price,
    p.unit_price * COALESCE(i.current_stock, 0),
    CASE 
      WHEN COALESCE(i.current_stock, 0) <= 0 THEN 'نفد'
      WHEN COALESCE(i.current_stock, 0) <= p.min_stock_level THEN 'منخفض'
      ELSE 'متوفر'
    END
  FROM public.products p
  LEFT JOIN public.inventory i ON p.id = i.product_id
  WHERE p.is_active = true
  ORDER BY p.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';