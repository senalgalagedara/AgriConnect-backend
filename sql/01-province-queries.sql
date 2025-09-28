-- Province Module SQL Queries
-- All database operations for the Province module

-- ===========================
-- CREATE OPERATIONS
-- ===========================

-- Create new province
INSERT INTO provinces (name, capacity, location, manager_name)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- ===========================
-- READ OPERATIONS
-- ===========================

-- Get all provinces with pagination
SELECT * FROM provinces 
WHERE status = 'active'
ORDER BY name ASC
LIMIT $1 OFFSET $2;

-- Get total count of active provinces
SELECT COUNT(*) as total FROM provinces WHERE status = 'active';

-- Get province by ID
SELECT * FROM provinces WHERE id = $1;

-- Get province by name
SELECT * FROM provinces WHERE LOWER(name) = LOWER($1);

-- Get provinces with farmer count
SELECT 
  p.*,
  COUNT(f.id) as farmer_count
FROM provinces p
LEFT JOIN farmers f ON p.id = f.province_id
GROUP BY p.id
ORDER BY p.name;

-- Get provinces with product count
SELECT 
  p.*,
  COUNT(DISTINCT pr.id) as product_count
FROM provinces p
LEFT JOIN products pr ON p.id = pr.province_id
GROUP BY p.id
ORDER BY p.name;

-- Get provinces with statistics
SELECT 
  p.*,
  COUNT(DISTINCT f.id) as farmer_count,
  COUNT(DISTINCT pr.id) as product_count,
  COALESCE(SUM(pr.current_stock), 0) as total_stock
FROM provinces p
LEFT JOIN farmers f ON p.id = f.province_id
LEFT JOIN products pr ON p.id = pr.province_id
GROUP BY p.id
ORDER BY p.name;

-- Search provinces by name or location
SELECT * FROM provinces 
WHERE LOWER(name) LIKE LOWER($1) 
   OR LOWER(location) LIKE LOWER($1)
ORDER BY name;

-- ===========================
-- UPDATE OPERATIONS
-- ===========================

-- Update province details
UPDATE provinces 
SET name = $1, capacity = $2, location = $3, manager_name = $4, updated_at = NOW()
WHERE id = $5
RETURNING *;

-- Update province capacity
UPDATE provinces 
SET capacity = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- Update province manager
UPDATE provinces 
SET manager_name = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- ===========================
-- DELETE OPERATIONS
-- ===========================

-- Soft delete province (set status to inactive)
UPDATE provinces 
SET status = 'inactive', updated_at = NOW()
WHERE id = $1
RETURNING *;

-- Hard delete province (only if no dependencies)
DELETE FROM provinces WHERE id = $1;

-- ===========================
-- VALIDATION QUERIES
-- ===========================

-- Check if province name exists (for unique validation)
SELECT COUNT(*) FROM provinces WHERE LOWER(name) = LOWER($1) AND id != $2;

-- Check if province has farmers (before deletion)
SELECT COUNT(*) FROM farmers WHERE province_id = $1;

-- Check if province has products (before deletion)
SELECT COUNT(*) FROM products WHERE province_id = $1;

-- ===========================
-- REPORTING QUERIES
-- ===========================

-- Province performance report
SELECT 
  p.name,
  p.location,
  p.capacity,
  p.manager_name,
  COUNT(DISTINCT f.id) as farmer_count,
  COUNT(DISTINCT pr.id) as product_count,
  COALESCE(SUM(pr.current_stock), 0) as total_stock,
  COALESCE(AVG(pr.final_price), 0) as avg_price,
  COUNT(DISTINCT s.id) as supplier_count
FROM provinces p
LEFT JOIN farmers f ON p.id = f.province_id
LEFT JOIN products pr ON p.id = pr.province_id AND pr.status = 'active'
LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.status = 'active'
GROUP BY p.id, p.name, p.location, p.capacity, p.manager_name
ORDER BY farmer_count DESC;

-- Monthly province activity
SELECT 
  p.name,
  DATE_TRUNC('month', f.created_at) as month,
  COUNT(f.id) as new_farmers
FROM provinces p
LEFT JOIN farmers f ON p.id = f.province_id
WHERE f.created_at >= NOW() - INTERVAL '12 months'
GROUP BY p.id, p.name, DATE_TRUNC('month', f.created_at)
ORDER BY p.name, month;