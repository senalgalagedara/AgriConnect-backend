-- Driver Module SQL Queries
-- All database operations for the Driver module

-- ===========================
-- CREATE OPERATIONS
-- ===========================

-- Create new driver
INSERT INTO drivers (name, phone_number, location, vehicle_type, capacity, availability_status, status)
VALUES ($1, $2, $3, $4, $5, 'available', 'active')
RETURNING *;

-- ===========================
-- READ OPERATIONS
-- ===========================

-- Get all drivers with pagination
SELECT * FROM drivers 
WHERE status = 'active'
ORDER BY name ASC
LIMIT $1 OFFSET $2;

-- Get total count of active drivers
SELECT COUNT(*) as total FROM drivers WHERE status = 'active';

-- Get driver by ID
SELECT * FROM drivers WHERE id = $1;

-- Get available drivers
SELECT * FROM drivers 
WHERE status = 'active' 
  AND availability_status = 'available'
ORDER BY name;

-- Get available drivers with capacity
SELECT 
  d.*,
  CASE 
    WHEN d.availability_status = 'available' AND d.capacity > $1 THEN 'suitable'
    WHEN d.availability_status = 'available' THEN 'limited_capacity'
    ELSE 'unavailable'
  END as suitability_status
FROM drivers d
WHERE d.status = 'active'
ORDER BY 
  CASE WHEN d.availability_status = 'available' AND d.capacity > $1 THEN 1 ELSE 2 END,
  d.capacity DESC;

-- Get drivers by location
SELECT * FROM drivers 
WHERE LOWER(location) LIKE LOWER($1) 
  AND status = 'active'
ORDER BY name;

-- Get drivers by vehicle type
SELECT * FROM drivers 
WHERE LOWER(vehicle_type) LIKE LOWER($1) 
  AND status = 'active'
ORDER BY capacity DESC;

-- Search drivers by name or phone
SELECT * FROM drivers 
WHERE (LOWER(name) LIKE LOWER($1) 
   OR phone_number LIKE $1)
  AND status = 'active'
ORDER BY name;

-- Get drivers with assignment statistics
SELECT 
  d.*,
  COUNT(a.id) as total_assignments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
  COUNT(CASE WHEN a.status = 'pending' THEN 1 END) as pending_assignments,
  COUNT(CASE WHEN a.status = 'in_progress' THEN 1 END) as active_assignments,
  MAX(a.completed_at) as last_completed_assignment,
  AVG(EXTRACT(EPOCH FROM (a.completed_at - a.started_at)) / 3600) as avg_completion_hours
FROM drivers d
LEFT JOIN assignments a ON d.id = a.driver_id
WHERE d.status = 'active'
GROUP BY d.id
ORDER BY d.name;

-- ===========================
-- UPDATE OPERATIONS
-- ===========================

-- Update driver details
UPDATE drivers 
SET name = $1, phone_number = $2, location = $3, 
    vehicle_type = $4, capacity = $5, updated_at = CURRENT_TIMESTAMP
WHERE id = $6
RETURNING *;

-- Update driver availability status
UPDATE drivers 
SET availability_status = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update driver status
UPDATE drivers 
SET status = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update driver location
UPDATE drivers 
SET location = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update driver capacity
UPDATE drivers 
SET capacity = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Mark driver as busy (when assigned)
UPDATE drivers 
SET availability_status = 'busy', updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Mark driver as available (when assignment completed)
UPDATE drivers 
SET availability_status = 'available', updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- ===========================
-- DELETE OPERATIONS
-- ===========================

-- Soft delete driver (set status to inactive)
UPDATE drivers 
SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Suspend driver
UPDATE drivers 
SET status = 'suspended', availability_status = 'offline', updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Hard delete driver (only if no dependencies)
DELETE FROM drivers WHERE id = $1;

-- ===========================
-- VALIDATION QUERIES
-- ===========================

-- Check if phone number exists (for unique validation)
SELECT COUNT(*) FROM drivers 
WHERE phone_number = $1 AND id != $2 AND status != 'inactive';

-- Check if driver has active assignments (before deletion)
SELECT COUNT(*) FROM assignments 
WHERE driver_id = $1 AND status IN ('pending', 'accepted', 'in_progress');

-- Check if driver is available for assignment
SELECT COUNT(*) FROM drivers 
WHERE id = $1 
  AND status = 'active' 
  AND availability_status = 'available';

-- Check driver capacity for assignment
SELECT 
  d.capacity,
  COALESCE(SUM(oi.qty), 0) as required_capacity,
  CASE 
    WHEN d.capacity >= COALESCE(SUM(oi.qty), 0) THEN true
    ELSE false
  END as can_handle
FROM drivers d
LEFT JOIN assignments a ON d.id = a.driver_id AND a.order_id = $2
LEFT JOIN order_items oi ON a.order_id = oi.order_id
WHERE d.id = $1
GROUP BY d.id, d.capacity;

-- ===========================
-- ASSIGNMENT SUPPORT QUERIES
-- ===========================

-- Get available drivers for specific location
SELECT 
  d.*,
  -- Calculate simple distance score (basic implementation)
  CASE 
    WHEN LOWER(d.location) LIKE LOWER('%' || $1 || '%') THEN 1
    ELSE 2
  END as location_priority
FROM drivers d
WHERE d.status = 'active' 
  AND d.availability_status = 'available'
  AND d.capacity >= $2 -- minimum capacity required
ORDER BY location_priority ASC, d.capacity DESC;

-- Get best driver for order (considering location and capacity)
SELECT 
  d.*,
  CASE 
    WHEN LOWER(d.location) LIKE LOWER('%' || $1 || '%') THEN 1
    ELSE 2
  END as location_score,
  CASE 
    WHEN d.capacity >= $2 * 2 THEN 1 -- Double capacity = best
    WHEN d.capacity >= $2 THEN 2     -- Sufficient capacity
    ELSE 3                           -- Limited capacity
  END as capacity_score,
  -- Performance score based on completion rate
  COALESCE(
    (completed_stats.completed_count::FLOAT / NULLIF(completed_stats.total_count, 0)) * 100, 
    0
  ) as completion_rate
FROM drivers d
LEFT JOIN (
  SELECT 
    driver_id,
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count
  FROM assignments
  WHERE created_at >= NOW() - INTERVAL '3 months'
  GROUP BY driver_id
) completed_stats ON d.id = completed_stats.driver_id
WHERE d.status = 'active' 
  AND d.availability_status = 'available'
  AND d.capacity >= $2
ORDER BY location_score ASC, capacity_score ASC, completion_rate DESC
LIMIT 5;

-- Get driver workload for today
SELECT 
  d.id,
  d.name,
  COUNT(a.id) as assignments_today,
  SUM(
    CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') 
    THEN 1 ELSE 0 END
  ) as active_assignments,
  d.availability_status
FROM drivers d
LEFT JOIN assignments a ON d.id = a.driver_id 
  AND DATE(a.assigned_at) = CURRENT_DATE
WHERE d.status = 'active'
GROUP BY d.id, d.name, d.availability_status
ORDER BY assignments_today ASC, d.name;

-- ===========================
-- REPORTING QUERIES
-- ===========================

-- Driver performance report
SELECT 
  d.id,
  d.name,
  d.phone_number,
  d.location,
  d.vehicle_type,
  d.capacity,
  d.availability_status,
  COUNT(a.id) as total_assignments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
  COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_assignments,
  ROUND(
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(a.id), 0) * 100, 2
  ) as completion_rate,
  AVG(
    CASE WHEN a.completed_at IS NOT NULL AND a.started_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (a.completed_at - a.started_at)) / 3600 
    END
  ) as avg_completion_hours,
  SUM(o.total) as total_delivery_value,
  MAX(a.completed_at) as last_delivery,
  d.created_at as registration_date
FROM drivers d
LEFT JOIN assignments a ON d.id = a.driver_id
LEFT JOIN orders o ON a.order_id = o.id
WHERE d.status = 'active'
GROUP BY d.id, d.name, d.phone_number, d.location, d.vehicle_type, d.capacity, d.availability_status, d.created_at
ORDER BY completion_rate DESC, total_assignments DESC;

-- Daily driver activity
SELECT 
  DATE(a.assigned_at) as assignment_date,
  COUNT(DISTINCT a.driver_id) as active_drivers,
  COUNT(a.id) as total_assignments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
  AVG(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600) as avg_assignment_hours,
  SUM(o.total) as total_delivery_value
FROM assignments a
JOIN orders o ON a.order_id = o.id
WHERE a.assigned_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(a.assigned_at)
ORDER BY assignment_date DESC;

-- Driver capacity utilization
SELECT 
  d.name,
  d.capacity as max_capacity,
  AVG(order_weight.total_weight) as avg_load_weight,
  MAX(order_weight.total_weight) as max_load_weight,
  ROUND(AVG(order_weight.total_weight) / d.capacity * 100, 2) as avg_capacity_utilization,
  COUNT(a.id) as total_deliveries
FROM drivers d
JOIN assignments a ON d.id = a.driver_id
JOIN (
  SELECT 
    o.id as order_id,
    SUM(oi.qty) as total_weight -- Assuming qty represents weight
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  GROUP BY o.id
) order_weight ON a.order_id = order_weight.order_id
WHERE a.status = 'completed'
  AND a.completed_at >= NOW() - INTERVAL '3 months'
GROUP BY d.id, d.name, d.capacity
HAVING COUNT(a.id) >= 5 -- Only drivers with at least 5 deliveries
ORDER BY avg_capacity_utilization DESC;

-- Driver location coverage
SELECT 
  d.location,
  COUNT(d.id) as driver_count,
  COUNT(CASE WHEN d.availability_status = 'available' THEN 1 END) as available_drivers,
  AVG(d.capacity) as avg_capacity,
  SUM(d.capacity) as total_capacity,
  COUNT(a.id) as total_assignments_this_month
FROM drivers d
LEFT JOIN assignments a ON d.id = a.driver_id 
  AND a.assigned_at >= DATE_TRUNC('month', CURRENT_DATE)
WHERE d.status = 'active'
GROUP BY d.location
ORDER BY driver_count DESC;

-- Top performing drivers (last 3 months)
SELECT 
  d.name,
  d.phone_number,
  d.location,
  COUNT(a.id) as deliveries_completed,
  SUM(o.total) as total_delivery_value,
  AVG(o.total) as avg_order_value,
  ROUND(AVG(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600), 2) as avg_delivery_time_hours,
  COUNT(DISTINCT DATE(a.assigned_at)) as active_days
FROM drivers d
JOIN assignments a ON d.id = a.driver_id
JOIN orders o ON a.order_id = o.id
WHERE a.status = 'completed'
  AND a.completed_at >= NOW() - INTERVAL '3 months'
GROUP BY d.id, d.name, d.phone_number, d.location
HAVING COUNT(a.id) >= 10 -- Minimum 10 deliveries
ORDER BY deliveries_completed DESC, avg_delivery_time_hours ASC
LIMIT 10;