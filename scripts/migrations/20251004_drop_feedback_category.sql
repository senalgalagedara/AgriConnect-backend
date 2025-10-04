-- Migration: Drop category column from feedback table
-- Purpose: Remove obsolete category in favor of feedback_type
BEGIN;

-- Drop index if exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND indexname='idx_feedback_category') THEN
    EXECUTE 'DROP INDEX idx_feedback_category';
  END IF;
END$$;

-- Drop check constraint if exists (name may vary) - attempt known pattern
DO $$
DECLARE
  cons RECORD;
BEGIN
  FOR cons IN SELECT conname FROM pg_constraint WHERE conrelid = 'feedback'::regclass AND conname LIKE 'feedback_category_check%'
  LOOP
    EXECUTE format('ALTER TABLE feedback DROP CONSTRAINT %I', cons.conname);
  END LOOP;
END$$;

-- Drop the column if it exists
ALTER TABLE feedback DROP COLUMN IF EXISTS category;

COMMIT;