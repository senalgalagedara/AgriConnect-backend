-- Assignment Module SQL Queries
-- All database operations for the Assignment module

-- ===========================
-- CREATE OPERATIONS
-- ===========================

-- Create new assignment
INSERT INTO assignments (order_id, driver_id, schedule_time, special_notes, status)
VALUES ($1, $2, $3, $4, 'pending')
RETURNING *;

-- ===========================
-- READ OPERATIONS
-- ===========================

-- Get all assignments with pagination
SELECT 
  a.*,
  o.total as order_total,
  o.contact->>'name' as customer_name,
  o.contact->>'phone' as customer_phone,
  o.shipping->>'address' as delivery_address,
  o.shipping->>'city' as delivery_city,
  d.name as driver_name,
  d.phone_number as driver_phone,
  d.vehicle_type,
  COUNT(oi.id) as item_count,
  SUM(oi.qty) as total_quantity
FROM assignments a
LEFT JOIN orders o ON a.order_id = o.id
LEFT JOIN drivers d ON a.driver_id = d.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY a.id, o.id, d.id
ORDER BY a.assigned_at DESC
LIMIT $1 OFFSET $2;

-- Get total count of assignments
SELECT COUNT(*) as total FROM assignments;

-- Get assignment by ID with full details
SELECT 
  a.*,
  o.user_id,
  o.total as order_total,
  o.subtotal,
  o.tax,
  o.shipping_fee,
  o.status as order_status,
  o.contact,
  o.shipping,
  o.created_at as order_created_at,
  d.name as driver_name,
  d.phone_number as driver_phone,
  d.location as driver_location,
  d.vehicle_type,
  d.capacity as driver_capacity,
  d.availability_status as driver_availability,
  -- Order items
  array_agg(
    json_build_object(
      'product_id', oi.product_id,
      'name', oi.name,
      'price', oi.price,
      'qty', oi.qty,
      'total', oi.qty * oi.price
    )
  ) as order_items,
  COUNT(oi.id) as item_count,
  SUM(oi.qty) as total_quantity,
  SUM(oi.qty * oi.price) as items_total
FROM assignments a
JOIN orders o ON a.order_id = o.id
LEFT JOIN drivers d ON a.driver_id = d.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE a.id = $1
GROUP BY a.id, o.id, d.id;

-- Get assignments by driver
SELECT 
  a.*,
  o.total as order_total,
  o.contact->>'name' as customer_name,
  o.contact->>'phone' as customer_phone,
  o.shipping->>'address' as delivery_address,
  o.shipping->>'city' as delivery_city,
  COUNT(oi.id) as item_count
FROM assignments a
JOIN orders o ON a.order_id = o.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE a.driver_id = $1
GROUP BY a.id, o.id
ORDER BY a.schedule_time ASC;

-- Get assignments by status
SELECT 
  a.*,
  o.total as order_total,
  o.contact->>'name' as customer_name,
  d.name as driver_name,
  d.phone_number as driver_phone
FROM assignments a
JOIN orders o ON a.order_id = o.id
LEFT JOIN drivers d ON a.driver_id = d.id
WHERE a.status = $1
ORDER BY a.schedule_time ASC;

-- Get pending assignments
SELECT 
  a.*,
  o.total as order_total,
  o.contact->>'name' as customer_name,
  o.contact->>'phone' as customer_phone,
  o.shipping->>'address' as delivery_address,
  o.shipping->>'city' as delivery_city,
  d.name as driver_name,
  d.phone_number as driver_phone,
  COUNT(oi.id) as item_count,
  SUM(oi.qty) as total_quantity
FROM assignments a
JOIN orders o ON a.order_id = o.id
LEFT JOIN drivers d ON a.driver_id = d.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE a.status = 'pending'
GROUP BY a.id, o.id, d.id
ORDER BY a.schedule_time ASC;

-- Get today's assignments
SELECT 
  a.*,
  o.total as order_total,
  o.contact->>'name' as customer_name,
  o.contact->>'phone' as customer_phone,
  o.shipping->>'address' as delivery_address,
  d.name as driver_name,
  d.phone_number as driver_phone,
  d.vehicle_type
FROM assignments a
JOIN orders o ON a.order_id = o.id
LEFT JOIN drivers d ON a.driver_id = d.id
WHERE DATE(a.schedule_time) = CURRENT_DATE
ORDER BY a.schedule_time ASC;

-- Get assignments scheduled for date range
SELECT 
  a.*,
  o.total as order_total,
  o.contact->>'name' as customer_name,
  d.name as driver_name,
  o.shipping->>'city' as delivery_city
FROM assignments a
JOIN orders o ON a.order_id = o.id
LEFT JOIN drivers d ON a.driver_id = d.id
WHERE a.schedule_time BETWEEN $1 AND $2
ORDER BY a.schedule_time ASC;

-- Get overdue assignments
SELECT 
  a.*,
  o.total as order_total,
  o.contact->>'name' as customer_name,
  o.contact->>'phone' as customer_phone,
  d.name as driver_name,
  d.phone_number as driver_phone,
  (EXTRACT(EPOCH FROM (NOW() - a.schedule_time)) / 3600) as hours_overdue
FROM assignments a
JOIN orders o ON a.order_id = o.id
LEFT JOIN drivers d ON a.driver_id = d.id
WHERE a.schedule_time < NOW()
  AND a.status NOT IN ('completed', 'cancelled')
ORDER BY hours_overdue DESC;

-- ===========================
-- UPDATE OPERATIONS
-- ===========================

-- Update assignment status
UPDATE assignments 
SET status = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Accept assignment (driver accepts)
UPDATE assignments 
SET status = 'accepted', updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Start assignment
UPDATE assignments 
SET status = 'in_progress', started_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Complete assignment
UPDATE assignments 
SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Cancel assignment
UPDATE assignments 
SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Update assignment schedule time
UPDATE assignments 
SET schedule_time = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update assignment driver
UPDATE assignments 
SET driver_id = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update assignment notes
UPDATE assignments 
SET special_notes = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- ===========================
-- DELETE OPERATIONS
-- ===========================

-- Delete assignment (hard delete)
DELETE FROM assignments WHERE id = $1;

-- ===========================
-- VALIDATION QUERIES
-- ===========================

-- Check if order exists and can be assigned
SELECT COUNT(*) FROM orders 
WHERE id = $1 
  AND status IN ('pending', 'confirmed') 
  AND assignment_status = 'unassigned';

-- Check if driver exists and is available
SELECT COUNT(*) FROM drivers 
WHERE id = $1 
  AND status = 'active' 
  AND availability_status = 'available';

-- Check if assignment exists and belongs to driver
SELECT COUNT(*) FROM assignments 
WHERE id = $1 AND driver_id = $2;

-- Check if assignment can be updated/cancelled
SELECT COUNT(*) FROM assignments 
WHERE id = $1 AND status IN ('pending', 'accepted');

-- Check driver capacity for assignment
SELECT 
  d.capacity,
  COALESCE(SUM(oi.qty), 0) as required_capacity,
  CASE 
    WHEN d.capacity >= COALESCE(SUM(oi.qty), 0) THEN 'sufficient'
    ELSE 'insufficient'
  END as capacity_status
FROM drivers d
CROSS JOIN orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE d.id = $1 AND o.id = $2
GROUP BY d.id, d.capacity;

-- ===========================
-- BUSINESS LOGIC QUERIES
-- ===========================

-- Create assignment with related updates (transaction)
WITH assignment_insert AS (
  INSERT INTO assignments (order_id, driver_id, schedule_time, special_notes, status)
  VALUES ($1, $2, $3, $4, 'pending')
  RETURNING *
),
order_update AS (
  UPDATE orders 
  SET assignment_status = 'assigned', status = 'assigned', updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING *
),
driver_update AS (
  UPDATE drivers 
  SET availability_status = 'busy', updated_at = CURRENT_TIMESTAMP
  WHERE id = $2
  RETURNING *
)
SELECT * FROM assignment_insert;

-- Complete assignment with related updates
WITH assignment_complete AS (
  UPDATE assignments 
  SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING *
),
order_complete AS (
  UPDATE orders 
  SET status = 'delivered', assignment_status = 'completed', updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT order_id FROM assignment_complete)
  RETURNING *
),
driver_available AS (
  UPDATE drivers 
  SET availability_status = 'available', updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT driver_id FROM assignment_complete)
  RETURNING *
)
SELECT * FROM assignment_complete;

-- Cancel assignment with cleanup
WITH assignment_cancel AS (
  UPDATE assignments 
  SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING *
),
order_reset AS (
  UPDATE orders 
  SET assignment_status = 'unassigned', status = 'confirmed', updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT order_id FROM assignment_cancel)
  RETURNING *
),
driver_available AS (
  UPDATE drivers 
  SET availability_status = 'available', updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT driver_id FROM assignment_cancel)
  RETURNING *
)
SELECT * FROM assignment_cancel;

-- ===========================
-- REPORTING QUERIES
-- ===========================

-- Assignment performance report
SELECT 
  DATE(a.assigned_at) as assignment_date,
  COUNT(a.id) as total_assignments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
  COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_assignments,
  COUNT(CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN 1 END) as active_assignments,
  ROUND(
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(a.id), 0) * 100, 2
  ) as completion_rate,
  AVG(
    CASE WHEN a.completed_at IS NOT NULL AND a.started_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (a.completed_at - a.started_at)) / 3600 
    END
  ) as avg_completion_hours,
  SUM(o.total) as total_delivery_value
FROM assignments a
LEFT JOIN orders o ON a.order_id = o.id
WHERE a.assigned_at >= $1
GROUP BY DATE(a.assigned_at)
ORDER BY assignment_date DESC;

-- Driver assignment workload
SELECT 
  d.id as driver_id,
  d.name as driver_name,
  d.location,
  d.capacity,
  COUNT(a.id) as total_assignments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
  COUNT(CASE WHEN a.status IN ('pending', 'accepted', 'in_progress') THEN 1 END) as active_assignments,
  AVG(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600) as avg_assignment_hours,
  SUM(o.total) as total_delivery_value,
  MAX(a.completed_at) as last_delivery
FROM drivers d
LEFT JOIN assignments a ON d.id = a.driver_id
LEFT JOIN orders o ON a.order_id = o.id
WHERE d.status = 'active'
  AND (a.assigned_at >= $1 OR a.assigned_at IS NULL)
GROUP BY d.id, d.name, d.location, d.capacity
ORDER BY total_assignments DESC;

-- Assignment timing analysis
SELECT 
  AVG(EXTRACT(EPOCH FROM (a.started_at - a.assigned_at)) / 3600) as avg_acceptance_hours,
  AVG(EXTRACT(EPOCH FROM (a.completed_at - a.started_at)) / 3600) as avg_delivery_hours,
  AVG(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600) as avg_total_hours,
  MIN(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600) as min_total_hours,
  MAX(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600) as max_total_hours
FROM assignments a
WHERE a.status = 'completed'
  AND a.assigned_at >= $1
  AND a.started_at IS NOT NULL
  AND a.completed_at IS NOT NULL;

-- Late delivery analysis
SELECT 
  COUNT(a.id) as total_assignments,
  COUNT(CASE WHEN a.completed_at > a.schedule_time THEN 1 END) as late_deliveries,
  ROUND(
    COUNT(CASE WHEN a.completed_at > a.schedule_time THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(a.id), 0) * 100, 2
  ) as late_delivery_rate,
  AVG(
    CASE WHEN a.completed_at > a.schedule_time 
    THEN EXTRACT(EPOCH FROM (a.completed_at - a.schedule_time)) / 3600 
    END
  ) as avg_delay_hours
FROM assignments a
WHERE a.status = 'completed'
  AND a.assigned_at >= $1;

-- Assignment location analysis
SELECT 
  o.shipping->>'city' as delivery_city,
  o.shipping->>'province' as delivery_province,
  COUNT(a.id) as total_assignments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
  AVG(o.total) as avg_order_value,
  AVG(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600) as avg_delivery_hours,
  COUNT(DISTINCT a.driver_id) as unique_drivers
FROM assignments a
JOIN orders o ON a.order_id = o.id
WHERE a.assigned_at >= $1
GROUP BY o.shipping->>'city', o.shipping->>'province'
ORDER BY total_assignments DESC;