-- إنشاء نظام إدارة المخزون المحمي

-- إنشاء جدول الملفات الشخصية للمستخدمين
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'cashier', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل Row Level Security على الملفات الشخصية
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- إنشاء جدول المنتجات
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT UNIQUE,
  category TEXT,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل Row Level Security على المنتجات
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- إنشاء جدول المخزون
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL DEFAULT 0,
  reserved_stock INTEGER NOT NULL DEFAULT 0,
  available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(product_id)
);

-- تفعيل Row Level Security على المخزون
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- إنشاء جدول حركات المخزون
CREATE TABLE public.inventory_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'return', 'transfer')),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  reference_id UUID, -- مرجع للفاتورة أو العملية
  reference_type TEXT, -- نوع المرجع
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل Row Level Security على حركات المخزون
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- إنشاء جدول الفواتير
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type TEXT NOT NULL CHECK (invoice_type IN ('sale', 'purchase', 'return')),
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'paid', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل Row Level Security على الفواتير
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- إنشاء جدول عناصر الفواتير
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- تفعيل Row Level Security على عناصر الفواتير
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_inventory_product_id ON public.inventory(product_id);
CREATE INDEX idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_created_at ON public.inventory_movements(created_at DESC);
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_created_at ON public.invoices(created_at DESC);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON public.invoice_items(product_id);

-- إنشاء دالة الحماية للأدوار
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- إنشاء trigger لتحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- تطبيق trigger على الجداول
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- دالة تحديث المخزون
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- trigger لتحديث المخزون عند إضافة حركة جديدة
CREATE TRIGGER trigger_update_inventory_stock
  AFTER INSERT ON public.inventory_movements
  FOR EACH ROW EXECUTE FUNCTION public.update_inventory_stock();

-- دالة إنشاء حركات المخزون من الفواتير
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- trigger لإنشاء حركات المخزون من الفواتير
CREATE TRIGGER trigger_create_inventory_movements_from_invoice
  AFTER UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.create_inventory_movements_from_invoice();

-- دالة إنشاء الملف الشخصي تلقائياً
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- trigger لإنشاء الملف الشخصي
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- سياسات الحماية (RLS Policies)

-- سياسات الملفات الشخصية
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_user_role(auth.uid()) = 'admin');

-- سياسات المنتجات
CREATE POLICY "Authenticated users can view products"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only managers and admins can create products"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Only managers and admins can update products"
  ON public.products FOR UPDATE
  TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Only admins can delete products"
  ON public.products FOR DELETE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- سياسات المخزون
CREATE POLICY "Authenticated users can view inventory"
  ON public.inventory FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only managers and admins can update inventory"
  ON public.inventory FOR ALL
  TO authenticated
  USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- سياسات حركات المخزون
CREATE POLICY "Authenticated users can view inventory movements"
  ON public.inventory_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create inventory movements"
  ON public.inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- سياسات الفواتير
CREATE POLICY "Authenticated users can view invoices"
  ON public.invoices FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create invoices"
  ON public.invoices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own invoices"
  ON public.invoices FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR public.get_user_role(auth.uid()) IN ('admin', 'manager'));

CREATE POLICY "Only admins can delete invoices"
  ON public.invoices FOR DELETE
  TO authenticated
  USING (public.get_user_role(auth.uid()) = 'admin');

-- سياسات عناصر الفواتير
CREATE POLICY "Authenticated users can view invoice items"
  ON public.invoice_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage invoice items"
  ON public.invoice_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.invoices 
      WHERE id = invoice_id 
      AND (created_by = auth.uid() OR public.get_user_role(auth.uid()) IN ('admin', 'manager'))
    )
  );

-- إنشاء دالة للحصول على تقرير المخزون
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
$$ LANGUAGE plpgsql SECURITY DEFINER;