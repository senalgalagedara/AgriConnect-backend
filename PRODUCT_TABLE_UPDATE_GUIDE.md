# Product Table Schema Update Guide

## Overview
This migration ensures your PostgreSQL `products` table matches the current Product module requirements.

## Current Schema Requirements

Based on `ProductModel.ts`, the products table should have:

| Column Name     | Data Type      | Constraints                    | Default Value |
|----------------|----------------|--------------------------------|---------------|
| id             | SERIAL         | PRIMARY KEY                    | AUTO          |
| product_name   | TEXT           | NOT NULL                       | -             |
| category_id    | INTEGER        | FK to categories(id)           | NULL          |
| province_id    | INTEGER        | FK to provinces(id)            | NULL          |
| daily_limit    | NUMERIC(12,2)  | NOT NULL                       | 0             |
| current_stock  | NUMERIC(12,2)  | NOT NULL                       | 0             |
| final_price    | NUMERIC(12,2)  | NOT NULL                       | 0             |
| unit           | TEXT           | NOT NULL                       | 'kg'          |
| status         | TEXT           | NOT NULL                       | 'active'      |
| created_at     | TIMESTAMPTZ    | NOT NULL                       | NOW()         |
| updated_at     | TIMESTAMPTZ    | NOT NULL                       | NOW()         |

### Status Values
- `active` - Product is available for ordering
- `inactive` - Product is temporarily unavailable
- `discontinued` - Product is permanently discontinued
- `deleted` - Soft-deleted product (used by delete method)

### Unit Values
Common units: `kg`, `g`, `lb`, `pcs`, `dozen`, `box`, etc.

## How to Apply the Migration

### Option 1: Using pgAdmin Query Tool

1. Open **pgAdmin**
2. Connect to your database
3. Right-click on your database → **Query Tool**
4. Open the migration file: `scripts/migrations/update_products_table.sql`
5. Copy and paste the SQL content into the query window
6. Click **Execute** (F5)
7. Review the output to verify all changes were applied

### Option 2: Using psql Command Line

```bash
# Navigate to the project directory
cd c:\Users\U S E R\AgriConnect-backend

# Run the migration
psql -U your_username -d your_database_name -f scripts/migrations/update_products_table.sql
```

### Option 3: Using Node.js Script

```bash
# Navigate to the project directory
cd c:\Users\U S E R\AgriConnect-backend

# Run the migration using Node.js
npm run db:migrate
```

## What the Migration Does

1. **Creates the products table** if it doesn't exist
2. **Adds missing columns** with proper data types and defaults
3. **Creates foreign key constraints** to `categories` and `provinces` tables
4. **Creates indexes** for performance optimization:
   - `idx_products_status` - For filtering by status
   - `idx_products_province` - For joins and province filtering
   - `idx_products_category` - For joins and category filtering
   - `idx_products_name` - For product name searches
   - `idx_products_created_at` - For date sorting
5. **Displays verification queries** showing the final schema

## Pre-requisites

Before running this migration, ensure:

✅ The `categories` table exists (required for foreign key)
✅ The `provinces` table exists (required for foreign key)
✅ You have backup of your database (recommended)

## Sample Categories Table

If you don't have a categories table, create it first:

```sql
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert some default categories
INSERT INTO categories (name, description) VALUES
  ('Vegetables', 'Fresh vegetables'),
  ('Fruits', 'Fresh fruits'),
  ('Grains', 'Rice, wheat, and other grains'),
  ('Dairy', 'Milk products'),
  ('Other', 'Other agricultural products')
ON CONFLICT (name) DO NOTHING;
```

## Sample Provinces Table

If you don't have a provinces table, create it first:

```sql
CREATE TABLE IF NOT EXISTS provinces (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  manager_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert some default provinces
INSERT INTO provinces (name, capacity, location) VALUES
  ('Central', 10000, 'Kandy'),
  ('Western', 15000, 'Colombo'),
  ('Southern', 8000, 'Galle'),
  ('Northern', 7000, 'Jaffna'),
  ('Eastern', 6000, 'Batticaloa')
ON CONFLICT (name) DO NOTHING;
```

## Verification Queries

After running the migration, verify the schema:

```sql
-- Check table structure
SELECT 
  column_name, 
  data_type, 
  column_default, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'products';

-- Check foreign keys
SELECT
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'products';

-- Check sample data
SELECT * FROM products LIMIT 5;
```

## Sample Data

To test the table, insert some sample products:

```sql
INSERT INTO products (
  product_name, 
  category_id, 
  province_id, 
  daily_limit, 
  current_stock, 
  final_price, 
  unit, 
  status
) VALUES 
  ('Carrots', 1, 1, 100.00, 50.00, 150.00, 'kg', 'active'),
  ('Tomatoes', 1, 2, 200.00, 180.00, 120.00, 'kg', 'active'),
  ('Rice', 3, 1, 500.00, 450.00, 200.00, 'kg', 'active'),
  ('Bananas', 2, 3, 150.00, 20.00, 80.00, 'kg', 'active'),
  ('Milk', 4, 2, 300.00, 250.00, 180.00, 'L', 'active');
```

## Troubleshooting

### Error: relation "categories" does not exist
**Solution**: Create the categories table first (see Sample Categories Table above)

### Error: relation "provinces" does not exist
**Solution**: Create the provinces table first (see Sample Provinces Table above)

### Error: column "product_name" already exists
**Solution**: The migration is idempotent - it safely checks before adding columns. This error shouldn't occur, but if it does, the column already exists and you can proceed.

### Error: constraint already exists
**Solution**: The migration checks for existing constraints before creating them. This is normal behavior.

## Related Files

- **Model**: `src/modules/product/models/ProductModel.ts`
- **Types**: `src/types/entities.ts` (Product interface)
- **Controller**: `src/modules/product/controllers/ProductController.ts`
- **Routes**: `src/modules/product/routes/productRoutes.ts`
- **Service**: `src/modules/product/services/ProductService.ts`

## Notes

- The migration is **idempotent** - you can run it multiple times safely
- Existing data will **not** be deleted or modified
- All operations check for existence before creating
- The `deleted` status is used for soft-delete functionality
- Foreign keys use `ON DELETE SET NULL` to prevent orphaned records

## Support

If you encounter any issues:
1. Check that prerequisite tables exist
2. Verify you have the necessary permissions
3. Review PostgreSQL error logs
4. Check database connection settings in `.env` file
