-- حذف المعاملات المكررة لنفس المنتج
WITH duplicate_transactions AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY reference_id, reference_type, description, amount 
      ORDER BY created_at
    ) as rn
  FROM cash_transactions 
  WHERE reference_type = 'product_inventory'
  AND description LIKE 'شراء مخزون%'
)
DELETE FROM cash_transactions 
WHERE id IN (
  SELECT id FROM duplicate_transactions WHERE rn > 1
);