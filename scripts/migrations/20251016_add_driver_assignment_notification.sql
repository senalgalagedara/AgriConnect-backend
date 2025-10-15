-- Add driver_assigned notification type
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type IN (
  'expired', 
  'low_stock', 
  'new_product', 
  'supplier_added', 
  'stock_updated',
  'order_placed',
  'order_cancelled',
  'driver_assigned',
  'milestone_earnings',
  'milestone_orders'
));

-- Add comment
COMMENT ON TABLE notifications IS 'Unified notification table for products, orders, drivers, and milestones';
