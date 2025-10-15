-- Create product_notifications table
CREATE TABLE IF NOT EXISTS product_notifications (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('expired', 'low_stock', 'new_product', 'supplier_added', 'stock_updated')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create unique constraint only for recurring notification types (expired, low_stock)
-- This allows multiple notifications for events like new_product, supplier_added, stock_updated
CREATE UNIQUE INDEX unique_recurring_notification 
ON product_notifications (product_id, notification_type, is_read) 
WHERE notification_type IN ('expired', 'low_stock');

-- Create index for faster queries
CREATE INDEX idx_product_notifications_product_id ON product_notifications(product_id);
CREATE INDEX idx_product_notifications_is_read ON product_notifications(is_read);
CREATE INDEX idx_product_notifications_type ON product_notifications(notification_type);
CREATE INDEX idx_product_notifications_created_at ON product_notifications(created_at DESC);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_product_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_product_notifications_updated_at
    BEFORE UPDATE ON product_notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_product_notifications_updated_at();
