-- إضافة عمود deleted_at لجدول suppliers لتنفيذ soft delete
ALTER TABLE public.suppliers 
ADD COLUMN deleted_at timestamp with time zone DEFAULT NULL;

-- إنشاء index للبحث السريع عن الموردين المحذوفين
CREATE INDEX idx_suppliers_deleted_at ON public.suppliers(deleted_at);

-- إنشاء trigger function لتحديث updated_at عند الاستعادة
CREATE OR REPLACE FUNCTION update_supplier_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger
CREATE TRIGGER update_suppliers_updated_at
BEFORE UPDATE ON public.suppliers
FOR EACH ROW
EXECUTE FUNCTION update_supplier_updated_at();