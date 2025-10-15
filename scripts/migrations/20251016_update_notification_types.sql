-- Update product_notifications table to support new notification types
-- This migration adds new notification types and updates the constraint

-- Drop old constraint if it exists
ALTER TABLE product_notifications DROP CONSTRAINT IF EXISTS product_notifications_notification_type_check;
ALTER TABLE product_notifications DROP CONSTRAINT IF EXISTS unique_active_notification;
DROP INDEX IF EXISTS unique_recurring_notification;

-- Add new notification types to check constraint
ALTER TABLE product_notifications 
ADD CONSTRAINT product_notifications_notification_type_check 
CHECK (notification_type IN ('expired', 'low_stock', 'new_product', 'supplier_added', 'stock_updated'));

-- Create unique constraint only for recurring notification types (expired, low_stock)
-- This allows multiple notifications for events like new_product, supplier_added, stock_updated
CREATE UNIQUE INDEX unique_recurring_notification 
ON product_notifications (product_id, notification_type, is_read) 
WHERE notification_type IN ('expired', 'low_stock');

-- Add comment
COMMENT ON TABLE product_notifications IS 'Stores product notifications including expired products, low stock, new products, and supplier activities';
