-- Update Kids pants specifically
UPDATE products 
SET subcategory = 'KIDS'
WHERE LOWER(name) LIKE '%kid%'
  AND subcategory IS NULL;

-- Update other products based on name patterns
UPDATE products 
SET subcategory = 'MENS'
WHERE (LOWER(name) LIKE '%men%' OR LOWER(name) LIKE '%mens%' OR LOWER(name) LIKE '%man%')
  AND subcategory IS NULL;

UPDATE products 
SET subcategory = 'WOMENS'
WHERE (LOWER(name) LIKE '%women%' OR LOWER(name) LIKE '%womens%' OR LOWER(name) LIKE '%ladies%' OR LOWER(name) LIKE '%lady%')
  AND subcategory IS NULL;

-- Set UNISEX as default for products without specific gender
UPDATE products 
SET subcategory = 'UNISEX'
WHERE subcategory IS NULL;

-- Verify the updates
SELECT id, name, category, subcategory, product_type
FROM products
ORDER BY id;
