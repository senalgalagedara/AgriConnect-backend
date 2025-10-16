# 🎨 Frontend Integration Guide - API Updates & Docker Setup

## Overview
The backend has been updated with bug fixes, new endpoints, and Docker containerization. This guide covers all changes needed in the frontend.

---

## 🐳 Docker Setup (NEW)

### Running the Full Stack

The entire project (frontend + backend + database + pgAdmin) now runs in Docker containers.

#### Prerequisites
1. Install Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Ensure both `AgriConnect-backend` and `AgriConnect-frontend` are in the same parent folder

#### Frontend Dockerfile Needed

Create a `Dockerfile` in your frontend root directory:

```dockerfile
# AgriConnect-frontend/Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

#### Update next.config.js

Add this to enable standalone build:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // ... your existing config
}

module.exports = nextConfig
```

#### Start Everything

From the backend directory, run:
```bash
# Windows
.\start-docker.bat

# Mac/Linux
./start-docker.sh
```

**Services will be available at:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- pgAdmin: http://localhost:5050
- Database: localhost:5432

---

## 🔧 API Changes & Bug Fixes

### 1. Consumer Profile Endpoint (FIXED)

**Endpoint:** `GET /api/consumers/user/:userId`

**Issue Fixed:** Was returning 404 for users with `user_type !== 'consumer'`

**Solution:** Endpoint now works for any user_type, but you should verify the user's role on the frontend before displaying consumer-specific features.

**Updated Implementation:**
```typescript
// Before (will fail for non-consumer users)
const response = await fetch(`/api/consumers/user/${userId}`);

// After (works for all users, but check role)
const response = await fetch(`/api/consumers/user/${userId}`);
const userData = await response.json();

if (userData.user_type !== 'consumer') {
  // Handle non-consumer user appropriately
  // Maybe redirect or show different UI
}
```

---

### 2. Feedback Endpoint (FIXED)

**Endpoint:** `GET /api/feedback/user/:userType/:userId`

**Issue Fixed:** Was filtering by `user_type` and returning empty results for users with mismatched types.

**Solution:** Endpoint now ignores the `userType` parameter and returns all feedback for the given `userId`.

**Updated Implementation:**
```typescript
// The userType parameter is still in the URL but ignored by backend
// You can pass any value or the actual user type
const response = await fetch(`/api/feedback/user/${userType}/${userId}`);
const feedbackList = await response.json();

// Will return all feedback for this userId regardless of their user_type
```

**Response Example:**
```json
[
  {
    "id": 1,
    "user_id": 21,
    "feedback_type": "complaint",
    "description": "Late delivery",
    "status": "pending",
    "created_at": "2024-10-15T10:30:00Z"
  },
  {
    "id": 2,
    "user_id": 21,
    "feedback_type": "suggestion",
    "description": "Add more payment methods",
    "status": "resolved",
    "created_at": "2024-10-14T08:20:00Z"
  }
]
```

---

### 3. Orders Endpoint (FIXED - Numeric Fields)

**Endpoint:** `GET /api/orders/:userType/:userId`

**Issue Fixed:** Numeric fields (total, subtotal, tax, shipping_fee) were strings, causing `.toFixed()` errors.

**Solution:** All numeric fields are now properly converted to JavaScript numbers.

**Updated Implementation:**
```typescript
const response = await fetch(`/api/orders/consumer/${userId}`);
const orders = await response.json();

// Now this works without errors! ✅
orders.forEach(order => {
  const formattedTotal = order.total.toFixed(2);  // No more TypeError!
  const formattedTax = order.tax.toFixed(2);
  const formattedShipping = order.shipping_fee.toFixed(2);
});
```

**Response Structure:**
```typescript
interface Order {
  id: number;
  user_id: number;
  status: string;
  subtotal: number;      // ✅ Now a number, not string
  tax: number;           // ✅ Now a number, not string
  shipping_fee: number;  // ✅ Now a number, not string
  total: number;         // ✅ Now a number, not string
  contact: {
    name: string;
    email: string;
    phone: string;
  };
  shipping: {
    address: string;
    city: string;
    province: string;
    postal_code: string;
  };
  created_at: string;
  updated_at: string;
}
```

---

### 4. Orders with Items (NEW FEATURE) 🆕

**Endpoint:** `GET /api/orders/:userType/:userId`

**New Feature:** Orders now include an `items` array with full order details!

**Response Structure:**
```typescript
interface OrderItem {
  name: string;
  qty: number;        // ✅ Converted to number
  price: number;      // ✅ Converted to number
  product_id: number;
}

interface OrderWithItems extends Order {
  items: OrderItem[];     // ✅ NEW: Array of order items
  item_count: number;     // ✅ NEW: Total count of items
}
```

**Example Response:**
```json
{
  "id": 1,
  "user_id": 2,
  "status": "delivered",
  "subtotal": 45.99,
  "tax": 5.99,
  "shipping_fee": 10.00,
  "total": 61.98,
  "contact": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890"
  },
  "shipping": {
    "address": "123 Main St",
    "city": "Colombo",
    "province": "Western",
    "postal_code": "10100"
  },
  "items": [
    {
      "name": "Organic Tomatoes",
      "qty": 5,
      "price": 12.99,
      "product_id": 101
    },
    {
      "name": "Fresh Carrots",
      "qty": 3,
      "price": 8.50,
      "product_id": 102
    }
  ],
  "item_count": 2,
  "created_at": "2024-10-15T14:30:00Z",
  "updated_at": "2024-10-15T16:45:00Z"
}
```

**Frontend Implementation:**
```typescript
// Fetch orders
const response = await fetch(`/api/orders/consumer/${userId}`);
const orders: OrderWithItems[] = await response.json();

// Display order details
orders.forEach(order => {
  console.log(`Order #${order.id} - Total: $${order.total.toFixed(2)}`);
  console.log(`Items (${order.item_count}):`);
  
  order.items.forEach(item => {
    const itemTotal = (item.qty * item.price).toFixed(2);
    console.log(`  - ${item.name}: ${item.qty} x $${item.price.toFixed(2)} = $${itemTotal}`);
  });
});
```

**React Component Example:**
```tsx
function OrderDetails({ order }: { order: OrderWithItems }) {
  return (
    <div className="order-card">
      <h3>Order #{order.id}</h3>
      <p>Status: {order.status}</p>
      
      <div className="order-items">
        <h4>Items ({order.item_count}):</h4>
        {order.items.map((item, index) => (
          <div key={index} className="order-item">
            <span>{item.name}</span>
            <span>{item.qty} x ${item.price.toFixed(2)}</span>
            <span>${(item.qty * item.price).toFixed(2)}</span>
          </div>
        ))}
      </div>
      
      <div className="order-totals">
        <div>Subtotal: ${order.subtotal.toFixed(2)}</div>
        <div>Tax: ${order.tax.toFixed(2)}</div>
        <div>Shipping: ${order.shipping_fee.toFixed(2)}</div>
        <div className="total">Total: ${order.total.toFixed(2)}</div>
      </div>
      
      <div className="shipping-info">
        <h4>Shipping Address:</h4>
        <p>{order.shipping.address}</p>
        <p>{order.shipping.city}, {order.shipping.province}</p>
        <p>{order.shipping.postal_code}</p>
      </div>
    </div>
  );
}
```

---

## 🔄 Migration Checklist

### Immediate Updates Needed:

- [ ] Create `Dockerfile` in frontend root
- [ ] Add `output: 'standalone'` to `next.config.js`
- [ ] Update API base URL to use environment variable
- [ ] Test consumer profile endpoint with different user types
- [ ] Update feedback display to handle all feedback types
- [ ] Update order display to show items array
- [ ] Add `.toFixed(2)` formatting for all price displays
- [ ] Test all endpoints with Docker setup

### Environment Variables

Update your frontend `.env.local` or `.env.production`:

```env
# Development (non-Docker)
NEXT_PUBLIC_API_URL=http://localhost:5000

# Docker (when running in containers)
NEXT_PUBLIC_API_URL=http://backend:5000
```

### API Client Update

If you have a centralized API client, update it:

```typescript
// lib/api.ts or utils/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const api = {
  // Consumer
  getConsumerProfile: (userId: number) => 
    fetch(`${API_BASE_URL}/api/consumers/user/${userId}`).then(r => r.json()),
  
  // Feedback (userType parameter kept for compatibility but ignored by backend)
  getUserFeedback: (userType: string, userId: number) =>
    fetch(`${API_BASE_URL}/api/feedback/user/${userType}/${userId}`).then(r => r.json()),
  
  // Orders (now includes items array!)
  getUserOrders: (userType: string, userId: number) =>
    fetch(`${API_BASE_URL}/api/orders/${userType}/${userId}`).then(r => r.json()),
};
```

---

## 🧪 Testing

### Test the Docker Setup

1. **Build and run:**
   ```bash
   cd AgriConnect-backend
   docker-compose up -d
   ```

2. **Verify services:**
   ```bash
   docker-compose ps
   ```
   All 4 services should show "Up" status.

3. **Test endpoints:**
   ```bash
   # Test backend health
   curl http://localhost:5000/api/health
   
   # Test orders with items
   curl http://localhost:5000/api/orders/consumer/2
   
   # Test feedback
   curl http://localhost:5000/api/feedback/user/consumer/21
   ```

4. **Check frontend:**
   Open http://localhost:3000 in browser

5. **Check logs if issues:**
   ```bash
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

---

## 📊 Data Type Reference

### Before vs After

| Field | Before | After |
|-------|--------|-------|
| `order.total` | `"61.98"` (string) | `61.98` (number) |
| `order.tax` | `"5.99"` (string) | `5.99` (number) |
| `order.subtotal` | `"45.99"` (string) | `45.99` (number) |
| `order.shipping_fee` | `"10.00"` (string) | `10.00` (number) |
| `item.qty` | `"5"` (string) | `5` (number) |
| `item.price` | `"12.99"` (string) | `12.99` (number) |
| `order.items` | ❌ Not included | ✅ Array of items |
| `order.item_count` | ❌ Not included | ✅ Number |

---

## 🚨 Breaking Changes

### None! 

All changes are **backwards compatible**:
- Existing endpoints still work the same way
- New fields (`items`, `item_count`) are additions, not replacements
- Numeric conversions fix bugs, don't break functionality
- Docker is optional - you can still run locally with `npm run dev`

---

## 📞 Support

If you encounter issues:

1. **Check Docker logs:** `docker-compose logs -f`
2. **Verify network:** Ensure all services are on the same Docker network
3. **Database connection:** Use pgAdmin at http://localhost:5050
4. **API testing:** Use curl or Postman to test endpoints directly
5. **Read docs:** See `DOCKER_SETUP.md` for detailed troubleshooting

---

## 🎯 Summary for Frontend Dev

**What You Need to Do:**

1. ✅ Create frontend `Dockerfile` (template above)
2. ✅ Update `next.config.js` with `output: 'standalone'`
3. ✅ Update order display components to show `items` array
4. ✅ Ensure all price displays use `.toFixed(2)` (now safe to use!)
5. ✅ Test with Docker: Run `.\start-docker.bat` and verify everything works
6. ✅ Update environment variables for Docker deployment

**What's Already Done:**

- ✅ Backend API endpoints fixed and tested
- ✅ Numeric type conversions working
- ✅ Orders include full item details
- ✅ Docker configuration complete
- ✅ Database migrations applied
- ✅ Comprehensive documentation provided

**Testing Priority:**

1. **HIGH:** Docker setup - ensure frontend builds and runs in container
2. **HIGH:** Orders page - verify items array displays correctly
3. **MEDIUM:** Feedback page - confirm all feedback shows up
4. **MEDIUM:** Profile page - test with different user types
5. **LOW:** Performance - monitor API response times in Docker

---

## 📝 Notes

- The backend server automatically restarts when you make changes (nodemon in Docker)
- PostgreSQL data persists in Docker volumes (won't lose data on restart)
- pgAdmin configuration also persists in volumes
- Frontend hot-reload works in Docker development mode
- Production build should use `npm start` instead of `npm run dev`

---

**Questions?** Check `DOCKER_SETUP.md` or `QUICKSTART.md` in the backend repository.

**Ready to deploy?** Everything is containerized and portable - just share the repo!

🎉 **Happy Coding!**
