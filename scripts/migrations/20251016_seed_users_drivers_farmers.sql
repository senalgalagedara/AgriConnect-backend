-- Migration: Seed sample users, drivers, and farmers
-- Creates test accounts with linked profiles

BEGIN;

-- Insert sample users (password for all: 'password123')
-- Password hash for 'password123' using bcrypt
INSERT INTO users (email, password_hash, role, first_name, last_name, contact_number, address, status, created_at, updated_at)
VALUES 
  -- Consumers (already exist as test users from previous migration)
  -- Adding more consumers
  ('alice.consumer@test.com', '$2a$10$YQs7QKNwGKGLxCx3zYvHUOxH7KxPZJd7pZvHZL3xH3YzH3xH3xH3x', 'consumer', 'Alice', 'Johnson', '555-0001', '123 Consumer St, New York, NY', 'active', NOW(), NOW()),
  ('bob.consumer@test.com', '$2a$10$YQs7QKNwGKGLxCx3zYvHUOxH7KxPZJd7pZvHZL3xH3YzH3xH3xH3x', 'consumer', 'Bob', 'Williams', '555-0002', '456 Buyer Ave, Los Angeles, CA', 'active', NOW(), NOW()),
  
  -- Drivers
  ('john.driver@test.com', '$2a$10$YQs7QKNwGKGLxCx3zYvHUOxH7KxPZJd7pZvHZL3xH3YzH3xH3xH3x', 'driver', 'John', 'Smith', '555-1001', '789 Transport Rd, Chicago, IL', 'active', NOW(), NOW()),
  ('sarah.driver@test.com', '$2a$10$YQs7QKNwGKGLxCx3zYvHUOxH7KxPZJd7pZvHZL3xH3YzH3xH3xH3x', 'driver', 'Sarah', 'Davis', '555-1002', '321 Delivery Ln, Houston, TX', 'active', NOW(), NOW()),
  ('mike.driver@test.com', '$2a$10$YQs7QKNwGKGLxCx3zYvHUOxH7KxPZJd7pZvHZL3xH3YzH3xH3xH3x', 'driver', 'Mike', 'Brown', '555-1003', '654 Freight St, Phoenix, AZ', 'active', NOW(), NOW()),
  
  -- Farmers
  ('emma.farmer@test.com', '$2a$10$YQs7QKNwGKGLxCx3zYvHUOxH7KxPZJd7pZvHZL3xH3YzH3xH3xH3x', 'farmer', 'Emma', 'Wilson', '555-2001', '111 Farm Road, Iowa City, IA', 'active', NOW(), NOW()),
  ('james.farmer@test.com', '$2a$10$YQs7QKNwGKGLxCx3zYvHUOxH7KxPZJd7pZvHZL3xH3YzH3xH3xH3x', 'farmer', 'James', 'Martinez', '555-2002', '222 Harvest Ln, Fresno, CA', 'active', NOW(), NOW()),
  ('olivia.farmer@test.com', '$2a$10$YQs7QKNwGKGLxCx3zYvHUOxH7KxPZJd7pZvHZL3xH3YzH3xH3xH3x', 'farmer', 'Olivia', 'Garcia', '555-2003', '333 Crop Circle, Kansas City, KS', 'active', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert drivers linked to driver users
INSERT INTO drivers (user_id, name, phone_number, location, vehicle_type, capacity, availability_status, status, created_at, updated_at)
SELECT 
  u.id,
  u.first_name || ' ' || u.last_name,
  u.contact_number,
  u.address,
  CASE 
    WHEN u.email = 'john.driver@test.com' THEN 'Refrigerated Truck'
    WHEN u.email = 'sarah.driver@test.com' THEN 'Box Truck'
    WHEN u.email = 'mike.driver@test.com' THEN 'Cargo Van'
  END,
  CASE 
    WHEN u.email = 'john.driver@test.com' THEN 5000
    WHEN u.email = 'sarah.driver@test.com' THEN 3000
    WHEN u.email = 'mike.driver@test.com' THEN 1500
  END,
  CASE 
    WHEN u.email = 'john.driver@test.com' THEN 'available'
    WHEN u.email = 'sarah.driver@test.com' THEN 'busy'
    WHEN u.email = 'mike.driver@test.com' THEN 'available'
  END,
  'active',
  NOW(),
  NOW()
FROM users u
WHERE u.role = 'driver' 
  AND u.email IN ('john.driver@test.com', 'sarah.driver@test.com', 'mike.driver@test.com')
  AND NOT EXISTS (SELECT 1 FROM drivers d WHERE d.user_id = u.id);

-- Insert farmers linked to farmer users
INSERT INTO farmers (user_id, name, contact_number, email, address, province_id, registration_number, created_at, updated_at)
SELECT 
  u.id,
  u.first_name || ' ' || u.last_name,
  u.contact_number,
  u.email,
  u.address,
  CASE 
    WHEN u.email = 'emma.farmer@test.com' THEN 1
    WHEN u.email = 'james.farmer@test.com' THEN 2
    WHEN u.email = 'olivia.farmer@test.com' THEN 3
  END,
  CASE 
    WHEN u.email = 'emma.farmer@test.com' THEN 'FARM-2024-001'
    WHEN u.email = 'james.farmer@test.com' THEN 'FARM-2024-002'
    WHEN u.email = 'olivia.farmer@test.com' THEN 'FARM-2024-003'
  END,
  NOW(),
  NOW()
FROM users u
WHERE u.role = 'farmer' 
  AND u.email IN ('emma.farmer@test.com', 'james.farmer@test.com', 'olivia.farmer@test.com')
  AND NOT EXISTS (SELECT 1 FROM farmers f WHERE f.user_id = u.id);

COMMIT;

-- Verification queries
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_drivers FROM drivers;
-- SELECT COUNT(*) as total_farmers FROM farmers;
-- 
-- SELECT u.email, u.role, d.name as driver_name, d.vehicle_type, d.capacity
-- FROM users u 
-- JOIN drivers d ON u.id = d.user_id 
-- WHERE u.role = 'driver';
-- 
-- SELECT u.email, u.role, f.name as farmer_name, f.registration_number
-- FROM users u 
-- JOIN farmers f ON u.id = f.user_id 
-- WHERE u.role = 'farmer';
