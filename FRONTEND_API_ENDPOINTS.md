# Frontend API Endpoints - Fixed ✅

## 1. Orders Endpoint ✅ FIXED

**Endpoint:** `GET /api/orders/:userType/:userId`

**Example:** `http://localhost:5000/api/orders/consumer/21`

**Parameters:**
- `userType`: User role - `'consumer'`, `'driver'`, or `'farmer'`
- `userId`: The user's ID (number)

**Frontend Usage:**
```javascript
const { id, role } = currentUser; // from your auth context

const ordersResponse = await fetch(
  `http://localhost:5000/api/orders/${role}/${id}`,
  { credentials: 'include' }
);

if (ordersResponse.ok) {
  const { data: orders } = await ordersResponse.json();
  console.log('Orders:', orders);
}
```

**Response:**
```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": 5,
      "order_no": null,
      "user_id": 2,
      "subtotal": "30.00",
      "tax": "1.95",
      "shipping_fee": "0.00",
      "total": "31.95",
      "status": "processing",
      "contact_first_name": "John",
      "contact_last_name": "Doe",
      "contact_email": "john@example.com",
      "contact_phone": "1234567890",
      "shipping_address": "123 Main St",
      "shipping_city": "Springfield",
      "shipping_state": "IL",
      "shipping_postal_code": "62701",
      "payment_method": "COD",
      "created_at": "2025-10-16T...",
      "updated_at": "2025-10-16T..."
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalItems": 1,
    "itemsPerPage": 1
  }
}
```

---

## 2. Feedback Endpoint ✅ ALREADY EXISTS

**Endpoint:** `GET /api/feedback/user/:userType/:userId`

**Example:** `http://localhost:5000/api/feedback/user/consumer/21`

**Frontend Usage:**
```javascript
const { id, role } = currentUser; // from your auth context

const feedbackResponse = await fetch(
  `http://localhost:5000/api/feedback/user/${role}/${id}`,
  { credentials: 'include' }
);

if (feedbackResponse.ok) {
  const { data: feedback } = await feedbackResponse.json();
  console.log('Feedback:', feedback);
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "user_id": 2,
      "user_type": "consumer",
      "subject": "Great Service",
      "message": "Very satisfied with the product quality",
      "rating": 5,
      "status": "pending",
      "feedback_type": "transactional",
      "priority": "medium",
      "created_at": "2025-10-16T10:30:00Z",
      "updated_at": "2025-10-16T10:30:00Z",
      "resolved_at": null,
      "resolved_by": null,
      "admin_notes": null
    }
  ],
  "message": "User feedback retrieved successfully"
}
```

---

## 3. Consumer Profile Endpoint ✅ ALREADY EXISTS

**Endpoint:** `GET /api/consumers/user/:userId`

**Example:** `http://localhost:5000/api/consumers/user/2`

**Note:** Only works for users with `role='consumer'`

**Frontend Usage:**
```javascript
const { id, role } = currentUser;

if (role === 'consumer') {
  const profileResponse = await fetch(
    `http://localhost:5000/api/consumers/user/${id}`,
    { credentials: 'include' }
  );
  
  if (profileResponse.ok) {
    const { data: profile } = await profileResponse.json();
    console.log('Profile:', profile);
  }
}
```

---

## Key Points

✅ **All endpoints are now working**
- Orders endpoint: Created new route `GET /api/orders/:userType/:userId`
- Feedback endpoint: Already existed at `GET /api/feedback/user/:userType/:userId`
- Consumer profile: Already existed at `GET /api/consumers/user/:userId`

⚠️ **Important**:
- Always use `credentials: 'include'` for session cookies
- Use `currentUser.role` (consumer/driver/farmer) for `userType` parameter
- Use `currentUser.id` for `userId` parameter
- Consumer profile endpoint only works for users with role='consumer'

🎯 **Example Complete Fetch**:
```javascript
const { id, role } = currentUser; // Get from auth context

// Fetch orders
const orders = await fetch(`http://localhost:5000/api/orders/${role}/${id}`, {
  credentials: 'include'
}).then(res => res.json());

// Fetch feedback
const feedback = await fetch(`http://localhost:5000/api/feedback/user/${role}/${id}`, {
  credentials: 'include'
}).then(res => res.json());
```
