-- Sample data for Foreign Fits Inventory Management System
-- H2 Database compatible SQL

-- Insert default locations (2 warehouses and 2 stores)
INSERT INTO locations (id, name, type, address, city, state, zip_code, phone, manager, capacity, is_active, created_at, updated_at) VALUES
(1, 'Main Warehouse', 'WAREHOUSE', 'Main Warehouse District', 'Mumbai', 'Maharashtra', '400001', '+91-22-1234-5678', 'Warehouse Manager 1', 10000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Secondary Warehouse', 'WAREHOUSE', 'Industrial Zone', 'Mumbai', 'Maharashtra', '400004', '+91-22-1234-5679', 'Warehouse Manager 2', 8000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Wholesale Store - Adarsh Colony', 'STORE', 'Adarsh Colony', 'Mumbai', 'Maharashtra', '400002', '+91-22-2345-6789', 'Store Manager 1', 1500, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Retail Store - Mohan Market', 'STORE', 'Mohan Market', 'Mumbai', 'Maharashtra', '400003', '+91-22-3456-7890', 'Store Manager 2', 800, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert dummy users for testing
-- Password for all accounts: admin123
-- This is a BCrypt hash for the password "admin123"
-- Admin has no location (can access all locations)
-- 2 Warehouse users (one for each warehouse)
-- 2 Sales users (one for each store)
INSERT INTO users (id, name, email, password, role, location_id, is_active, created_at, updated_at) VALUES
(1, 'Admin User', 'admin@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'ADMIN', NULL, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Warehouse Manager 1', 'warehouse1@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Warehouse Manager 2', 'warehouse2@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Sales Rep - Wholesale Store', 'sales.wholesale@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Sales Rep - Retail Store', 'sales.retail@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Pending Sales User', 'pending.sales@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'Pending Warehouse User', 'pending.warehouse@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', 1, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- Insert sample products (prices in paise - multiply by 100)
INSERT INTO products (id, name, category, size, color, price, cost, wholesale_price, wholesale_min_quantity, stock, min_stock, sku, description, barcode, location_id, created_at, updated_at) VALUES
(1, 'Classic Cotton T-Shirt', 'SHIRTS', 'M', 'White', 199900, 100000, 159900, 100, 45, 10, 'TSH-WHT-M-001', 'Comfortable 100% cotton t-shirt perfect for everyday wear', '011234567890', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Slim Fit Jeans', 'PANTS', '32', 'Dark Blue', 639900, 280000, 527900, 100, 25, 15, 'JNS-BLU-32-002', 'Modern slim fit jeans with premium denim', '021234567891', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Summer Floral Dress', 'DRESSES', 'S', 'Floral Print', 719900, 336000, 599900, 100, 30, 8, 'DRS-FLR-S-003', 'Light and breezy summer dress with beautiful floral pattern', '031234567892', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Leather Bomber Jacket', 'JACKETS', 'L', 'Black', 1279900, 640000, 1039900, 100, 12, 5, 'JKT-BLK-L-004', 'Premium leather bomber jacket with modern cut', '041234567893', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Running Sneakers', 'SHOES', '9', 'Gray/Blue', 1039900, 520000, 879900, 100, 18, 12, 'SHO-GRY-9-005', 'High-performance running shoes with advanced cushioning', '051234567894', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Silk Scarf', 'ACCESSORIES', 'One Size', 'Red', 367900, 144000, 295900, 100, 40, 20, 'ACC-RED-OS-006', 'Elegant silk scarf perfect for any occasion', '061234567895', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Same products at different locations (demonstrating multi-location inventory)
(7, 'Classic Cotton T-Shirt', 'SHIRTS', 'M', 'White', 199900, 100000, 159900, 100, 10, 5, 'TSH-WHT-M-001', 'Comfortable 100% cotton t-shirt perfect for everyday wear', NULL, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'Slim Fit Jeans', 'PANTS', '32', 'Dark Blue', 639900, 280000, 527900, 100, 8, 3, 'JNS-BLU-32-002', 'Modern slim fit jeans with premium denim', NULL, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 'Classic Cotton T-Shirt', 'SHIRTS', 'M', 'White', 199900, 100000, 159900, 100, 15, 5, 'TSH-WHT-M-001', 'Comfortable 100% cotton t-shirt perfect for everyday wear', NULL, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 'Slim Fit Jeans', 'PANTS', '32', 'Dark Blue', 639900, 280000, 527900, 100, 7, 3, 'JNS-BLU-32-002', 'Modern slim fit jeans with premium denim', NULL, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(11, 'Summer Floral Dress', 'DRESSES', 'S', 'Floral Print', 719900, 336000, 599900, 100, 9, 3, 'DRS-FLR-S-003', 'Light and breezy summer dress with beautiful floral pattern', NULL, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(12, 'Running Sneakers', 'SHOES', '9', 'Gray/Blue', 1039900, 520000, 879900, 100, 6, 5, 'SHO-GRY-9-005', 'High-performance running shoes with advanced cushioning', NULL, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample product images
INSERT INTO product_images (product_id, image_url) VALUES
(1, 'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=400'),
(1, 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400'),
(2, 'https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=400'),
(2, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400'),
(3, 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400'),
(4, 'https://images.pexels.com/photos/1124468/pexels-photo-1124468.jpeg?auto=compress&cs=tinysrgb&w=400'),
(4, 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400'),
(4, 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400'),
(5, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400'),
(6, 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400'),
(6, 'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=400'),
-- Images for products at other locations (same product, same images)
(7, 'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=400'),
(7, 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400'),
(8, 'https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=400'),
(8, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400'),
(9, 'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=400'),
(9, 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=400'),
(10, 'https://images.pexels.com/photos/1082529/pexels-photo-1082529.jpeg?auto=compress&cs=tinysrgb&w=400'),
(10, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400'),
(11, 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400'),
(12, 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400');

-- Insert sample stock movements for testing
-- Main Warehouse (location_id = 1) stock movements
INSERT INTO stock_movements (id, product_id, type, quantity, previous_stock, new_stock, reason, reference, location_id, created_by, created_at) VALUES
(1, 1, 'RESTOCK', 50, 0, 50, 'Initial stock from supplier', 'PO-2024-001', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '5' DAY),
(2, 1, 'ADJUSTMENT', -5, 50, 45, 'Inventory count correction', 'INV-2024-001', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '3' DAY),
(3, 2, 'RESTOCK', 30, 0, 30, 'Initial stock from supplier', 'PO-2024-002', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '5' DAY),
(4, 2, 'TRANSFER_OUT', -5, 30, 25, 'Transfer to store', 'TRF-2024-001', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '2' DAY),
(5, 3, 'RESTOCK', 35, 0, 35, 'Initial stock from supplier', 'PO-2024-003', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '5' DAY),
(6, 3, 'DAMAGE', -5, 35, 30, 'Damaged during handling', 'DMG-2024-001', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '2' DAY),
(7, 4, 'RESTOCK', 15, 0, 15, 'Initial stock from supplier', 'PO-2024-004', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '4' DAY),
(8, 4, 'ADJUSTMENT', -3, 15, 12, 'Quality control check', 'QC-2024-001', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '1' DAY),
(9, 5, 'RESTOCK', 20, 0, 20, 'Initial stock from supplier', 'PO-2024-005', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '4' DAY),
(10, 5, 'ADJUSTMENT', -2, 20, 18, 'Size mismatch correction', 'ADJ-2024-001', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '1' DAY),
(11, 6, 'RESTOCK', 50, 0, 50, 'Initial stock from supplier', 'PO-2024-006', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '3' DAY),
(12, 6, 'TRANSFER_OUT', -10, 50, 40, 'Transfer to retail store', 'TRF-2024-002', 1, 'Warehouse Manager', CURRENT_TIMESTAMP - INTERVAL '1' DAY);

-- Wholesale Store (location_id = 3) stock movements
INSERT INTO stock_movements (id, product_id, type, quantity, previous_stock, new_stock, reason, reference, location_id, created_by, created_at) VALUES
(13, 9, 'TRANSFER_IN', 20, 0, 20, 'Transfer from warehouse', 'TRF-2024-003', 3, 'Sales Rep - Wholesale Store', CURRENT_TIMESTAMP - INTERVAL '2' DAY),
(14, 9, 'SALE', -5, 20, 15, 'Customer purchase', 'SALE-2024-001', 3, 'Sales Rep - Wholesale Store', CURRENT_TIMESTAMP - INTERVAL '1' DAY),
(15, 10, 'TRANSFER_IN', 12, 0, 12, 'Transfer from warehouse', 'TRF-2024-004', 3, 'Sales Rep - Wholesale Store', CURRENT_TIMESTAMP - INTERVAL '2' DAY),
(16, 10, 'SALE', -4, 12, 8, 'Customer purchase', 'SALE-2024-002', 3, 'Sales Rep - Wholesale Store', CURRENT_TIMESTAMP - INTERVAL '1' DAY);

-- Retail Store (location_id = 4) stock movements
INSERT INTO stock_movements (id, product_id, type, quantity, previous_stock, new_stock, reason, reference, location_id, created_by, created_at) VALUES
(17, 11, 'TRANSFER_IN', 12, 0, 12, 'Transfer from warehouse', 'TRF-2024-005', 4, 'Sales Rep - Retail Store', CURRENT_TIMESTAMP - INTERVAL '2' DAY),
(18, 11, 'SALE', -3, 12, 9, 'Customer purchase', 'SALE-2024-003', 4, 'Sales Rep - Retail Store', CURRENT_TIMESTAMP - INTERVAL '1' DAY),
(19, 12, 'TRANSFER_IN', 10, 0, 10, 'Transfer from warehouse', 'TRF-2024-006', 4, 'Sales Rep - Retail Store', CURRENT_TIMESTAMP - INTERVAL '2' DAY),
(20, 12, 'SALE', -4, 10, 6, 'Customer purchase', 'SALE-2024-004', 4, 'Sales Rep - Retail Store', CURRENT_TIMESTAMP);

-- Ensure IDENTITY sequences continue after seeded IDs (H2 syntax)
ALTER TABLE locations ALTER COLUMN id RESTART WITH 5;
ALTER TABLE users ALTER COLUMN id RESTART WITH 8;
ALTER TABLE products ALTER COLUMN id RESTART WITH 13;
ALTER TABLE stock_movements ALTER COLUMN id RESTART WITH 21;

-- Insert sample sales data (5 sales per store = 10 total sales)
-- Prices are in paise (multiply by 100)

-- WHOLESALE STORE (Location ID: 3) - 5 Sales
-- Sale 1: T-Shirt purchase
INSERT INTO sales (id, subtotal, tax, total, payment_method, customer_name, customer_email, sold_by_id, created_at) VALUES
(1, 199900, 35982, 235882, 'CARD', 'Rajesh Kumar', 'rajesh.kumar@example.com', 4, CURRENT_TIMESTAMP - INTERVAL '5' DAY);

INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES
(1, 1, 9, 1, 199900, 199900);

-- Sale 2: Jeans purchase
INSERT INTO sales (id, subtotal, tax, total, payment_method, customer_name, customer_email, sold_by_id, created_at) VALUES
(2, 639900, 115182, 755082, 'CASH', 'Priya Sharma', 'priya.sharma@example.com', 4, CURRENT_TIMESTAMP - INTERVAL '4' DAY);

INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES
(2, 2, 10, 1, 639900, 639900);

-- Sale 3: Multiple T-Shirts
INSERT INTO sales (id, subtotal, tax, total, payment_method, customer_name, customer_email, sold_by_id, created_at) VALUES
(3, 399800, 71964, 471764, 'CARD', 'Amit Patel', 'amit.patel@example.com', 4, CURRENT_TIMESTAMP - INTERVAL '3' DAY);

INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES
(3, 3, 9, 2, 199900, 399800);

-- Sale 4: Mixed purchase (T-Shirt + Jeans)
INSERT INTO sales (id, subtotal, tax, total, payment_method, customer_name, customer_email, sold_by_id, created_at) VALUES
(4, 839800, 151164, 990964, 'CARD', 'Sneha Desai', 'sneha.desai@example.com', 4, CURRENT_TIMESTAMP - INTERVAL '2' DAY);

INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES
(4, 4, 9, 1, 199900, 199900),
(5, 4, 10, 1, 639900, 639900);

-- Sale 5: Bulk T-Shirt purchase
INSERT INTO sales (id, subtotal, tax, total, payment_method, customer_name, sold_by_id, created_at) VALUES
(5, 999500, 179910, 1179410, 'CASH', 'Vikram Singh', 4, CURRENT_TIMESTAMP - INTERVAL '1' DAY);

INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES
(6, 5, 9, 5, 199900, 999500);

-- RETAIL STORE (Location ID: 4) - 5 Sales
-- Sale 6: Dress purchase
INSERT INTO sales (id, subtotal, tax, total, payment_method, customer_name, customer_email, sold_by_id, created_at) VALUES
(6, 719900, 129582, 849482, 'CARD', 'Meera Iyer', 'meera.iyer@example.com', 5, CURRENT_TIMESTAMP - INTERVAL '5' DAY);

INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES
(7, 6, 11, 1, 719900, 719900);

-- Sale 7: Sneakers purchase
INSERT INTO sales (id, subtotal, tax, total, payment_method, customer_name, customer_email, sold_by_id, created_at) VALUES
(7, 1039900, 187182, 1227082, 'CARD', 'Arjun Reddy', 'arjun.reddy@example.com', 5, CURRENT_TIMESTAMP - INTERVAL '4' DAY);

INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES
(8, 7, 12, 1, 1039900, 1039900);

-- Sale 8: Multiple dresses
INSERT INTO sales (id, subtotal, tax, total, payment_method, customer_name, customer_email, sold_by_id, created_at) VALUES
(8, 1439800, 259164, 1698964, 'CASH', 'Kavya Nair', 'kavya.nair@example.com', 5, CURRENT_TIMESTAMP - INTERVAL '3' DAY);

INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES
(9, 8, 11, 2, 719900, 1439800);

-- Sale 9: Mixed purchase (Dress + Sneakers)
INSERT INTO sales (id, subtotal, tax, total, payment_method, customer_name, customer_email, sold_by_id, created_at) VALUES
(9, 1759800, 316764, 2076564, 'CARD', 'Rohit Malhotra', 'rohit.malhotra@example.com', 5, CURRENT_TIMESTAMP - INTERVAL '2' DAY);

INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES
(10, 9, 11, 1, 719900, 719900),
(11, 9, 12, 1, 1039900, 1039900);

-- Sale 10: Multiple sneakers
INSERT INTO sales (id, subtotal, tax, total, payment_method, customer_name, sold_by_id, created_at) VALUES
(10, 3119700, 561546, 3681246, 'CARD', 'Anjali Gupta', 5, CURRENT_TIMESTAMP - INTERVAL '1' DAY);

INSERT INTO sale_items (id, sale_id, product_id, quantity, price, total) VALUES
(12, 10, 12, 3, 1039900, 3119700);

-- Update IDENTITY sequences for sales tables
ALTER TABLE sales ALTER COLUMN id RESTART WITH 11;
ALTER TABLE sale_items ALTER COLUMN id RESTART WITH 13;
