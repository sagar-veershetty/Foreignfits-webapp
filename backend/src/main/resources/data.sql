-- Sample data for Foreign Fits Inventory Management System
-- H2 Database compatible SQL

-- Insert INITIAL location (used as fromLocation for initial stock/product creation)
INSERT INTO locations (id, name, type, address, city, state, zip_code, phone, manager, capacity, is_active, created_at, updated_at) VALUES
(0, 'INITIAL', 'WAREHOUSE', 'System Initial Location', 'System', 'System', '000000', 'N/A', 'System', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert default locations (1 supplier, 2 warehouses and 2 stores)
INSERT INTO locations (id, name, type, address, city, state, zip_code, phone, manager, capacity, is_active, created_at, updated_at) VALUES
(1, 'Supplier', 'WAREHOUSE', 'Supplier Headquarters', 'Mumbai', 'Maharashtra', '400000', '+91-22-1234-5670', 'Admin', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Main Warehouse', 'WAREHOUSE', 'Main Warehouse District', 'Mumbai', 'Maharashtra', '400001', '+91-22-1234-5678', 'Warehouse Manager 1', 10000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Secondary Warehouse', 'WAREHOUSE', 'Industrial Zone', 'Mumbai', 'Maharashtra', '400004', '+91-22-1234-5679', 'Warehouse Manager 2', 8000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Wholesale Store - Adarsh Colony', 'STORE', 'Adarsh Colony', 'Mumbai', 'Maharashtra', '400002', '+91-22-2345-6789', 'Store Manager 1', 1500, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Retail Store - Mohan Market', 'STORE', 'Mohan Market', 'Mumbai', 'Maharashtra', '400003', '+91-22-3456-7890', 'Store Manager 2', 800, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert dummy users for testing
-- Password for all accounts: admin123
-- This is a BCrypt hash for the password "admin123"
-- Admin assigned to Supplier location (ID 1)
-- 2 Warehouse users (one for each warehouse)
-- 2 Sales users (one for each store)
INSERT INTO users (id, name, email, password, role, location_id, is_active, created_at, updated_at) VALUES
(1, 'Admin User', 'admin@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'ADMIN', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Warehouse Manager 1', 'warehouse1@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Warehouse Manager 2', 'warehouse2@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Sales Rep - Wholesale Store', 'sales.wholesale@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Sales Rep - Retail Store', 'sales.retail@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Pending Sales User', 'pending.sales@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 4, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'Pending Warehouse User', 'pending.warehouse@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', 2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- Products section removed - starting with clean slate

-- Product images section removed - starting with clean slate

-- Stock movements section removed - starting with clean slate

-- Sales data section removed - starting with clean slate

-- Ensure IDENTITY sequences continue after seeded IDs (H2 syntax)
ALTER TABLE locations ALTER COLUMN id RESTART WITH 6;
ALTER TABLE users ALTER COLUMN id RESTART WITH 8;
