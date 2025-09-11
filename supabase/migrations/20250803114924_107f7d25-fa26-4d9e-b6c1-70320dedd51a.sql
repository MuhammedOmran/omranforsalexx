-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'manager', 'employee');

-- Create enum for product status
CREATE TYPE public.product_status AS ENUM ('active', 'inactive', 'discontinued');

-- Create enum for movement types
CREATE TYPE public.movement_type AS ENUM ('in', 'out', 'adjustment', 'transfer');

-- Create enum for movement reasons
CREATE TYPE public.movement_reason AS ENUM ('purchase', 'sale', 'return', 'damage', 'theft', 'expired', 'adjustment', 'transfer');

-- Create user profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    phone TEXT,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    barcode TEXT,
    category TEXT NOT NULL,
    description TEXT,
    cost_price DECIMAL(10,2) NOT NULL CHECK (cost_price >= 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    min_stock INTEGER NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
    max_stock INTEGER CHECK (max_stock >= min_stock),
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    status product_status NOT NULL DEFAULT 'active',
    supplier_info JSONB,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create inventory movements table
CREATE TABLE public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    movement_type movement_type NOT NULL,
    reason movement_reason NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10,2) CHECK (unit_cost >= 0),
    total_value DECIMAL(10,2) CHECK (total_value >= 0),
    reference_type TEXT, -- 'invoice', 'purchase_order', 'manual'
    reference_id UUID,
    notes TEXT,
    performed_by UUID REFERENCES public.profiles(id),
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on inventory movements
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Create invoices table
CREATE TABLE public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'cheque')),
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id),
    confirmed_by UUID REFERENCES public.profiles(id),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create invoice items table
CREATE TABLE public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    product_name TEXT NOT NULL,
    product_code TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on invoice items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_products_code ON public.products(code);
CREATE INDEX idx_products_barcode ON public.products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_inventory_movements_product_id ON public.inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_performed_at ON public.inventory_movements(performed_at);
CREATE INDEX idx_inventory_movements_reference ON public.inventory_movements(reference_type, reference_id);
CREATE INDEX idx_invoices_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_created_at ON public.invoices(created_at);
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product_id ON public.invoice_items(product_id);

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT role FROM public.profiles WHERE id = user_id;
$$;

-- Create function to check if user has required role
CREATE OR REPLACE FUNCTION public.has_role(required_role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT CASE 
        WHEN auth.uid() IS NULL THEN FALSE
        WHEN get_user_role(auth.uid()) = 'admin' THEN TRUE
        WHEN required_role = 'employee' AND get_user_role(auth.uid()) IN ('employee', 'manager', 'admin') THEN TRUE
        WHEN required_role = 'manager' AND get_user_role(auth.uid()) IN ('manager', 'admin') THEN TRUE
        WHEN required_role = 'admin' AND get_user_role(auth.uid()) = 'admin' THEN TRUE
        ELSE FALSE
    END;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (has_role('admin'));

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL TO authenticated USING (has_role('admin'));

-- RLS Policies for products
CREATE POLICY "Authenticated users can view active products" ON public.products
    FOR SELECT TO authenticated USING (status = 'active' OR has_role('manager'));

CREATE POLICY "Managers can manage products" ON public.products
    FOR ALL TO authenticated USING (has_role('manager'));

-- RLS Policies for inventory movements
CREATE POLICY "Users can view inventory movements" ON public.inventory_movements
    FOR SELECT TO authenticated USING (has_role('employee'));

CREATE POLICY "Employees can create movements" ON public.inventory_movements
    FOR INSERT TO authenticated WITH CHECK (has_role('employee') AND performed_by = auth.uid());

CREATE POLICY "Managers can manage movements" ON public.inventory_movements
    FOR ALL TO authenticated USING (has_role('manager'));

-- RLS Policies for invoices
CREATE POLICY "Users can view invoices" ON public.invoices
    FOR SELECT TO authenticated USING (has_role('employee'));

CREATE POLICY "Employees can create invoices" ON public.invoices
    FOR INSERT TO authenticated WITH CHECK (has_role('employee') AND created_by = auth.uid());

CREATE POLICY "Users can update draft invoices they created" ON public.invoices
    FOR UPDATE TO authenticated USING (
        has_role('employee') AND 
        created_by = auth.uid() AND 
        status = 'draft'
    );

CREATE POLICY "Managers can manage all invoices" ON public.invoices
    FOR ALL TO authenticated USING (has_role('manager'));

-- RLS Policies for invoice items
CREATE POLICY "Users can view invoice items" ON public.invoice_items
    FOR SELECT TO authenticated USING (has_role('employee'));

CREATE POLICY "Users can manage items in draft invoices" ON public.invoice_items
    FOR ALL TO authenticated USING (
        has_role('employee') AND 
        EXISTS (
            SELECT 1 FROM public.invoices 
            WHERE id = invoice_id 
            AND created_by = auth.uid() 
            AND status = 'draft'
        )
    );

CREATE POLICY "Managers can manage all invoice items" ON public.invoice_items
    FOR ALL TO authenticated USING (has_role('manager'));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to update product stock based on inventory movements
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.movement_type = 'in' THEN
        UPDATE public.products 
        SET current_stock = current_stock + NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    ELSIF NEW.movement_type = 'out' THEN
        UPDATE public.products 
        SET current_stock = GREATEST(0, current_stock - NEW.quantity),
            updated_at = NOW()
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to update stock when movement is created
CREATE TRIGGER update_stock_on_movement
    AFTER INSERT ON public.inventory_movements
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Function to create inventory movements when invoice is confirmed
CREATE OR REPLACE FUNCTION public.create_movements_from_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item RECORD;
BEGIN
    -- Only create movements when status changes to 'confirmed'
    IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
        -- Create inventory movements for each invoice item
        FOR item IN 
            SELECT ii.*, p.cost_price 
            FROM public.invoice_items ii
            JOIN public.products p ON ii.product_id = p.id
            WHERE ii.invoice_id = NEW.id
        LOOP
            INSERT INTO public.inventory_movements (
                product_id,
                movement_type,
                reason,
                quantity,
                unit_cost,
                total_value,
                reference_type,
                reference_id,
                notes,
                performed_by,
                performed_at
            ) VALUES (
                item.product_id,
                'out',
                'sale',
                item.quantity,
                item.cost_price,
                item.quantity * item.cost_price,
                'invoice',
                NEW.id,
                'حركة تلقائية من فاتورة رقم ' || NEW.invoice_number,
                NEW.confirmed_by,
                NEW.confirmed_at
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to create movements when invoice is confirmed
CREATE TRIGGER create_movements_on_invoice_confirm
    AFTER UPDATE ON public.invoices
    FOR EACH ROW EXECUTE FUNCTION create_movements_from_invoice();

-- Function to automatically create user profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, role, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        'employee',
        NEW.email
    );
    RETURN NEW;
END;
$$;

-- Create trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to get inventory report
CREATE OR REPLACE FUNCTION public.get_inventory_report()
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    product_code TEXT,
    category TEXT,
    current_stock INTEGER,
    min_stock INTEGER,
    stock_status TEXT,
    last_movement_date TIMESTAMPTZ,
    total_value DECIMAL
)
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
    SELECT 
        p.id,
        p.name,
        p.code,
        p.category,
        p.current_stock,
        p.min_stock,
        CASE 
            WHEN p.current_stock = 0 THEN 'نفد المخزون'
            WHEN p.current_stock <= p.min_stock THEN 'مخزون منخفض'
            ELSE 'طبيعي'
        END as stock_status,
        (
            SELECT MAX(performed_at) 
            FROM public.inventory_movements 
            WHERE product_id = p.id
        ) as last_movement_date,
        (p.current_stock * p.cost_price) as total_value
    FROM public.products p
    WHERE p.status = 'active'
    ORDER BY p.name;
$$;