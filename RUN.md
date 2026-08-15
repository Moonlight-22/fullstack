# Find Ace — How to Run Frontend + Backend

This project has two parts:

| Folder | Stack | Purpose |
|--------|-------|---------|
| `findAce_Backend` | Laravel 8 + MySQL (XAMPP) | REST API |
| `Frontend` | React + Vite + Tailwind | Web UI |

---

## Prerequisites

1. **XAMPP** — Apache + MySQL running
2. **PHP 8.0+** (included with XAMPP)
3. **Composer** — https://getcomposer.org/
4. **Node.js 18+** — https://nodejs.org/

---

## Step 1: Database (XAMPP MySQL)

1. Open **phpMyAdmin**: http://localhost/phpmyadmin
2. Create database: `laravel` (if not already created)
3. Default XAMPP credentials:
   - Host: `127.0.0.1`
   - User: `root`
   - Password: *(empty)*

---

## Step 2: Backend Setup

Open terminal in the backend folder:

```bash
cd C:\xampp\htdocs\Final\findAce_Backend
```

### Install dependencies
```bash
composer install
```

### Environment
Copy `.env.example` to `.env` if needed, then ensure:

```env
APP_URL=http://localhost
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

### Generate key & migrate
```bash
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan db:seed
```

### Start Laravel API server
```bash
php artisan serve
```

API will run at: **http://127.0.0.1:8000**

Test: http://127.0.0.1:8000/api/v1/categories

---

## Step 3: Frontend Setup

Open a **new terminal** in the frontend folder:

```bash
cd C:\xampp\htdocs\Final\Frontend
```

### Install dependencies
```bash
npm install
```

### Environment
File `Frontend/.env` should contain:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

### Start React dev server
```bash
npm run dev
```

Frontend will run at: **http://localhost:5173**

---

## Step 4: Login & Test

Open http://localhost:5173 in your browser.

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@findace.com | admin |
| **Worker** | worker1@findace.com | Worker1#Ace |
| **Client** | client1@findace.com | Client1#Ace |

### What works (live API)
- Sign in / Register (Client & Worker)
- Browse workers with map + categories
- Search & filter workers
- Send job requests (Client)
- View booking history (Client)
- Accept/Reject/Complete jobs (Worker)
- Edit worker profile + portfolio upload
- Admin dashboard statistics

---

## Architecture Flow

```
Browser (React :5173)
        │
        │  HTTP + Bearer Token
        ▼
Laravel API (:8000/api/v1/...)
        │
        ▼
MySQL (XAMPP :3306 / laravel)
```

---

## Alternative: XAMPP-only (no artisan serve)

If you prefer Apache instead of `php artisan serve`:

1. Backend URL:
   ```
   http://localhost/Final/findAce_Backend/public/api
   ```

2. Update `Frontend/.env`:
   ```env
   VITE_API_URL=http://localhost/Final/findAce_Backend/public/api
   ```

3. Still run frontend with:
   ```bash
   npm run dev
   ```

---

## Troubleshooting

### CORS errors
Backend `config/cors.php` allows all origins (`*`). Restart `php artisan serve` after config changes.

### 401 Unauthorized
- Log out and log in again
- Clear browser localStorage (keys: `findace_token`, `findace_user`)

### Empty workers list
Run seeder again:
```bash
php artisan db:seed --force
```

### Database connection failed
- Check MySQL is running in XAMPP
- Verify `.env` DB settings match phpMyAdmin

### Frontend can't reach API
- Ensure backend is running on port 8000
- Check `VITE_API_URL` in `Frontend/.env`
- Restart Vite after changing `.env`: `npm run dev`

---

## Production Build (optional)

```bash
cd Frontend
npm run build
```

Output in `Frontend/dist/` — serve via Apache or deploy to hosting.

---

## Quick Start (both servers)

**Terminal 1 — Backend:**
```bash
cd C:\xampp\htdocs\Final\findAce_Backend
php artisan serve
```

**Terminal 2 — Frontend:**
```bash
cd C:\xampp\htdocs\Final\Frontend
npm run dev
```

Then open: **http://localhost:5173**
