-- H2-friendly seed data for Foreign Fits Inventory Management System
-- Mirrors data.sql but removes PostgreSQL-specific setval calls

INSERT INTO locations (id, name, type, address, city, state, zip_code, phone, manager, capacity, is_active, created_at, updated_at) VALUES
(0, 'INITIAL', 'WAREHOUSE', 'System Initial Location', 'System', 'System', '000000', 'N/A', 'System', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO locations (id, name, type, address, city, state, zip_code, phone, manager, capacity, is_active, created_at, updated_at) VALUES
(1, 'Supplier', 'WAREHOUSE', 'Supplier Headquarters', 'Mumbai', 'Maharashtra', '400000', '+91-22-1234-5670', 'Admin', 999999, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Gaumukh Warehouse', 'WAREHOUSE', 'Main Warehouse District', 'Bidar', 'Karnataka', '585401', '+91-8482-123456', 'Warehouse Manager', 10000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Foreign Fits Ganga', 'STORE', 'Adarsh Colony', 'Bidar', 'Karnataka', '585401', '+91-8482-345678', 'Store Manager 1', 1500, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Foreign Fits Yamuna', 'STORE', 'Mohan Market', 'Bidar', 'Karnataka', '585401', '+91-8482-456789', 'Store Manager 2', 800, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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

-- Sequence restarts for H2
ALTER TABLE locations ALTER COLUMN id RESTART WITH 5;
ALTER TABLE users ALTER COLUMN id RESTART WITH 10;
ALTER TABLE products ALTER COLUMN id RESTART WITH 1;
ALTER TABLE location_inventory ALTER COLUMN id RESTART WITH 1;
