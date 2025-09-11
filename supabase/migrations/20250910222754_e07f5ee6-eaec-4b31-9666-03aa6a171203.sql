-- إضافة حقول ربح المنتج ونسبة الربح لجدول عناصر فواتير الشراء
ALTER TABLE public.purchase_invoice_items 
ADD COLUMN IF NOT EXISTS profit_margin_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS profit_margin_percentage NUMERIC DEFAULT 0;

-- إضافة تعليقات على الحقول الجديدة
COMMENT ON COLUMN public.purchase_invoice_items.profit_margin_amount IS 'ربح المنتج بالجنيه المصري';
COMMENT ON COLUMN public.purchase_invoice_items.profit_margin_percentage IS 'نسبة الربح كنسبة مئوية';

-- تحديث function حساب سعر البيع المتوقع
CREATE OR REPLACE FUNCTION public.calculate_expected_selling_price(p_unit_cost NUMERIC, p_profit_percentage NUMERIC)
RETURNS NUMERIC AS $$
BEGIN
    RETURN p_unit_cost + (p_unit_cost * p_profit_percentage / 100);
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER SET search_path = public;