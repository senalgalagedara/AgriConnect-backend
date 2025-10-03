-- Migration: Add feedback_type column to feedback table
ALTER TABLE feedback
ADD COLUMN IF NOT EXISTS feedback_type VARCHAR(50) NOT NULL DEFAULT 'transactional';

-- Optional index for querying by feedback_type
CREATE INDEX IF NOT EXISTS idx_feedback_feedback_type ON feedback(feedback_type);

-- Verify
SELECT column_name, data_type FROM information_schema.columns WHERE table_name='feedback' AND column_name='feedback_type';
