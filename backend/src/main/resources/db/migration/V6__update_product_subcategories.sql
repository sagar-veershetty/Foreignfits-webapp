-- Migration V6: Update existing products with subcategory values
-- This migration populates the subcategory column for existing products

-- Update Kids products
UPDATE products 
SET subcategory = 'KIDS'
WHERE (LOWER(name) LIKE '%kid%' OR LOWER(name) LIKE '%kids%')
  AND subcategory IS NULL;

-- Update Boys products
UPDATE products 
SET subcategory = 'BOYS'
WHERE (LOWER(name) LIKE '%boy%' OR LOWER(name) LIKE '%boys%')
  AND subcategory IS NULL;

-- Update Girls products
UPDATE products 
SET subcategory = 'GIRLS'
WHERE (LOWER(name) LIKE '%girl%' OR LOWER(name) LIKE '%girls%')
  AND subcategory IS NULL;

-- Update Mens products
UPDATE products 
SET subcategory = 'MENS'
WHERE (LOWER(name) LIKE '%men%' OR LOWER(name) LIKE '%mens%' OR LOWER(name) LIKE '%man%')
  AND subcategory IS NULL;

-- Update Womens products
UPDATE products 
SET subcategory = 'WOMENS'
WHERE (LOWER(name) LIKE '%women%' OR LOWER(name) LIKE '%womens%' OR LOWER(name) LIKE '%ladies%' OR LOWER(name) LIKE '%lady%')
  AND subcategory IS NULL;

-- Update Infant products
UPDATE products 
SET subcategory = 'INFANT'
WHERE (LOWER(name) LIKE '%infant%' OR LOWER(name) LIKE '%baby%')
  AND subcategory IS NULL;

-- Update Toddler products
UPDATE products 
SET subcategory = 'TODDLER'
WHERE LOWER(name) LIKE '%toddler%'
  AND subcategory IS NULL;

-- Set remaining products to UNISEX
UPDATE products 
SET subcategory = 'UNISEX'
WHERE subcategory IS NULL;
