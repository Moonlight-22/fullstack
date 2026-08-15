# Find Ace API Documentation - Module 1: Authentication

Base URL (XAMPP):
```
http://localhost/Final/findAce_Backend/public/api
```

All responses follow this format.

Success:
```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Error:
```json
{
  "success": false,
  "message": "...",
  "errors": {}
}
```

Protected routes require:
```
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

---

## 1. Register

`POST /v1/auth/register`

**Roles:** `client`, `worker`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123",
  "role": "client",
  "phone_number": "09123456789"
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "Registration successful.",
  "data": {
    "token": "1|xxxxxxxx",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client",
      "phone_number": "09123456789",
      "profile_image_url": null,
      "email_verified_at": null,
      "is_active": true,
      "created_at": "2026-07-20T10:00:00.000000Z",
      "updated_at": "2026-07-20T10:00:00.000000Z"
    }
  }
}
```

**Validation Error (422):**
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": {
    "email": ["The email has already been taken."]
  }
}
```

---

## 2. Login

`POST /v1/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "device_name": "web"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "token": "2|xxxxxxxx",
    "token_type": "Bearer",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "client"
    }
  }
}
```

**Invalid Credentials (422):**
```json
{
  "success": false,
  "message": "Login failed.",
  "errors": {
    "email": ["Invalid credentials provided."]
  }
}
```

---

## 3. Logout

`POST /v1/auth/logout`

**Auth:** Required

**Success (200):**
```json
{
  "success": true,
  "message": "Logout successful.",
  "data": {}
}
```

---

## 4. Forgot Password

`POST /v1/auth/forgot-password`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Password reset link sent successfully.",
  "data": {}
}
```

---

## 5. Reset Password

`POST /v1/auth/reset-password`

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "email": "john@example.com",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Password reset successful.",
  "data": {}
}
```

---

## 6. Get Profile

`GET /v1/auth/profile`

**Auth:** Required

**Success (200):**
```json
{
  "success": true,
  "message": "Profile fetched successfully.",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "client",
    "phone_number": "09123456789",
    "profile_image_url": null,
    "email_verified_at": null,
    "is_active": true
  }
}
```

---

## 7. Update Profile

`PUT /v1/auth/profile`

**Auth:** Required

**Request Body (JSON or multipart/form-data):**
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone_number": "09987654321"
}
```

For image upload use `multipart/form-data` with field `profile_image`.

**Success (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "id": 1,
    "name": "John Updated",
    "email": "john.updated@example.com"
  }
}
```

---

## 8. Change Password

`POST /v1/auth/change-password`

**Auth:** Required

**Request Body:**
```json
{
  "current_password": "password123",
  "new_password": "newpassword123",
  "new_password_confirmation": "newpassword123"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Password changed successfully.",
  "data": {}
}
```

---

## 9. Delete Account

`DELETE /v1/auth/delete-account`

**Auth:** Required

**Success (200):**
```json
{
  "success": true,
  "message": "Account deleted successfully.",
  "data": {}
}
```

---

## 10. Resend Email Verification

`POST /v1/auth/email/verification-notification`

**Auth:** Required

**Success (200):**
```json
{
  "success": true,
  "message": "Verification email sent successfully.",
  "data": {}
}
```

---

## 11. Verify Email

`GET /v1/auth/email/verify/{id}/{hash}`

**Auth:** Required (Bearer token) + signed URL

**Success (200):**
```json
{
  "success": true,
  "message": "Email verified successfully.",
  "data": {}
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created (register) |
| 401 | Unauthenticated |
| 403 | Unauthorized |
| 422 | Validation error |
| 429 | Too many requests (rate limited) |
| 500 | Server error |

---

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| Register | 10/min |
| Login | 20/min |
| Forgot Password | 10/min |
| Reset Password | 10/min |
| Change Password | 10/min |
| Resend Verification | 6/min |

---

## Database (XAMPP MySQL)

- Database: `laravel`
- Host: `127.0.0.1`
- Port: `3306`
- User: `root`
- Password: (empty)

Tables created:
- `users` (with role, phone, profile_image, is_active, soft deletes)
- `personal_access_tokens` (Sanctum)
- `password_resets`
- `categories`
- `worker_profiles`
- `client_profiles`
- `worker_portfolio_images`
- `category_worker`
- `favorite_workers`
- `job_requests`
- `job_request_histories`
- `reviews`
- `notifications`
