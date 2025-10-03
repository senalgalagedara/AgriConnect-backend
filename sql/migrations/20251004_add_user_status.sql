-- Migration: add status column to users table
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active','inactive'));

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
