-- SQL Script to Update Existing Products with Subcategory Values
-- Run this in your PostgreSQL database to assign subcategories to existing products

-- This is a template - you'll need to customize it based on your actual product names/patterns

-- Example 1: Update products with "Men" or "Men's" in the name
UPDATE products 
SET subcategory = 'MENS'
WHERE (LOWER(name) LIKE '%men%' OR LOWER(name) LIKE '%mens%' OR LOWER(name) LIKE '%man%')
  AND subcategory IS NULL;

-- Example 2: Update products with "Women" or "Ladies" in the name
UPDATE products 
SET subcategory = 'WOMENS'
WHERE (LOWER(name) LIKE '%women%' OR LOWER(name) LIKE '%womens%' OR LOWER(name) LIKE '%ladies%' OR LOWER(name) LIKE '%lady%')
  AND subcategory IS NULL;

-- Example 3: Update products with "Kids" or "Children" in the name
UPDATE products 
SET subcategory = 'KIDS'
WHERE (LOWER(name) LIKE '%kids%' OR LOWER(name) LIKE '%children%' OR LOWER(name) LIKE '%child%')
  AND subcategory IS NULL;

-- Example 4: Update products with "Boys" in the name
UPDATE products 
SET subcategory = 'BOYS'
WHERE LOWER(name) LIKE '%boys%' OR LOWER(name) LIKE '%boy%'
  AND subcategory IS NULL;

-- Example 5: Update products with "Girls" in the name
UPDATE products 
SET subcategory = 'GIRLS'
WHERE LOWER(name) LIKE '%girls%' OR LOWER(name) LIKE '%girl%'
  AND subcategory IS NULL;

-- Example 6: Update products with "Infant" or "Baby" in the name
UPDATE products 
SET subcategory = 'INFANT'
WHERE (LOWER(name) LIKE '%infant%' OR LOWER(name) LIKE '%baby%')
  AND subcategory IS NULL;

-- Example 7: Update products with "Toddler" in the name
UPDATE products 
SET subcategory = 'TODDLER'
WHERE LOWER(name) LIKE '%toddler%'
  AND subcategory IS NULL;

-- Example 8: Set remaining products to UNISEX as default
UPDATE products 
SET subcategory = 'UNISEX'
WHERE subcategory IS NULL;

-- ============================================================================
-- OPTIONAL: Set product_type based on product names
-- ============================================================================

-- Update Jeans
UPDATE products 
SET product_type = 'Jeans'
WHERE (LOWER(name) LIKE '%jean%' OR LOWER(name) LIKE '%denim%')
  AND product_type IS NULL;

-- Update T-Shirts
UPDATE products 
SET product_type = 'T-Shirt'
WHERE (LOWER(name) LIKE '%t-shirt%' OR LOWER(name) LIKE '%tshirt%' OR LOWER(name) LIKE '%tee%')
  AND product_type IS NULL;

-- Update Jackets
UPDATE products 
SET product_type = 'Jacket'
WHERE (LOWER(name) LIKE '%jacket%' OR LOWER(name) LIKE '%coat%')
  AND product_type IS NULL;

-- Update Shirts
UPDATE products 
SET product_type = 'Shirt'
WHERE LOWER(name) LIKE '%shirt%' AND LOWER(name) NOT LIKE '%t-shirt%' AND LOWER(name) NOT LIKE '%tshirt%'
  AND product_type IS NULL;

-- Update Pants
UPDATE products 
SET product_type = 'Pants'
WHERE (LOWER(name) LIKE '%pant%' OR LOWER(name) LIKE '%trouser%')
  AND product_type IS NULL;

-- Update Dresses
UPDATE products 
SET product_type = 'Dress'
WHERE LOWER(name) LIKE '%dress%'
  AND product_type IS NULL;

-- Update Shoes
UPDATE products 
SET product_type = 'Shoes'
WHERE (LOWER(name) LIKE '%shoe%' OR LOWER(name) LIKE '%sneaker%' OR LOWER(name) LIKE '%boot%')
  AND product_type IS NULL;

-- Update Accessories
UPDATE products 
SET product_type = 'Accessory'
WHERE (LOWER(name) LIKE '%bag%' OR LOWER(name) LIKE '%hat%' OR LOWER(name) LIKE '%scarf%' OR LOWER(name) LIKE '%belt%')
  AND product_type IS NULL;

-- ============================================================================
-- Verify the updates
-- ============================================================================

-- Check subcategory distribution
SELECT subcategory, COUNT(*) as product_count
FROM products
GROUP BY subcategory
ORDER BY subcategory;

-- Check product_type distribution
SELECT product_type, COUNT(*) as product_count
FROM products
GROUP BY product_type
ORDER BY product_type;

-- Check products that still don't have subcategory (should be 0)
SELECT COUNT(*) as products_without_subcategory
FROM products
WHERE subcategory IS NULL;

-- Check products that still don't have product_type
SELECT COUNT(*) as products_without_type
FROM products
WHERE product_type IS NULL;

-- View sample of updated products
SELECT id, name, category, subcategory, product_type
FROM products
LIMIT 20;
