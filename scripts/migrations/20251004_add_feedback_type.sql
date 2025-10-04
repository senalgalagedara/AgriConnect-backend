-- Migration: add feedback_type column to feedback table
-- Adds ENUM-like constrained text with default 'transactional'
BEGIN;

ALTER TABLE feedback 
  ADD COLUMN IF NOT EXISTS feedback_type TEXT NOT NULL DEFAULT 'transactional';

-- Backfill existing rows if NULL (older rows may not have default applied at creation time)
UPDATE feedback SET feedback_type = 'transactional' WHERE feedback_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_feedback_feedback_type ON feedback(feedback_type);

COMMIT;