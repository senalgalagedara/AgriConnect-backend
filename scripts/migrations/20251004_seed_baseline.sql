-- Baseline seed data for AgriConnect
-- Safe / idempotent: uses ON CONFLICT or EXISTS guards.
-- Adjust sample data as needed.
BEGIN;

/* ============= Provinces ============= */
INSERT INTO provinces (name, capacity, location, manager_name)
VALUES 
  ('Central', 5000, 'Central Region', 'Alice Manager'),
  ('Northern', 3000, 'Northern Region', 'Bob Supervisor'),
  ('Southern', 4000, 'Southern Region', 'Carol Lead')
ON CONFLICT (name) DO UPDATE SET
  capacity = EXCLUDED.capacity,
  location = EXCLUDED.location,
  manager_name = EXCLUDED.manager_name;

/* ============= Categories ============= */
INSERT INTO categories (name, description)
VALUES 
  ('Vegetables','Leafy and root vegetables'),
  ('Fruits','Seasonal fruits'),
  ('Grains','Grain products')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

/* ============= Admin User ============= */
-- NOTE: Replace password hash with a secure one for production. Default password here is 'admin123'.
DO $$
DECLARE
  existing_id INTEGER;
BEGIN
  SELECT id INTO existing_id FROM users WHERE email = 'admin@example.com';
  IF existing_id IS NULL THEN
    INSERT INTO users (email, password_hash, role, first_name, last_name, status)
    VALUES ('admin@example.com', '$2a$10$H2nMBfgYOKg57f8dVg1AuOk6oL5/hir.pZyLzUrhoO1JZEcK3S0iu', 'admin', 'System', 'Admin', 'active');
  END IF;
END$$;

/* ============= Sample Products ============= */
-- Only insert if table currently empty (so we don't pollute existing environments)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM products) = 0 THEN
    INSERT INTO products (product_name, category_id, province_id, daily_limit, current_stock, final_price, unit, status)
    SELECT 'Tomatoes', c1.id, p1.id, 100, 80, 2.50, 'kg', 'active'
    FROM categories c1, provinces p1
    WHERE c1.name = 'Vegetables' AND p1.name = 'Central'
    LIMIT 1;

    INSERT INTO products (product_name, category_id, province_id, daily_limit, current_stock, final_price, unit, status)
    SELECT 'Apples', c2.id, p2.id, 120, 95, 3.10, 'kg', 'active'
    FROM categories c2, provinces p2
    WHERE c2.name = 'Fruits' AND p2.name = 'Northern'
    LIMIT 1;
  END IF;
END$$;

/* ============= Sample Farmer ============= */
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM farmers) = 0 THEN
    INSERT INTO farmers (name, contact_number, email, address, province_id, registration_number)
    SELECT 'John Farmer', '1234567890', 'john.farmer@example.com', '123 Farm Lane', p.id, 'REG-001'
    FROM provinces p WHERE p.name = 'Central' LIMIT 1;
  END IF;
END$$;

/* ============= Sample Supplier (links farmer + product) ============= */
DO $$
DECLARE
  prod INTEGER; farm INTEGER;
BEGIN
  SELECT id INTO prod FROM products ORDER BY id LIMIT 1;
  SELECT id INTO farm FROM farmers ORDER BY id LIMIT 1;
  IF prod IS NOT NULL AND farm IS NOT NULL AND (SELECT COUNT(*) FROM suppliers) = 0 THEN
    INSERT INTO suppliers (farmer_id, product_id, quantity, price_per_unit, supply_date, notes, status)
    VALUES (farm, prod, 50, 1.80, CURRENT_DATE, 'Initial supply batch', 'active');
  END IF;
END$$;

COMMIT;
