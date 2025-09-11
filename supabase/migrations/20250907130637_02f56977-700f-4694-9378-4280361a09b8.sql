-- إصلاح ربط فواتير الشراء بالموردين
UPDATE purchase_invoices 
SET supplier_id = suppliers.id
FROM suppliers 
WHERE purchase_invoices.supplier_name = suppliers.name 
  AND purchase_invoices.supplier_id IS NULL
  AND suppliers.is_active = true;