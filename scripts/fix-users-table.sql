-- Fix users table structure to match the service expectations
-- This will update the existing users table to support the fields expected by the user service

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Update the role check constraint to match service expectations
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'farmer', 'supplier', 'driver', 'customer', 'consumer'));

-- Create the trigger for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update existing users to have default values if needed
UPDATE users SET 
  name = COALESCE(name, 'User'),
  phone = COALESCE(phone, ''),
  address = COALESCE(address, ''),
  updated_at = COALESCE(updated_at, created_at)
WHERE name IS NULL OR phone IS NULL OR address IS NULL OR updated_at IS NULL;