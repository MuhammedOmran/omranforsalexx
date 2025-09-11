-- حذف السياسات التي تعتمد على company_id وإنشاء سياسات جديدة تعتمد على user_id فقط

-- إسقاط السياسات القديمة للعملاء
DROP POLICY IF EXISTS "Users can view company customers" ON public.customers;
DROP POLICY IF EXISTS "Users can create company customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update company customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete company customers" ON public.customers;

-- إسقاط السياسات القديمة للمنتجات
DROP POLICY IF EXISTS "Users can view company products" ON public.products;
DROP POLICY IF EXISTS "Users can create company products" ON public.products;
DROP POLICY IF EXISTS "Users can update company products" ON public.products;
DROP POLICY IF EXISTS "Users can delete company products" ON public.products;

-- إنشاء سياسات جديدة للعملاء تعتمد على user_id
CREATE POLICY "Users can view their customers" ON public.customers
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their customers" ON public.customers
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their customers" ON public.customers
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their customers" ON public.customers
FOR DELETE USING (auth.uid() = user_id);

-- إنشاء سياسات جديدة للمنتجات تعتمد على user_id
CREATE POLICY "Users can view their products" ON public.products
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their products" ON public.products
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their products" ON public.products
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their products" ON public.products
FOR DELETE USING (auth.uid() = user_id);