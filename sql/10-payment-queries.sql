-- Payment Module SQL Queries
-- All database operations for the Payment module

-- ===========================
-- CREATE OPERATIONS
-- ===========================

-- Create new payment record
INSERT INTO payments (
  order_id, amount, payment_method, payment_status, 
  transaction_id, payment_gateway, gateway_response
) VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- ===========================
-- READ OPERATIONS
-- ===========================

-- Get all payments with pagination
SELECT 
  p.*,
  o.user_id,
  o.total as order_total,
  o.status as order_status,
  o.contact->>'name' as customer_name,
  o.contact->>'email' as customer_email,
  (p.amount - o.total) as payment_difference
FROM payments p
LEFT JOIN orders o ON p.order_id = o.id
ORDER BY p.created_at DESC
LIMIT $1 OFFSET $2;

-- Get total count of payments
SELECT COUNT(*) as total FROM payments;

-- Get payment by ID with order details
SELECT 
  p.*,
  o.user_id,
  o.total as order_total,
  o.subtotal,
  o.tax,
  o.shipping_fee,
  o.status as order_status,
  o.contact,
  o.shipping,
  o.created_at as order_created_at
FROM payments p
LEFT JOIN orders o ON p.order_id = o.id
WHERE p.id = $1;

-- Get payments by order ID
SELECT * FROM payments 
WHERE order_id = $1
ORDER BY created_at ASC;

-- Get payments by status
SELECT 
  p.*,
  o.contact->>'name' as customer_name,
  o.total as order_total
FROM payments p
LEFT JOIN orders o ON p.order_id = o.id
WHERE p.payment_status = $1
ORDER BY p.created_at DESC;

-- Get payments by payment method
SELECT 
  p.*,
  o.contact->>'name' as customer_name,
  o.total as order_total
FROM payments p
LEFT JOIN orders o ON p.order_id = o.id
WHERE p.payment_method = $1
ORDER BY p.created_at DESC;

-- Get payments by gateway
SELECT 
  p.*,
  o.contact->>'name' as customer_name
FROM payments p
LEFT JOIN orders o ON p.order_id = o.id
WHERE p.payment_gateway = $1
ORDER BY p.created_at DESC;

-- Get pending payments
SELECT 
  p.*,
  o.contact->>'name' as customer_name,
  o.contact->>'phone' as customer_phone,
  o.total as order_total,
  (EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600) as hours_pending
FROM payments p
JOIN orders o ON p.order_id = o.id
WHERE p.payment_status = 'pending'
ORDER BY p.created_at ASC;

-- Get failed payments
SELECT 
  p.*,
  o.contact->>'name' as customer_name,
  o.contact->>'email' as customer_email,
  o.total as order_total
FROM payments p
JOIN orders o ON p.order_id = o.id
WHERE p.payment_status = 'failed'
ORDER BY p.created_at DESC;

-- Get payments by date range
SELECT 
  p.*,
  o.contact->>'name' as customer_name,
  o.total as order_total
FROM payments p
LEFT JOIN orders o ON p.order_id = o.id
WHERE p.created_at BETWEEN $1 AND $2
ORDER BY p.created_at DESC;

-- Get successful payments (completed)
SELECT 
  p.*,
  o.contact->>'name' as customer_name,
  o.total as order_total
FROM payments p
LEFT JOIN orders o ON p.order_id = o.id
WHERE p.payment_status = 'completed'
  AND p.processed_at IS NOT NULL
ORDER BY p.processed_at DESC;

-- Search payments by transaction ID
SELECT 
  p.*,
  o.contact->>'name' as customer_name,
  o.total as order_total
FROM payments p
LEFT JOIN orders o ON p.order_id = o.id
WHERE p.transaction_id LIKE $1
ORDER BY p.created_at DESC;

-- ===========================
-- UPDATE OPERATIONS
-- ===========================

-- Update payment status
UPDATE payments 
SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Mark payment as processing
UPDATE payments 
SET payment_status = 'processing', updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Complete payment
UPDATE payments 
SET payment_status = 'completed', 
    processed_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;

-- Fail payment with gateway response
UPDATE payments 
SET payment_status = 'failed', 
    gateway_response = $1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update transaction ID and gateway response
UPDATE payments 
SET transaction_id = $1, 
    gateway_response = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $3
RETURNING *;

-- Refund payment
UPDATE payments 
SET payment_status = 'refunded', 
    gateway_response = $1,
    updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- Update payment amount (if adjustment needed)
UPDATE payments 
SET amount = $1, updated_at = CURRENT_TIMESTAMP
WHERE id = $2
RETURNING *;

-- ===========================
-- DELETE OPERATIONS
-- ===========================

-- Delete payment (hard delete - use carefully)
DELETE FROM payments WHERE id = $1;

-- ===========================
-- VALIDATION QUERIES
-- ===========================

-- Check if order exists
SELECT COUNT(*) FROM orders WHERE id = $1;

-- Check if payment exists for order
SELECT COUNT(*) FROM payments WHERE order_id = $1;

-- Validate payment amount matches order total
SELECT 
  o.total as order_total,
  $1 as payment_amount,
  CASE WHEN o.total = $1 THEN 'valid' ELSE 'invalid' END as validation_status
FROM orders o
WHERE o.id = $2;

-- Check if payment can be processed
SELECT COUNT(*) FROM payments 
WHERE id = $1 
  AND payment_status IN ('pending', 'processing');

-- Check if payment can be refunded
SELECT COUNT(*) FROM payments 
WHERE id = $1 
  AND payment_status = 'completed';

-- ===========================
-- BUSINESS LOGIC QUERIES
-- ===========================

-- Process payment completion with order update
WITH payment_complete AS (
  UPDATE payments 
  SET payment_status = 'completed', 
      processed_at = CURRENT_TIMESTAMP,
      gateway_response = $2,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING *
),
order_confirm AS (
  UPDATE orders 
  SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT order_id FROM payment_complete)
  RETURNING *
)
SELECT * FROM payment_complete;

-- Handle failed payment with order status update
WITH payment_fail AS (
  UPDATE payments 
  SET payment_status = 'failed', 
      gateway_response = $2,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING *
),
order_pending AS (
  UPDATE orders 
  SET status = 'payment_failed', updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT order_id FROM payment_fail)
  RETURNING *
)
SELECT * FROM payment_fail;

-- Process refund with order cancellation
WITH payment_refund AS (
  UPDATE payments 
  SET payment_status = 'refunded', 
      gateway_response = $2,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $1
  RETURNING *
),
order_cancel AS (
  UPDATE orders 
  SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
  WHERE id = (SELECT order_id FROM payment_refund)
  RETURNING *
)
SELECT * FROM payment_refund;

-- ===========================
-- FINANCIAL REPORTING QUERIES
-- ===========================

-- Daily payment summary
SELECT 
  DATE(p.created_at) as payment_date,
  COUNT(p.id) as total_payments,
  COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as successful_payments,
  COUNT(CASE WHEN p.payment_status = 'failed' THEN 1 END) as failed_payments,
  COUNT(CASE WHEN p.payment_status = 'pending' THEN 1 END) as pending_payments,
  SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN p.payment_status = 'refunded' THEN p.amount ELSE 0 END) as total_refunds,
  ROUND(
    COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(p.id), 0) * 100, 2
  ) as success_rate
FROM payments p
WHERE p.created_at >= $1 AND p.created_at <= $2
GROUP BY DATE(p.created_at)
ORDER BY payment_date DESC;

-- Payment method analysis
SELECT 
  p.payment_method,
  COUNT(p.id) as total_transactions,
  COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as successful_transactions,
  SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) as total_amount,
  AVG(CASE WHEN p.payment_status = 'completed' THEN p.amount END) as avg_transaction_amount,
  ROUND(
    COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(p.id), 0) * 100, 2
  ) as success_rate
FROM payments p
WHERE p.created_at >= $1
GROUP BY p.payment_method
ORDER BY total_amount DESC;

-- Payment gateway performance
SELECT 
  p.payment_gateway,
  COUNT(p.id) as total_transactions,
  COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as successful_transactions,
  COUNT(CASE WHEN p.payment_status = 'failed' THEN 1 END) as failed_transactions,
  SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) as total_processed,
  ROUND(
    COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(p.id), 0) * 100, 2
  ) as success_rate,
  AVG(
    CASE WHEN p.payment_status = 'completed' 
    THEN EXTRACT(EPOCH FROM (p.processed_at - p.created_at)) / 60 
    END
  ) as avg_processing_minutes
FROM payments p
WHERE p.created_at >= $1
GROUP BY p.payment_gateway
ORDER BY total_processed DESC;

-- Monthly revenue report
SELECT 
  DATE_TRUNC('month', p.processed_at) as month,
  COUNT(p.id) as total_payments,
  SUM(p.amount) as total_revenue,
  AVG(p.amount) as avg_payment_amount,
  COUNT(CASE WHEN p.payment_method = 'card' THEN 1 END) as card_payments,
  COUNT(CASE WHEN p.payment_method = 'cash' THEN 1 END) as cash_payments,
  COUNT(CASE WHEN p.payment_method = 'bank_transfer' THEN 1 END) as bank_payments
FROM payments p
WHERE p.payment_status = 'completed'
  AND p.processed_at >= $1
GROUP BY DATE_TRUNC('month', p.processed_at)
ORDER BY month DESC;

-- Failed payment analysis
SELECT 
  p.payment_gateway,
  p.payment_method,
  COUNT(p.id) as failed_count,
  AVG(p.amount) as avg_failed_amount,
  -- Common failure reasons from gateway response
  COUNT(CASE WHEN p.gateway_response::text LIKE '%insufficient%' THEN 1 END) as insufficient_funds,
  COUNT(CASE WHEN p.gateway_response::text LIKE '%declined%' THEN 1 END) as card_declined,
  COUNT(CASE WHEN p.gateway_response::text LIKE '%expired%' THEN 1 END) as card_expired,
  COUNT(CASE WHEN p.gateway_response::text LIKE '%timeout%' THEN 1 END) as timeout_failures
FROM payments p
WHERE p.payment_status = 'failed'
  AND p.created_at >= $1
GROUP BY p.payment_gateway, p.payment_method
ORDER BY failed_count DESC;

-- Customer payment patterns
SELECT 
  o.user_id,
  o.contact->>'name' as customer_name,
  COUNT(p.id) as total_payments,
  SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) as total_spent,
  AVG(CASE WHEN p.payment_status = 'completed' THEN p.amount END) as avg_payment_amount,
  COUNT(CASE WHEN p.payment_status = 'failed' THEN 1 END) as failed_payments,
  array_agg(DISTINCT p.payment_method) as preferred_methods,
  MAX(p.created_at) as last_payment_date,
  MIN(p.created_at) as first_payment_date
FROM payments p
JOIN orders o ON p.order_id = o.id
WHERE p.created_at >= $1
GROUP BY o.user_id, o.contact->>'name'
HAVING COUNT(p.id) >= 2 -- Customers with at least 2 payments
ORDER BY total_spent DESC
LIMIT $2;

-- Payment timing analysis
SELECT 
  EXTRACT(HOUR FROM p.created_at) as hour_of_day,
  COUNT(p.id) as payment_count,
  SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) as total_amount,
  ROUND(
    COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(p.id), 0) * 100, 2
  ) as success_rate
FROM payments p
WHERE p.created_at >= $1
GROUP BY EXTRACT(HOUR FROM p.created_at)
ORDER BY hour_of_day;

-- Refund analysis
SELECT 
  DATE_TRUNC('month', p.updated_at) as refund_month,
  COUNT(p.id) as total_refunds,
  SUM(p.amount) as total_refund_amount,
  AVG(p.amount) as avg_refund_amount,
  AVG(EXTRACT(EPOCH FROM (p.updated_at - p.created_at)) / 86400) as avg_days_to_refund,
  COUNT(DISTINCT p.order_id) as unique_orders_refunded
FROM payments p
WHERE p.payment_status = 'refunded'
  AND p.updated_at >= $1
GROUP BY DATE_TRUNC('month', p.updated_at)
ORDER BY refund_month DESC;