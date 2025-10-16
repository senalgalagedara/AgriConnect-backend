# Quick Start Guide: Update Products Table in pgAdmin

## 🎯 Goal
Update your PostgreSQL database to match the Product module schema requirements.

## 📋 Steps to Follow

### Step 1: Open pgAdmin
1. Launch **pgAdmin** on your computer
2. Connect to your PostgreSQL server
3. Expand your database in the left panel

### Step 2: Open Query Tool
1. Right-click on your **database name**
2. Select **Query Tool** from the menu
3. A new query window will open

### Step 3: Choose Your Migration Method

#### Option A: Quick Setup (If Starting Fresh)
```sql
-- Copy and paste this file content into Query Tool:
scripts/migrations/quick_setup_products.sql
```
**What it does:**
- ✅ Creates categories table
- ✅ Creates provinces table  
- ✅ Creates products table
- ✅ Adds indexes
- ✅ Inserts sample data
- ✅ Shows verification results

**Best for:** New databases or complete setup

---

#### Option B: Update Existing Table
```sql
-- Copy and paste this file content into Query Tool:
scripts/migrations/update_products_table.sql
```
**What it does:**
- ✅ Adds missing columns
- ✅ Creates foreign keys
- ✅ Adds indexes
- ✅ Preserves existing data
- ✅ Shows verification results

**Best for:** Existing databases with data

---

### Step 4: Execute the Migration
1. Click the **Execute/Refresh (F5)** button
2. Wait for completion (usually takes a few seconds)
3. Check the **Messages** tab at the bottom for results

### Step 5: Verify Success
Look for these confirmation messages:
```
CREATE TABLE
CREATE INDEX
INSERT 0 X (for sample data)
```

## 🔍 Verify Your Table

Run this query to check your products table:

```sql
SELECT 
  p.id,
  p.product_name,
  c.name as category,
  pr.name as province,
  p.current_stock,
  p.daily_limit,
  p.final_price,
  p.unit,
  p.status
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN provinces pr ON p.province_id = pr.id
LIMIT 5;
```

## ✅ Expected Table Structure

| Column        | Type          | Example Value    |
|--------------|---------------|------------------|
| id           | integer       | 1                |
| product_name | text          | "Carrots"        |
| category_id  | integer       | 1                |
| province_id  | integer       | 1                |
| daily_limit  | numeric(12,2) | 100.00           |
| current_stock| numeric(12,2) | 50.00            |
| final_price  | numeric(12,2) | 150.00           |
| unit         | text          | "kg"             |
| status       | text          | "active"         |
| created_at   | timestamptz   | 2025-10-15...    |
| updated_at   | timestamptz   | 2025-10-15...    |

## 🛠️ Troubleshooting

### Problem: "relation does not exist"
**Solution:** Run `quick_setup_products.sql` instead - it creates all required tables

### Problem: "constraint already exists"
**Solution:** This is normal! The migration checks and skips existing constraints

### Problem: Foreign key errors
**Solution:** Make sure `categories` and `provinces` tables exist first

## 📁 Files Created

1. **`scripts/migrations/update_products_table.sql`**
   - Detailed migration with column-by-column updates
   - Safe for existing databases

2. **`scripts/migrations/quick_setup_products.sql`**
   - Complete setup from scratch
   - Includes sample data

3. **`PRODUCT_TABLE_UPDATE_GUIDE.md`**
   - Comprehensive documentation
   - Troubleshooting guide

4. **`PGADMIN_QUICK_START.md`** (this file)
   - Quick reference for pgAdmin users

## 🎓 What Each File Does

### Categories Table
Stores product categories (Vegetables, Fruits, etc.)

### Provinces Table  
Stores province/region information (Central, Western, etc.)

### Products Table
Stores all product information with references to category and province

## 🔗 Database Relationships

```
categories (1) ←──── (many) products
provinces (1)  ←──── (many) products
```

## ✨ Next Steps

After successful migration:
1. ✅ Verify table structure
2. ✅ Check sample data
3. ✅ Test your API endpoints
4. ✅ Update any existing product records if needed

## 📞 Need Help?

- Check `PRODUCT_TABLE_UPDATE_GUIDE.md` for detailed documentation
- Review error messages in pgAdmin's Messages panel
- Ensure database connection in `.env` file is correct

---

**Database Schema Version:** 2025-10-15
**Compatible with:** ProductModel.ts (current version)
