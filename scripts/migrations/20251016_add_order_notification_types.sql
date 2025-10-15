-- Extend product_notifications table to support order/payment notifications
-- Rename table to 'notifications' for broader scope and add order_id column

-- Step 1: Rename the table
ALTER TABLE product_notifications RENAME TO notifications;

-- Step 2: Add order_id column (nullable since not all notifications are order-related)
ALTER TABLE notifications 
ADD COLUMN order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE;

-- Step 3: Make product_id nullable (since order notifications won't have product_id)
ALTER TABLE notifications 
ALTER COLUMN product_id DROP NOT NULL;

-- Step 4: Update the CHECK constraint to include new notification types
ALTER TABLE notifications 
DROP CONSTRAINT IF EXISTS product_notifications_notification_type_check;

ALTER TABLE notifications 
ADD CONSTRAINT notifications_notification_type_check 
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

-- Step 5: Update unique constraint name to reflect table rename
DROP INDEX IF EXISTS unique_recurring_notification;

CREATE UNIQUE INDEX unique_recurring_notification 
ON notifications (product_id, notification_type, is_read) 
WHERE notification_type IN ('expired', 'low_stock') AND product_id IS NOT NULL;

-- Step 6: Add new indexes for order-related queries
CREATE INDEX idx_notifications_order_id ON notifications(order_id);

-- Step 7: Update the trigger function name
DROP TRIGGER IF EXISTS trigger_update_product_notifications_updated_at ON notifications;

CREATE TRIGGER trigger_update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_product_notifications_updated_at();

-- Step 8: Create a milestone tracking table to prevent duplicate milestone notifications
CREATE TABLE IF NOT EXISTS notification_milestones (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    milestone_type VARCHAR(50) NOT NULL CHECK (milestone_type IN ('earnings', 'orders')),
    milestone_value INTEGER NOT NULL,
    achieved_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, milestone_type, milestone_value)
);

CREATE INDEX idx_notification_milestones_user ON notification_milestones(user_id);
CREATE INDEX idx_notification_milestones_type ON notification_milestones(milestone_type);

COMMENT ON TABLE notifications IS 'Unified notification table for product and order events';
COMMENT ON COLUMN notifications.product_id IS 'Foreign key to products table (nullable for order notifications)';
COMMENT ON COLUMN notifications.order_id IS 'Foreign key to orders table (nullable for product notifications)';
COMMENT ON TABLE notification_milestones IS 'Tracks achieved milestones to prevent duplicate notifications';
