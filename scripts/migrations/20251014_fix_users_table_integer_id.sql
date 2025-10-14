-- Migration: Fix users table to use INTEGER IDs instead of UUID
-- This migration safely updates the users table structure to match other tables
-- Date: 2025-10-14

BEGIN;

-- Check if users table exists with UUID
DO $$
BEGIN
  -- Drop existing users table if it uses UUID (we'll preserve data if possible)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    -- Backup existing users data to a temporary table
    CREATE TEMP TABLE users_backup AS SELECT * FROM users;
    
    -- Drop the old users table
    DROP TABLE IF EXISTS users CASCADE;
    
    RAISE NOTICE 'Old UUID-based users table dropped. Data backed up.';
  END IF;
END $$;

-- Create or recreate users table with INTEGER ID (SERIAL)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  contact_number VARCHAR(20),
  address TEXT,
  role VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'consumer', 'driver', 'admin')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Create or replace trigger function for updated_at
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();

-- Update related tables to use INTEGER for user_id if they exist
DO $$
BEGIN
  -- Update carts table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'carts') THEN
    -- Check if user_id column exists and is not already INTEGER
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'carts' AND column_name = 'user_id' 
      AND data_type NOT IN ('integer', 'bigint', 'smallint')
    ) THEN
      ALTER TABLE carts 
        ALTER COLUMN user_id TYPE INTEGER USING user_id::integer;
      
      -- Add foreign key constraint if not exists
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'carts' AND constraint_name = 'fk_carts_user'
      ) THEN
        ALTER TABLE carts 
          ADD CONSTRAINT fk_carts_user 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
      
      RAISE NOTICE 'Updated carts.user_id to INTEGER';
    END IF;
  END IF;

  -- Update orders table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orders' AND column_name = 'user_id' 
      AND data_type NOT IN ('integer', 'bigint', 'smallint')
    ) THEN
      ALTER TABLE orders 
        ALTER COLUMN user_id TYPE INTEGER USING user_id::integer;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'orders' AND constraint_name = 'fk_orders_user'
      ) THEN
        ALTER TABLE orders 
          ADD CONSTRAINT fk_orders_user 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
      END IF;
      
      RAISE NOTICE 'Updated orders.user_id to INTEGER';
    END IF;
  END IF;

  -- Update feedback table
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feedback') THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'feedback' AND column_name = 'user_id' 
      AND data_type NOT IN ('integer', 'bigint', 'smallint')
    ) THEN
      ALTER TABLE feedback 
        ALTER COLUMN user_id TYPE INTEGER USING user_id::integer;
      
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'feedback' AND constraint_name = 'fk_feedback_user'
      ) THEN
        ALTER TABLE feedback 
          ADD CONSTRAINT fk_feedback_user 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
      END IF;
      
      RAISE NOTICE 'Updated feedback.user_id to INTEGER';
    END IF;
  END IF;

  -- Update resolved_by in feedback table
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'feedback' AND column_name = 'resolved_by' 
    AND data_type NOT IN ('integer', 'bigint', 'smallint')
  ) THEN
    ALTER TABLE feedback 
      ALTER COLUMN resolved_by TYPE INTEGER USING resolved_by::integer;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE table_name = 'feedback' AND constraint_name = 'fk_feedback_resolved_by'
    ) THEN
      ALTER TABLE feedback 
        ADD CONSTRAINT fk_feedback_resolved_by 
        FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    RAISE NOTICE 'Updated feedback.resolved_by to INTEGER';
  END IF;

END $$;

-- Insert a default admin user if table is empty
INSERT INTO users (email, first_name, last_name, role, password_hash, status)
SELECT 
  'admin@agriconnect.com',
  'Admin',
  'User',
  'admin',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2SA2JOQAf6', -- password: Admin@123
  'active'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@agriconnect.com');

COMMIT;

-- Print success message
DO $$
BEGIN
  RAISE NOTICE '✓ Migration completed successfully!';
  RAISE NOTICE '✓ Users table now uses INTEGER IDs';
  RAISE NOTICE '✓ Default admin user created: admin@agriconnect.com / Admin@123';
END $$;
