-- Test Query for Dashboard Stats
-- Run this in pgAdmin to verify the query works

-- Main query (matches DashboardController)
SELECT
  (COALESCE((SELECT COUNT(*)::int FROM farmers),0) + COALESCE((SELECT COUNT(*)::int FROM drivers),0)) as total_users,
  COALESCE((SELECT COUNT(*)::int FROM orders),0) as total_orders,
  -- Prefer payments sum for revenue if payments table exists, fall back to paid orders total
  COALESCE((SELECT SUM(amount)::numeric FROM payments WHERE status = 'paid'), (SELECT SUM(total) FROM orders WHERE status = 'paid'), 0) as total_revenue,
  COALESCE((SELECT COUNT(*)::int FROM orders WHERE status IN ('pending','processing','shipped')),0) as pending_deliveries,
  COALESCE((SELECT COUNT(*)::int FROM feedback),0) as total_feedback,
  COALESCE((SELECT COUNT(*)::int FROM payments),0) as total_payments;

-- Individual table checks
SELECT 'Farmers count:' as info, COUNT(*) FROM farmers;
SELECT 'Drivers count:' as info, COUNT(*) FROM drivers;
SELECT 'Orders count:' as info, COUNT(*) FROM orders;
SELECT 'Payments count:' as info, COUNT(*) FROM payments;
SELECT 'Feedback count:' as info, COUNT(*) FROM feedback;

-- Check payment statuses
SELECT status, COUNT(*) as count, SUM(amount) as total_amount
FROM payments
GROUP BY status;

-- Check order statuses
SELECT status, COUNT(*) as count, SUM(total) as total_amount
FROM orders
GROUP BY status;
