# 🔔 Notification System - Quick Start Guide

## ✅ System Status: FULLY OPERATIONAL

Your notification system is now complete and working! Here's everything you need to know.

---

## 🎯 What's Working

### Notifications Appear For:
1. **✨ New Products** - When you add a product to inventory
2. **📦 Low Stock** - When product stock is low
3. **⚠️ Expired Products** - Products older than 5 days
4. **🔄 Stock Updates** - When you manually update stock
5. **🚚 Supplier Adds Stock** - When suppliers restock products
6. **🚗 Driver Assignment** - When you assign a driver to an order
7. **🛒 Order Placed** - When a new order is created
8. **❌ Order Cancelled** - When an order is cancelled
9. **💰 Earnings Milestones** - Rs. 1K, 5K, 10K, 25K, 50K, 100K, etc.
10. **🎯 Order Milestones** - 10, 25, 50, 100, 250, 500+ orders

---

## 🚀 How to Access Notifications

### 1. **Bell Icon** (Top Navigation)
Click the bell icon (🔔) to see:
- Unread count badge
- Dropdown with recent notifications
- Quick actions (mark as read, delete)

### 2. **Centered Modal** (Better View)
Click the grid icon (⊞) in the dropdown header to open:
- Full-screen modal
- All notifications in one view
- Better for mobile devices

### 3. **Notification Details**
Click any notification to see:
- Full message
- Related product/order info
- Timestamp
- Quick action buttons

---

## 📋 API Endpoints (For Testing)

```bash
# Get unread count
curl http://localhost:5000/api/notifications/count

# Get all unread notifications
curl http://localhost:5000/api/notifications/unread

# Get all notifications (including read)
curl http://localhost:5000/api/notifications?limit=50

# Mark notification as read
curl -X PATCH http://localhost:5000/api/notifications/1/read

# Mark all as read
curl -X PATCH http://localhost:5000/api/notifications/read-all

# Delete notification
curl -X DELETE http://localhost:5000/api/notifications/1

# Trigger manual check (expired/low stock)
curl -X POST http://localhost:5000/api/notifications/check
```

---

## 🧪 Test the System

### Test 1: Add a Product
1. Go to Inventory Dashboard
2. Click "Add Product"
3. Fill in product details
4. Submit
5. **Check bell icon** - Should see "New product added" notification

### Test 2: Low Stock Alert
1. Update a product's stock to 0 or very low
2. Run: `curl -X POST http://localhost:5000/api/notifications/check`
3. **Check bell icon** - Should see "Low stock alert"

### Test 3: Assign Driver
1. Go to Order Delivery page
2. Select an order
3. Assign a driver
4. **Check bell icon** - Should see "Driver assigned" notification

### Test 4: Supplier Adds Stock
1. Go to Supplier management
2. Have a supplier add stock to a product
3. **Check bell icon** - Should see "Stock supplied" notification

---

## 🎨 Notification Colors

Each notification type has a distinct color:
- **Red** (#dc2626) - Expired, Cancelled, Deleted (Urgent)
- **Amber** (#f59e0b) - Low Stock (Warning)
- **Green** (#10b981) - New Product, Order Placed (Success)
- **Blue** (#3b82f6) - Supplier Added (Info)
- **Purple** (#8b5cf6) - Stock Updated
- **Cyan** (#0891b2) - Driver Assigned (Process)
- **Yellow** (#eab308) - Earnings Milestone (Achievement)

---

## ⚙️ Configuration

### Auto-refresh Interval
Default: Every 30 seconds
To change: Edit `NotificationDropdown.tsx` line ~40:
```tsx
const interval = setInterval(() => {
  fetchUnreadCount();
  if (isOpen) {
    fetchNotifications();
  }
}, 30000); // Change this value (in milliseconds)
```

### Cron Job Schedule
Default: Every 6 hours (checks for expired products and low stock)
To change: Edit `src/config/notificationCron.ts`:
```typescript
cron.schedule('0 */6 * * *', async () => { // Change this cron expression
  await NotificationService.checkAndCreateNotifications();
});
```

### Product Expiry Days
Default: 5 days
To change: Edit `NotificationService.ts` line ~31:
```typescript
if (daysSinceCreation >= 5) { // Change this value
  // Create expiry notification
}
```

---

## 🐛 Troubleshooting

### No Notifications Appearing

**Check 1: Backend API**
```bash
curl http://localhost:5000/api/notifications/unread
```
- If 500 error: Check backend logs
- If empty array: Create test notification (add a product)

**Check 2: Frontend Console**
Open browser DevTools (F12) → Console
- Look for errors starting with "Error fetching notifications"
- Check Network tab for failed API calls

**Check 3: Database**
```bash
# Check if notifications exist
npx ts-node -e "
import database from './src/config/database';
database.query('SELECT COUNT(*) FROM notifications WHERE is_read = false')
  .then(r => console.log('Unread:', r.rows[0]))
  .then(() => process.exit(0));
"
```

### Count Shows But No Notifications

**Fix:** Clear browser cache and reload
```bash
# Or restart frontend
cd AgriConnect-frontend
npm run dev
```

### Notifications Not Auto-Refreshing

**Check:** Make sure the dropdown component is properly mounted
**Fix:** Verify `useEffect` dependencies in `NotificationDropdown.tsx`

---

## 📱 Mobile Responsiveness

The notification system is fully responsive:
- **Desktop**: Dropdown panel (right-aligned)
- **Mobile**: Full-width centered modal
- **Tablet**: Adaptive layout

---

## 🔒 Security Notes

- Notifications are not user-specific yet (shows all)
- Consider adding user_id filtering for multi-user systems
- API endpoints don't require authentication (add if needed)

---

## 📊 Database Queries

### View All Notifications
```sql
SELECT * FROM notifications ORDER BY created_at DESC LIMIT 20;
```

### Count Unread
```sql
SELECT COUNT(*) FROM notifications WHERE is_read = false;
```

### Delete Old Read Notifications
```sql
DELETE FROM notifications 
WHERE is_read = true 
  AND updated_at < NOW() - INTERVAL '30 days';
```

### View Milestones
```sql
SELECT * FROM notification_milestones ORDER BY achieved_at DESC;
```

---

## 🎓 Code Examples

### Create Custom Notification (Backend)
```typescript
import { NotificationModel } from './modules/product/models/NotificationModel';

// Product notification
await NotificationModel.create(
  productId,
  'custom_type',
  'Your custom message here'
);

// Order notification
await NotificationModel.createOrderNotification(
  orderId,
  'custom_type',
  'Your custom message here'
);
```

### Add New Notification Type (Frontend)
```tsx
// In NotificationModal.tsx or NotificationDropdown.tsx

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'your_new_type':
      return '🎉'; // Your icon
    // ... existing cases
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'your_new_type':
      return '#yourColor';
    // ... existing cases
  }
};

const getNotificationTitle = (type: string) => {
  switch (type) {
    case 'your_new_type':
      return 'Your Title';
    // ... existing cases
  }
};
```

---

## 📁 File Locations

### Backend
```
AgriConnect-backend/
├── src/modules/product/
│   ├── models/NotificationModel.ts
│   ├── services/NotificationService.ts
│   ├── controllers/NotificationController.ts
│   └── routes/notificationRoutes.ts
├── src/modules/assignment/
│   └── services/AssignmentService.ts (updated)
├── src/config/
│   └── notificationCron.ts
└── NOTIFICATION_SYSTEM_COMPLETE.md
```

### Frontend
```
AgriConnect-frontend/
├── src/components/
│   ├── NotificationDropdown.tsx (updated)
│   └── NotificationModal.tsx (new)
└── src/app/dashboard/
    └── (use <NotificationDropdown /> in layout)
```

---

## ✨ Features Summary

✅ Real-time notification system  
✅ 10+ notification types  
✅ Auto-refresh every 30 seconds  
✅ Mark as read / Mark all as read  
✅ Delete notifications  
✅ Centered modal for better UX  
✅ Color-coded by type  
✅ Mobile responsive  
✅ Smooth animations  
✅ Milestone tracking  
✅ Duplicate prevention  
✅ Non-blocking creation  
✅ Automatic expired product detection  
✅ Automatic low stock alerts  

---

## 🎉 You're All Set!

Your notification system is fully functional! Start using it by:
1. Adding products to inventory
2. Assigning drivers to orders
3. Having suppliers add stock
4. Watching the bell icon light up! 🔔

For questions or issues, check the documentation files:
- `NOTIFICATION_SYSTEM_COMPLETE.md` - Full technical documentation
- `NOTIFICATION_IMPLEMENTATION_SUMMARY.md` - Implementation details

**Enjoy your new notification system! 🚀**
