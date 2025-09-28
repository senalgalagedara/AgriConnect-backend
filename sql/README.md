# AgriConnect Backend SQL Queries Documentation

This directory contains comprehensive SQL queries for all modules of the AgriConnect backend system. Each file contains organized queries for specific business operations.

## 📁 File Structure

```
sql/
├── 00-database-schema.sql      # Complete database schema and setup
├── 01-province-queries.sql     # Province management operations
├── 02-farmer-queries.sql       # Farmer management operations
├── 03-product-queries.sql      # Product catalog operations
├── 04-supplier-queries.sql     # Supplier and supply chain operations
├── 05-cart-queries.sql         # Shopping cart operations
├── 06-order-queries.sql        # Order management operations
├── 07-driver-queries.sql       # Driver management operations
├── 08-assignment-queries.sql   # Delivery assignment operations
├── 09-feedback-queries.sql     # Feedback system operations
├── 10-payment-queries.sql      # Payment processing operations
├── 11-admin-queries.sql        # Admin and system management operations
└── README.md                   # This documentation file
```

## 🚀 Quick Start

### 1. Initial Database Setup
```bash
# Run the main schema file first
psql -U username -d database_name -f 00-database-schema.sql
```

### 2. Using Module Queries
Each SQL file contains queries organized by operation type:
- **CREATE** - Insert new records
- **READ** - Select and retrieve data
- **UPDATE** - Modify existing records
- **DELETE** - Remove records
- **VALIDATION** - Data integrity checks
- **REPORTING** - Analytics and reports

## 📊 Query Categories by File

### 00-database-schema.sql
- ✅ Complete database schema
- ✅ All table definitions with relationships
- ✅ Indexes for performance optimization
- ✅ Triggers for automatic timestamp updates
- ✅ Sample data insertion

### 01-province-queries.sql
- 🏢 Province CRUD operations
- 📈 Province statistics with farmer/product counts
- 🔍 Search and filtering queries
- 📊 Province performance reports

### 02-farmer-queries.sql
- 👨‍🌾 Farmer registration and management
- 📞 Contact information updates
- 🌾 Farmer supply statistics
- 📈 Performance and activity reports

### 03-product-queries.sql
- 🥬 Product catalog management
- 📦 Inventory and stock operations
- 💰 Price management queries
- 📊 Product performance analytics

### 04-supplier-queries.sql
- 🚛 Supply chain management
- 📅 Supply scheduling and tracking
- 💸 Pricing and payment queries
- 📈 Supplier performance analysis

### 05-cart-queries.sql
- 🛒 Shopping cart operations
- ➕ Add/remove/update cart items
- 💰 Cart total calculations
- 🧹 Cart cleanup operations

### 06-order-queries.sql
- 📋 Order processing workflow
- 🎯 Order assignment preparation
- 💰 Financial calculations
- 📊 Sales reporting and analytics

### 07-driver-queries.sql
- 🚗 Driver registration and management
- 📍 Location and availability tracking
- 📊 Performance metrics and ratings
- 🎯 Assignment suitability queries

### 08-assignment-queries.sql
- 📦 Delivery assignment operations
- ⏰ Scheduling and timing management
- 📈 Performance tracking
- 🎯 Route optimization support

### 09-feedback-queries.sql
- 💬 Feedback collection and management
- ⭐ Rating and satisfaction tracking
- 🎯 Issue categorization and prioritization
- 📊 Customer satisfaction analytics

### 10-payment-queries.sql
- 💳 Payment processing operations
- 🏦 Multi-gateway support queries
- 💰 Financial reporting and reconciliation
- 🔄 Refund and dispute management

### 11-admin-queries.sql
- 👨‍💼 Administrative dashboard queries
- 📊 System health monitoring
- 🚨 Alert and notification systems
- 📈 Business analytics and reporting

## 💡 Usage Examples

### Basic CRUD Operations
```sql
-- Create a new farmer
INSERT INTO farmers (name, contact_number, email, address, province_id, registration_number)
VALUES ('John Smith', '+1234567890', 'john@email.com', '123 Farm St', 1, 'FRM001')
RETURNING *;

-- Get farmer with province info
SELECT f.*, p.name as province_name
FROM farmers f
LEFT JOIN provinces p ON f.province_id = p.id
WHERE f.id = 1;
```

### Advanced Analytics
```sql
-- Daily sales report
SELECT 
  DATE(created_at) as order_date,
  COUNT(*) as total_orders,
  SUM(total) as total_revenue,
  AVG(total) as avg_order_value
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND status != 'cancelled'
GROUP BY DATE(created_at)
ORDER BY order_date DESC;
```

### Business Intelligence
```sql
-- Top performing drivers
SELECT 
  d.name,
  COUNT(a.id) as deliveries_completed,
  AVG(o.total) as avg_delivery_value,
  AVG(EXTRACT(EPOCH FROM (a.completed_at - a.assigned_at)) / 3600) as avg_delivery_hours
FROM drivers d
JOIN assignments a ON d.id = a.driver_id
JOIN orders o ON a.order_id = o.id
WHERE a.status = 'completed'
  AND a.completed_at >= NOW() - INTERVAL '3 months'
GROUP BY d.id, d.name
ORDER BY deliveries_completed DESC;
```

## 🔧 Parameter Placeholders

All queries use numbered parameters (`$1`, `$2`, etc.) for safe parameter binding:
- `$1`, `$2`, ... - Input parameters
- Always use parameter binding to prevent SQL injection
- Match parameter numbers with your application's database driver

## 📈 Performance Considerations

### Indexes Included
- Primary keys and foreign keys
- Frequently searched columns
- Composite indexes for complex queries
- Text search indexes for names and descriptions

### Query Optimization Tips
- Use `LIMIT` with `OFFSET` for pagination
- Add `WHERE` clauses to filter large datasets
- Use `JOIN` instead of subqueries when possible
- Consider query complexity for real-time operations

## 🔒 Security Notes

- All queries use parameterized statements
- No dynamic SQL generation
- Input validation should be done at application level
- Sensitive data handling follows best practices

## 📊 Reporting Capabilities

Each module includes reporting queries for:
- **Daily/Weekly/Monthly summaries**
- **Performance metrics**
- **Trend analysis**
- **Business intelligence**
- **Operational monitoring**

## 🛠️ Maintenance Queries

### Regular Cleanup
```sql
-- Clean up old abandoned carts
DELETE FROM carts 
WHERE status = 'abandoned' 
  AND updated_at < NOW() - INTERVAL '30 days';

-- Archive old completed orders (if archiving table exists)
-- Move to order_archive table for historical data
```

### Health Checks
```sql
-- Check system health
SELECT 
  'orders' as table_name,
  COUNT(*) as total_records,
  COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) as today_records
FROM orders
UNION ALL
SELECT 'farmers', COUNT(*), COUNT(CASE WHEN created_at >= CURRENT_DATE THEN 1 END) FROM farmers;
```

## 📞 Support

For questions about specific queries or implementation:
1. Check the query comments for parameter explanations
2. Review the database schema in `00-database-schema.sql`
3. Test queries in a development environment first
4. Use `EXPLAIN ANALYZE` to check query performance

## 🔄 Version History

- **v1.0** - Initial complete query collection
- Includes all 11 modules with full CRUD operations
- Comprehensive reporting and analytics queries
- Performance optimized with proper indexing

---

**Note**: Always backup your database before running any DELETE or UPDATE operations, especially in production environments.