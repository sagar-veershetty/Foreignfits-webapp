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
-- 1 Sales Manager (manages all stores)
-- 2 Sales Representatives (one for each store)
INSERT INTO users (id, name, email, password, role, location_id, is_active, created_at, updated_at) VALUES
(1, 'Admin User', 'admin@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'ADMIN', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(2, 'Warehouse Manager 1', 'warehouse1@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(3, 'Warehouse Manager 2', 'warehouse2@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(4, 'Sales Manager', 'salesmanager@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES_MANAGER', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(5, 'Sales Rep - Wholesale Store', 'sales.wholesale@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(6, 'Sales Rep - Retail Store', 'sales.retail@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 5, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(7, 'Pending Sales User', 'pending.sales@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'SALES', 4, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(8, 'Pending Warehouse User', 'pending.warehouse@foreignfits.com', '$2a$10$vJy.i0LNXteM4vRN5W5k1ug6sDxYToqHEfT8kPE6fd6mKNVehBnAK', 'WAREHOUSE', 2, false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);


-- Ensure IDENTITY sequences continue after seeded IDs (H2 syntax)
ALTER TABLE locations ALTER COLUMN id RESTART WITH 6;
ALTER TABLE users ALTER COLUMN id RESTART WITH 9;
ALTER TABLE products ALTER COLUMN id RESTART WITH 1;
ALTER TABLE location_inventory ALTER COLUMN id RESTART WITH 1;

-- Insert sample expenses for testing
INSERT INTO expenses (id, type, amount, description, expense_date, location_id, payment_method, receipt_url, notes, created_by, approved_by, status, created_at, updated_at) VALUES
-- Wholesale Store expenses
(1, 'RENT', 25000.00, 'Monthly store rent - November 2025', CURRENT_TIMESTAMP - 5, 4, 'BANK_TRANSFER', null, 'Rent paid for November 2025', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 5, CURRENT_TIMESTAMP - 5),
(2, 'ELECTRICITY', 3500.00, 'Electricity bill - October 2025', CURRENT_TIMESTAMP - 4, 4, 'UPI', null, 'Monthly electricity charges', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 4, CURRENT_TIMESTAMP - 4),
(3, 'SALARY', 18000.00, 'Sales Representative salary - November 2025', CURRENT_TIMESTAMP - 3, 4, 'BANK_TRANSFER', null, 'Monthly salary payment', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 3, CURRENT_TIMESTAMP - 3),
(4, 'DAILY_MAINTENANCE', 500.00, 'Store cleaning and maintenance', CURRENT_TIMESTAMP - 2, 4, 'CASH', null, 'Daily cleaning supplies and minor repairs', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 2, CURRENT_TIMESTAMP - 2),
(5, 'INTERNET', 1500.00, 'Internet and phone bill - November 2025', CURRENT_TIMESTAMP - 1, 4, 'UPI', null, 'Monthly connectivity charges', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 1, CURRENT_TIMESTAMP - 1),
-- Retail Store expenses
(6, 'RENT', 20000.00, 'Monthly store rent - November 2025', CURRENT_TIMESTAMP - 5, 5, 'BANK_TRANSFER', null, 'Rent paid for November 2025', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 5, CURRENT_TIMESTAMP - 5),
(7, 'ELECTRICITY', 2800.00, 'Electricity bill - October 2025', CURRENT_TIMESTAMP - 4, 5, 'UPI', null, 'Monthly electricity charges', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 4, CURRENT_TIMESTAMP - 4),
(8, 'SALARY', 15000.00, 'Sales Representative salary - November 2025', CURRENT_TIMESTAMP - 3, 5, 'BANK_TRANSFER', null, 'Monthly salary payment', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 3, CURRENT_TIMESTAMP - 3),
(9, 'CLEANING', 300.00, 'Professional cleaning service', CURRENT_TIMESTAMP - 2, 5, 'CASH', null, 'Weekly deep cleaning', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 2, CURRENT_TIMESTAMP - 2),
(10, 'MARKETING', 5000.00, 'Social media advertising campaign', CURRENT_TIMESTAMP - 1, 5, 'CARD', null, 'Instagram and Facebook ads for new collection', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 1, CURRENT_TIMESTAMP - 1),
-- Warehouse expenses
(11, 'RENT', 35000.00, 'Warehouse rent - November 2025', CURRENT_TIMESTAMP - 4, 2, 'BANK_TRANSFER', null, 'Monthly warehouse rental', 'warehouse1@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 4, CURRENT_TIMESTAMP - 4),
(12, 'EQUIPMENT', 12000.00, 'Pallet jack repair and maintenance', CURRENT_TIMESTAMP - 3, 2, 'CARD', null, 'Equipment maintenance for warehouse operations', 'warehouse1@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 3, CURRENT_TIMESTAMP - 3),
(13, 'SECURITY', 8000.00, 'Security services - November 2025', CURRENT_TIMESTAMP - 2, 2, 'BANK_TRANSFER', null, 'Monthly security guard services', 'warehouse1@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP - 2, CURRENT_TIMESTAMP - 2),
-- Recent/Miscellaneous expenses
(14, 'OFFICE_SUPPLIES', 1200.00, 'Stationery and office supplies', CURRENT_TIMESTAMP, 4, 'CARD', null, 'Pens, papers, tags, and packaging materials', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(15, 'TRANSPORTATION', 2500.00, 'Delivery vehicle fuel and maintenance', CURRENT_TIMESTAMP, 5, 'CASH', null, 'Monthly transportation costs', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(16, 'MISCELLANEOUS', 800.00, 'Emergency repair - AC unit', CURRENT_TIMESTAMP, 5, 'CASH', null, 'Urgent AC repair during hot day', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(17, 'WATER', 500.00, 'Water bill - October 2025', CURRENT_TIMESTAMP, 4, 'UPI', null, 'Monthly water charges', 'salesmanager@foreignfits.com', 'admin@foreignfits.com', 'APPROVED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE expenses ALTER COLUMN id RESTART WITH 18;
