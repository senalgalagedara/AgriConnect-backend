# Notification System - Complete Implementation

## Overview
The AgriConnect platform now has a comprehensive notification system that tracks all important events across the application.

## Notification Types

### 1. **Product Notifications**
- ✨ **new_product**: When a new product is added to inventory
- 📦 **low_stock**: When product stock falls below threshold
- ⚠️ **expired**: When product has been in inventory for 5+ days
- 🔄 **stock_updated**: When product stock is manually updated
- 🚚 **supplier_added**: When a supplier adds stock to inventory

### 2. **Order Notifications**
- 🛒 **order_placed**: When a new order is created
- ❌ **order_cancelled**: When an order is cancelled
- 🚗 **driver_assigned**: When a driver is assigned to an order

### 3. **Payment Notifications**
- ❌ **payment_deleted**: When a payment record is deleted

### 4. **Milestone Notifications**
- 💰 **milestone_earnings**: When earning milestones are reached (Rs. 1,000, 5,000, 10,000, etc.)
- 🎯 **milestone_orders**: When order count milestones are reached (10, 25, 50, 100, etc.)

## Backend Implementation

### Database Schema

#### notifications table
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  order_id INTEGER REFERENCES orders(id),
  notification_type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_unread_product_notification 
    UNIQUE (product_id, notification_type, is_read) 
    WHERE product_id IS NOT NULL
);
```

#### notification_milestones table
```sql
CREATE TABLE notification_milestones (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  milestone_type VARCHAR(50) NOT NULL,
  milestone_value NUMERIC(12,2) NOT NULL,
  achieved_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, milestone_type, milestone_value)
);
```

### API Endpoints

#### GET /api/notifications/count
Get unread notification count
```json
{
  "success": true,
  "data": { "count": 5 }
}
```

#### GET /api/notifications/unread
Get all unread notifications with full details
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_id": 4,
      "notification_type": "new_product",
      "message": "New product 'Cabbage' has been added...",
      "is_read": false,
      "created_at": "2025-10-16T00:40:29.348Z",
      "product_name": "Cabbage",
      "province_name": "Western"
    }
  ]
}
```

#### GET /api/notifications
Get all notifications (read and unread)
Query params: `?limit=50`

#### PATCH /api/notifications/:id/read
Mark a specific notification as read

#### PATCH /api/notifications/read-all
Mark all notifications as read

#### DELETE /api/notifications/:id
Delete a specific notification

#### POST /api/notifications/check
Manually trigger notification checks (for expired products and low stock)

### Service Layer

#### NotificationService
Located: `src/modules/product/services/NotificationService.ts`

Key methods:
- `notifyNewProduct(productId, productName, provinceName)` - Called when product is created
- `notifyStockUpdated(productId, productName, oldStock, newStock, unit)` - Called when stock changes
- `notifySupplierAddedStock(productId, productName, farmerName, quantity, unit)` - Called when supplier adds stock
- `notifyOrderPlaced(orderId, orderNo, totalAmount, itemCount)` - Called when order is placed
- `notifyDriverAssigned(orderId, orderNo, driverName, driverPhone)` - Called when driver is assigned
- `checkExpiredProducts()` - Checks for products older than 5 days
- `checkLowStockProducts()` - Checks for products below stock threshold

### Integration Points

#### 1. Product Creation
File: `ProductController.ts`
```typescript
const product = await ProductService.createProduct(productData);

// Send notification
NotificationService.notifyNewProduct(
  product.id,
  product.product_name,
  product.province_name || 'Unknown'
).catch(err => console.error('Failed to send notification:', err));
```

#### 2. Stock Update
File: `ProductController.ts`
```typescript
const product = await ProductService.updateProduct(id, updateData);

if (oldProduct && updateData.current_stock !== undefined) {
  NotificationService.notifyStockUpdated(
    product.id,
    product.product_name,
    oldProduct.current_stock,
    product.current_stock,
    product.unit
  ).catch(err => console.error('Failed to send notification:', err));
}
```

#### 3. Supplier Adds Stock
File: `SupplierController.ts`
```typescript
NotificationService.notifySupplierAddedStock(
  productId,
  productName,
  farmerName,
  quantity,
  unit
).catch(err => console.error('Failed to send notification:', err));
```

#### 4. Driver Assignment
File: `AssignmentService.ts`
```typescript
const assignment = await AssignmentModel.create(assignmentData);

// Fetch driver and order details
const driver = await getDriver(assignmentData.driverId);
const order = await getOrder(assignmentData.orderId);

NotificationService.notifyDriverAssigned(
  assignmentData.orderId,
  order.order_no,
  driver.name,
  driver.phone_number
).catch(err => console.error('Failed to send notification:', err));
```

#### 5. Payment Deletion
File: `PaymentService.ts`
```typescript
await PaymentService.deletePayment(paymentId, orderId, orderNo);
```

### Automated Checks

#### Cron Job
File: `src/config/notificationCron.ts`

Runs every 6 hours to check for:
- Expired products (older than 5 days)
- Low stock products (below threshold)

```typescript
cron.schedule('0 */6 * * *', async () => {
  await NotificationService.checkAndCreateNotifications();
});
```

## Frontend Implementation

### Components

#### 1. NotificationDropdown
Location: `src/components/NotificationDropdown.tsx`

Features:
- Bell icon with unread count badge
- Dropdown panel with quick view of notifications
- Click notification to see details
- Mark as read / Mark all as read
- Delete individual notifications
- Opens centered modal for full view

#### 2. NotificationModal (NEW)
Location: `src/components/NotificationModal.tsx`

Features:
- Centered modal overlay
- Full-screen notification list
- Better for mobile devices
- Animated entrance
- Click notification for detailed view
- Sub-modal for notification details

### Usage

```tsx
import NotificationDropdown from '@/components/NotificationDropdown';

export default function DashboardLayout() {
  return (
    <header>
      <NotificationDropdown />
    </header>
  );
}
```

### Notification Features

1. **Auto-refresh**: Checks for new notifications every 30 seconds
2. **Real-time count**: Badge updates automatically
3. **Color-coded**: Each notification type has a distinct color
4. **Contextual actions**: View product/order buttons based on notification type
5. **Responsive**: Works on desktop and mobile
6. **Animations**: Smooth transitions and hover effects

### Notification Colors

| Type | Color | Description |
|------|-------|-------------|
| expired | Red (#dc2626) | Urgent attention needed |
| low_stock | Amber (#f59e0b) | Warning |
| new_product | Green (#10b981) | Positive event |
| supplier_added | Blue (#3b82f6) | Informational |
| stock_updated | Purple (#8b5cf6) | Update |
| order_placed | Green (#10b981) | Positive event |
| order_cancelled | Red (#dc2626) | Negative event |
| driver_assigned | Cyan (#0891b2) | Process update |
| milestone_earnings | Yellow (#eab308) | Achievement |
| milestone_orders | Cyan (#06b6d4) | Achievement |

## Testing

### Manual Testing Steps

1. **Test New Product Notification**
   - Go to inventory management
   - Add a new product
   - Check notifications - should see "New product added"

2. **Test Low Stock Notification**
   - Update product stock to below threshold
   - Click "Check Notifications" or wait for cron
   - Should see "Low stock alert"

3. **Test Stock Update Notification**
   - Manually update product stock
   - Check notifications - should see "Stock updated"

4. **Test Supplier Added Notification**
   - Have a supplier add stock
   - Check notifications - should see "Stock supplied"

5. **Test Driver Assignment Notification**
   - Assign a driver to an order
   - Check notifications - should see "Driver assigned"

6. **Test Expired Product Notification**
   - Wait 5+ days or manually set product created_at
   - Run notification check
   - Should see "Product expired"

### API Testing

```bash
# Get unread count
curl http://localhost:5000/api/notifications/count

# Get unread notifications
curl http://localhost:5000/api/notifications/unread

# Mark as read
curl -X PATCH http://localhost:5000/api/notifications/1/read

# Delete notification
curl -X DELETE http://localhost:5000/api/notifications/1

# Trigger check
curl -X POST http://localhost:5000/api/notifications/check
```

## Performance Considerations

1. **Non-blocking**: Notification creation never blocks main operations
2. **Indexed queries**: Database indexes on `is_read`, `created_at`, `product_id`, `order_id`
3. **Batch processing**: Cron job processes all products in one batch
4. **Duplicate prevention**: Unique constraints prevent duplicate notifications
5. **Auto-cleanup**: Old read notifications can be deleted after 30 days

## Future Enhancements

1. **WebSocket support**: Real-time push notifications
2. **Email notifications**: Send important alerts via email
3. **SMS notifications**: Critical alerts via SMS
4. **User preferences**: Allow users to customize notification types
5. **Notification history**: Archive and search old notifications
6. **Push notifications**: Browser push notifications
7. **Notification grouping**: Group similar notifications
8. **Smart filters**: Filter by type, date, read/unread

## Troubleshooting

### Notifications not appearing
1. Check backend is running: `http://localhost:5000/api/notifications/count`
2. Check database connection
3. Verify notification routes are registered in server.ts
4. Check browser console for API errors

### 500 Error on /unread endpoint
- **Fixed**: Updated queries with `DISTINCT ON` to handle multiple driver assignments
- Ensure all JOIN conditions are correct
- Check for null values in joined tables

### Duplicate notifications
- Verify unique constraints are in place
- Check ON CONFLICT clauses in insert queries

## Configuration

### Environment Variables
None required - uses existing database connection

### Cron Schedule
Default: Every 6 hours
To change: Edit `src/config/notificationCron.ts`

### Stock Thresholds
Low stock threshold: Configured per product in `products.daily_limit`

### Expiry Days
Default: 5 days
To change: Edit `NotificationService.checkExpiredProducts()`

## Summary

The notification system is now fully functional and integrated across:
- ✅ Product management (create, update, stock changes)
- ✅ Supplier operations
- ✅ Order management
- ✅ Driver assignments  
- ✅ Payment operations
- ✅ Automated checks (expired, low stock)
- ✅ Milestone tracking

All notifications appear in the bell icon dropdown and can be viewed in the centered modal for better UX.
