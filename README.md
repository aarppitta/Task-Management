# Daily Task Manager

A full-stack daily task management system built with the PERN stack (PostgreSQL, Express, React, Node.js). Tasks live on a **Today Board** for the current day. Each night at 23:59, a scheduled End-of-Day (EOD) job archives all tasks, generates a daily summary, and sends an HTML summary email via Mailtrap.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 19 + Vite 8 + Tailwind CSS 3 |
| Backend    | Express 5 + Node.js 22           |
| Database   | PostgreSQL 16 (via `pg`)          |
| Scheduling | node-cron                         |
| Email      | Nodemailer + Mailtrap             |
| Deployment | Docker + Docker Compose + Nginx   |

---

## Features

- Create, edit, and delete tasks for the current day
- Four task statuses: **Pending**, **In Progress**, **Completed**, **Not Completed**
- **Today Board** (`/`) — live view of today's active tasks with inline status transitions
- **History Page** (`/history`) — date picker to browse archived tasks from previous days
- **Summary Page** (`/summary`) — completion ring chart and daily statistics
- Automated EOD job at 23:59 (Asia/Kolkata) that:
  - Generates a daily summary with completion statistics
  - Updates any remaining **In Progress** tasks to **Not Completed**
  - Archives all tasks transactionally (atomic — all steps commit or none do)
  - Sends an HTML summary email via Mailtrap
- Manual EOD trigger button in the Navbar for testing
- Idempotent EOD job — safe to trigger multiple times on the same day
- Database tables auto-created on server startup (no separate migration step)

---

## Project Structure

```
daily-task-manager/
├── client/                          # React frontend (Vite + Nginx in Docker)
│   ├── src/
│   │   ├── api/
│   │   │   └── taskApi.js           # Axios API client — all HTTP calls
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top nav with EOD trigger button
│   │   │   ├── TaskCard.jsx         # Task card with edit/delete/status actions
│   │   │   └── TaskForm.jsx         # Create and edit form with validation
│   │   └── pages/
│   │       ├── TodayBoard.jsx       # Main page — today's active tasks
│   │       ├── HistoryView.jsx      # Date picker + archived tasks list
│   │       └── SummaryView.jsx      # EOD summary with completion ring chart
│   ├── nginx.conf                   # Nginx config for SPA routing in Docker
│   ├── Dockerfile                   # Multi-stage build: Vite → Nginx
│   ├── .dockerignore
│   ├── .env                         # Local env vars (git-ignored)
│   ├── .env.example                 # Template — copy to .env
│   └── package.json
├── server/                          # Node.js / Express backend
│   ├── config/
│   │   └── db.js                    # PostgreSQL pool + table initialization
│   ├── controllers/
│   │   ├── taskController.js        # CRUD + archived tasks handler
│   │   ├── eodController.js         # Manual EOD trigger handler
│   │   └── summaryController.js     # Daily summary handler
│   ├── routes/
│   │   ├── tasks.js                 # Task CRUD routes
│   │   ├── eod.js                   # EOD trigger route
│   │   └── summaries.js             # Summary route
│   ├── services/
│   │   └── eodService.js            # EOD logic: archive, summarize, email
│   ├── jobs/
│   │   └── scheduler.js             # node-cron job (23:59 daily)
│   ├── Dockerfile                   # Multi-stage Node.js build
│   ├── .dockerignore
│   ├── .env                         # Local env vars (git-ignored)
│   ├── .env.example                 # Template — copy to .env
│   ├── index.js                     # Express app bootstrap
│   └── package.json
├── docker-compose.yml               # PostgreSQL + Express + React containers
└── README.md
```

---

## Prerequisites

- **Docker** and **Docker Compose** (recommended)
- _or_ **Node.js** 20+ and **PostgreSQL** 16+ for local development

---

## Quick Start with Docker

> Requires only Docker — no local Node.js or PostgreSQL needed.

### 1. Clone the repository

```bash
git clone <repo-url>
cd daily-task-manager
```

### 2. Set up environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` and fill in your Mailtrap credentials (optional — the app works without them, email just won't be sent).

### 3. Start the containers

```bash
docker compose up --build -d
```

This spins up three containers:

| Container            | Description             | Host Port |
|----------------------|-------------------------|-----------|
| `taskmanager_db`     | PostgreSQL 16           | `5433`    |
| `taskmanager_server` | Express API             | `5001`    |
| `taskmanager_client` | React app (Nginx)       | `3000`    |

Database tables are created automatically when the server starts.

### 4. Open in browser

```
http://localhost:3000
```

The API is available at `http://localhost:5001/api`.

### 5. Useful Docker commands

```bash
# View logs
docker compose logs -f

# Stop all containers
docker compose down

# Stop and remove database volume (full reset)
docker compose down -v

# Rebuild after code changes
docker compose up --build -d
```

---

## Local Setup (without Docker)

### 1. Clone and set up environment

```bash
git clone <repo-url>
cd daily-task-manager
```

### 2. Set up the server

```bash
cd server
cp .env.example .env
# Edit .env — set DB credentials, Mailtrap config, etc.
npm install
```

### 3. Set up the client

```bash
cd ../client
cp .env.example .env
# Edit .env — set VITE_API_URL (default: http://localhost:5000/api)
npm install
```

### 4. Ensure PostgreSQL is running

Create the database:

```bash
createdb daily_task_manager
```

Tables are created automatically when the server starts — no manual migration needed.

### 5. Run the application

**Terminal 1** — API server:

```bash
cd server
npm run dev
```

**Terminal 2** — React client:

```bash
cd client
npm run dev
```

### 6. Open in browser

```
http://localhost:5173
```

---

## Environment Variables

### Server (`server/.env`)

| Variable        | Description                             | Example                        |
|-----------------|-----------------------------------------|--------------------------------|
| `PORT`          | Express server port                     | `5000`                         |
| `DB_HOST`       | PostgreSQL host                         | `localhost`                    |
| `DB_PORT`       | PostgreSQL port                         | `5432`                         |
| `DB_NAME`       | Database name                           | `daily_task_manager`           |
| `DB_USER`       | Database user                           | `postgres`                     |
| `DB_PASSWORD`   | Database password                       | `root`                         |
| `CORS_ORIGIN`   | Allowed origins (comma-separated)       | `http://localhost:5173,http://localhost:3000` |
| `TZ`            | Timezone for cron and timestamps        | `Asia/Kolkata`                 |
| `MAILTRAP_HOST` | Mailtrap SMTP host                      | `sandbox.smtp.mailtrap.io`     |
| `MAILTRAP_PORT` | Mailtrap SMTP port                      | `2525`                         |
| `MAILTRAP_USER` | Mailtrap SMTP username                  | `your_mailtrap_user`           |
| `MAILTRAP_PASS` | Mailtrap SMTP password                  | `your_mailtrap_pass`           |
| `MAILTRAP_FROM` | Sender address in emails                | `noreply@dailytaskmanager.com` |
| `NOTIFY_EMAIL`  | Recipient for the daily summary email   | `you@example.com`              |

### Client (`client/.env`)

| Variable       | Description              | Example                      |
|----------------|--------------------------|------------------------------|
| `VITE_API_URL` | Backend API base URL     | `http://localhost:5000/api`  |

---

## API Endpoints

### Tasks (`/api/tasks`)

| Method   | Endpoint     | Description                          | Body / Query                              |
|----------|-------------|--------------------------------------|-------------------------------------------|
| `GET`    | `/`         | Fetch tasks for a date               | Query: `?date=YYYY-MM-DD` (default: today)|
| `POST`   | `/`         | Create a new task                    | Body: `{ title, description?, status?, task_date? }` |
| `PUT`    | `/:id`      | Update a task                        | Body: `{ title?, description?, status? }` |
| `DELETE` | `/:id`      | Delete a task                        | URL param: `id`                           |
| `GET`    | `/archived` | Fetch archived tasks for a date      | Query: `?date=YYYY-MM-DD` **(required)**  |

### EOD (`/api/eod`)

| Method   | Endpoint     | Description                          | Body                                      |
|----------|-------------|--------------------------------------|-------------------------------------------|
| `POST`   | `/trigger`  | Manually trigger the EOD process     | Body: `{ date? }` (default: today)        |

### Summaries (`/api/summaries`)

| Method   | Endpoint     | Description                          | Params                                    |
|----------|-------------|--------------------------------------|-------------------------------------------|
| `GET`    | `/:date`    | Fetch daily summary for a date       | URL param: `YYYY-MM-DD`                   |

### Health

| Method   | Endpoint       | Description      |
|----------|---------------|------------------|
| `GET`    | `/api/health` | Server health check |

**Valid `status` values:** `pending` | `in_progress` | `completed` | `not_completed`

---

## Database Schema

### `tasks` — Active daily tasks

| Column        | Type           | Notes                                                        |
|---------------|----------------|--------------------------------------------------------------|
| `id`          | `SERIAL`       | Primary key                                                  |
| `title`       | `VARCHAR(255)` | Not null                                                     |
| `description` | `TEXT`         | Optional                                                     |
| `status`      | `VARCHAR(20)`  | Default: `pending`. CHECK: `pending`, `in_progress`, `completed`, `not_completed` |
| `task_date`   | `DATE`         | Default: `CURRENT_DATE`                                      |
| `created_at`  | `TIMESTAMP`    | Default: `NOW()`                                             |
| `updated_at`  | `TIMESTAMP`    | Default: `NOW()`                                             |

Index: `idx_tasks_date` on `task_date`

### `archived_tasks` — Historical records after EOD

| Column        | Type           | Notes                                  |
|---------------|----------------|----------------------------------------|
| `id`          | `SERIAL`       | Primary key                            |
| `original_id` | `INTEGER`      | Original task ID before archiving      |
| `title`       | `VARCHAR(255)` | Not null                               |
| `description` | `TEXT`         | Optional                               |
| `status`      | `VARCHAR(20)`  | Final status at time of archiving      |
| `task_date`   | `DATE`         | Original task date                     |
| `created_at`  | `TIMESTAMP`    | Original creation time                 |
| `updated_at`  | `TIMESTAMP`    | Last update time                       |
| `archived_at` | `TIMESTAMP`    | Default: `NOW()` — when EOD ran        |

Index: `idx_archived_date` on `task_date`

### `daily_summaries` — Per-day aggregated statistics

| Column                  | Type           | Notes                          |
|-------------------------|----------------|--------------------------------|
| `id`                    | `SERIAL`       | Primary key                    |
| `summary_date`          | `DATE`         | Unique, not null               |
| `total_tasks`           | `INTEGER`      | Not null                       |
| `completed_tasks`       | `INTEGER`      | Not null                       |
| `pending_tasks`         | `INTEGER`      | Not null                       |
| `completion_percentage` | `NUMERIC(5,2)` | Not null                       |
| `eod_executed_at`       | `TIMESTAMP`    | Default: `NOW()`               |

Index: `idx_summaries_date` on `summary_date`

---

## EOD Job

The End-of-Day job runs via `node-cron` at **23:59 every night** (Asia/Kolkata timezone). The core steps run inside a single PostgreSQL transaction for atomicity.

1. **Fetch tasks** — gets all tasks for the target date
2. **Count totals** — calculates completed, pending, and completion percentage
3. **Update stale tasks** — any task still `in_progress` is set to `not_completed`
4. **Archive tasks** — copies all tasks into `archived_tasks` with metadata preserved
5. **Delete from active table** — removes archived tasks from `tasks`
6. **Compute cumulative stats** — aggregates across all archived records for the date
7. **Upsert summary** — writes/updates `daily_summaries` row (idempotent via `ON CONFLICT`)
8. **Send email** — dispatches an HTML summary email via Mailtrap. Email failure is caught gracefully and does not roll back the transaction
9. **Commit** — all database changes from steps 3-7 commit atomically

---

## Testing the EOD Job

With the app running, click the **EOD** button in the Navbar, or use cURL:

```bash
curl -X POST http://localhost:5001/api/eod/trigger
```

**Verify the results:**

1. Check server logs for the `[EOD]` log sequence
2. Open **Mailtrap inbox** — an HTML daily summary email should appear
3. Go to **History** page, select today's date — archived tasks should appear
4. Go to **Summary** page — completion stats and ring chart should display
5. Go to **Today Board** — it should be empty (tasks were archived)
