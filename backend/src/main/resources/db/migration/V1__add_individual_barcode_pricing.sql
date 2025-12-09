-- Migration: Add individual pricing to barcodes
-- Description: Adds purchase_price and sale_price columns to barcodes table
--              and migrates existing prices from location_inventory

-- Step 1: Add price columns to barcodes table
ALTER TABLE barcodes 
ADD COLUMN IF NOT EXISTS purchase_price DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS sale_price DOUBLE PRECISION;

-- Step 2: Create index for faster price queries
CREATE INDEX IF NOT EXISTS idx_barcode_sale_price ON barcodes(sale_price);

-- Step 3: Migrate existing prices from location_inventory to barcodes
-- This will set the sale price for all barcodes based on their product's current location inventory price
UPDATE barcodes b
SET sale_price = li.sale_price
FROM location_inventory li
INNER JOIN products p ON p.sku = li.product_sku
WHERE b.product_id = p.id
  AND b.current_location_id = li.location_id
  AND b.sale_price IS NULL; -- Only update if not already set

-- Step 4: Set default prices for any barcodes without prices
-- Use a default sale price of 0 for barcodes that don't have a location_inventory entry
UPDATE barcodes
SET sale_price = 0.0
WHERE sale_price IS NULL;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN barcodes.purchase_price IS 'Individual purchase/cost price for this specific barcode unit';
COMMENT ON COLUMN barcodes.sale_price IS 'Individual sale price for this specific barcode unit. Each item can have different pricing.';
