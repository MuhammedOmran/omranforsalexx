-- حذف المنتجات المكررة والاحتفاظ بالأول فقط (PRD001)
DELETE FROM products 
WHERE user_id = '07045e5c-0528-4561-9c0b-dbc47313a19b' 
AND name = 'تيشرت' 
AND code IN ('PRD002', 'PRD003', 'PRD004', 'PRD005');