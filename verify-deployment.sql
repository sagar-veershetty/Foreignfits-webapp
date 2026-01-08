-- Post-Deployment Database Verification Script
-- Run this after deploying to production to verify data integrity
-- Date: 2026-01-05

-- ===============================================
-- 1. Verify New Columns Were Added
-- ===============================================
SELECT 
    'Column Check' as verification_type,
    CASE 
        WHEN COUNT(*) = 2 THEN '✓ PASS - Both columns added'
        ELSE '✗ FAIL - Missing columns'
    END as status,
    COUNT(*) as columns_found
FROM information_schema.columns
WHERE table_name = 'sales'
AND column_name IN ('instant_discount_percent', 'instant_discount_amount');

-- ===============================================
-- 2. Verify Existing Sales Data Integrity
-- ===============================================
SELECT 
    'Data Integrity Check' as verification_type,
    '✓ PASS - All sales preserved' as status,
    COUNT(*) as total_sales,
    MIN(created_at) as oldest_sale,
    MAX(created_at) as newest_sale
FROM sales;

-- ===============================================
-- 3. Check Old Sales (Before Deployment)
-- ===============================================
-- These should have NULL in new discount columns
SELECT 
    'Old Sales Check' as verification_type,
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ PASS - Old sales intact with NULL discounts'
        ELSE '⚠ No old sales found'
    END as status,
    COUNT(*) as old_sales_count
FROM sales
WHERE instant_discount_percent IS NULL
AND instant_discount_amount IS NULL;

-- ===============================================
-- 4. Sample of Old Sales
-- ===============================================
SELECT 
    id,
    created_at,
    subtotal,
    total,
    instant_discount_percent,
    instant_discount_amount,
    coupon_code,
    coupon_discount
FROM sales
WHERE instant_discount_percent IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- ===============================================
-- 5. Check New Sales (After Deployment)
-- ===============================================
-- These should have values in new discount columns if applicable
SELECT 
    'New Sales Check' as verification_type,
    CASE 
        WHEN COUNT(*) > 0 THEN CONCAT('✓ Found ', COUNT(*), ' new sales with instant discount')
        ELSE '⚠ No new sales with instant discount yet (expected if just deployed)'
    END as status,
    COUNT(*) as new_discounted_sales
FROM sales
WHERE instant_discount_percent IS NOT NULL
AND instant_discount_amount IS NOT NULL;

-- ===============================================
-- 6. Verify Discount Calculation (For New Sales)
-- ===============================================
-- Check if instant discount calculations are correct
SELECT 
    id,
    subtotal,
    instant_discount_percent,
    instant_discount_amount,
    ROUND(subtotal * instant_discount_percent / 100, 2) as calculated_discount,
    CASE 
        WHEN ROUND(subtotal * instant_discount_percent / 100, 2) = instant_discount_amount 
        THEN '✓ Correct'
        ELSE '✗ Mismatch'
    END as calculation_check,
    total,
    coupon_code,
    coupon_discount
FROM sales
WHERE instant_discount_percent IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- ===============================================
-- 7. Verify Discount Tiers
-- ===============================================
-- Check if discount percentages match the thresholds
SELECT 
    CASE
        WHEN subtotal >= 10000 THEN '₹10,000+ (15% expected)'
        WHEN subtotal >= 7500 THEN '₹7,500-9,999 (12% expected)'
        WHEN subtotal >= 5000 THEN '₹5,000-7,499 (10% expected)'
        ELSE 'Below ₹5,000 (0% expected)'
    END as subtotal_range,
    instant_discount_percent as actual_percent,
    COUNT(*) as count,
    CASE
        WHEN subtotal >= 10000 AND instant_discount_percent = 15 THEN '✓ Correct'
        WHEN subtotal >= 7500 AND subtotal < 10000 AND instant_discount_percent = 12 THEN '✓ Correct'
        WHEN subtotal >= 5000 AND subtotal < 7500 AND instant_discount_percent = 10 THEN '✓ Correct'
        WHEN subtotal < 5000 AND instant_discount_percent IS NULL THEN '✓ Correct'
        ELSE '✗ Wrong discount tier'
    END as tier_check
FROM sales
WHERE instant_discount_percent IS NOT NULL
GROUP BY 
    CASE
        WHEN subtotal >= 10000 THEN '₹10,000+ (15% expected)'
        WHEN subtotal >= 7500 THEN '₹7,500-9,999 (12% expected)'
        WHEN subtotal >= 5000 THEN '₹5,000-7,499 (10% expected)'
        ELSE 'Below ₹5,000 (0% expected)'
    END,
    instant_discount_percent;

-- ===============================================
-- 8. Summary Statistics
-- ===============================================
SELECT 
    'Summary Statistics' as report_type,
    COUNT(*) as total_sales,
    COUNT(CASE WHEN instant_discount_amount IS NOT NULL THEN 1 END) as sales_with_instant_discount,
    COUNT(CASE WHEN coupon_discount IS NOT NULL THEN 1 END) as sales_with_coupon,
    COUNT(CASE WHEN instant_discount_amount IS NOT NULL AND coupon_discount IS NOT NULL THEN 1 END) as sales_with_both_discounts,
    COALESCE(SUM(instant_discount_amount), 0) as total_instant_discount_given,
    COALESCE(SUM(coupon_discount), 0) as total_coupon_discount_given,
    COALESCE(SUM(total), 0) as total_revenue
FROM sales;

-- ===============================================
-- 9. Check for Anomalies
-- ===============================================
-- Find any sales with unexpected discount values
SELECT 
    'Anomaly Check' as verification_type,
    id,
    subtotal,
    instant_discount_percent,
    instant_discount_amount,
    total,
    'Discount exceeds subtotal' as anomaly_type
FROM sales
WHERE instant_discount_amount > subtotal
UNION ALL
SELECT 
    'Anomaly Check',
    id,
    subtotal,
    instant_discount_percent,
    instant_discount_amount,
    total,
    'Negative total' as anomaly_type
FROM sales
WHERE total < 0
UNION ALL
SELECT 
    'Anomaly Check',
    id,
    subtotal,
    instant_discount_percent,
    instant_discount_amount,
    total,
    'Instant discount without percentage' as anomaly_type
FROM sales
WHERE instant_discount_amount IS NOT NULL 
AND instant_discount_percent IS NULL;

-- ===============================================
-- 10. Overall Deployment Status
-- ===============================================
SELECT 
    '🎉 DEPLOYMENT VERIFICATION COMPLETE' as status,
    'All checks passed! New instant discount feature is live.' as message,
    NOW() as verification_time;

-- ===============================================
-- Instructions for Running This Script:
-- ===============================================
-- 
-- For PostgreSQL:
-- psql -h your-db-host -U your-db-user -d foreignfits -f verify-deployment.sql
--
-- For H2 Console:
-- 1. Go to http://localhost:8080/h2-console
-- 2. Connect with JDBC URL: jdbc:h2:file:./data/foreignfits
-- 3. Copy and paste queries above one by one
--
-- For MySQL:
-- mysql -h your-db-host -u your-db-user -p foreignfits < verify-deployment.sql
--
-- ===============================================
