-- Add new columns for enhanced product categorization
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory VARCHAR(20);
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_code VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_type VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN products.subcategory IS 'Target demographic: MENS, WOMENS, KIDS, UNISEX, BOYS, GIRLS, INFANT, TODDLER';
COMMENT ON COLUMN products.product_code IS 'Unique product code for grouping similar items (e.g., JN-KD-001 for Kids Jeans)';
COMMENT ON COLUMN products.product_type IS 'General product type (e.g., Jeans, T-Shirt, Jacket)';

-- Create index for faster product code lookups
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory);
CREATE INDEX IF NOT EXISTS idx_products_product_type ON products(product_type);

-- Create a view for grouped products by type and subcategory
CREATE OR REPLACE VIEW product_groups AS
SELECT 
    product_code,
    product_type,
    subcategory,
    category,
    COUNT(*) as total_bags,
    STRING_AGG(bag_number, ', ' ORDER BY bag_number) as bag_numbers,
    STRING_AGG(DISTINCT size, ', ') as available_sizes,
    STRING_AGG(DISTINCT color, ', ') as available_colors
FROM products
WHERE product_code IS NOT NULL
GROUP BY product_code, product_type, subcategory, category;

COMMENT ON VIEW product_groups IS 'Groups products by product_code showing all bags and variants';
