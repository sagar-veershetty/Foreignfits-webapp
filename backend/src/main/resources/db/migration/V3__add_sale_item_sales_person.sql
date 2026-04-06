-- Add sales person tracking per sale item
ALTER TABLE sale_items
ADD COLUMN IF NOT EXISTS sales_person_name VARCHAR(100);
