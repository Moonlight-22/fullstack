# Find Ace

Find Ace is a local service marketplace where clients can find trusted workers, request jobs, track progress on a map, leave reviews, and report issues. Admins manage users, jobs, categories, reviews, and warranties.

## Features

### Client
- Register / sign in
- Search workers by category, skill, name, and location
- Send job requests
- Track job status and contact info
- Save favorite workers
- Leave reviews after completed jobs
- Report workers when not satisfied
- View warranties from admin

### Worker
- Register / sign in
- Manage profile, skills, portfolio, and availability (`available` / `busy` / `offline`)
- Accept or reject job requests
- Update job status (`accepted` → `in_progress` → `completed`)
- Report clients after completed jobs
- Receive notifications and warranties

### Admin
- Dashboard overview with date filters
- Manage users (suspend / activate / delete)
- Manage workers, jobs, reviews, and categories
- Review reports and send warranties
- Temporary ban after 5 warranties in 24 hours

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Leaflet |
| Backend | Laravel 8, PHP 8, Laravel Sanctum |
| Database | MySQL |

## Project Structure

```text
Final/
├── Frontend/           # React app
└── findAce_Backend/    # Laravel API
```

## Requirements

- Node.js 18+
- PHP 8.0+
- Composer
- MySQL (XAMPP recommended on Windows)
- Apache or `php artisan serve`

## Setup

### 1) Backend

```bash
cd findAce_Backend
composer install
copy .env.example .env
php artisan key:generate
```

Update `.env` database settings:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=
```

Then run:

```bash
php artisan migrate
php artisan db:seed --class=DemoAccountsSeeder
php artisan storage:link
php artisan serve --host=127.0.0.1 --port=8000
```

API base URL:

```text
http://127.0.0.1:8000/api
```

### 2) Frontend

```bash
cd Frontend
npm install
```

Create `Frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

Start the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Demo Accounts

Each account has a unique password.

| Role | Email | Password |
|---|---|---|
| Admin | `admin@findace.com` | `admin` |
| Client | `hiro@gmail.com` | `password123` |
| Client | `min@gmail.com` | `Min#Client` |
| Worker | `aung@gmail.com` | `password124` |
| Client | `client1@findace.com` | `Client1#Ace` |
| Worker | `worker1@findace.com` | `Worker1#Ace` |

Other demo clients use `Client2#Ace` … `Client5#Ace`.  
Other demo workers use `Worker2#Ace` … `Worker12#Ace`.

## Main API Groups

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET /api/v1/workers/search`
- `POST /api/v1/job-requests`
- `PATCH /api/v1/job-requests/{id}/status`
- `POST /api/v1/reviews`
- `POST /api/v1/reports`
- `GET /api/v1/admin/dashboard`
- `POST /api/v1/admin/reports/{id}/warranty`

## Job Status Flow

```text
pending → accepted → in_progress → completed
         ↘ rejected
pending / accepted → cancelled (client)
```

## Warranty & Ban Rules

1. Admin sends a warranty to `reporter`, `reported`, or `both` with **start date** and **end date**
2. Dates are stored in `warranty_started_at` / `warranty_ended_at`
3. Target users receive a notification and can see the date range in history
4. If a user receives **5+ warranties within 24 hours**, they are banned for **1 day**

## Notes

- Sign In does not ask for Client/Worker role (role comes from the account)
- Register still lets users choose Client or Worker
- Workers choose skills only from existing service categories (saved to `skills` + `category_worker`)
- Deleting a category in Admin permanently removes it from the database

## License

This project is for academic / final-year project use.
