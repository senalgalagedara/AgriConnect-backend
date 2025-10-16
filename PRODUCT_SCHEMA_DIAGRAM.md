# Product Module Database Schema

## Entity Relationship Diagram

```
┌─────────────────────────┐
│      CATEGORIES         │
├─────────────────────────┤
│ • id (PK)              │
│ • name                 │
│ • description          │
│ • created_at           │
│ • updated_at           │
└─────────────────────────┘
            │
            │ 1
            │
            │ Many
            ▼
┌─────────────────────────┐
│       PRODUCTS          │
├─────────────────────────┤
│ • id (PK)              │
│ • product_name         │
│ • category_id (FK)     │────┐
│ • province_id (FK)     │────┼──┐
│ • daily_limit          │    │  │
│ • current_stock        │    │  │
│ • final_price          │    │  │
│ • unit                 │    │  │
│ • status               │    │  │
│ • created_at           │    │  │
│ • updated_at           │    │  │
└─────────────────────────┘    │  │
            ▲                  │  │
            │                  │  │
            │ Many             │  │
            │                  │  │
            │ 1                │  │
┌─────────────────────────┐    │  │
│       PROVINCES         │    │  │
├─────────────────────────┤    │  │
│ • id (PK)              │◄───┘  │
│ • name                 │       │
│ • capacity             │       │
│ • location             │       │
│ • manager_name         │       │
│ • created_at           │       │
│ • updated_at           │       │
└─────────────────────────┘       │
                                  │
         Connects to ◄────────────┘
         categories(id)
```

## Table Details

### 🏷️ CATEGORIES
**Purpose:** Classify products into categories (Vegetables, Fruits, etc.)

| Column      | Type         | Constraints           |
|-------------|--------------|----------------------|
| id          | SERIAL       | PRIMARY KEY          |
| name        | TEXT         | NOT NULL, UNIQUE     |
| description | TEXT         | -                    |
| created_at  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() |
| updated_at  | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() |

**Sample Data:**
```
1 | Vegetables | Fresh vegetables
2 | Fruits     | Fresh fruits
3 | Grains     | Rice, wheat, and other grains
```

---

### 📍 PROVINCES
**Purpose:** Store warehouse/distribution center locations

| Column       | Type         | Constraints           |
|--------------|--------------|----------------------|
| id           | SERIAL       | PRIMARY KEY          |
| name         | TEXT         | NOT NULL, UNIQUE     |
| capacity     | INTEGER      | NOT NULL, DEFAULT 0  |
| location     | TEXT         | -                    |
| manager_name | TEXT         | -                    |
| created_at   | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() |
| updated_at   | TIMESTAMPTZ  | NOT NULL, DEFAULT NOW() |

**Sample Data:**
```
1 | Central  | 10000 | Kandy    | -
2 | Western  | 15000 | Colombo  | -
3 | Southern | 8000  | Galle    | -
```

---

### 📦 PRODUCTS (Main Table)
**Purpose:** Store all product inventory information

| Column        | Type          | Constraints              | Description |
|--------------|---------------|--------------------------|-------------|
| id           | SERIAL        | PRIMARY KEY              | Auto-increment ID |
| product_name | TEXT          | NOT NULL                 | Product display name |
| category_id  | INTEGER       | FK → categories(id)      | Product category |
| province_id  | INTEGER       | FK → provinces(id)       | Storage location |
| daily_limit  | NUMERIC(12,2) | NOT NULL, DEFAULT 0      | Max daily supply |
| current_stock| NUMERIC(12,2) | NOT NULL, DEFAULT 0      | Available quantity |
| final_price  | NUMERIC(12,2) | NOT NULL, DEFAULT 0      | Selling price per unit |
| unit         | TEXT          | NOT NULL, DEFAULT 'kg'   | Unit of measurement |
| status       | TEXT          | NOT NULL, DEFAULT 'active'| Product availability |
| created_at   | TIMESTAMPTZ   | NOT NULL, DEFAULT NOW()  | Record creation time |
| updated_at   | TIMESTAMPTZ   | NOT NULL, DEFAULT NOW()  | Last update time |

**Sample Data:**
```
id | product_name | category_id | province_id | daily_limit | current_stock | final_price | unit | status
---|--------------|-------------|-------------|-------------|---------------|-------------|------|-------
1  | Carrots      | 1           | 1           | 100.00      | 50.00         | 150.00      | kg   | active
2  | Tomatoes     | 1           | 2           | 200.00      | 180.00        | 120.00      | kg   | active
3  | Rice         | 3           | 1           | 500.00      | 450.00        | 200.00      | kg   | active
```

---

## Status Values

| Status        | Description                     | Usage |
|---------------|--------------------------------|-------|
| `active`      | Available for ordering         | Default for new products |
| `inactive`    | Temporarily unavailable        | Out of stock temporarily |
| `discontinued`| No longer offered              | Permanently removed from catalog |
| `deleted`     | Soft-deleted                   | Used by ProductModel.delete() |

---

## Indexes

| Index Name               | Column(s)      | Purpose |
|-------------------------|----------------|---------|
| idx_products_status     | status         | Fast filtering by status |
| idx_products_province   | province_id    | Join optimization with provinces |
| idx_products_category   | category_id    | Join optimization with categories |
| idx_products_name       | product_name   | Search by product name |
| idx_products_created_at | created_at     | Sorting by date |

---

## Foreign Key Constraints

### products.category_id → categories.id
- **Action on delete:** SET NULL
- **Why:** If a category is deleted, products remain but lose category assignment

### products.province_id → provinces.id
- **Action on delete:** SET NULL
- **Why:** If a province is removed, products remain but lose location assignment

---

## Common Queries

### Get Products with Full Details
```sql
SELECT 
  p.id,
  p.product_name,
  c.name as category_name,
  pr.name as province_name,
  p.current_stock,
  p.daily_limit,
  p.final_price,
  p.unit,
  p.status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
WHERE p.status = 'active'
ORDER BY p.product_name;
```

### Find Low Stock Products (< 20% of daily limit)
```sql
SELECT 
  p.product_name,
  p.current_stock,
  p.daily_limit,
  pr.name as province
FROM products p
LEFT JOIN provinces pr ON p.province_id = pr.id
WHERE p.status = 'active' 
  AND p.current_stock < p.daily_limit * 0.2
ORDER BY p.current_stock ASC;
```

### Check Product Availability
```sql
SELECT 
  product_name,
  current_stock,
  daily_limit,
  status,
  CASE 
    WHEN status = 'active' AND current_stock > 0 THEN 'Available'
    WHEN status = 'active' AND current_stock = 0 THEN 'Out of Stock'
    ELSE 'Not Available'
  END as availability
FROM products
WHERE id = $1;
```

### Update Stock (Increment/Decrement)
```sql
UPDATE products 
SET 
  current_stock = current_stock + $1,
  updated_at = NOW()
WHERE id = $2
RETURNING *;
```

---

## Data Types Explained

| Type          | Range/Size                    | Usage in Schema |
|--------------|-------------------------------|-----------------|
| SERIAL       | 1 to 2,147,483,647           | Auto-increment IDs |
| TEXT         | Unlimited length              | Names, descriptions |
| INTEGER      | -2,147,483,648 to 2,147,483,647 | Capacity, references |
| NUMERIC(12,2)| Up to 9,999,999,999.99       | Prices, quantities |
| TIMESTAMPTZ  | Timestamp with timezone       | Dates and times |

---

## ProductModel Methods & Queries

| Method            | SQL Operation | Purpose |
|-------------------|--------------|---------|
| findByProvinceId  | SELECT       | Get products by province |
| findById          | SELECT       | Get single product by ID |
| findAll           | SELECT       | Get paginated product list |
| create            | INSERT       | Add new product |
| update            | UPDATE       | Modify product details |
| updateStock       | UPDATE       | Adjust stock quantity |
| delete            | UPDATE       | Soft-delete (set status='deleted') |
| findLowStock      | SELECT       | Find products below 20% threshold |
| checkAvailability | SELECT       | Check if product is orderable |

---

## Migration Files Match This Schema

✅ `update_products_table.sql` - Updates existing database
✅ `quick_setup_products.sql` - Complete fresh setup

Both files ensure your database matches this exact schema!
