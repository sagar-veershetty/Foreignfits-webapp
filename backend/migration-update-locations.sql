-- Migration Script: Update Location Names
-- This script updates location names without deleting any data
-- Safe to run on production database

-- Update location ID 1 (Supplier)
UPDATE locations 
SET name = 'Supplier (warehouse)',
    city = 'Mumbai',
    state = 'Maharashtra'
WHERE id = 1;

-- Update location ID 2 (Main Warehouse)
UPDATE locations 
SET name = 'Main Warehouse (warehouse)',
    city = 'Bidar',
    state = 'Karnataka',
    address = 'Main Warehouse District'
WHERE id = 2;

-- Update or Insert location ID 3 (Secondary Warehouse)
-- First check if it exists
INSERT INTO locations (id, name, type, address, city, state, zip_code, phone, manager, capacity, is_active, created_at, updated_at)
VALUES (3, 'Secondary Warehouse (warehouse)', 'WAREHOUSE', 'Secondary Warehouse District', 'Bidar', 'Karnataka', '585402', '+91-8482-234567', 'Warehouse Manager 2', 8000, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO UPDATE SET
    name = 'Secondary Warehouse (warehouse)',
    type = 'WAREHOUSE',
    address = 'Secondary Warehouse District',
    city = 'Bidar',
    state = 'Karnataka',
    zip_code = '585402',
    phone = '+91-8482-234567',
    manager = 'Warehouse Manager 2',
    capacity = 8000,
    is_active = true,
    updated_at = CURRENT_TIMESTAMP;

-- Update location ID 4 (Wholesale Store)
-- This was previously "Foreign Fits Ganga" or location ID 3
UPDATE locations 
SET name = 'Wholesale Store - Adarsh Colony (store)',
    type = 'STORE',
    address = 'Adarsh Colony',
    city = 'Bidar',
    state = 'Karnataka',
    zip_code = '585401',
    phone = '+91-8482-345678',
    manager = 'Store Manager 1',
    capacity = 1500
WHERE (id = 4 OR name LIKE '%Ganga%') AND type = 'STORE';

-- Update location ID 5 (Retail Store)
-- This was previously "Foreign Fits Yamuna" or location ID 4
UPDATE locations 
SET name = 'Retail Store - Mohan Market (store)',
    type = 'STORE',
    address = 'Mohan Market',
    city = 'Bidar',
    state = 'Karnataka',
    zip_code = '585401',
    phone = '+91-8482-456789',
    manager = 'Store Manager 2',
    capacity = 800
WHERE (id = 5 OR name LIKE '%Yamuna%') AND type = 'STORE';

-- Verify the updates
SELECT id, name, type, city, state FROM locations ORDER BY id;
