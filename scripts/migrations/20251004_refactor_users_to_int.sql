-- WARNING: Destructive migration converting users & sessions to integer IDs.
-- Run only if you intend to DROP existing UUID-based data.
-- Steps:
-- 1. Drop dependent tables or constraints referencing users.id (adjust as needed).
-- 2. Recreate users and sessions with SERIAL integer primary keys.
-- 3. Adjust related tables (carts, orders, feedback) user_id columns to INTEGER and add FKs.

BEGIN;

-- Example: if existing sessions table referencing UUID
DROP TABLE IF EXISTS sessions CASCADE;

-- Drop users last
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  contact_number TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Adjust domain tables (examples - adjust if schema differs)
ALTER TABLE IF EXISTS carts
  ALTER COLUMN user_id TYPE INTEGER USING user_id::integer,
  ADD CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS orders
  ALTER COLUMN user_id TYPE INTEGER USING user_id::integer,
  ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS feedback
  ALTER COLUMN user_id TYPE INTEGER USING user_id::integer,
  ADD CONSTRAINT fk_feedback_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

COMMIT;
