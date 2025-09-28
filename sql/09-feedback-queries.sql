-- Feedback Module SQL Queries
-- All database operations for the Feedback module

-- ===========================
-- CREATE OPERATIONS
-- ===========================

-- Create new feedback
INSERT INTO feedback (
  user_id, user_type, category, subject, message, 
  rating, priority, attachments, meta
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- ===========================
-- READ OPERATIONS
-- ===========================

-- Get all feedback with pagination and user info
SELECT 
  f.*,
  CASE 
    WHEN f.user_type = 'farmer' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM farmers WHERE id = f.user_id LIMIT 1)
    WHEN f.user_type = 'driver' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM drivers WHERE id = f.user_id LIMIT 1)
    ELSE 'Anonymous User'
  END as user_name
FROM feedback f
ORDER BY f.created_at DESC, f.priority DESC
LIMIT $1 OFFSET $2;

-- Get total count of feedback
SELECT COUNT(*) as total FROM feedback;

-- Get feedback by ID with user info
SELECT 
  f.*,
  CASE 
    WHEN f.user_type = 'farmer' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM farmers WHERE id = f.user_id LIMIT 1)
    WHEN f.user_type = 'driver' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM drivers WHERE id = f.user_id LIMIT 1)
    ELSE 'Anonymous User'
  END as user_name,
  CASE 
    WHEN f.user_type = 'farmer' AND f.user_id IS NOT NULL THEN
      (SELECT contact_number FROM farmers WHERE id = f.user_id LIMIT 1)
    WHEN f.user_type = 'driver' AND f.user_id IS NOT NULL THEN
      (SELECT phone_number FROM drivers WHERE id = f.user_id LIMIT 1)
    ELSE NULL
  END as user_contact
FROM feedback f
WHERE f.id = $1;

-- Get feedback by user
SELECT * FROM feedback 
WHERE user_id = $1 AND user_type = $2
ORDER BY created_at DESC;

-- Get feedback by category
SELECT 
  f.*,
  CASE 
    WHEN f.user_type = 'farmer' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM farmers WHERE id = f.user_id LIMIT 1)
    ELSE 'Anonymous User'
  END as user_name
FROM feedback f
WHERE f.category = $1
ORDER BY f.created_at DESC;

-- Get feedback by status
SELECT 
  f.*,
  CASE 
    WHEN f.user_type = 'farmer' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM farmers WHERE id = f.user_id LIMIT 1)
    WHEN f.user_type = 'driver' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM drivers WHERE id = f.user_id LIMIT 1)
    ELSE 'Anonymous User'
  END as user_name
FROM feedback f
WHERE f.status = $1
ORDER BY f.created_at DESC;

-- Get feedback by priority
SELECT 
  f.*,
  CASE 
    WHEN f.user_type = 'farmer' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM farmers WHERE id = f.user_id LIMIT 1)
    ELSE 'Anonymous User'
  END as user_name
FROM feedback f
WHERE f.priority = $1
ORDER BY f.created_at DESC;

-- Get feedback by rating
SELECT 
  f.*,
  CASE 
    WHEN f.user_type = 'farmer' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM farmers WHERE id = f.user_id LIMIT 1)
    ELSE 'Anonymous User'
  END as user_name
FROM feedback f
WHERE f.rating = $1
ORDER BY f.created_at DESC;

-- Get feedback by date range
SELECT 
  f.*,
  CASE 
    WHEN f.user_type = 'farmer' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM farmers WHERE id = f.user_id LIMIT 1)
    ELSE 'Anonymous User'
  END as user_name
FROM feedback f
WHERE f.created_at BETWEEN $1 AND $2
ORDER BY f.created_at DESC;

-- Search feedback by subject or message
SELECT 
  f.*,
  CASE 
    WHEN f.user_type = 'farmer' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM farmers WHERE id = f.user_id LIMIT 1)
    ELSE 'Anonymous User'
  END as user_name
FROM feedback f
WHERE LOWER(f.subject) LIKE LOWER($1) 
   OR LOWER(f.message) LIKE LOWER($1)
ORDER BY f.created_at DESC;

-- Get pending feedback (needs attention)
SELECT 
  f.*,
  CASE 
    WHEN f.user_type = 'farmer' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM farmers WHERE id = f.user_id LIMIT 1)
    WHEN f.user_type = 'driver' AND f.user_id IS NOT NULL THEN
      (SELECT name FROM drivers WHERE id = f.user_id LIMIT 1)
    ELSE 'Anonymous User'
  END as user_name
FROM feedback f
WHERE f.status = 'pending'
ORDER BY 
  CASE f.priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    ELSE 4 
  END,
  f.created_at ASC;

-- Get feedback with attachments
SELECT * FROM feedback 
WHERE attachments IS NOT NULL 
  AND json_array_length(attachments) > 0
ORDER BY created_at DESC;

-- ===========================
-- UPDATE OPERATIONS
-- ===========================

-- Update feedback status
UPDATE feedback 
SET status = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update feedback priority
UPDATE feedback 
SET priority = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Add admin response/notes
UPDATE feedback 
SET admin_notes = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Resolve feedback
UPDATE feedback 
SET status = 'resolved', 
    resolved_at = CURRENT_TIMESTAMP, 
    resolved_by = $1,
    admin_notes = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $3
RETURNING *;

-- Mark feedback as in progress
UPDATE feedback 
SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Close feedback
UPDATE feedback 
SET status = 'closed', updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Update feedback subject and message (if needed)
UPDATE feedback 
SET subject = $1, message = $2, updated_at = CURRENT_TIMESTAMP
WHERE id = $3
RETURNING *;

-- Update feedback meta information
UPDATE feedback 
SET meta = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- ===========================
-- DELETE OPERATIONS
-- ===========================

-- Delete feedback (hard delete)
DELETE FROM feedback WHERE id = $1;

-- ===========================
-- VALIDATION QUERIES
-- ===========================

-- Check if user exists based on user_type
SELECT 
  CASE 
    WHEN $2 = 'farmer' THEN (SELECT COUNT(*) FROM farmers WHERE id = $1)
    WHEN $2 = 'driver' THEN (SELECT COUNT(*) FROM drivers WHERE id = $1)
    ELSE 1 -- Allow anonymous
  END as user_exists;

-- Validate rating range
SELECT CASE WHEN $1 BETWEEN 1 AND 5 THEN 1 ELSE 0 END as valid_rating;

-- Check if feedback can be updated by user
SELECT COUNT(*) FROM feedback 
WHERE id = $1 
  AND user_id = $2 
  AND user_type = $3 
  AND status = 'pending';

-- ===========================
-- AGGREGATION QUERIES
-- ===========================

-- Get feedback summary statistics
SELECT 
  COUNT(*) as total_feedback,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
  COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count,
  ROUND(AVG(rating), 2) as avg_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star_count,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star_count,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star_count,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star_count,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star_count
FROM feedback
WHERE created_at >= $1;

-- Get feedback by category summary
SELECT 
  category,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
  ROUND(AVG(rating), 2) as avg_rating,
  COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_count,
  COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_count
FROM feedback
WHERE created_at >= $1
GROUP BY category
ORDER BY total_count DESC;

-- Get feedback by user type summary
SELECT 
  user_type,
  COUNT(*) as total_count,
  ROUND(AVG(rating), 2) as avg_rating,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
  ROUND(
    COUNT(CASE WHEN status = 'resolved' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(*), 0) * 100, 2
  ) as resolution_rate
FROM feedback
WHERE created_at >= $1
GROUP BY user_type
ORDER BY total_count DESC;

-- Get monthly feedback trends
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as total_feedback,
  ROUND(AVG(rating), 2) as avg_rating,
  COUNT(CASE WHEN category = 'complaint' THEN 1 END) as complaints,
  COUNT(CASE WHEN category = 'suggestion' THEN 1 END) as suggestions,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count
FROM feedback
WHERE created_at >= $1
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ===========================
-- REPORTING QUERIES
-- ===========================

-- Comprehensive feedback report
SELECT 
  DATE(f.created_at) as feedback_date,
  COUNT(f.id) as total_feedback,
  COUNT(CASE WHEN f.status = 'resolved' THEN 1 END) as resolved_today,
  ROUND(AVG(f.rating), 2) as avg_rating,
  COUNT(CASE WHEN f.category = 'complaint' THEN 1 END) as complaints,
  COUNT(CASE WHEN f.category = 'suggestion' THEN 1 END) as suggestions,
  COUNT(CASE WHEN f.priority = 'urgent' THEN 1 END) as urgent_issues,
  COUNT(CASE WHEN f.user_type = 'farmer' THEN 1 END) as farmer_feedback,
  COUNT(CASE WHEN f.user_type = 'driver' THEN 1 END) as driver_feedback,
  COUNT(CASE WHEN f.user_type = 'anonymous' THEN 1 END) as anonymous_feedback
FROM feedback f
WHERE f.created_at >= $1
GROUP BY DATE(f.created_at)
ORDER BY feedback_date DESC;

-- Top issues by frequency
SELECT 
  category,
  subject,
  COUNT(*) as occurrence_count,
  ROUND(AVG(rating), 2) as avg_rating,
  COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
  array_agg(DISTINCT user_type) as affected_user_types
FROM feedback
WHERE created_at >= $1
GROUP BY category, subject
HAVING COUNT(*) >= $2 -- Minimum occurrences threshold
ORDER BY occurrence_count DESC
LIMIT 20;

-- Customer satisfaction analysis
SELECT 
  rating,
  COUNT(*) as count,
  ROUND(COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM feedback WHERE created_at >= $1) * 100, 2) as percentage,
  -- Common themes for each rating
  array_agg(DISTINCT category) as categories,
  array_agg(DISTINCT user_type) as user_types
FROM feedback
WHERE created_at >= $1
GROUP BY rating
ORDER BY rating DESC;

-- Response time analysis (for resolved feedback)
SELECT 
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as avg_resolution_hours,
  MIN(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as min_resolution_hours,
  MAX(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600) as max_resolution_hours,
  COUNT(*) as resolved_count,
  -- Response time by priority
  AVG(CASE WHEN priority = 'urgent' THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 END) as urgent_avg_hours,
  AVG(CASE WHEN priority = 'high' THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 END) as high_avg_hours,
  AVG(CASE WHEN priority = 'medium' THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 END) as medium_avg_hours,
  AVG(CASE WHEN priority = 'low' THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600 END) as low_avg_hours
FROM feedback
WHERE status = 'resolved' 
  AND resolved_at IS NOT NULL
  AND created_at >= $1;

-- Feedback with meta data analysis
SELECT 
  f.id,
  f.subject,
  f.rating,
  f.category,
  f.meta->>'orderId' as order_id,
  f.meta->>'userId' as meta_user_id,
  f.user_type,
  f.created_at,
  CASE 
    WHEN f.meta->>'orderId' IS NOT NULL THEN
      (SELECT status FROM orders WHERE id = (f.meta->>'orderId')::INTEGER)
    ELSE NULL
  END as related_order_status
FROM feedback f
WHERE f.meta IS NOT NULL
  AND f.created_at >= $1
ORDER BY f.created_at DESC;

-- Admin workload report (feedback resolution)
SELECT 
  resolved_by as admin_id,
  COUNT(*) as total_resolved,
  ROUND(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600), 2) as avg_resolution_hours,
  COUNT(CASE WHEN priority = 'urgent' THEN 1 END) as urgent_resolved,
  COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_resolved,
  MIN(resolved_at) as first_resolution,
  MAX(resolved_at) as last_resolution
FROM feedback
WHERE status = 'resolved' 
  AND resolved_by IS NOT NULL
  AND resolved_at >= $1
GROUP BY resolved_by
ORDER BY total_resolved DESC;