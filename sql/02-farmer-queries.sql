-- Farmer Module SQL Queries
-- All database operations for the Farmer module

-- ===========================
-- CREATE OPERATIONS
-- ===========================

-- Create new farmer
INSERT INTO farmers (
  name, contact_number, email, address, province_id, registration_number
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *;

-- ===========================
-- READ OPERATIONS
-- ===========================

-- Get all farmers with pagination and province info
SELECT 
  f.*,
  p.name as province_name,
  p.location as province_location
FROM farmers f
LEFT JOIN provinces p ON f.province_id = p.id
WHERE f.status = 'active'
ORDER BY f.name ASC
LIMIT $1 OFFSET $2;

-- Get total count of active farmers
SELECT COUNT(*) as total FROM farmers WHERE status = 'active';

-- Get farmer by ID with province info
SELECT 
  f.*,
  p.name as province_name,
  p.location as province_location
FROM farmers f
LEFT JOIN provinces p ON f.province_id = p.id
WHERE f.id = $1;

-- Get farmer by email
SELECT * FROM farmers WHERE email = $1 AND status = 'active';

-- Get farmer by registration number
SELECT * FROM farmers WHERE registration_number = $1 AND status = 'active';

-- Get farmers by province
SELECT 
  f.*,
  p.name as province_name
FROM farmers f
JOIN provinces p ON f.province_id = p.id
WHERE f.province_id = $1 AND f.status = 'active'
ORDER BY f.name;

-- Search farmers by name, email, or contact
SELECT 
  f.*,
  p.name as province_name
FROM farmers f
LEFT JOIN provinces p ON f.province_id = p.id
WHERE (LOWER(f.name) LIKE LOWER($1) 
   OR LOWER(f.email) LIKE LOWER($1)
   OR f.contact_number LIKE $1)
  AND f.status = 'active'
ORDER BY f.name;

-- Get farmers with supplier statistics
SELECT 
  f.*,
  p.name as province_name,
  COUNT(DISTINCT s.id) as supplier_count,
  COUNT(DISTINCT s.product_id) as products_supplied,
  COALESCE(SUM(s.quantity), 0) as total_quantity_supplied,
  COALESCE(AVG(s.price_per_unit), 0) as avg_price_per_unit
FROM farmers f
LEFT JOIN provinces p ON f.province_id = p.id
LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.status = 'active'
WHERE f.status = 'active'
GROUP BY f.id, p.name
ORDER BY f.name;

-- ===========================
-- UPDATE OPERATIONS
-- ===========================

-- Update farmer details
UPDATE farmers 
SET name = $1, contact_number = $2, email = $3, address = $4, 
    province_id = $5, updated_at = NOW()
WHERE id = $6
RETURNING *;

-- Update farmer contact information
UPDATE farmers 
SET contact_number = $1, email = $2, updated_at = NOW()
WHERE id = $3
RETURNING *;

-- Update farmer address
UPDATE farmers 
SET address = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- Update farmer province
UPDATE farmers 
SET province_id = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- Update farmer status
UPDATE farmers 
SET status = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- ===========================
-- DELETE OPERATIONS
-- ===========================

-- Soft delete farmer (set status to inactive)
UPDATE farmers 
SET status = 'inactive', updated_at = NOW()
WHERE id = $1
RETURNING *;

-- Hard delete farmer (only if no dependencies)
DELETE FROM farmers WHERE id = $1;

-- ===========================
-- VALIDATION QUERIES
-- ===========================

-- Check if email exists (for unique validation)
SELECT COUNT(*) FROM farmers 
WHERE LOWER(email) = LOWER($1) AND id != $2 AND status != 'inactive';

-- Check if registration number exists (for unique validation)
SELECT COUNT(*) FROM farmers 
WHERE registration_number = $1 AND id != $2 AND status != 'inactive';

-- Check if farmer has active suppliers (before deletion)
SELECT COUNT(*) FROM suppliers 
WHERE farmer_id = $1 AND status = 'active';

-- Validate province exists
SELECT COUNT(*) FROM provinces WHERE id = $1;

-- ===========================
-- REPORTING QUERIES
-- ===========================

-- Farmer performance report
SELECT 
  f.id,
  f.name,
  f.contact_number,
  f.email,
  p.name as province_name,
  COUNT(DISTINCT s.id) as total_supplies,
  COUNT(DISTINCT s.product_id) as unique_products,
  COALESCE(SUM(s.quantity), 0) as total_quantity,
  COALESCE(SUM(s.quantity * s.price_per_unit), 0) as total_revenue,
  COALESCE(AVG(s.price_per_unit), 0) as avg_price,
  MAX(s.supply_date) as last_supply_date,
  f.created_at as registration_date
FROM farmers f
LEFT JOIN provinces p ON f.province_id = p.id
LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.status = 'active'
WHERE f.status = 'active'
GROUP BY f.id, f.name, f.contact_number, f.email, p.name, f.created_at
ORDER BY total_revenue DESC;

-- Monthly farmer registrations
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as new_farmers,
  p.name as province_name
FROM farmers f
LEFT JOIN provinces p ON f.province_id = p.id
WHERE f.created_at >= NOW() - INTERVAL '12 months'
  AND f.status = 'active'
GROUP BY DATE_TRUNC('month', created_at), p.name
ORDER BY month DESC, province_name;

-- Top farmers by supply volume (last 6 months)
SELECT 
  f.name,
  f.contact_number,
  p.name as province_name,
  COUNT(s.id) as supply_count,
  SUM(s.quantity) as total_quantity,
  SUM(s.quantity * s.price_per_unit) as total_value
FROM farmers f
JOIN provinces p ON f.province_id = p.id
JOIN suppliers s ON f.id = s.farmer_id
WHERE s.supply_date >= NOW() - INTERVAL '6 months'
  AND s.status = 'active'
  AND f.status = 'active'
GROUP BY f.id, f.name, f.contact_number, p.name
HAVING COUNT(s.id) > 0
ORDER BY total_value DESC
LIMIT 10;

-- Farmers with no supplies in last 3 months
SELECT 
  f.id,
  f.name,
  f.contact_number,
  f.email,
  p.name as province_name,
  f.created_at as registration_date,
  MAX(s.supply_date) as last_supply_date
FROM farmers f
LEFT JOIN provinces p ON f.province_id = p.id
LEFT JOIN suppliers s ON f.id = s.farmer_id
WHERE f.status = 'active'
GROUP BY f.id, f.name, f.contact_number, f.email, p.name, f.created_at
HAVING MAX(s.supply_date) < NOW() - INTERVAL '3 months' 
   OR MAX(s.supply_date) IS NULL
ORDER BY f.created_at DESC;