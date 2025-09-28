-- Admin Module SQL Queries
-- All database operations for the Admin module and administrative functions

-- ===========================
-- ADMIN ACTION LOGGING
-- ===========================

-- Log admin action
INSERT INTO admin_actions (
  admin_id, action_type, entity_type, entity_id, 
  old_values, new_values, notes, ip_address, user_agent
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
RETURNING *;

-- Get admin action history
SELECT 
  aa.*,
  -- Try to get admin name if users table exists
  CASE 
    WHEN aa.entity_type = 'farmer' THEN (SELECT name FROM farmers WHERE id = aa.entity_id LIMIT 1)
    WHEN aa.entity_type = 'driver' THEN (SELECT name FROM drivers WHERE id = aa.entity_id LIMIT 1)
    WHEN aa.entity_type = 'product' THEN (SELECT product_name FROM products WHERE id = aa.entity_id LIMIT 1)
    ELSE CONCAT(aa.entity_type, ' #', aa.entity_id)
  END as entity_name
FROM admin_actions aa
ORDER BY aa.created_at DESC
LIMIT $1 OFFSET $2;

-- Get admin actions for specific entity
SELECT * FROM admin_actions 
WHERE entity_type = $1 AND entity_id = $2
ORDER BY created_at DESC;

-- Get admin actions by admin
SELECT 
  aa.*,
  CASE 
    WHEN aa.entity_type = 'farmer' THEN (SELECT name FROM farmers WHERE id = aa.entity_id LIMIT 1)
    WHEN aa.entity_type = 'driver' THEN (SELECT name FROM drivers WHERE id = aa.entity_id LIMIT 1)
    ELSE CONCAT(aa.entity_type, ' #', aa.entity_id)
  END as entity_name
FROM admin_actions aa
WHERE aa.admin_id = $1
ORDER BY aa.created_at DESC
LIMIT $2;

-- ===========================
-- SYSTEM OVERVIEW QUERIES
-- ===========================

-- Dashboard overview statistics
SELECT 
  -- User counts
  (SELECT COUNT(*) FROM farmers WHERE status = 'active') as active_farmers,
  (SELECT COUNT(*) FROM drivers WHERE status = 'active') as active_drivers,
  (SELECT COUNT(*) FROM products WHERE status = 'active') as active_products,
  
  -- Order statistics
  (SELECT COUNT(*) FROM orders WHERE status = 'pending') as pending_orders,
  (SELECT COUNT(*) FROM orders WHERE status = 'in_transit') as in_transit_orders,
  (SELECT COUNT(*) FROM orders WHERE created_at >= CURRENT_DATE) as orders_today,
  
  -- Assignment statistics
  (SELECT COUNT(*) FROM assignments WHERE status = 'pending') as pending_assignments,
  (SELECT COUNT(*) FROM assignments WHERE status = 'in_progress') as active_assignments,
  
  -- Financial statistics
  (SELECT COALESCE(SUM(total), 0) FROM orders WHERE status != 'cancelled' AND created_at >= CURRENT_DATE) as revenue_today,
  (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_status = 'completed' AND processed_at >= CURRENT_DATE) as payments_today,
  
  -- Feedback statistics
  (SELECT COUNT(*) FROM feedback WHERE status = 'pending') as pending_feedback,
  (SELECT COUNT(*) FROM feedback WHERE created_at >= CURRENT_DATE) as feedback_today,
  
  -- Stock alerts
  (SELECT COUNT(*) FROM products WHERE current_stock < daily_limit * 0.1 AND daily_limit > 0) as low_stock_products;

-- System health check
SELECT 
  'farmers' as entity,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_additions
FROM farmers
UNION ALL
SELECT 
  'drivers' as entity,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_additions
FROM drivers
UNION ALL
SELECT 
  'products' as entity,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_additions
FROM products
UNION ALL
SELECT 
  'orders' as entity,
  COUNT(*) as total_count,
  COUNT(CASE WHEN status NOT IN ('cancelled') THEN 1 END) as active_count,
  COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as recent_additions
FROM orders;

-- ===========================
-- USER MANAGEMENT QUERIES
-- ===========================

-- Get all farmers with detailed info for admin review
SELECT 
  f.*,
  p.name as province_name,
  COUNT(DISTINCT s.id) as supplier_records,
  COALESCE(SUM(s.quantity * s.price_per_unit), 0) as total_supply_value,
  MAX(s.supply_date) as last_supply_date
FROM farmers f
LEFT JOIN provinces p ON f.province_id = p.id
LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.status = 'active'
GROUP BY f.id, p.name
ORDER BY f.created_at DESC;

-- Get all drivers with performance metrics
SELECT 
  d.*,
  COUNT(DISTINCT a.id) as total_assignments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
  ROUND(
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(a.id), 0) * 100, 2
  ) as completion_rate,
  COALESCE(SUM(o.total), 0) as total_delivery_value,
  MAX(a.completed_at) as last_delivery_date
FROM drivers d
LEFT JOIN assignments a ON d.id = a.driver_id
LEFT JOIN orders o ON a.order_id = o.id
GROUP BY d.id
ORDER BY d.created_at DESC;

-- Get problematic users (for admin review)
SELECT 
  'farmer' as user_type,
  f.id,
  f.name,
  f.contact_number,
  f.email,
  'No recent activity' as issue,
  f.created_at
FROM farmers f
LEFT JOIN suppliers s ON f.id = s.farmer_id AND s.supply_date >= CURRENT_DATE - INTERVAL '3 months'
WHERE f.status = 'active' 
  AND s.id IS NULL
  AND f.created_at <= CURRENT_DATE - INTERVAL '1 month'

UNION ALL

SELECT 
  'driver' as user_type,
  d.id,
  d.name,
  d.phone_number,
  NULL as email,
  'Low completion rate' as issue,
  d.created_at
FROM drivers d
LEFT JOIN (
  SELECT 
    driver_id,
    COUNT(*) as total,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
  FROM assignments
  WHERE assigned_at >= CURRENT_DATE - INTERVAL '3 months'
  GROUP BY driver_id
) perf ON d.id = perf.driver_id
WHERE d.status = 'active'
  AND (perf.completed::DECIMAL / NULLIF(perf.total, 0)) < 0.7 -- Less than 70% completion rate
  AND perf.total >= 5; -- At least 5 assignments

-- ===========================
-- CONTENT MANAGEMENT QUERIES
-- ===========================

-- Get products needing admin attention
SELECT 
  p.*,
  c.name as category_name,
  pr.name as province_name,
  (p.current_stock / NULLIF(p.daily_limit, 0) * 100) as stock_percentage,
  COUNT(s.id) as active_suppliers,
  AVG(s.price_per_unit) as avg_supplier_price
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
LEFT JOIN suppliers s ON p.id = s.product_id AND s.status = 'active'
WHERE p.status = 'active'
  AND (
    p.current_stock < p.daily_limit * 0.1 -- Low stock
    OR NOT EXISTS (SELECT 1 FROM suppliers WHERE product_id = p.id AND status = 'active') -- No suppliers
    OR p.updated_at < CURRENT_DATE - INTERVAL '30 days' -- Not updated recently
  )
GROUP BY p.id, c.name, pr.name
ORDER BY stock_percentage ASC;

-- Get recent orders requiring admin review
SELECT 
  o.*,
  o.contact->>'name' as customer_name,
  o.contact->>'phone' as customer_phone,
  COUNT(oi.id) as item_count,
  CASE 
    WHEN o.status = 'pending' AND o.created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours' THEN 'overdue_processing'
    WHEN o.assignment_status = 'unassigned' AND o.status = 'confirmed' THEN 'needs_assignment'
    WHEN o.total > 1000 THEN 'high_value_order'
    ELSE 'normal'
  END as admin_attention_reason
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.status NOT IN ('delivered', 'cancelled')
  AND (
    (o.status = 'pending' AND o.created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours')
    OR (o.assignment_status = 'unassigned' AND o.status = 'confirmed')
    OR o.total > 1000
  )
GROUP BY o.id
ORDER BY o.created_at ASC;

-- ===========================
-- FINANCIAL OVERSIGHT QUERIES
-- ===========================

-- Daily financial summary for admin
SELECT 
  CURRENT_DATE as report_date,
  
  -- Orders
  COUNT(o.id) as total_orders,
  COUNT(CASE WHEN o.status != 'cancelled' THEN 1 END) as valid_orders,
  COALESCE(SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END), 0) as total_order_value,
  
  -- Payments
  COUNT(p.id) as total_payment_attempts,
  COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as successful_payments,
  COALESCE(SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END), 0) as total_payments_received,
  COUNT(CASE WHEN p.payment_status = 'failed' THEN 1 END) as failed_payments,
  
  -- Refunds
  COUNT(CASE WHEN p.payment_status = 'refunded' THEN 1 END) as refunds_issued,
  COALESCE(SUM(CASE WHEN p.payment_status = 'refunded' THEN p.amount ELSE 0 END), 0) as total_refunds,
  
  -- Net revenue
  COALESCE(SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END), 0) -
  COALESCE(SUM(CASE WHEN p.payment_status = 'refunded' THEN p.amount ELSE 0 END), 0) as net_revenue

FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
WHERE DATE(o.created_at) = CURRENT_DATE
   OR DATE(p.created_at) = CURRENT_DATE;

-- Payment gateway comparison
SELECT 
  p.payment_gateway,
  COUNT(p.id) as total_transactions,
  COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as successful_transactions,
  ROUND(
    COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END)::DECIMAL / 
    NULLIF(COUNT(p.id), 0) * 100, 2
  ) as success_rate,
  SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) as total_processed,
  AVG(CASE WHEN p.payment_status = 'completed' THEN p.amount END) as avg_transaction_amount
FROM payments p
WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY p.payment_gateway
ORDER BY total_processed DESC;

-- ===========================
-- OPERATIONAL MONITORING
-- ===========================

-- Assignment and delivery monitoring
SELECT 
  DATE(a.assigned_at) as assignment_date,
  COUNT(a.id) as total_assignments,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_assignments,
  COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_assignments,
  COUNT(CASE WHEN a.schedule_time < NOW() AND a.status NOT IN ('completed', 'cancelled') THEN 1 END) as overdue_assignments,
  AVG(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600) as avg_completion_hours,
  COUNT(DISTINCT a.driver_id) as active_drivers
FROM assignments a
WHERE a.assigned_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(a.assigned_at)
ORDER BY assignment_date DESC;

-- Stock level monitoring
SELECT 
  p.id,
  p.product_name,
  pr.name as province_name,
  p.current_stock,
  p.daily_limit,
  ROUND((p.current_stock / NULLIF(p.daily_limit, 0) * 100), 2) as stock_percentage,
  COUNT(s.id) as active_suppliers,
  MAX(s.supply_date) as last_supply_date,
  CASE 
    WHEN p.current_stock <= 0 THEN 'out_of_stock'
    WHEN p.current_stock < p.daily_limit * 0.1 THEN 'critically_low'
    WHEN p.current_stock < p.daily_limit * 0.25 THEN 'low'
    ELSE 'adequate'
  END as stock_status
FROM products p
LEFT JOIN provinces pr ON p.province_id = pr.id
LEFT JOIN suppliers s ON p.id = s.product_id AND s.status = 'active'
WHERE p.status = 'active'
GROUP BY p.id, pr.name
ORDER BY stock_percentage ASC;

-- ===========================
-- REPORTING AND ANALYTICS
-- ===========================

-- Weekly business summary
SELECT 
  DATE_TRUNC('week', CURRENT_DATE) as week_start,
  
  -- Customer activity
  COUNT(DISTINCT o.user_id) as unique_customers,
  COUNT(o.id) as total_orders,
  AVG(o.total) as avg_order_value,
  
  -- Product performance
  COUNT(DISTINCT oi.product_id) as products_sold,
  SUM(oi.qty) as total_items_sold,
  
  -- Financial metrics
  SUM(CASE WHEN o.status != 'cancelled' THEN o.total ELSE 0 END) as gross_revenue,
  SUM(CASE WHEN p.payment_status = 'completed' THEN p.amount ELSE 0 END) as net_revenue,
  
  -- Operational metrics
  COUNT(DISTINCT a.driver_id) as active_drivers,
  AVG(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600) as avg_delivery_hours
  
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN payments p ON o.id = p.order_id
LEFT JOIN assignments a ON o.id = a.order_id AND a.status = 'completed'
WHERE o.created_at >= DATE_TRUNC('week', CURRENT_DATE)
  AND o.created_at < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week';

-- System alerts for admin attention
SELECT 
  alert_type,
  alert_message,
  priority,
  count,
  created_at
FROM (
  -- Low stock alerts
  SELECT 
    'stock' as alert_type,
    'Low stock: ' || COUNT(*) || ' products below 10% stock level' as alert_message,
    'high' as priority,
    COUNT(*) as count,
    MAX(updated_at) as created_at
  FROM products 
  WHERE status = 'active' 
    AND current_stock < daily_limit * 0.1 
    AND daily_limit > 0
  HAVING COUNT(*) > 0
    
  UNION ALL
  
  -- Overdue orders
  SELECT 
    'orders' as alert_type,
    'Overdue orders: ' || COUNT(*) || ' orders pending > 24 hours' as alert_message,
    'urgent' as priority,
    COUNT(*) as count,
    MAX(created_at) as created_at
  FROM orders 
  WHERE status = 'pending' 
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours'
  HAVING COUNT(*) > 0
    
  UNION ALL
  
  -- Failed payments
  SELECT 
    'payments' as alert_type,
    'Payment failures: ' || COUNT(*) || ' failed payments in last 24 hours' as alert_message,
    'medium' as priority,
    COUNT(*) as count,
    MAX(created_at) as created_at
  FROM payments 
  WHERE payment_status = 'failed' 
    AND created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
  HAVING COUNT(*) > 0
    
  UNION ALL
  
  -- Unresolved feedback
  SELECT 
    'feedback' as alert_type,
    'Urgent feedback: ' || COUNT(*) || ' urgent feedback items pending' as alert_message,
    'high' as priority,
    COUNT(*) as count,
    MAX(created_at) as created_at
  FROM feedback 
  WHERE status = 'pending' 
    AND priority = 'urgent'
  HAVING COUNT(*) > 0
) alerts
ORDER BY 
  CASE priority 
    WHEN 'urgent' THEN 1 
    WHEN 'high' THEN 2 
    WHEN 'medium' THEN 3 
    ELSE 4 
  END,
  created_at DESC;