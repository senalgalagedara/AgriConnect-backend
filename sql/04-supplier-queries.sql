-- Supplier Module SQL Queries
-- All database operations for the Supplier module

-- ===========================
-- CREATE OPERATIONS
-- ===========================

-- Create new supplier record
INSERT INTO suppliers (
  farmer_id, product_id, quantity, price_per_unit, supply_date, 
  notes, status
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- ===========================
-- READ OPERATIONS
-- ===========================

-- Get all suppliers with pagination and related info
SELECT 
  s.*,
  f.name as farmer_name,
  f.contact_number as farmer_contact,
  f.email as farmer_email,
  p.product_name,
  p.unit,
  p.final_price as current_market_price,
  pr.name as province_name,
  c.name as category_name,
  (s.quantity * s.price_per_unit) as total_value
FROM suppliers s
LEFT JOIN farmers f ON s.farmer_id = f.id
LEFT JOIN products p ON s.product_id = p.id
LEFT JOIN provinces pr ON f.province_id = pr.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE s.status = 'active'
ORDER BY s.supply_date DESC, s.created_at DESC
LIMIT $1 OFFSET $2;

-- Get total count of active suppliers
SELECT COUNT(*) as total FROM suppliers WHERE status = 'active';

-- Get supplier by ID with related info
SELECT 
  s.*,
  f.name as farmer_name,
  f.contact_number as farmer_contact,
  f.email as farmer_email,
  f.address as farmer_address,
  p.product_name,
  p.unit,
  p.final_price as current_market_price,
  pr.name as province_name,
  c.name as category_name,
  (s.quantity * s.price_per_unit) as total_value
FROM suppliers s
LEFT JOIN farmers f ON s.farmer_id = f.id
LEFT JOIN products p ON s.product_id = p.id
LEFT JOIN provinces pr ON f.province_id = pr.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE s.id = $1;

-- Get suppliers by farmer
SELECT 
  s.*,
  p.product_name,
  p.unit,
  c.name as category_name,
  (s.quantity * s.price_per_unit) as total_value
FROM suppliers s
JOIN products p ON s.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE s.farmer_id = $1 AND s.status = 'active'
ORDER BY s.supply_date DESC;

-- Get suppliers by product
SELECT 
  s.*,
  f.name as farmer_name,
  f.contact_number as farmer_contact,
  pr.name as province_name,
  (s.quantity * s.price_per_unit) as total_value
FROM suppliers s
JOIN farmers f ON s.farmer_id = f.id
LEFT JOIN provinces pr ON f.province_id = pr.id
WHERE s.product_id = $1 AND s.status = 'active'
ORDER BY s.supply_date DESC;

-- Get suppliers by date range
SELECT 
  s.*,
  f.name as farmer_name,
  p.product_name,
  pr.name as province_name,
  (s.quantity * s.price_per_unit) as total_value
FROM suppliers s
JOIN farmers f ON s.farmer_id = f.id
JOIN products p ON s.product_id = p.id
LEFT JOIN provinces pr ON f.province_id = pr.id
WHERE s.supply_date BETWEEN $1 AND $2 
  AND s.status = 'active'
ORDER BY s.supply_date DESC;

-- Get today's suppliers
SELECT 
  s.*,
  f.name as farmer_name,
  f.contact_number as farmer_contact,
  p.product_name,
  p.unit,
  pr.name as province_name,
  (s.quantity * s.price_per_unit) as total_value
FROM suppliers s
JOIN farmers f ON s.farmer_id = f.id
JOIN products p ON s.product_id = p.id
LEFT JOIN provinces pr ON f.province_id = pr.id
WHERE s.supply_date = CURRENT_DATE 
  AND s.status = 'active'
ORDER BY s.created_at DESC;

-- Search suppliers by farmer name or product name
SELECT 
  s.*,
  f.name as farmer_name,
  p.product_name,
  pr.name as province_name,
  (s.quantity * s.price_per_unit) as total_value
FROM suppliers s
JOIN farmers f ON s.farmer_id = f.id
JOIN products p ON s.product_id = p.id
LEFT JOIN provinces pr ON f.province_id = pr.id
WHERE (LOWER(f.name) LIKE LOWER($1) 
   OR LOWER(p.product_name) LIKE LOWER($1))
  AND s.status = 'active'
ORDER BY s.supply_date DESC;

-- Get suppliers with price comparison
SELECT 
  s.*,
  f.name as farmer_name,
  p.product_name,
  p.final_price as market_price,
  (s.price_per_unit - p.final_price) as price_difference,
  CASE 
    WHEN s.price_per_unit < p.final_price THEN 'Below Market'
    WHEN s.price_per_unit > p.final_price THEN 'Above Market'
    ELSE 'At Market'
  END as price_position,
  (s.quantity * s.price_per_unit) as total_value
FROM suppliers s
JOIN farmers f ON s.farmer_id = f.id
JOIN products p ON s.product_id = p.id
WHERE s.status = 'active'
ORDER BY s.supply_date DESC;

-- ===========================
-- UPDATE OPERATIONS
-- ===========================

-- Update supplier details
UPDATE suppliers 
SET farmer_id = $1, product_id = $2, quantity = $3, 
    price_per_unit = $4, supply_date = $5, notes = $6, updated_at = NOW()
WHERE id = $7
RETURNING *;

-- Update supplier quantity
UPDATE suppliers 
SET quantity = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- Update supplier price
UPDATE suppliers 
SET price_per_unit = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- Update supplier status
UPDATE suppliers 
SET status = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- Update supplier notes
UPDATE suppliers 
SET notes = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- Mark supplier as completed
UPDATE suppliers 
SET status = 'completed', updated_at = NOW()
WHERE id = $1
RETURNING *;

-- ===========================
-- DELETE OPERATIONS
-- ===========================

-- Soft delete supplier (set status to cancelled)
UPDATE suppliers 
SET status = 'cancelled', updated_at = NOW()
WHERE id = $1
RETURNING *;

-- Hard delete supplier (only if no dependencies)
DELETE FROM suppliers WHERE id = $1;

-- ===========================
-- VALIDATION QUERIES
-- ===========================

-- Check if farmer exists and is active
SELECT COUNT(*) FROM farmers 
WHERE id = $1 AND status = 'active';

-- Check if product exists and is active
SELECT COUNT(*) FROM products 
WHERE id = $1 AND status = 'active';

-- Check for duplicate supply (same farmer, product, date)
SELECT COUNT(*) FROM suppliers 
WHERE farmer_id = $1 AND product_id = $2 
  AND supply_date = $3 AND id != $4 
  AND status = 'active';

-- Validate positive quantity and price
SELECT CASE 
  WHEN $1 > 0 AND $2 > 0 THEN 1 
  ELSE 0 
END as valid;

-- ===========================
-- AGGREGATION QUERIES
-- ===========================

-- Get supplier totals by farmer
SELECT 
  f.id as farmer_id,
  f.name as farmer_name,
  COUNT(s.id) as total_supplies,
  SUM(s.quantity) as total_quantity,
  SUM(s.quantity * s.price_per_unit) as total_value,
  AVG(s.price_per_unit) as avg_price_per_unit,
  MIN(s.supply_date) as first_supply_date,
  MAX(s.supply_date) as last_supply_date
FROM farmers f
LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.status = 'active'
WHERE f.status = 'active'
GROUP BY f.id, f.name
HAVING COUNT(s.id) > 0
ORDER BY total_value DESC;

-- Get supplier totals by product
SELECT 
  p.id as product_id,
  p.product_name,
  p.unit,
  COUNT(s.id) as supplier_count,
  SUM(s.quantity) as total_quantity_supplied,
  AVG(s.price_per_unit) as avg_supplier_price,
  MIN(s.price_per_unit) as min_supplier_price,
  MAX(s.price_per_unit) as max_supplier_price,
  SUM(s.quantity * s.price_per_unit) as total_supply_value
FROM products p
LEFT JOIN suppliers s ON p.id = s.product_id AND s.status = 'active'
WHERE p.status = 'active'
GROUP BY p.id, p.product_name, p.unit
HAVING COUNT(s.id) > 0
ORDER BY total_supply_value DESC;

-- Get supplier totals by province
SELECT 
  pr.id as province_id,
  pr.name as province_name,
  COUNT(DISTINCT f.id) as unique_farmers,
  COUNT(s.id) as total_supplies,
  COUNT(DISTINCT p.id) as unique_products,
  SUM(s.quantity) as total_quantity,
  SUM(s.quantity * s.price_per_unit) as total_value,
  AVG(s.price_per_unit) as avg_price_per_unit
FROM provinces pr
LEFT JOIN farmers f ON pr.id = f.province_id AND f.status = 'active'
LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.status = 'active'
LEFT JOIN products p ON s.product_id = p.id
GROUP BY pr.id, pr.name
HAVING COUNT(s.id) > 0
ORDER BY total_value DESC;

-- ===========================
-- REPORTING QUERIES
-- ===========================

-- Daily supply report
SELECT 
  s.supply_date,
  COUNT(s.id) as total_supplies,
  COUNT(DISTINCT s.farmer_id) as unique_farmers,
  COUNT(DISTINCT s.product_id) as unique_products,
  SUM(s.quantity) as total_quantity,
  SUM(s.quantity * s.price_per_unit) as total_value,
  AVG(s.price_per_unit) as avg_price_per_unit
FROM suppliers s
WHERE s.status = 'active'
  AND s.supply_date >= NOW() - INTERVAL '30 days'
GROUP BY s.supply_date
ORDER BY s.supply_date DESC;

-- Weekly supply trends
SELECT 
  DATE_TRUNC('week', s.supply_date) as week_start,
  COUNT(s.id) as total_supplies,
  SUM(s.quantity) as total_quantity,
  SUM(s.quantity * s.price_per_unit) as total_value,
  AVG(s.price_per_unit) as avg_price_per_unit
FROM suppliers s
WHERE s.status = 'active'
  AND s.supply_date >= NOW() - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', s.supply_date)
ORDER BY week_start DESC;

-- Top suppliers by value (last 3 months)
SELECT 
  f.name as farmer_name,
  f.contact_number,
  pr.name as province_name,
  COUNT(s.id) as supply_count,
  SUM(s.quantity) as total_quantity,
  SUM(s.quantity * s.price_per_unit) as total_value,
  AVG(s.price_per_unit) as avg_price_per_unit,
  COUNT(DISTINCT s.product_id) as unique_products
FROM suppliers s
JOIN farmers f ON s.farmer_id = f.id
LEFT JOIN provinces pr ON f.province_id = pr.id
WHERE s.status = 'active'
  AND s.supply_date >= NOW() - INTERVAL '3 months'
GROUP BY f.id, f.name, f.contact_number, pr.name
ORDER BY total_value DESC
LIMIT 20;

-- Price analysis by product (last month)
SELECT 
  p.product_name,
  p.unit,
  p.final_price as current_market_price,
  COUNT(s.id) as supply_count,
  AVG(s.price_per_unit) as avg_supplier_price,
  MIN(s.price_per_unit) as min_supplier_price,
  MAX(s.price_per_unit) as max_supplier_price,
  STDDEV(s.price_per_unit) as price_std_dev,
  (AVG(s.price_per_unit) - p.final_price) as avg_price_difference
FROM products p
JOIN suppliers s ON p.id = s.product_id
WHERE s.status = 'active'
  AND s.supply_date >= NOW() - INTERVAL '1 month'
GROUP BY p.id, p.product_name, p.unit, p.final_price
HAVING COUNT(s.id) >= 3
ORDER BY avg_price_difference DESC;