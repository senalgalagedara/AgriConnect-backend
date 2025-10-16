# Missing Tables Setup Guide

## 📊 Current Database Status

### ✅ Existing Tables (9)
- `categories` - Product categories
- `farmers` - Farmer information
- `feedback` - User feedback
- `products` - Product inventory
- `provinces` - Province/region data
- `schema_migrations` - Migration tracking
- `sessions` - User sessions
- `suppliers` - Supplier records
- `users` - User accounts

### ❌ Missing Tables (7)
- `carts` - Shopping carts
- `cart_items` - Items in shopping carts
- `orders` - Customer orders
- `order_items` - Items in orders
- `payments` - Payment records
- `drivers` - Delivery drivers
- `assignments` - Driver-order assignments

## 🎯 Why These Tables Are Needed

### Shopping & Orders
- **`carts`** - Stores active shopping carts for users
- **`cart_items`** - Individual products in each cart
- **`orders`** - Confirmed orders with shipping/billing info
- **`order_items`** - Products purchased in each order
- **`payments`** - Payment transactions linked to orders

### Delivery Management
- **`drivers`** - Driver profiles and availability
- **`assignments`** - Links drivers to orders for delivery

## 🚀 How to Create Missing Tables

### Step 1: Open pgAdmin
1. Launch **pgAdmin**
2. Connect to your PostgreSQL server
3. Expand your database in the left panel

### Step 2: Open Query Tool
1. Right-click on your **database name**
2. Select **Query Tool**

### Step 3: Run the Migration
1. Open the file: `scripts/migrations/create_missing_tables.sql`
2. Copy ALL the content
3. Paste into the Query Tool
4. Click **Execute/Refresh (F5)**

## 📋 What Will Be Created

### 1. Carts Table
```sql
carts
├── id (SERIAL PRIMARY KEY)
├── user_id (INTEGER FK → users.id)
├── status ('active', 'completed', 'abandoned')
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### 2. Cart Items Table
```sql
cart_items
├── id (SERIAL PRIMARY KEY)
├── cart_id (INTEGER FK → carts.id)
├── product_id (INTEGER FK → products.id)
├── qty (INTEGER)
└── added_at (TIMESTAMPTZ)
```

### 3. Orders Table
```sql
orders
├── id (SERIAL PRIMARY KEY)
├── order_no (INTEGER UNIQUE)
├── user_id (INTEGER FK → users.id)
├── subtotal (NUMERIC)
├── tax (NUMERIC)
├── shipping_fee (NUMERIC)
├── total (NUMERIC)
├── status ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')
├── contact (JSONB) - customer contact info
├── shipping (JSONB) - shipping address
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### 4. Order Items Table
```sql
order_items
├── id (SERIAL PRIMARY KEY)
├── order_id (INTEGER FK → orders.id)
├── product_id (INTEGER FK → products.id)
├── name (TEXT) - product name at time of order
├── price (NUMERIC) - price at time of order
├── qty (INTEGER)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### 5. Payments Table
```sql
payments
├── id (SERIAL PRIMARY KEY)
├── order_id (INTEGER FK → orders.id)
├── amount (NUMERIC)
├── method ('COD', 'CARD', 'credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cash')
├── card_last4 (TEXT)
├── status ('pending', 'paid', 'failed', 'refunded')
├── transaction_id (TEXT)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### 6. Drivers Table
```sql
drivers
├── id (SERIAL PRIMARY KEY)
├── name (TEXT)
├── phone_number (TEXT)
├── location (TEXT)
├── vehicle_type (TEXT)
├── capacity (INTEGER)
├── availability_status ('available', 'busy', 'offline')
├── status ('active', 'inactive')
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

### 7. Assignments Table
```sql
assignments
├── id (SERIAL PRIMARY KEY)
├── order_id (INTEGER FK → orders.id)
├── driver_id (INTEGER FK → drivers.id)
├── schedule_time (TIMESTAMPTZ)
├── special_notes (TEXT)
├── status ('pending', 'in_progress', 'completed', 'cancelled')
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)
```

## 🔗 Database Relationships

```
users ──┬─→ carts ────→ cart_items ──→ products
        ├─→ orders ───┬─→ order_items ──→ products
        └─→ sessions  ├─→ payments
                      └─→ assignments ──→ drivers

provinces ──→ products
categories ──→ products
farmers ──→ suppliers ──→ products
```

## ✅ Expected Results

After running the migration, you should see:

```
CREATE TABLE
CREATE INDEX
CREATE TRIGGER
INSERT 0 5  (for sample drivers)
COMMIT
```

Then the verification queries will show:
- All 16 tables listed
- Record counts for each table
- Foreign key relationships
- "SETUP COMPLETE" message

## 🧪 Verification Queries

Run these individually to verify:

```sql
-- 1. Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Count records
SELECT COUNT(*) FROM carts;
SELECT COUNT(*) FROM cart_items;
SELECT COUNT(*) FROM orders;
SELECT COUNT(*) FROM order_items;
SELECT COUNT(*) FROM payments;
SELECT COUNT(*) FROM drivers;
SELECT COUNT(*) FROM assignments;

-- 3. Check sample drivers
SELECT * FROM drivers;
```

## 📦 Sample Data Included

The migration includes **5 sample drivers** for testing:

| Name | Location | Vehicle | Capacity | Status |
|------|----------|---------|----------|--------|
| John Silva | Colombo | Van | 500kg | available |
| Nimal Perera | Kandy | Truck | 1000kg | available |
| Sunil Fernando | Galle | Pickup | 300kg | busy |
| Kamal Jayasinghe | Jaffna | Van | 500kg | available |
| Ravi Wickramasinghe | Batticaloa | Truck | 1200kg | offline |

## 🛠️ Features Included

### Auto-Update Triggers
All tables with `updated_at` columns have automatic triggers that update the timestamp on every UPDATE operation.

### Indexes for Performance
- User lookups: `idx_carts_user`, `idx_orders_user`
- Status filtering: `idx_carts_status`, `idx_orders_status`, `idx_payments_status`
- Foreign key joins: Multiple indexes for efficient joins
- Date sorting: `idx_orders_created_at`

### Constraints
- **Foreign Keys**: Proper cascading deletes and set null actions
- **Unique Constraints**: 
  - `order_no` must be unique
  - `cart_items` prevents duplicate products in same cart

### JSONB Fields
- `orders.contact` - Stores customer contact information
- `orders.shipping` - Stores shipping address details

## 🔧 Troubleshooting

### Error: "relation already exists"
**Solution:** Table already created - safe to ignore

### Error: "constraint already exists"
**Solution:** The script checks before creating - this is normal

### Error: "foreign key violation"
**Solution:** Make sure the parent tables (users, products) have data

### Error: "permission denied"
**Solution:** Ensure you're connected as a user with CREATE TABLE permissions

## 📝 Next Steps After Migration

1. ✅ **Verify tables created** - Check pgAdmin left panel
2. ✅ **Test dashboard endpoint** - Should now work without errors
3. ✅ **Create test orders** - Use your frontend to test order flow
4. ✅ **Test cart functionality** - Add items to cart
5. ✅ **Test driver assignments** - Assign drivers to orders

## 🎓 Module Compatibility

These tables are required by:

### Cart Module
- `src/modules/cart/models/CartModel.ts` ✅
- `src/modules/cart/controllers/CartController.ts` ✅

### Checkout Module
- `src/modules/checkout/controllers/CheckoutController.ts` ✅

### Order Module
- `src/modules/order/models/OrderModel.ts` ✅
- `src/modules/order/controllers/OrderController.ts` ✅

### Payment Module
- `src/modules/payment/services/PaymentService.ts` ✅
- `src/modules/payment/controllers/PaymentController.ts` ✅

### Driver Module
- `src/modules/driver/models/DriverModel.ts` ✅
- `src/modules/driver/controllers/DriverController.ts` ✅

### Assignment Module
- `src/modules/assignment/models/AssignmentModel.ts` ✅
- `src/modules/assignment/controllers/AssignmentController.ts` ✅

### Dashboard Module
- `src/modules/dashboard/controllers/DashboardController.ts` ✅ (NOW FIXED!)

## 💾 Backup Recommendation

Before running the migration:

```bash
# Backup your database
pg_dump -U your_username database_name > backup_before_tables_$(date +%Y%m%d).sql
```

Or in pgAdmin:
1. Right-click your database
2. Select **Backup...**
3. Choose location and format
4. Click **Backup**

## 🎉 Summary

After running this migration:
- ✅ All 7 missing tables will be created
- ✅ All foreign keys and constraints will be set up
- ✅ Indexes for performance will be added
- ✅ Auto-update triggers will be configured
- ✅ Sample drivers will be inserted
- ✅ Your application will be fully functional

The migration is **safe** and **idempotent** - you can run it multiple times without breaking existing data.

---

**File:** `scripts/migrations/create_missing_tables.sql`
**Date:** October 15, 2025
**Status:** ✅ Ready to run
