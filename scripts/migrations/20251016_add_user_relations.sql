-- Migration: Add user_id foreign keys to drivers and farmers tables
-- This allows linking user accounts to their specific role profiles

BEGIN;

-- Add user_id column to drivers table
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Add foreign key constraint
ALTER TABLE drivers 
  ADD CONSTRAINT fk_drivers_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Create unique index to ensure one driver profile per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);

-- Add user_id column to farmers table
ALTER TABLE farmers ADD COLUMN IF NOT EXISTS user_id INTEGER;

-- Add foreign key constraint
ALTER TABLE farmers 
  ADD CONSTRAINT fk_farmers_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- Create unique index to ensure one farmer profile per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);

-- Add comment to explain the relationship
COMMENT ON COLUMN drivers.user_id IS 'Foreign key to users table - links driver profile to user account';
COMMENT ON COLUMN farmers.user_id IS 'Foreign key to users table - links farmer profile to user account';

COMMIT;

-- Verification queries (run these to check the relationships)
-- SELECT * FROM drivers WHERE user_id IS NOT NULL;
-- SELECT * FROM farmers WHERE user_id IS NOT NULL;
-- SELECT u.email, u.role, d.name as driver_name FROM users u LEFT JOIN drivers d ON u.id = d.user_id WHERE u.role = 'driver';
-- SELECT u.email, u.role, f.name as farmer_name FROM users u LEFT JOIN farmers f ON u.id = f.user_id WHERE u.role = 'farmer';
