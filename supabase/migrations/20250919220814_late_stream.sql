-- Sample data for Foreign Fits Inventory Management System
-- H2 Database compatible SQL

-- Insert default locations
INSERT INTO locations (id, name, type, address, city, state, zip_code, phone, manager, capacity, is_active, created_at, updated_at) VALUES
(1, 'Main Warehouse', 'WAREHOUSE', '1234 Industrial Blvd', 'Mumbai', 'Maharashtra', '400001', '+91-22-1234-5678', 'Rajesh Kumar', 10000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Downtown Store', 'STORE', '456 Fashion Street', 'Mumbai', 'Maharashtra', '400002', '+91-22-2345-6789', 'Priya Sharma', 500, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Mall Store', 'STORE', '789 Phoenix Mall', 'Pune', 'Maharashtra', '411001', '+91-20-3456-7890', 'Amit Patel', 300, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'North Warehouse', 'WAREHOUSE', '321 Storage Complex', 'Delhi', 'Delhi', '110001', '+91-11-4567-8901', 'Sunita Singh', 8000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert dummy users for testing
-- Password for all users is 'password123' (BCrypt encoded)
INSERT INTO users (id, name, email, password, role, is_active, created_at, updated_at) VALUES
(1, 'Admin User', 'admin@foreignfits.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9b2.lCy.vWN.2Ci', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Sales Representative', 'sales@foreignfits.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9b2.lCy.vWN.2Ci', 'SALES', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Warehouse Manager', 'warehouse@foreignfits.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9b2.lCy.vWN.2Ci', 'WAREHOUSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'John Admin', 'john.admin@foreignfits.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9b2.lCy.vWN.2Ci', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Sarah Sales', 'sarah.sales@foreignfits.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9b2.lCy.vWN.2Ci', 'SALES', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Mike Warehouse', 'mike.warehouse@foreignfits.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9b2.lCy.vWN.2Ci', 'WAREHOUSE', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert sample products (prices in paise - multiply by 100)
INSERT INTO products (id, name, category, size, color, price, cost, wholesale_price, wholesale_min_quantity, stock, min_stock, sku, description, barcode, location_id, created_at, updated_at) VALUES
(1, 'Classic Cotton T-Shirt', 'SHIRTS', 'M', 'White', 199900, 100000, 159900, 100, 45, 10, 'TSH-WHT-M-001', 'Comfortable 100% cotton t-shirt perfect for everyday wear', '011234567890', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Slim Fit Jeans', 'PANTS', '32', 'Dark Blue', 639900, 280000, 527900, 100, 8, 15, 'JNS-BLU-32-002', 'Modern slim fit jeans with premium denim', '021234567891', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Summer Floral Dress', 'DRESSES', 'S', 'Floral Print', 719900, 336000, 599900, 100, 22, 8, 'DRS-FLR-S-003', 'Light and breezy summer dress with beautiful floral pattern', '031234567892', 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Leather Bomber Jacket', 'JACKETS', 'L', 'Black', 1279900, 640000, 1039900, 100, 12, 5, 'JKT-BLK-L-004', 'Premium leather bomber jacket with modern cut', '041234567893', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Running Sneakers', 'SHOES', '9', 'Gray/Blue', 1039900, 520000, 879900, 100, 18, 12, 'SHO-GRY-9-005', 'High-performance running shoes with advanced cushioning', '051234567894', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Silk Scarf', 'ACCESSORIES', 'One Size', 'Red', 367900, 144000, 295900, 100, 6, 20, 'ACC-RED-OS-006', 'Elegant silk scarf perfect for any occasion', '061234567895', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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
(6, 'https://images.pexels.com/photos/1020585/pexels-photo-1020585.jpeg?auto=compress&cs=tinysrgb&w=400');