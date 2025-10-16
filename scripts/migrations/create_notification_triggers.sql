-- Create a function to automatically create notifications on database changes
-- This will be triggered by database INSERT/UPDATE/DELETE operations

-- Function to create notification when a new product is added
CREATE OR REPLACE FUNCTION notify_new_product()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (product_id, notification_type, message, is_read, created_at, updated_at)
  VALUES (
    NEW.id,
    'new_product',
    '✨ New product "' || NEW.product_name || '" has been added to the inventory system.',
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when product stock is updated
CREATE OR REPLACE FUNCTION notify_stock_change()
RETURNS TRIGGER AS $$
DECLARE
  change_amount NUMERIC;
  change_text TEXT;
BEGIN
  IF OLD.current_stock != NEW.current_stock THEN
    change_amount := NEW.current_stock - OLD.current_stock;
    
    IF change_amount > 0 THEN
      change_text := 'increased by ' || ABS(change_amount);
    ELSE
      change_text := 'decreased by ' || ABS(change_amount);
    END IF;
    
    INSERT INTO notifications (product_id, notification_type, message, is_read, created_at, updated_at)
    VALUES (
      NEW.id,
      'stock_updated',
      '🔄 Stock for "' || NEW.product_name || '" ' || change_text || ' ' || NEW.unit || '. Current stock: ' || NEW.current_stock || ' ' || NEW.unit || '.',
      false,
      NOW(),
      NOW()
    );
    
    -- Also check for low stock
    IF NEW.current_stock < (NEW.daily_limit * 0.2) AND NEW.current_stock > 0 THEN
      INSERT INTO notifications (product_id, notification_type, message, is_read, created_at, updated_at)
      VALUES (
        NEW.id,
        'low_stock',
        '📦 Low stock alert for "' || NEW.product_name || '". Current stock: ' || NEW.current_stock || ' ' || NEW.unit || ' (' || ROUND((NEW.current_stock / NEW.daily_limit * 100)::numeric, 1) || '% of daily limit).',
        false,
        NOW(),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when product is deleted
CREATE OR REPLACE FUNCTION notify_product_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (product_id, notification_type, message, is_read, created_at, updated_at)
  VALUES (
    NULL, -- product is deleted, so we can't reference it
    'product_deleted',
    '🗑️ Product "' || OLD.product_name || '" has been removed from inventory.',
    false,
    NOW(),
    NOW()
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when a new order is placed
CREATE OR REPLACE FUNCTION notify_order_placed()
RETURNS TRIGGER AS $$
DECLARE
  item_count INTEGER;
BEGIN
  -- Count items in the order
  SELECT COUNT(*) INTO item_count FROM order_items WHERE order_id = NEW.id;
  
  INSERT INTO notifications (order_id, notification_type, message, is_read, created_at, updated_at)
  VALUES (
    NEW.id,
    'order_placed',
    '🛒 Order #' || NEW.order_no || ' has been placed successfully! Total: Rs ' || NEW.total || ' (' || item_count || ' item' || CASE WHEN item_count > 1 THEN 's' ELSE '' END || ')',
    false,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when order status changes
CREATE OR REPLACE FUNCTION notify_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO notifications (order_id, notification_type, message, is_read, created_at, updated_at)
    VALUES (
      NEW.id,
      CASE 
        WHEN NEW.status = 'cancelled' THEN 'order_cancelled'
        WHEN NEW.status = 'completed' THEN 'order_completed'
        WHEN NEW.status = 'processing' THEN 'order_processing'
        ELSE 'order_status_changed'
      END,
      CASE 
        WHEN NEW.status = 'cancelled' THEN '❌ Order #' || NEW.order_no || ' has been cancelled. Amount: Rs ' || NEW.total
        WHEN NEW.status = 'completed' THEN '✅ Order #' || NEW.order_no || ' has been completed! Amount: Rs ' || NEW.total
        WHEN NEW.status = 'processing' THEN '⚙️ Order #' || NEW.order_no || ' is now being processed.'
        ELSE '🔄 Order #' || NEW.order_no || ' status changed to: ' || NEW.status
      END,
      false,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when a driver is assigned
CREATE OR REPLACE FUNCTION notify_driver_assigned()
RETURNS TRIGGER AS $$
DECLARE
  driver_full_name TEXT;
  driver_contact TEXT;
  order_number INTEGER;
BEGIN
  -- Get driver details
  SELECT CONCAT(first_name, ' ', last_name), contact_number 
  INTO driver_full_name, driver_contact
  FROM drivers WHERE id = NEW.driver_id;
  
  -- Get order number
  SELECT order_no INTO order_number FROM orders WHERE id = NEW.order_id;
  
  INSERT INTO notifications (order_id, notification_type, message, is_read, created_at, updated_at)
  VALUES (
    NEW.order_id,
    'driver_assigned',
    '🚗 Driver assigned! ' || driver_full_name || ' (' || driver_contact || ') has been assigned to Order #' || order_number || '.',
    false,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when assignment is cancelled
CREATE OR REPLACE FUNCTION notify_assignment_cancelled()
RETURNS TRIGGER AS $$
DECLARE
  driver_full_name TEXT;
  order_number INTEGER;
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Get driver details
    SELECT CONCAT(first_name, ' ', last_name) 
    INTO driver_full_name
    FROM drivers WHERE id = NEW.driver_id;
    
    -- Get order number
    SELECT order_no INTO order_number FROM orders WHERE id = NEW.order_id;
    
    INSERT INTO notifications (order_id, notification_type, message, is_read, created_at, updated_at)
    VALUES (
      NEW.order_id,
      'assignment_cancelled',
      '⚠️ Driver assignment cancelled for Order #' || order_number || '. Driver: ' || driver_full_name,
      false,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when a payment is deleted
CREATE OR REPLACE FUNCTION notify_payment_deleted()
RETURNS TRIGGER AS $$
DECLARE
  order_number INTEGER;
BEGIN
  -- Get order number
  SELECT order_no INTO order_number FROM orders WHERE id = OLD.order_id;
  
  INSERT INTO notifications (order_id, notification_type, message, is_read, created_at, updated_at)
  VALUES (
    OLD.order_id,
    'payment_deleted',
    '❌ Payment record deleted for Order #' || order_number || '. Amount: Rs ' || OLD.amount,
    false,
    NOW(),
    NOW()
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Function to create notification when supplier adds stock
CREATE OR REPLACE FUNCTION notify_supplier_stock_added()
RETURNS TRIGGER AS $$
DECLARE
  product_name_val TEXT;
  farmer_name_val TEXT;
BEGIN
  -- Get product name
  SELECT product_name INTO product_name_val FROM products WHERE id = NEW.product_id;
  
  -- Get farmer/supplier name
  SELECT CONCAT(first_name, ' ', last_name) INTO farmer_name_val 
  FROM users WHERE id = NEW.farmer_id;
  
  IF farmer_name_val IS NULL THEN
    farmer_name_val := 'Unknown Farmer';
  END IF;
  
  INSERT INTO notifications (product_id, notification_type, message, is_read, created_at, updated_at)
  VALUES (
    NEW.product_id,
    'supplier_added',
    '🚚 ' || farmer_name_val || ' supplied ' || NEW.quantity_supplied || ' kg of "' || product_name_val || '" to inventory.',
    false,
    NOW(),
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS trigger_notify_new_product ON products;
DROP TRIGGER IF EXISTS trigger_notify_stock_change ON products;
DROP TRIGGER IF EXISTS trigger_notify_product_deletion ON products;
DROP TRIGGER IF EXISTS trigger_notify_order_placed ON orders;
DROP TRIGGER IF EXISTS trigger_notify_order_status_change ON orders;
DROP TRIGGER IF EXISTS trigger_notify_driver_assigned ON assignments;
DROP TRIGGER IF EXISTS trigger_notify_assignment_cancelled ON assignments;
DROP TRIGGER IF EXISTS trigger_notify_payment_deleted ON payments;

-- Create triggers for PRODUCTS table
CREATE TRIGGER trigger_notify_new_product
AFTER INSERT ON products
FOR EACH ROW
EXECUTE FUNCTION notify_new_product();

CREATE TRIGGER trigger_notify_stock_change
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION notify_stock_change();

CREATE TRIGGER trigger_notify_product_deletion
AFTER DELETE ON products
FOR EACH ROW
EXECUTE FUNCTION notify_product_deletion();

-- Create triggers for ORDERS table
CREATE TRIGGER trigger_notify_order_placed
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_placed();

CREATE TRIGGER trigger_notify_order_status_change
AFTER UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION notify_order_status_change();

-- Create triggers for ASSIGNMENTS table
CREATE TRIGGER trigger_notify_driver_assigned
AFTER INSERT ON assignments
FOR EACH ROW
EXECUTE FUNCTION notify_driver_assigned();

CREATE TRIGGER trigger_notify_assignment_cancelled
AFTER UPDATE ON assignments
FOR EACH ROW
EXECUTE FUNCTION notify_assignment_cancelled();

-- Create trigger for PAYMENTS table
CREATE TRIGGER trigger_notify_payment_deleted
AFTER DELETE ON payments
FOR EACH ROW
EXECUTE FUNCTION notify_payment_deleted();

COMMENT ON TRIGGER trigger_notify_new_product ON products IS 'Automatically creates notification when new product is added';
COMMENT ON TRIGGER trigger_notify_stock_change ON products IS 'Automatically creates notification when product stock changes';
COMMENT ON TRIGGER trigger_notify_product_deletion ON products IS 'Automatically creates notification when product is deleted';
COMMENT ON TRIGGER trigger_notify_order_placed ON orders IS 'Automatically creates notification when new order is placed';
COMMENT ON TRIGGER trigger_notify_order_status_change ON orders IS 'Automatically creates notification when order status changes';
COMMENT ON TRIGGER trigger_notify_driver_assigned ON assignments IS 'Automatically creates notification when driver is assigned';
COMMENT ON TRIGGER trigger_notify_assignment_cancelled ON assignments IS 'Automatically creates notification when assignment is cancelled';
COMMENT ON TRIGGER trigger_notify_payment_deleted ON payments IS 'Automatically creates notification when payment is deleted';
