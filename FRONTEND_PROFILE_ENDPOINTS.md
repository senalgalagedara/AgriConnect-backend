# Profile Endpoint Usage Guide

## Problem
The `/api/consumers/user/${userId}` endpoint returns 404 because the logged-in user (ID 2) is not a consumer.

## Solution
The frontend should call different profile endpoints based on the user's role from the session:

```javascript
// Get current user from session/auth context
const currentUser = useAuth(); // or however you store session user

// Call the appropriate endpoint based on role
let profileEndpoint;
if (currentUser.role === 'consumer') {
  profileEndpoint = `/api/consumers/user/${currentUser.id}`;
} else if (currentUser.role === 'driver') {
  profileEndpoint = `/api/driver/${currentUser.id}`; // or check if this endpoint exists
} else if (currentUser.role === 'farmer') {
  profileEndpoint = `/api/farmer/${currentUser.id}`; // or check if this endpoint exists
}

const response = await fetch(`http://localhost:5000${profileEndpoint}`, {
  credentials: 'include' // Important for session cookies
});
```

## Available Endpoints

### Consumer Profile
- **GET** `/api/consumers/user/:userId`
- Returns user data for consumers only
- Returns 404 if user not found or user role is not 'consumer'

### Driver Profile
- Check if `/api/driver/:userId` or `/api/drivers/:userId` exists in your backend

### Farmer Profile
- Check if `/api/farmer/:userId` or `/api/farmers/:userId` exists in your backend

## Quick Fix
For testing with user ID 2, check their role first:
1. Log in and check `currentUser.role` from session
2. If role is 'driver', call driver endpoint
3. If role is 'farmer', call farmer endpoint
4. If role is 'consumer', call consumer endpoint

## Alternative: Generic User Endpoint
If you need a single endpoint that works for all roles, consider creating:
- **GET** `/api/users/:userId` - Returns user data regardless of role
