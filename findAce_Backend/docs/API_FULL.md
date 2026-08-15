# Find Ace - Complete API Documentation

**Base URL (XAMPP):**
```
http://localhost/Final/findAce_Backend/public/api
```

**Dev server:**
```
http://127.0.0.1:8000/api
```

**Headers (protected routes):**
```
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

---

## Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@findace.com | admin |
| Worker | worker1@findace.com | Worker1#Ace |
| Client | client1@findace.com | Client1#Ace |

Run seeder: `php artisan db:seed --force`

---

## Response Format

**Success:** `{ "success": true, "message": "...", "data": {} }`  
**Error:** `{ "success": false, "message": "...", "errors": {} }`

**Paginated data shape:**
```json
{
  "success": true,
  "message": "...",
  "data": {
    "items": [],
    "pagination": {
      "current_page": 1,
      "last_page": 10,
      "per_page": 15,
      "total": 150
    }
  }
}
```

---

## 1. Authentication (`/v1/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | No | Register client/worker |
| POST | `/login` | No | Login, get token |
| POST | `/logout` | Yes | Revoke token |
| POST | `/forgot-password` | No | Send reset link |
| POST | `/reset-password` | No | Reset password |
| GET | `/profile` | Yes | Get profile |
| PUT | `/profile` | Yes | Update profile |
| POST | `/change-password` | Yes | Change password |
| DELETE | `/delete-account` | Yes | Soft delete account |
| POST | `/email/verification-notification` | Yes | Resend verification |
| GET | `/email/verify/{id}/{hash}` | Yes+Signed | Verify email |

---

## 2. Categories (`/v1/categories`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/categories` | No | List categories |
| GET | `/categories/{id}` | No | Show category |
| POST | `/admin/categories` | Admin | Create category |
| PUT | `/admin/categories/{id}` | Admin | Update category |
| DELETE | `/admin/categories/{id}` | Admin | Delete category |

**Query params:** `search`, `is_active`, `active_only`, `sort_by`, `sort_order`, `per_page`

---

## 3. Worker Profile (`/v1/worker`) — Worker role

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get worker profile |
| PUT | `/profile` | Update profile + upload images |
| DELETE | `/portfolio/{imageId}` | Delete portfolio image |

**Update body (multipart supported):**
```json
{
  "bio": "Professional electrician",
  "experience_years": 5,
  "skills": ["Wiring", "AC Repair"],
  "hourly_rate": 15000,
  "address": "No.12, Kamayut",
  "township": "Kamayut",
  "latitude": 16.8260,
  "longitude": 96.1340,
  "availability_status": "available",
  "category_ids": [1, 2]
}
```

**Image fields:** `profile_image`, `portfolio_images[]`

---

## 4. Client Profile (`/v1/client`) — Client role

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get client profile |
| PUT | `/profile` | Update profile + image |
| GET | `/bookings` | Booking history |
| GET | `/favorites` | Favorite workers |
| POST | `/favorites/{workerId}` | Add favorite |
| DELETE | `/favorites/{workerId}` | Remove favorite |

**Bookings query:** `status`, `search`, `sort_by`, `per_page`

---

## 5. Worker Search (`/v1/workers`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/search` | No | Search workers |
| GET | `/{workerId}` | No | Worker public profile |

**Search query params:**

| Param | Description |
|-------|-------------|
| `keyword` | Search name, bio, skills, township |
| `category_id` | Filter by category |
| `township` | Filter by township |
| `latitude`, `longitude`, `radius` | Haversine distance (km) |
| `min_rating` | Minimum average rating |
| `availability` | available / busy / offline |
| `min_price`, `max_price` | Hourly rate range |
| `sort_by` | nearest, highest_rated, lowest_price, most_reviews, newest |
| `per_page` | Pagination (max 100) |

**Example:**
```
GET /v1/workers/search?category_id=1&township=Kamayut&latitude=16.826&longitude=96.134&radius=10&sort_by=nearest&min_rating=4
```

---

## 6. Job Requests (`/v1/job-requests`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/` | All | List own jobs |
| GET | `/{id}` | All | Show job + history |
| POST | `/` | Client | Create job request |
| PATCH | `/{id}/status` | Worker/Client | Update status |

**Create body:**
```json
{
  "worker_id": 2,
  "category_id": 1,
  "title": "Fix home wiring",
  "description": "Need electrician for kitchen wiring",
  "budget": 50000,
  "requested_date": "2026-07-25",
  "address": "No.45, Bahan Township",
  "latitude": 16.8140,
  "longitude": 96.1560
}
```

**Status flow:**
- Worker: pending → accepted/rejected → in_progress → completed
- Client: pending/accepted → cancelled

**Statuses:** `pending`, `accepted`, `rejected`, `in_progress`, `completed`, `cancelled`

---

## 7. Reviews (`/v1/reviews`)

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| GET | `/` | No | List reviews |
| POST | `/` | Client | Submit review (completed jobs only) |
| DELETE | `/admin/reviews/{id}` | Admin | Delete review |

**Create body:**
```json
{
  "job_request_id": 10,
  "stars": 5,
  "comment": "Excellent work!"
}
```

Worker `average_rating` and `total_reviews` update automatically.

---

## 8. Notifications (`/v1/notifications`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List notifications |
| GET | `/unread-count` | Unread count |
| POST | `/{id}/read` | Mark one as read |
| POST | `/read-all` | Mark all as read |

**Notification types:** new_job_request, job_status_*, review_added

---

## 9. Admin Panel (`/v1/admin`) — Admin role

### Dashboard
`GET /dashboard`

Returns: total_users, total_workers, total_clients, completed_jobs, pending_jobs, cancelled_jobs, revenue_placeholder, top_categories, monthly_registrations, monthly_jobs, top_rated_workers

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users` | List users (filter: role, is_active, search) |
| GET | `/users/{id}` | Show user |
| POST | `/users/{id}/suspend` | Suspend user |
| POST | `/users/{id}/activate` | Activate user |
| DELETE | `/users/{id}` | Delete user |

### Workers
`GET /workers` — List all worker profiles

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/jobs` | List all jobs |
| GET | `/jobs/{id}` | Show job |
| DELETE | `/jobs/{id}` | Delete job |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reviews` | List all reviews |
| DELETE | `/reviews/{id}` | Delete review |

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 401 | Unauthenticated |
| 403 | Unauthorized / wrong role |
| 404 | Not found |
| 422 | Validation error |
| 429 | Rate limited |
| 500 | Server error |

---

## Setup (XAMPP)

1. Start Apache + MySQL in XAMPP
2. Create database `laravel` in phpMyAdmin
3. Configure `.env`:
   ```env
   DB_DATABASE=laravel
   DB_USERNAME=root
   DB_PASSWORD=
   APP_URL=http://localhost/Final/findAce_Backend/public
   ```
4. Run:
   ```bash
   composer install
   php artisan key:generate
   php artisan migrate
   php artisan storage:link
   php artisan db:seed
   ```
5. Access API: `http://localhost/Final/findAce_Backend/public/api/v1/categories`

---

## Seeded Data

| Entity | Count |
|--------|-------|
| Admin | 1 |
| Categories | 20 |
| Workers | 50 |
| Clients | 100 |
| Job Requests | 600 (500 completed) |
| Reviews | 500 |
