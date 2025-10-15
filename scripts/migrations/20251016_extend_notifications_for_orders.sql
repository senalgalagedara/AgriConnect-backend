-- Rename product_notifications table to notifications (more generic)
ALTER TABLE product_notifications RENAME TO notifications;

-- Make product_id nullable (since order notifications don't have product_id)
ALTER TABLE notifications ALTER COLUMN product_id DROP NOT NULL;

-- Add order_id column for order-related notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE;

-- Update notification_type check constraint to include new types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS product_notifications_notification_type_check;
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
  'milestone_earnings',
  'milestone_orders'
));

-- Update unique constraint for recurring notifications
-- Only applies to product-based recurring notifications (expired, low_stock)
DROP INDEX IF EXISTS unique_recurring_notification;
CREATE UNIQUE INDEX unique_recurring_notification 
ON notifications (product_id, notification_type, is_read) 
WHERE product_id IS NOT NULL AND notification_type IN ('expired', 'low_stock');

-- Add index for order notifications
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications(order_id);

-- Create milestone tracking table to prevent duplicate milestone notifications
CREATE TABLE IF NOT EXISTS notification_milestones (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  milestone_type VARCHAR(50) NOT NULL CHECK (milestone_type IN ('earnings', 'orders')),
  milestone_value NUMERIC(12,2) NOT NULL,
  achieved_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, milestone_type, milestone_value)
);

CREATE INDEX IF NOT EXISTS idx_notification_milestones_user_id ON notification_milestones(user_id);

-- Update the trigger function name reference
DROP TRIGGER IF EXISTS trigger_update_product_notifications_updated_at ON notifications;
DROP TRIGGER IF EXISTS trigger_update_notifications_updated_at ON notifications;

CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_product_notifications_updated_at();

-- Add comment to table
COMMENT ON TABLE notifications IS 'Unified notification table for products, orders, and milestones';
COMMENT ON COLUMN notifications.product_id IS 'Product ID for product-related notifications (nullable)';
COMMENT ON COLUMN notifications.order_id IS 'Order ID for order-related notifications (nullable)';
COMMENT ON TABLE notification_milestones IS 'Tracks achieved milestones to prevent duplicate notifications';
