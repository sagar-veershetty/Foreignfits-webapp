-- Sample data for Foreign Fits Inventory Management System
-- Compatible with both H2 and PostgreSQL databases
-- Only includes locations and users (core data needed for application to function)

-- Insert INITIAL location (used as fromLocation for initial stock/product creation)
INSERT INTO locations (id, name, type, address, city, state, zip_code, phone, manager, capacity, is_active, created_at, updated_at) VALUES
(0, 'INITIAL', 'WAREHOUSE', 'System Initial Location', 'System', 'System', '000000', 'N/A', 'System', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert default locations (1 supplier, 1 warehouse and 2 stores)
INSERT INTO locations (id, name, type, address, city, state, zip_code, phone, manager, capacity, is_active, created_at, updated_at) VALUES
(1, 'Supplier', 'WAREHOUSE', 'Supplier Headquarters', 'Mumbai', 'Maharashtra', '400000', '+91-22-1234-5670', 'Admin', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Gaumukh Warehouse', 'WAREHOUSE', 'Main Warehouse District', 'Bidar', 'Karnataka', '585401', '+91-8482-123456', 'Warehouse Manager', 10000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Foreign Fits Ganga', 'STORE', 'Adarsh Colony', 'Bidar', 'Karnataka', '585401', '+91-8482-345678', 'Store Manager 1', 1500, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Foreign Fits Yamuna', 'STORE', 'Mohan Market', 'Bidar', 'Karnataka', '585401', '+91-8482-456789', 'Store Manager 2', 800, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insert dummy users for testing
-- Password for all accounts: admin123
-- This is a BCrypt hash for the password "admin123"
-- Admin assigned to Supplier location (ID 1)
-- 1 Warehouse user (for Gaumukh Warehouse)
-- 1 Sales Manager (manages all stores)
-- 2 Sales Representatives (one for each store)
INSERT INTO users (id, name, email, password, role, location_id, is_active, created_at, updated_at) VALUES
(1, 'Admin User', 'admin@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'ADMIN', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Warehouse Manager', 'warehouse@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Sales Manager', 'salesmanager@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES_MANAGER', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Sales Rep - Ganga Store', 'sales.ganga@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Sales Rep - Yamuna Store', 'sales.yamuna@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Pending Sales User', 'pending.sales@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 3, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'Pending Warehouse User', 'pending.warehouse@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', 2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'Karl Chen', 'karl@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SHIPPING_AGENT_CHINA', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(9, 'Girish Patel', 'girish@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SHIPPING_AGENT_INDIA', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Update sequences for both H2 and PostgreSQL
-- H2 syntax
ALTER TABLE locations ALTER COLUMN id RESTART WITH 5;
ALTER TABLE users ALTER COLUMN id RESTART WITH 10;
ALTER TABLE products ALTER COLUMN id RESTART WITH 1;
ALTER TABLE location_inventory ALTER COLUMN id RESTART WITH 1;

-- PostgreSQL syntax (will be ignored by H2)
SELECT setval('locations_id_seq', 5, false);
SELECT setval('users_id_seq', 10, false);
SELECT setval('products_id_seq', 1, false);
SELECT setval('location_inventory_id_seq', 1, false);
