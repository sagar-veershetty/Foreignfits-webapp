-- Sample data for Foreign Fits Inventory Management System
-- H2 Database compatible SQL

-- Insert default locations
INSERT INTO locations (id, name, type, address, city, state, zip_code, phone, manager, capacity, is_active, created_at, updated_at) VALUES
(1, 'Main Warehouse', 'WAREHOUSE', 'Main Warehouse District', 'Mumbai', 'Maharashtra', '400001', '+91-22-1234-5678', 'Warehouse Manager', 10000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Wholesale Store - Adarsh Colony', 'STORE', 'Adarsh Colony', 'Mumbai', 'Maharashtra', '400002', '+91-22-2345-6789', 'Store Manager', 1500, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Retail Store - Mohan Market', 'STORE', 'Mohan Market', 'Mumbai', 'Maharashtra', '400003', '+91-22-3456-7890', 'Store Manager', 800, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert dummy users for testing
-- Password for all accounts: admin123
-- This is a BCrypt hash for the password "admin123"
INSERT INTO users (id, name, email, password, role, is_active, created_at, updated_at) VALUES
(1, 'Admin User', 'admin@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Sales Representative', 'sales@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Warehouse Manager', 'warehouse@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample products (prices in paise - multiply by 100)
INSERT INTO products (id, name, category, size, color, price, cost, wholesale_price, wholesale_min_quantity, stock, min_stock, sku, description, barcode, location_id, created_at, updated_at) VALUES
(1, 'Classic Cotton T-Shirt', 'SHIRTS', 'M', 'White', 199900, 100000, 159900, 100, 45, 10, 'TSH-WHT-M-001', 'Comfortable 100% cotton t-shirt perfect for everyday wear', '011234567890', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Slim Fit Jeans', 'PANTS', '32', 'Dark Blue', 639900, 280000, 527900, 100, 25, 15, 'JNS-BLU-32-002', 'Modern slim fit jeans with premium denim', '021234567891', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Summer Floral Dress', 'DRESSES', 'S', 'Floral Print', 719900, 336000, 599900, 100, 30, 8, 'DRS-FLR-S-003', 'Light and breezy summer dress with beautiful floral pattern', '031234567892', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Leather Bomber Jacket', 'JACKETS', 'L', 'Black', 1279900, 640000, 1039900, 100, 12, 5, 'JKT-BLK-L-004', 'Premium leather bomber jacket with modern cut', '041234567893', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Running Sneakers', 'SHOES', '9', 'Gray/Blue', 1039900, 520000, 879900, 100, 18, 12, 'SHO-GRY-9-005', 'High-performance running shoes with advanced cushioning', '051234567894', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Silk Scarf', 'ACCESSORIES', 'One Size', 'Red', 367900, 144000, 295900, 100, 40, 20, 'ACC-RED-OS-006', 'Elegant silk scarf perfect for any occasion', '061234567895', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
-- Same products at different locations (demonstrating multi-location inventory)
(7, 'Classic Cotton T-Shirt', 'SHIRTS', 'M', 'White', 199900, 100000, 159900, 100, 8, 5, 'TSH-WHT-M-001', 'Comfortable 100% cotton t-shirt perfect for everyday wear', NULL, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'Slim Fit Jeans', 'PANTS', '32', 'Dark Blue', 639900, 280000, 527900, 100, 5, 3, 'JNS-BLU-32-002', 'Modern slim fit jeans with premium denim', NULL, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 'Classic Cotton T-Shirt', 'SHIRTS', 'M', 'White', 199900, 100000, 159900, 100, 12, 5, 'TSH-WHT-M-001', 'Comfortable 100% cotton t-shirt perfect for everyday wear', NULL, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(10, 'Summer Floral Dress', 'DRESSES', 'S', 'Floral Print', 719900, 336000, 599900, 100, 6, 3, 'DRS-FLR-S-003', 'Light and breezy summer dress with beautiful floral pattern', NULL, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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
(10, 'https://images.pexels.com/photos/985635/pexels-photo-985635.jpeg?auto=compress&cs=tinysrgb&w=400');

-- Ensure IDENTITY sequences continue after seeded IDs (H2 syntax)
ALTER TABLE locations ALTER COLUMN id RESTART WITH 4;
ALTER TABLE users ALTER COLUMN id RESTART WITH 4;
ALTER TABLE products ALTER COLUMN id RESTART WITH 11;
