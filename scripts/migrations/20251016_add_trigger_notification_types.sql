-- Add missing notification types for database triggers
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
  'milestone_orders',
  'product_deleted',
  'payment_deleted',
  'order_completed',
  'order_processing',
  'order_status_changed',
  'assignment_cancelled'
));
