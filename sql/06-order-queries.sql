-- Order Module SQL Queries
-- All database operations for the Order module

-- ===========================
-- CREATE OPERATIONS
-- ===========================

-- Create new order from cart
INSERT INTO orders (user_id, subtotal, tax, shipping_fee, total, contact, shipping)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- Create order items from cart items
INSERT INTO order_items (order_id, product_id, name, price, qty)
SELECT $1, p.id, p.product_name, p.final_price, ci.qty
FROM cart_items ci 
JOIN products p ON ci.product_id = p.id
WHERE ci.cart_id = $2;

-- Create single order item
INSERT INTO order_items (order_id, product_id, name, price, qty) 
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- ===========================
-- READ OPERATIONS
-- ===========================

-- Get all orders with pagination
SELECT 
  o.*,
  COUNT(oi.id) as item_count,
  SUM(oi.qty) as total_items_quantity,
  u.email as user_email -- If user table exists
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN users u ON o.user_id = u.id -- Optional if user table exists
WHERE 1=1
ORDER BY o.created_at DESC
LIMIT $1 OFFSET $2;

-- Get order by ID with full details
SELECT 
  o.*,
  oi.id as item_id,
  oi.product_id,
  oi.name as product_name,
  oi.price as item_price,
  oi.qty as item_quantity,
  (oi.qty * oi.price) as item_total,
  p.unit,
  p.current_stock,
  c.name as category_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN categories c ON p.category_id = c.id
WHERE o.id = $1
ORDER BY oi.id;

-- Get orders by user
SELECT 
  o.*,
  COUNT(oi.id) as item_count,
  SUM(oi.qty) as total_items_quantity
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = $1
GROUP BY o.id
ORDER BY o.created_at DESC;

-- Get orders by status
SELECT 
  o.*,
  COUNT(oi.id) as item_count,
  o.contact->>'name' as customer_name,
  o.contact->>'phone' as customer_phone
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = $1
GROUP BY o.id
ORDER BY o.created_at DESC;

-- Get orders by date range
SELECT 
  o.*,
  COUNT(oi.id) as item_count,
  SUM(oi.qty * oi.price) as calculated_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at BETWEEN $1 AND $2
GROUP BY o.id
ORDER BY o.created_at DESC;

-- Get pending orders (unassigned)
SELECT 
  o.*,
  COUNT(oi.id) as item_count,
  o.contact->>'name' as customer_name,
  o.contact->>'phone' as customer_phone,
  o.shipping->>'address' as delivery_address,
  o.shipping->>'city' as delivery_city
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status = 'pending' 
  AND o.assignment_status = 'unassigned'
GROUP BY o.id
ORDER BY o.created_at ASC; -- Oldest first for processing

-- Get orders ready for assignment
SELECT 
  o.*,
  COUNT(oi.id) as item_count,
  o.contact->>'name' as customer_name,
  o.shipping->>'address' as delivery_address,
  o.shipping->>'city' as delivery_city,
  o.shipping->>'province' as delivery_province
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status IN ('confirmed', 'pending') 
  AND o.assignment_status = 'unassigned'
GROUP BY o.id
ORDER BY o.created_at ASC;

-- Search orders by customer info
SELECT 
  o.*,
  COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE LOWER(o.contact->>'name') LIKE LOWER($1)
   OR LOWER(o.contact->>'email') LIKE LOWER($1)
   OR o.contact->>'phone' LIKE $1
GROUP BY o.id
ORDER BY o.created_at DESC;

-- ===========================
-- UPDATE OPERATIONS
-- ===========================

-- Update order status
UPDATE orders 
SET status = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update order assignment status
UPDATE orders 
SET assignment_status = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update both order and assignment status
UPDATE orders 
SET status = $1, assignment_status = $2, updated_at = CURRENT_TIMESTAMP
WHERE id = $3
RETURNING *;

-- Update order contact information
UPDATE orders 
SET contact = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update order shipping information
UPDATE orders 
SET shipping = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update order totals (if recalculation needed)
UPDATE orders 
SET subtotal = $1, tax = $2, shipping_fee = $3, total = $4, updated_at = CURRENT_TIMESTAMP
WHERE id = $5
RETURNING *;

-- ===========================
-- DELETE OPERATIONS
-- ===========================

-- Cancel order (soft delete)
UPDATE orders 
SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Hard delete order (will cascade to order_items)
DELETE FROM orders WHERE id = $1;

-- ===========================
-- VALIDATION QUERIES
-- ===========================

-- Check if order exists and belongs to user
SELECT COUNT(*) FROM orders 
WHERE id = $1 AND user_id = $2;

-- Check if order can be cancelled
SELECT COUNT(*) FROM orders 
WHERE id = $1 AND status IN ('pending', 'confirmed');

-- Check if order can be assigned
SELECT COUNT(*) FROM orders 
WHERE id = $1 
  AND status IN ('pending', 'confirmed') 
  AND assignment_status = 'unassigned';

-- Validate order items stock availability
SELECT 
  oi.product_id,
  oi.qty as required_qty,
  p.current_stock,
  p.product_name,
  CASE 
    WHEN p.current_stock >= oi.qty THEN 'available'
    ELSE 'insufficient'
  END as stock_status
FROM order_items oi
JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = $1;

-- ===========================
-- BUSINESS LOGIC QUERIES
-- ===========================

-- Reserve stock for order (decrease product stock)
UPDATE products 
SET current_stock = current_stock - (
  SELECT qty FROM order_items 
  WHERE order_id = $1 AND product_id = products.id
), updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT product_id FROM order_items WHERE order_id = $1
) AND current_stock >= (
  SELECT qty FROM order_items 
  WHERE order_id = $1 AND product_id = products.id
);

-- Release stock for cancelled order (increase product stock)
UPDATE products 
SET current_stock = current_stock + (
  SELECT qty FROM order_items 
  WHERE order_id = $1 AND product_id = products.id
), updated_at = CURRENT_TIMESTAMP
WHERE id IN (
  SELECT product_id FROM order_items WHERE order_id = $1
);

-- Get order financial summary
SELECT 
  SUM(subtotal) as total_subtotal,
  SUM(tax) as total_tax,
  SUM(shipping_fee) as total_shipping,
  SUM(total) as total_revenue,
  COUNT(*) as order_count,
  AVG(total) as avg_order_value
FROM orders
WHERE status NOT IN ('cancelled')
  AND created_at BETWEEN $1 AND $2;

-- ===========================
-- ASSIGNMENT SUPPORT QUERIES
-- ===========================

-- Get orders by delivery location for assignment
SELECT 
  o.id,
  o.total,
  o.created_at,
  o.contact->>'name' as customer_name,
  o.contact->>'phone' as customer_phone,
  o.shipping->>'address' as delivery_address,
  o.shipping->>'city' as delivery_city,
  o.shipping->>'province' as delivery_province,
  COUNT(oi.id) as item_count,
  SUM(oi.qty) as total_quantity
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.shipping->>'city' = $1
  AND o.assignment_status = 'unassigned'
  AND o.status IN ('confirmed', 'pending')
GROUP BY o.id
ORDER BY o.created_at ASC;

-- Get orders with weight/volume estimation for driver assignment
SELECT 
  o.id,
  o.total,
  o.created_at,
  o.shipping->>'province' as delivery_province,
  COUNT(oi.id) as item_count,
  SUM(oi.qty) as estimated_weight, -- Assuming qty represents weight
  AVG(oi.price) as avg_item_price
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
WHERE o.assignment_status = 'unassigned'
  AND o.status IN ('confirmed', 'pending')
GROUP BY o.id
HAVING SUM(oi.qty) <= $1 -- Driver capacity limit
ORDER BY o.created_at ASC;

-- ===========================
-- REPORTING QUERIES
-- ===========================

-- Daily sales report
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as total_orders,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
  COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
  SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END) as total_revenue,
  AVG(CASE WHEN status != 'cancelled' THEN total END) as avg_order_value,
  SUM(CASE WHEN status != 'cancelled' THEN subtotal ELSE 0 END) as total_subtotal,
  SUM(CASE WHEN status != 'cancelled' THEN tax ELSE 0 END) as total_tax,
  SUM(CASE WHEN status != 'cancelled' THEN shipping_fee ELSE 0 END) as total_shipping
FROM orders
WHERE created_at >= $1 AND created_at <= $2
GROUP BY DATE(created_at)
ORDER BY order_date DESC;

-- Order status distribution
SELECT 
  status,
  COUNT(*) as order_count,
  SUM(total) as total_value,
  AVG(total) as avg_order_value,
  ROUND(COUNT(*)::DECIMAL / (SELECT COUNT(*) FROM orders) * 100, 2) as percentage
FROM orders
WHERE created_at >= $1
GROUP BY status
ORDER BY order_count DESC;

-- Top customers by order value
SELECT 
  user_id,
  contact->>'name' as customer_name,
  contact->>'email' as customer_email,
  COUNT(*) as total_orders,
  SUM(total) as total_spent,
  AVG(total) as avg_order_value,
  MAX(created_at) as last_order_date
FROM orders
WHERE status != 'cancelled'
  AND created_at >= $1
GROUP BY user_id, contact->>'name', contact->>'email'
ORDER BY total_spent DESC
LIMIT $2;

-- Most popular products by order frequency
SELECT 
  oi.product_id,
  oi.name as product_name,
  COUNT(DISTINCT oi.order_id) as times_ordered,
  SUM(oi.qty) as total_quantity_sold,
  SUM(oi.qty * oi.price) as total_revenue,
  AVG(oi.price) as avg_selling_price,
  COUNT(DISTINCT o.user_id) as unique_customers
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status != 'cancelled'
  AND o.created_at >= $1
GROUP BY oi.product_id, oi.name
ORDER BY times_ordered DESC
LIMIT $2;