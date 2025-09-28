-- Migration to add meta column to feedback table and modify constraints
-- Run this if the feedback table already exists

-- Add meta column
ALTER TABLE feedback ADD COLUMN IF NOT EXISTS meta JSONB;

-- Update constraints to make rating required and add defaults
ALTER TABLE feedback ALTER COLUMN rating SET NOT NULL;
ALTER TABLE feedback ALTER COLUMN user_type SET DEFAULT 'anonymous';
ALTER TABLE feedback ALTER COLUMN category SET DEFAULT 'general';
ALTER TABLE feedback ALTER COLUMN subject SET DEFAULT 'Feedback';

-- Update the check constraint for user_type (drop and recreate)
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_user_type_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_user_type_check 
    CHECK (user_type IN ('farmer', 'supplier', 'driver', 'admin', 'anonymous'));

-- Update the check constraint for category (drop and recreate)  
ALTER TABLE feedback DROP CONSTRAINT IF EXISTS feedback_category_check;
ALTER TABLE feedback ADD CONSTRAINT feedback_category_check 
    CHECK (category IN ('general', 'technical', 'service', 'suggestion', 'complaint'));

-- Create index on meta column for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_meta ON feedback USING GIN (meta);

-- Update any existing records with NULL rating to have a default value of 5
UPDATE feedback SET rating = 5 WHERE rating IS NULL;

COMMIT;