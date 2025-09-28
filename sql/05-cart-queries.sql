-- Cart Module SQL Queries
-- All database operations for the Cart module

-- ===========================
-- CREATE OPERATIONS
-- ===========================

-- Create new cart for user
INSERT INTO carts (user_id) 
VALUES ($1) 
RETURNING *;

-- Add item to cart (with upsert logic)
INSERT INTO cart_items (cart_id, product_id, qty)
VALUES ($1, $2, $3)
ON CONFLICT (cart_id, product_id) 
DO UPDATE SET 
  qty = cart_items.qty + EXCLUDED.qty,
  added_at = CURRENT_TIMESTAMP
RETURNING *;

-- Add specific quantity (replace existing)
INSERT INTO cart_items (cart_id, product_id, qty)
VALUES ($1, $2, $3)
ON CONFLICT (cart_id, product_id) 
DO UPDATE SET 
  qty = EXCLUDED.qty,
  added_at = CURRENT_TIMESTAMP
RETURNING *;

-- ===========================
-- READ OPERATIONS
-- ===========================

-- Get user's active cart with items
SELECT 
  c.id as cart_id,
  c.user_id,
  c.status as cart_status,
  c.created_at as cart_created_at,
  ci.id as item_id,
  ci.product_id,
  ci.qty,
  ci.added_at,
  p.product_name,
  p.final_price,
  p.unit,
  p.current_stock,
  p.status as product_status,
  (ci.qty * p.final_price) as item_total,
  c2.name as category_name,
  pr.name as province_name
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
LEFT JOIN products p ON ci.product_id = p.id
LEFT JOIN categories c2 ON p.category_id = c2.id
LEFT JOIN provinces pr ON p.province_id = pr.id
WHERE c.user_id = $1 AND c.status = 'active'
ORDER BY ci.added_at DESC;

-- Get cart by cart ID
SELECT 
  c.*,
  COUNT(ci.id) as item_count,
  COALESCE(SUM(ci.qty * p.final_price), 0) as total_amount
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
LEFT JOIN products p ON ci.product_id = p.id AND p.status = 'active'
WHERE c.id = $1
GROUP BY c.id;

-- Get cart items with full product details
SELECT 
  ci.*,
  p.product_name,
  p.final_price,
  p.unit,
  p.current_stock,
  p.daily_limit,
  p.status as product_status,
  (ci.qty * p.final_price) as item_total,
  c2.name as category_name,
  pr.name as province_name,
  CASE 
    WHEN p.current_stock >= ci.qty THEN 'available'
    WHEN p.current_stock > 0 THEN 'partial'
    ELSE 'out_of_stock'
  END as availability_status
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
LEFT JOIN categories c2 ON p.category_id = c2.id
LEFT JOIN provinces pr ON p.province_id = pr.id
WHERE ci.cart_id = $1
ORDER BY ci.added_at DESC;

-- Get cart summary
SELECT 
  c.id as cart_id,
  c.user_id,
  c.status,
  COUNT(ci.id) as total_items,
  COALESCE(SUM(ci.qty), 0) as total_quantity,
  COALESCE(SUM(ci.qty * p.final_price), 0) as subtotal,
  COALESCE(SUM(ci.qty * p.final_price) * 0.08, 0) as tax, -- 8% tax
  50.00 as shipping_fee, -- Fixed shipping
  COALESCE(SUM(ci.qty * p.final_price) * 1.08 + 50.00, 50.00) as total_amount
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
LEFT JOIN products p ON ci.product_id = p.id AND p.status = 'active'
WHERE c.id = $1
GROUP BY c.id, c.user_id, c.status;

-- Check if user has active cart
SELECT id FROM carts 
WHERE user_id = $1 AND status = 'active' 
LIMIT 1;

-- Get cart item count for user
SELECT COUNT(ci.id) as item_count
FROM carts c
JOIN cart_items ci ON c.id = ci.cart_id
WHERE c.user_id = $1 AND c.status = 'active';

-- Validate cart items availability
SELECT 
  ci.product_id,
  ci.qty as requested_qty,
  p.current_stock,
  p.product_name,
  CASE 
    WHEN p.status != 'active' THEN 'product_inactive'
    WHEN p.current_stock < ci.qty THEN 'insufficient_stock'
    ELSE 'available'
  END as status
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.cart_id = $1;

-- ===========================
-- UPDATE OPERATIONS
-- ===========================

-- Update cart item quantity
UPDATE cart_items 
SET qty = $1, added_at = CURRENT_TIMESTAMP
WHERE cart_id = $2 AND product_id = $3
RETURNING *;

-- Increase cart item quantity
UPDATE cart_items 
SET qty = qty + $1, added_at = CURRENT_TIMESTAMP
WHERE cart_id = $2 AND product_id = $3
RETURNING *;

-- Update cart status
UPDATE carts 
SET status = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Mark cart as completed (after order creation)
UPDATE carts 
SET status = 'completed', updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- ===========================
-- DELETE OPERATIONS
-- ===========================

-- Remove item from cart
DELETE FROM cart_items 
WHERE cart_id = $1 AND product_id = $2
RETURNING *;

-- Clear all items from cart
DELETE FROM cart_items 
WHERE cart_id = $1;

-- Delete cart (hard delete with cascade)
DELETE FROM carts WHERE id = $1;

-- Abandon cart (soft delete)
UPDATE carts 
SET status = 'abandoned', updated_at = CURRENT_TIMESTAMP
WHERE id = $1;

-- ===========================
-- BATCH OPERATIONS
-- ===========================

-- Add multiple items to cart
INSERT INTO cart_items (cart_id, product_id, qty)
VALUES 
  ($1, $2, $3),
  ($1, $4, $5),
  ($1, $6, $7)
ON CONFLICT (cart_id, product_id) 
DO UPDATE SET 
  qty = cart_items.qty + EXCLUDED.qty,
  added_at = CURRENT_TIMESTAMP;

-- Update multiple cart items
UPDATE cart_items 
SET qty = CASE product_id
  WHEN $2 THEN $3
  WHEN $4 THEN $5
  WHEN $6 THEN $7
  ELSE qty
END,
added_at = CURRENT_TIMESTAMP
WHERE cart_id = $1 
  AND product_id IN ($2, $4, $6);

-- ===========================
-- CLEANUP OPERATIONS
-- ===========================

-- Clean up abandoned carts (older than 30 days)
DELETE FROM carts 
WHERE status = 'abandoned' 
  AND updated_at < NOW() - INTERVAL '30 days';

-- Clean up empty carts
DELETE FROM carts 
WHERE id NOT IN (
  SELECT DISTINCT cart_id FROM cart_items
) AND status = 'active'
  AND created_at < NOW() - INTERVAL '1 day';

-- Mark old active carts as abandoned (older than 7 days with no updates)
UPDATE carts 
SET status = 'abandoned', updated_at = CURRENT_TIMESTAMP
WHERE status = 'active' 
  AND updated_at < NOW() - INTERVAL '7 days';

-- ===========================
-- REPORTING QUERIES
-- ===========================

-- Cart analytics
SELECT 
  DATE(c.created_at) as date,
  COUNT(DISTINCT c.id) as carts_created,
  COUNT(DISTINCT CASE WHEN c.status = 'completed' THEN c.id END) as carts_completed,
  COUNT(DISTINCT CASE WHEN c.status = 'abandoned' THEN c.id END) as carts_abandoned,
  AVG(cart_summary.item_count) as avg_items_per_cart,
  AVG(cart_summary.total_value) as avg_cart_value
FROM carts c
LEFT JOIN (
  SELECT 
    c.id,
    COUNT(ci.id) as item_count,
    SUM(ci.qty * p.final_price) as total_value
  FROM carts c
  LEFT JOIN cart_items ci ON c.id = ci.cart_id
  LEFT JOIN products p ON ci.product_id = p.id
  GROUP BY c.id
) cart_summary ON c.id = cart_summary.id
WHERE c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(c.created_at)
ORDER BY date DESC;

-- Most added to cart products
SELECT 
  p.product_name,
  c2.name as category_name,
  COUNT(ci.id) as times_added,
  SUM(ci.qty) as total_quantity_added,
  COUNT(DISTINCT ci.cart_id) as unique_carts,
  AVG(ci.qty) as avg_quantity_per_add
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
LEFT JOIN categories c2 ON p.category_id = c2.id
WHERE ci.added_at >= NOW() - INTERVAL '30 days'
GROUP BY p.id, p.product_name, c2.name
ORDER BY times_added DESC
LIMIT 20;

-- Cart abandonment analysis
SELECT 
  EXTRACT(HOUR FROM c.created_at) as hour_of_day,
  COUNT(c.id) as total_carts,
  COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_carts,
  COUNT(CASE WHEN c.status = 'abandoned' THEN 1 END) as abandoned_carts,
  ROUND(
    COUNT(CASE WHEN c.status = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(c.id), 0) * 100, 2
  ) as completion_rate
FROM carts c
WHERE c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY EXTRACT(HOUR FROM c.created_at)
ORDER BY hour_of_day;

-- Average time to completion/abandonment
SELECT 
  c.status,
  COUNT(c.id) as cart_count,
  AVG(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 3600) as avg_hours_to_status_change,
  MIN(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 3600) as min_hours,
  MAX(EXTRACT(EPOCH FROM (c.updated_at - c.created_at)) / 3600) as max_hours
FROM carts c
WHERE c.status IN ('completed', 'abandoned')
  AND c.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.status;