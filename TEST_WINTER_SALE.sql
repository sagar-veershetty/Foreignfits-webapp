-- Test Winter Sale Price Update
-- This will set originalPrice and salePrice for testing the winter sale display
-- Run this SQL in your database to test the winter sale barcode display

-- Example: Update specific product's barcodes to show winter sale pricing
-- Replace 'Test-5' with your actual product name or use barcode number

-- Option 1: Update by product name
UPDATE barcodes 
SET 
  original_price = sale_price,  -- Save current price as original
  sale_price = 499               -- Set new winter sale price (249, 499, 749, 999, or 1249)
WHERE product_id IN (
  SELECT id FROM products WHERE name LIKE 'Test-5%'
);

-- Option 2: Update specific barcode numbers
-- UPDATE barcodes 
-- SET 
--   original_price = 89.99,  -- Original price
--   sale_price = 499         -- Winter sale price
-- WHERE barcode_number IN ('TEJACMBLIJ3852', 'TEJACMBLIJ3853');

-- Option 3: Update ALL barcodes for testing (BE CAREFUL!)
-- UPDATE barcodes 
-- SET 
--   original_price = sale_price,
--   sale_price = CASE 
--     WHEN sale_price >= 1500 THEN 1249
--     WHEN sale_price >= 1200 THEN 999
--     WHEN sale_price >= 900 THEN 749
--     WHEN sale_price >= 600 THEN 499
--     ELSE 249
--   END
-- WHERE sale_price IS NOT NULL;

-- Verify the update
SELECT 
  b.barcode_number,
  p.name as product_name,
  b.original_price,
  b.sale_price,
  (b.original_price - b.sale_price) as discount,
  ROUND(((b.original_price - b.sale_price) / b.original_price * 100), 2) as discount_percent
FROM barcodes b
JOIN products p ON b.product_id = p.id
WHERE b.original_price IS NOT NULL
  AND b.original_price > b.sale_price
ORDER BY p.name, b.barcode_number
LIMIT 20;
