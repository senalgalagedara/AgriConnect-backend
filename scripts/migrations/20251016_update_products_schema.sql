-- Migration: Update products table schema
-- Date: 2025-10-16
-- Description: Restructure products table with new fields (product_id, name, supplier_id, discount, price, total, weight, final_weight, image_path)

BEGIN;

-- Step 1: Drop existing triggers and indexes if they exist
DROP TRIGGER IF EXISTS products_updated_at ON products;
DROP INDEX IF EXISTS idx_products_status;
DROP INDEX IF EXISTS idx_products_province;
DROP INDEX IF EXISTS idx_products_category;

-- Step 2: Create a backup of the old products table (optional, for safety)
DROP TABLE IF EXISTS products_backup_20251016;
CREATE TABLE products_backup_20251016 AS SELECT * FROM products;

-- Step 3: Drop and recreate the products table with new schema
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    product_id INT,
    name VARCHAR(100),
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id INT,
    discount NUMERIC(10,2) DEFAULT 0,
    price NUMERIC(10,2) DEFAULT 0,
    total NUMERIC(10,2) DEFAULT 0,
    weight NUMERIC(10,2) DEFAULT 0,
    final_weight NUMERIC(10,2) DEFAULT 0,
    unit VARCHAR(10) DEFAULT 'kg',
    status VARCHAR(10) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_path TEXT
);

-- Step 4: Add indexes for performance
CREATE INDEX idx_products_product_id ON products(product_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_supplier_id ON products(supplier_id);
CREATE INDEX idx_products_status ON products(status);

-- Step 5: Create updated_at trigger
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Step 6: Add comments for documentation
COMMENT ON TABLE products IS 'Products table with new schema - updated 2025-10-16';
COMMENT ON COLUMN products.product_id IS 'Alternative product identifier';
COMMENT ON COLUMN products.name IS 'Product name';
COMMENT ON COLUMN products.supplier_id IS 'Reference to supplier (not enforced FK)';
COMMENT ON COLUMN products.discount IS 'Discount amount';
COMMENT ON COLUMN products.price IS 'Base price';
COMMENT ON COLUMN products.total IS 'Total price after calculations';
COMMENT ON COLUMN products.weight IS 'Original weight';
COMMENT ON COLUMN products.final_weight IS 'Final weight after processing';
COMMENT ON COLUMN products.image_path IS 'Path to product image';

-- Step 7: Insert sample data (optional)
INSERT INTO products (product_id, name, category_id, supplier_id, discount, price, total, weight, final_weight, unit, status, image_path)
VALUES 
    (1, 'Tomato', 1, 1, 0, 150.00, 150.00, 10.00, 10.00, 'kg', 'active', '/images/products/tomato.jpg'),
    (2, 'Carrot', 1, 1, 5.00, 120.00, 115.00, 15.00, 15.00, 'kg', 'active', '/images/products/carrot.jpg'),
    (3, 'Potato', 1, 2, 0, 80.00, 80.00, 25.00, 25.00, 'kg', 'active', '/images/products/potato.jpg');

COMMIT;

-- Migration complete: products table updated successfully
