-- Migration to add original_price column to barcodes table
-- Run this on PRODUCTION database BEFORE deploying new backend JAR

-- Add original_price column if it doesn't exist
ALTER TABLE barcodes 
ADD COLUMN IF NOT EXISTS original_price DOUBLE PRECISION;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_barcode_original_price ON barcodes(original_price);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'barcodes' AND column_name = 'original_price';

-- Optional: Initialize original_price with sale_price for existing records
-- (So existing barcodes show correct original price)
UPDATE barcodes 
SET original_price = sale_price 
WHERE original_price IS NULL;

-- Verify update
SELECT COUNT(*) as total_barcodes, 
       COUNT(original_price) as with_original_price,
       COUNT(*) - COUNT(original_price) as missing_original_price
FROM barcodes;
