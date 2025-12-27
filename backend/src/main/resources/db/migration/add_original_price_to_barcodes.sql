-- ============================================
-- DATABASE MIGRATION: Add Original Price Column
-- Winter Sale Feature - Foreign Fits
-- Date: December 27, 2025
-- ============================================

-- Add original_price column to barcodes table
-- This column stores the pre-discount price for strikethrough display

-- For H2 Database (Development)
ALTER TABLE barcodes 
ADD COLUMN IF NOT EXISTS original_price DOUBLE;

-- For PostgreSQL (Production)
-- Uncomment below if using PostgreSQL:
-- ALTER TABLE barcodes 
-- ADD COLUMN IF NOT EXISTS original_price DOUBLE PRECISION;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_barcode_original_price 
ON barcodes(original_price);

-- Add index for winter sale queries
CREATE INDEX IF NOT EXISTS idx_barcode_remark 
ON barcodes(remark);

-- Verify column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'barcodes' 
  AND column_name = 'original_price';

-- Sample data check
SELECT 
    COUNT(*) as total_barcodes,
    COUNT(sale_price) as with_sale_price,
    COUNT(original_price) as with_original_price
FROM barcodes;

-- ============================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================
-- Uncomment below to remove the column:
/*
ALTER TABLE barcodes DROP COLUMN IF EXISTS original_price;
DROP INDEX IF EXISTS idx_barcode_original_price;
*/

-- ============================================
-- END OF MIGRATION
-- ============================================
