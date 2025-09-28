-- Feedback table SQL script
CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_type VARCHAR(20) DEFAULT 'anonymous' CHECK (user_type IN ('farmer', 'supplier', 'driver', 'admin', 'anonymous')),
    category VARCHAR(20) DEFAULT 'general' CHECK (category IN ('general', 'technical', 'service', 'suggestion', 'complaint')),
    subject VARCHAR(255) DEFAULT 'Feedback',
    message TEXT NOT NULL, -- This stores the 'comment' from frontend
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5), -- Made required for frontend
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    attachments JSONB,
    meta JSONB, -- New field for frontend meta data (orderId, userId, etc.)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INTEGER,
    admin_notes TEXT
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_type ON feedback(user_type);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON feedback 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();