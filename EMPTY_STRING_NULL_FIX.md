# ✅ Empty String to NULL Conversion Fixed

## 🎯 Issue Fixed

**Problem:** When creating or updating users with empty strings for optional fields (`first_name`, `last_name`, `contact_number`, `address`), they were being saved as empty strings `''` or displaying as `[null]` in some database viewers, instead of proper SQL `NULL` values.

**Solution:** Added sanitization logic to convert empty strings to `NULL` values before database insertion/update.

## 📝 Changes Made

### 1. UserController.createUser() - Line ~52
**File:** `src/modules/user/controllers/UserController.ts`

Added sanitization helper function:
```typescript
// Convert empty strings to undefined (will be saved as NULL in DB)
const sanitizeField = (value: any) => {
  if (typeof value === 'string' && value.trim() === '') {
    return undefined;
  }
  return value;
};

// Create user with sanitized fields
const user = await UserModel.create({
  email,
  password_hash,
  role,
  first_name: sanitizeField(first_name),
  last_name: sanitizeField(last_name),
  contact_number: sanitizeField(contact_number),
  address: sanitizeField(address),
  status: sanitizeField(status)
});
```

### 2. UserController.updateUser() - Line ~170
**File:** `src/modules/user/controllers/UserController.ts`

Added sanitization for update operations:
```typescript
const updateData = req.body;

// Convert empty strings to undefined (will be saved as NULL in DB)
const sanitizeField = (value: any) => {
  if (typeof value === 'string' && value.trim() === '') {
    return null; // Use null for updates to explicitly clear the field
  }
  return value;
};

// Sanitize optional fields
if ('first_name' in updateData) {
  updateData.first_name = sanitizeField(updateData.first_name);
}
if ('last_name' in updateData) {
  updateData.last_name = sanitizeField(updateData.last_name);
}
if ('contact_number' in updateData) {
  updateData.contact_number = sanitizeField(updateData.contact_number);
}
if ('address' in updateData) {
  updateData.address = sanitizeField(updateData.address);
}
```

## ✅ Verification

### Before Fix:
```json
{
  "id": 6,
  "email": "mirshab@gmail.com",
  "first_name": "",           // Empty string
  "last_name": "",            // Empty string  
  "contact_number": ""        // Empty string
}
```

Database would show: `[null]` or `''` (empty string)

### After Fix:
```json
{
  "id": 6,
  "email": "mirshab@gmail.com",
  "first_name": null,         // Proper NULL
  "last_name": null,          // Proper NULL
  "contact_number": null,     // Proper NULL
  "address": "2131/8 adshdae, weata",
  "status": "active",
  "created_at": "2025-10-15T15:24:40.258Z",
  "updated_at": "2025-10-15T15:24:57.769Z"
}
```

Database now shows: `NULL` (proper SQL NULL value)

## 🎯 Behavior

### Create User (POST /api/users)
- **Empty string** → Converted to `undefined` → Saved as `NULL`
- **Whitespace only** (e.g., `"   "`) → Converted to `undefined` → Saved as `NULL`
- **Valid value** → Kept as-is → Saved normally
- **`undefined`** → Kept as `undefined` → Saved as `NULL`
- **`null`** → Kept as `null` → Saved as `NULL`

### Update User (PUT/PATCH /api/users/:id)
- **Empty string** → Converted to `null` → Updated to `NULL`
- **Whitespace only** → Converted to `null` → Updated to `NULL`
- **Valid value** → Kept as-is → Updated normally

## 🔧 Technical Details

### Why `undefined` for create and `null` for update?

1. **Create (`undefined`)**: PostgreSQL treats `undefined` (missing parameter) same as `NULL`, and it's cleaner in the model layer.

2. **Update (`null`)**: Explicitly passing `null` ensures the field is cleared in the database. This is important for PATCH operations where you want to intentionally remove a value.

### Fields Affected
- ✅ `first_name`
- ✅ `last_name`
- ✅ `contact_number`
- ✅ `address`
- ✅ `status` (but defaults to 'active' in model if undefined)

### Fields NOT Affected (Required)
- ❌ `email` - Always required, never NULL
- ❌ `password` - Always required on create
- ❌ `role` - Always required, never NULL

## 📁 Files Modified

```
src/modules/user/controllers/
  └── UserController.ts       ✏️ Added sanitizeField() helper in createUser and updateUser methods
```

## ✅ Testing

**Test Case 1: Create with empty strings**
```bash
POST /api/users
{
  "email": "test@example.com",
  "password": "password123",
  "role": "farmer",
  "first_name": "",
  "last_name": "",
  "contact_number": ""
}
```
Result: ✅ Fields saved as `NULL`

**Test Case 2: Create with whitespace**
```bash
POST /api/users
{
  "email": "test2@example.com",
  "password": "password123",
  "role": "consumer",
  "first_name": "   ",
  "contact_number": "\t"
}
```
Result: ✅ Fields saved as `NULL`

**Test Case 3: Update to empty**
```bash
PATCH /api/users/6
{
  "first_name": "",
  "last_name": ""
}
```
Result: ✅ Fields updated to `NULL`

## 🎉 Summary

Empty string handling is now properly implemented! When you send empty strings or whitespace-only values for optional fields, they will be:
- ✅ Converted to proper SQL `NULL` values
- ✅ Displayed as `null` in JSON responses
- ✅ Shown as `NULL` in pgAdmin
- ✅ Not shown as `[null]` or empty strings

This follows PostgreSQL best practices and makes the data cleaner and more consistent.

---

**Status:** ✅ Fixed  
**Date:** October 15, 2025  
**Files Modified:** UserController.ts
