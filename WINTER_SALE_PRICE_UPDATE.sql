-- ============================================
-- WINTER SALE 2025 - PRICE UPDATE SCRIPTS
-- Foreign Fits Inventory Management
-- ============================================

-- IMPORTANT: Run these scripts in order
-- Make sure to backup your database first!

-- ============================================
-- STEP 1: BACKUP CURRENT PRICES
-- ============================================
-- This saves current sale prices as original prices
-- So they can be displayed as strikethrough on stickers

UPDATE barcodes 
SET original_price = sale_price
WHERE sale_price IS NOT NULL 
  AND status = 'ACTIVE'
  AND (original_price IS NULL OR original_price = 0);

-- Verify backup
SELECT 
    COUNT(*) as total_barcodes_backed_up,
    MIN(original_price) as min_price,
    MAX(original_price) as max_price,
    AVG(original_price) as avg_price
FROM barcodes 
WHERE original_price IS NOT NULL 
  AND status = 'ACTIVE';

-- ============================================
-- STEP 2: APPLY WINTER SALE PRICING BY CATEGORY
-- ============================================

-- TIER 1: ₹249 (Budget Items)
-- T-Shirts, Basic Items, Kids Basics
UPDATE barcodes 
SET sale_price = 249.00, 
    remark = 'Winter Sale 2025'
WHERE product_id IN (
    SELECT id FROM products 
    WHERE category IN ('TSHIRT', 'ACCESSORIES')
       OR (product_type LIKE '%T-Shirt%' OR product_type LIKE '%Tee%')
       OR (subcategory IN ('KIDS', 'BOYS', 'GIRLS', 'INFANT', 'TODDLER') 
           AND category NOT IN ('JACKETS'))
)
AND status = 'ACTIVE'
AND original_price IS NOT NULL;

-- TIER 2: ₹499 (Mid-Range Items)
-- Casual Shirts, Simple Pants, Women's Tops
UPDATE barcodes 
SET sale_price = 499.00, 
    remark = 'Winter Sale 2025'
WHERE product_id IN (
    SELECT id FROM products 
    WHERE (category = 'SHIRTS' AND subcategory IN ('MENS', 'WOMENS'))
       OR (category = 'PANTS' AND subcategory IN ('MENS', 'WOMENS'))
       OR (product_type LIKE '%Shirt%' AND subcategory = 'WOMENS')
       OR (product_type LIKE '%Top%')
)
AND status = 'ACTIVE'
AND original_price IS NOT NULL
AND sale_price != 249.00; -- Don't override Tier 1

-- TIER 3: ₹749 (Premium Basics)
-- Premium Shirts, Denim Jeans, Quality Items
UPDATE barcodes 
SET sale_price = 749.00, 
    remark = 'Winter Sale 2025'
WHERE product_id IN (
    SELECT id FROM products 
    WHERE category IN ('JEANS', 'DRESSES')
       OR product_type LIKE '%Jeans%'
       OR product_type LIKE '%Dress%'
)
AND status = 'ACTIVE'
AND original_price IS NOT NULL
AND sale_price NOT IN (249.00, 499.00); -- Don't override lower tiers

-- TIER 4: ₹999 (Premium Items)
-- Jackets, Hoodies, Premium Collection
UPDATE barcodes 
SET sale_price = 999.00, 
    remark = 'Winter Sale 2025'
WHERE product_id IN (
    SELECT id FROM products 
    WHERE category = 'JACKETS'
       OR product_type LIKE '%Jacket%'
       OR product_type LIKE '%Hoodie%'
       OR product_type LIKE '%Blazer%'
)
AND status = 'ACTIVE'
AND original_price IS NOT NULL
AND sale_price NOT IN (249.00, 499.00, 749.00); -- Don't override lower tiers

-- TIER 5: ₹1249 (Top-Tier Premium)
-- Premium Outerwear, Special Collection
UPDATE barcodes 
SET sale_price = 1249.00, 
    remark = 'Winter Sale 2025'
WHERE product_id IN (
    SELECT id FROM products 
    WHERE (category = 'JACKETS' AND product_type LIKE '%Premium%')
       OR product_type LIKE '%Leather%'
       OR product_type LIKE '%Designer%'
       OR product_name LIKE '%Premium%'
       OR product_name LIKE '%Special%'
)
AND status = 'ACTIVE'
AND original_price IS NOT NULL
AND sale_price NOT IN (249.00, 499.00, 749.00, 999.00); -- Don't override lower tiers

-- ============================================
-- STEP 3: VERIFY UPDATES
-- ============================================

-- Check distribution across price tiers
SELECT 
    sale_price as winter_sale_price,
    COUNT(*) as barcode_count,
    COUNT(DISTINCT product_id) as product_count,
    MIN(original_price) as min_original,
    MAX(original_price) as max_original,
    AVG(original_price) as avg_original
FROM barcodes
WHERE remark = 'Winter Sale 2025'
  AND status = 'ACTIVE'
GROUP BY sale_price
ORDER BY sale_price;

-- Check total impact
SELECT 
    COUNT(*) as total_sale_barcodes,
    SUM(original_price - sale_price) as total_discount_amount,
    AVG((original_price - sale_price) / original_price * 100) as avg_discount_percent
FROM barcodes
WHERE remark = 'Winter Sale 2025'
  AND status = 'ACTIVE'
  AND original_price IS NOT NULL;

-- List products by category and their new prices
SELECT 
    p.category,
    p.subcategory,
    p.product_type,
    COUNT(DISTINCT b.id) as barcode_count,
    MIN(b.sale_price) as min_sale_price,
    MAX(b.sale_price) as max_sale_price,
    AVG(b.original_price) as avg_original_price
FROM barcodes b
JOIN products p ON b.product_id = p.id
WHERE b.remark = 'Winter Sale 2025'
  AND b.status = 'ACTIVE'
GROUP BY p.category, p.subcategory, p.product_type
ORDER BY p.category, p.subcategory, p.product_type;

-- ============================================
-- MANUAL ADJUSTMENTS (Optional)
-- ============================================

-- If you need to adjust specific products manually:

-- Example: Set specific product to ₹749
-- UPDATE barcodes 
-- SET sale_price = 749.00, 
--     remark = 'Winter Sale 2025'
-- WHERE product_id IN (
--     SELECT id FROM products 
--     WHERE sku = 'YOUR-SKU-HERE'
-- )
-- AND status = 'ACTIVE';

-- Example: Exclude specific product from sale
-- UPDATE barcodes 
-- SET sale_price = original_price,
--     original_price = NULL,
--     remark = NULL
-- WHERE product_id IN (
--     SELECT id FROM products 
--     WHERE sku = 'YOUR-SKU-HERE'
-- )
-- AND status = 'ACTIVE';

-- ============================================
-- ROLLBACK SCRIPT (After Sale Ends)
-- ============================================

-- Uncomment and run after winter sale to restore original prices:

/*
-- Restore original prices
UPDATE barcodes 
SET sale_price = original_price,
    original_price = NULL,
    remark = NULL
WHERE remark = 'Winter Sale 2025'
  AND original_price IS NOT NULL
  AND status = 'ACTIVE';

-- Verify rollback
SELECT 
    COUNT(*) as restored_count,
    MIN(sale_price) as min_price,
    MAX(sale_price) as max_price
FROM barcodes 
WHERE remark IS NULL 
  AND original_price IS NULL
  AND status = 'ACTIVE';
*/

-- ============================================
-- ADVANCED QUERIES
-- ============================================

-- Find barcodes with missing original prices
SELECT 
    b.id,
    b.barcode_number,
    p.name,
    p.sku,
    b.sale_price,
    b.original_price
FROM barcodes b
JOIN products p ON b.product_id = p.id
WHERE b.status = 'ACTIVE'
  AND b.sale_price IS NOT NULL
  AND (b.original_price IS NULL OR b.original_price = 0);

-- Calculate potential revenue impact
SELECT 
    SUM(b.sale_price) as winter_sale_revenue_potential,
    SUM(b.original_price) as original_revenue_potential,
    SUM(b.original_price - b.sale_price) as total_discount_given,
    (SUM(b.original_price - b.sale_price) / SUM(b.original_price) * 100) as overall_discount_percent
FROM barcodes b
WHERE b.remark = 'Winter Sale 2025'
  AND b.status = 'ACTIVE'
  AND b.original_price IS NOT NULL;

-- Products with highest discount percentage
SELECT 
    p.name,
    p.sku,
    p.category,
    b.original_price,
    b.sale_price,
    ((b.original_price - b.sale_price) / b.original_price * 100) as discount_percent
FROM barcodes b
JOIN products p ON b.product_id = p.id
WHERE b.remark = 'Winter Sale 2025'
  AND b.status = 'ACTIVE'
  AND b.original_price IS NOT NULL
ORDER BY discount_percent DESC
LIMIT 20;

-- ============================================
-- END OF SCRIPT
-- ============================================
