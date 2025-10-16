-- Migration: Create test users if none exist
-- Date: 2025-10-16
-- Description: Ensure at least one test user exists for testing cart functionality

BEGIN;

-- Check if users table is empty and insert test users
INSERT INTO users (id, email, password_hash, role, first_name, last_name, contact_number, status, created_at, updated_at)
SELECT 1, 'consumer@test.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234', 'consumer', 'Test', 'Consumer', '0771234567', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 1);

INSERT INTO users (id, email, password_hash, role, first_name, last_name, contact_number, status, created_at, updated_at)
SELECT 2, 'farmer@test.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234', 'farmer', 'Test', 'Farmer', '0772234567', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 2);

INSERT INTO users (id, email, password_hash, role, first_name, last_name, contact_number, status, created_at, updated_at)
SELECT 3, 'admin@test.com', '$2a$10$abcdefghijklmnopqrstuvwxyz123456789012345678901234', 'admin', 'Test', 'Admin', '0773234567', 'active', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE id = 3);

-- Update sequence to start from 4
SELECT setval('users_id_seq', GREATEST(4, (SELECT COALESCE(MAX(id), 0) + 1 FROM users)));

COMMIT;

-- Migration complete: Test users created
