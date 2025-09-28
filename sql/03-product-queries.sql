-- Product Module SQL Queries
-- All database operations for the Product module

-- ===========================
-- CREATE OPERATIONS
-- ===========================

-- Create new product
INSERT INTO products (
  product_name, category_id, province_id, daily_limit, 
  current_stock, final_price, unit, status
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- ===========================
-- READ OPERATIONS
-- ===========================

-- Get all products with pagination and related info
SELECT 
  p.*,
  c.name as category_name,
  c.description as category_description,
  pr.name as province_name,
  pr.location as province_location
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
WHERE p.status = 'active'
ORDER BY p.product_name ASC
LIMIT $1 OFFSET $2;

-- Get total count of active products
SELECT COUNT(*) as total FROM products WHERE status = 'active';

-- Get product by ID with related info
SELECT 
  p.*,
  c.name as category_name,
  c.description as category_description,
  pr.name as province_name,
  pr.location as province_location
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
WHERE p.id = $1;

-- Get products by category
SELECT 
  p.*,
  c.name as category_name,
  pr.name as province_name
FROM products p
JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
WHERE p.category_id = $1 AND p.status = 'active'
ORDER BY p.product_name;

-- Get products by province
SELECT 
  p.*,
  c.name as category_name,
  pr.name as province_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
JOIN provinces pr ON p.province_id = pr.id
WHERE p.province_id = $1 AND p.status = 'active'
ORDER BY p.product_name;

-- Search products by name
SELECT 
  p.*,
  c.name as category_name,
  pr.name as province_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
WHERE LOWER(p.product_name) LIKE LOWER($1) 
  AND p.status = 'active'
ORDER BY p.product_name;

-- Get products with supplier information
SELECT 
  p.*,
  c.name as category_name,
  pr.name as province_name,
  COUNT(DISTINCT s.id) as supplier_count,
  COALESCE(SUM(s.quantity), 0) as total_supply_quantity,
  COALESCE(AVG(s.price_per_unit), 0) as avg_supplier_price,
  MIN(s.price_per_unit) as min_supplier_price,
  MAX(s.price_per_unit) as max_supplier_price
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
LEFT JOIN suppliers s ON p.id = s.product_id AND s.status = 'active'
WHERE p.status = 'active'
GROUP BY p.id, c.name, pr.name
ORDER BY p.product_name;

-- Get products with low stock (below 10% of daily limit)
SELECT 
  p.*,
  c.name as category_name,
  pr.name as province_name,
  (p.current_stock / NULLIF(p.daily_limit, 0) * 100) as stock_percentage
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
WHERE p.status = 'active' 
  AND p.daily_limit > 0 
  AND p.current_stock < (p.daily_limit * 0.1)
ORDER BY stock_percentage ASC;

-- Get products in price range
SELECT 
  p.*,
  c.name as category_name,
  pr.name as province_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
WHERE p.final_price BETWEEN $1 AND $2 
  AND p.status = 'active'
ORDER BY p.final_price ASC;

-- ===========================
-- UPDATE OPERATIONS
-- ===========================

-- Update product details
UPDATE products 
SET product_name = $1, category_id = $2, province_id = $3, 
    daily_limit = $4, final_price = $5, unit = $6, updated_at = NOW()
WHERE id = $7
RETURNING *;

-- Update product stock
UPDATE products 
SET current_stock = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- Increase product stock (for supplies)
UPDATE products 
SET current_stock = current_stock + $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- Decrease product stock (for orders)
UPDATE products 
SET current_stock = current_stock - $1, updated_at = NOW()
WHERE id = $2 AND current_stock >= $1
RETURNING *;

-- Update product price
UPDATE products 
SET final_price = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- Update product status
UPDATE products 
SET status = $1, updated_at = NOW()
WHERE id = $2
RETURNING *;

-- ===========================
-- DELETE OPERATIONS
-- ===========================

-- Soft delete product (set status to inactive)
UPDATE products 
SET status = 'inactive', updated_at = NOW()
WHERE id = $1
RETURNING *;

-- Hard delete product (only if no dependencies)
DELETE FROM products WHERE id = $1;

-- ===========================
-- VALIDATION QUERIES
-- ===========================

-- Check if product name exists in same province (for unique validation)
SELECT COUNT(*) FROM products 
WHERE LOWER(product_name) = LOWER($1) 
  AND province_id = $2 
  AND id != $3 
  AND status != 'inactive';

-- Check if category exists
SELECT COUNT(*) FROM categories WHERE id = $1;

-- Check if province exists
SELECT COUNT(*) FROM provinces WHERE id = $1;

-- Check if product has active suppliers (before deletion)
SELECT COUNT(*) FROM suppliers 
WHERE product_id = $1 AND status = 'active';

-- Check if product is in any active cart items
SELECT COUNT(*) FROM cart_items ci
JOIN carts c ON ci.cart_id = c.id
WHERE ci.product_id = $1 AND c.status = 'active';

-- Check if product is in any order items
SELECT COUNT(*) FROM order_items WHERE product_id = $1;

-- Validate sufficient stock for order
SELECT current_stock FROM products 
WHERE id = $1 AND current_stock >= $2 AND status = 'active';

-- ===========================
-- INVENTORY MANAGEMENT
-- ===========================

-- Get stock alert products (below threshold)
SELECT 
  p.*,
  c.name as category_name,
  pr.name as province_name,
  p.current_stock,
  p.daily_limit,
  (p.current_stock / NULLIF(p.daily_limit, 0) * 100) as stock_percentage
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
WHERE p.status = 'active' 
  AND p.daily_limit > 0 
  AND p.current_stock < $1  -- threshold parameter
ORDER BY stock_percentage ASC;

-- Bulk update stock from suppliers
WITH supplier_totals AS (
  SELECT 
    product_id,
    SUM(quantity) as total_quantity
  FROM suppliers 
  WHERE supply_date = CURRENT_DATE 
    AND status = 'active'
  GROUP BY product_id
)
UPDATE products 
SET current_stock = current_stock + st.total_quantity,
    updated_at = NOW()
FROM supplier_totals st
WHERE products.id = st.product_id;

-- ===========================
-- REPORTING QUERIES
-- ===========================

-- Product performance report
SELECT 
  p.id,
  p.product_name,
  c.name as category_name,
  pr.name as province_name,
  p.final_price,
  p.current_stock,
  p.daily_limit,
  COUNT(DISTINCT s.id) as supplier_count,
  COALESCE(SUM(s.quantity), 0) as total_supplied,
  COALESCE(COUNT(DISTINCT oi.order_id), 0) as orders_count,
  COALESCE(SUM(oi.qty), 0) as total_sold,
  COALESCE(SUM(oi.qty * oi.price), 0) as total_revenue,
  (p.current_stock / NULLIF(p.daily_limit, 0) * 100) as stock_percentage
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
LEFT JOIN suppliers s ON p.id = s.product_id AND s.status = 'active'
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE p.status = 'active'
GROUP BY p.id, p.product_name, c.name, pr.name, p.final_price, p.current_stock, p.daily_limit
ORDER BY total_revenue DESC;

-- Daily stock movement
SELECT 
  p.product_name,
  p.current_stock,
  COALESCE(supplies.quantity_supplied, 0) as supplied_today,
  COALESCE(orders.quantity_sold, 0) as sold_today,
  (p.current_stock + COALESCE(supplies.quantity_supplied, 0) - COALESCE(orders.quantity_sold, 0)) as previous_stock
FROM products p
LEFT JOIN (
  SELECT 
    product_id,
    SUM(quantity) as quantity_supplied
  FROM suppliers 
  WHERE supply_date = CURRENT_DATE
  GROUP BY product_id
) supplies ON p.id = supplies.product_id
LEFT JOIN (
  SELECT 
    oi.product_id,
    SUM(oi.qty) as quantity_sold
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE DATE(o.created_at) = CURRENT_DATE
  GROUP BY oi.product_id
) orders ON p.id = orders.product_id
WHERE p.status = 'active'
ORDER BY p.product_name;

-- Top selling products (last 30 days)
SELECT 
  p.product_name,
  c.name as category_name,
  pr.name as province_name,
  COUNT(oi.id) as order_items_count,
  SUM(oi.qty) as total_quantity_sold,
  SUM(oi.qty * oi.price) as total_revenue,
  AVG(oi.price) as avg_selling_price
FROM products p
JOIN categories c ON p.category_id = c.id
JOIN provinces pr ON p.province_id = pr.id
JOIN order_items oi ON p.id = oi.product_id
JOIN orders o ON oi.order_id = o.id
WHERE o.created_at >= NOW() - INTERVAL '30 days'
  AND p.status = 'active'
GROUP BY p.id, p.product_name, c.name, pr.name
ORDER BY total_revenue DESC
LIMIT 20;