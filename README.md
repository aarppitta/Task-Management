# Daily Task Manager

PERN stack daily task management system with automated end-of-day archival, email summaries, and task history.

**Key Features:**
- Create, edit, delete tasks with 4 statuses (Pending, In Progress, Completed, Not Completed)
- Today Board, History Page (date picker), Summary Page (completion chart)
- Automated EOD at 23:59 (Asia/Kolkata): archive tasks, email summary, update stats
- Manual EOD trigger for testing
- Idempotent EOD job (safe to trigger multiple times)
- Auto-created database tables on startup

**Tech Stack:** React 19 + Vite + Tailwind | Express 5 + Node.js 22 | PostgreSQL 16 | node-cron | Mailtrap | Docker

---

## Project Structure

```
daily-task-manager/
├── client/                      # React frontend (Vite + Nginx)
│   ├── src/
│   │   ├── api/taskApi.js       # Axios client
│   │   ├── components/          # Navbar, TaskCard, TaskForm
│   │   └── pages/               # TodayBoard, HistoryView, SummaryView
│   └── Dockerfile
├── server/                      # Express backend
│   ├── config/db.js             # PostgreSQL pool + tables
│   ├── controllers/             # taskController, eodController, summaryController
│   ├── routes/                  # tasks, eod, summaries
│   ├── services/eodService.js   # EOD logic
│   ├── jobs/scheduler.js        # Cron job
│   └── index.js
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

- Docker + Docker Compose (recommended) OR Node.js 20+ + PostgreSQL 16+

---

## Setup

### Docker (Recommended)

```bash
git clone <repo-url>
cd daily-task-manager
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env with Mailtrap credentials (optional)
docker compose up --build -d
# Containers: db (5433), server (5001), client/Nginx (3000)
```

**Access:**
- App: http://localhost:3000
- API: http://localhost:5001/api

**Docker Commands:**
```bash
docker compose logs -f              # View logs
docker compose down                 # Stop containers
docker compose down -v              # Stop + remove database
docker compose up --build -d        # Rebuild after changes
```

### Local Setup

```bash
# Server
cd server
cp .env.example .env
npm install
createdb daily_task_manager
npm run dev

# Client (new terminal)
cd client
cp .env.example .env
npm install
npm run dev
```

**Access:** http://localhost:5173

---

## Environment Variables

### Server (`server/.env`)

| Variable        | Description                              |
|-----------------|-----------------------------------------|
| `PORT`          | Express port (default: 5000)            |
| `DB_HOST`       | PostgreSQL host                         |
| `DB_PORT`       | PostgreSQL port (default: 5432)         |
| `DB_NAME`       | Database name                           |
| `DB_USER`       | Database user                           |
| `DB_PASSWORD`   | Database password                       |
| `CORS_ORIGIN`   | Allowed origins (comma-separated)       |
| `TZ`            | Timezone (default: Asia/Kolkata)        |
| `MAILTRAP_HOST` | Mailtrap SMTP host                      |
| `MAILTRAP_PORT` | Mailtrap SMTP port (default: 2525)      |
| `MAILTRAP_USER` | Mailtrap username                       |
| `MAILTRAP_PASS` | Mailtrap password                       |
| `MAILTRAP_FROM` | Sender email address                    |
| `NOTIFY_EMAIL`  | Recipient email for daily summary       |

### Client (`client/.env`)

| Variable       | Description                    |
|----------------|--------------------------------|
| `VITE_API_URL` | Backend API base URL           |

---

## API Endpoints

### Tasks (`/api/tasks`)
- `GET /` — Fetch tasks (query: `?date=YYYY-MM-DD`)
- `POST /` — Create task (body: `{ title, description?, status?, task_date? }`)
- `PUT /:id` — Update task (body: `{ title?, description?, status? }`)
- `DELETE /:id` — Delete task
- `GET /archived` — Fetch archived tasks (query: `?date=YYYY-MM-DD`)

### EOD (`/api/eod`)
- `POST /trigger` — Trigger EOD process (body: `{ date? }`)

### Summaries (`/api/summaries`)
- `GET /:date` — Fetch daily summary (param: `YYYY-MM-DD`)

### Health
- `GET /api/health` — Server health check

**Valid statuses:** `pending` | `in_progress` | `completed` | `not_completed`

---

## Database Schema

### `tasks` — Active daily tasks

| Column        | Type           |
|---------------|----------------|
| `id`          | `SERIAL`       |
| `title`       | `VARCHAR(255)` |
| `description` | `TEXT`         |
| `status`      | `VARCHAR(20)`  |
| `task_date`   | `DATE`         |
| `created_at`  | `TIMESTAMP`    |
| `updated_at`  | `TIMESTAMP`    |

Index: `idx_tasks_date`

### `archived_tasks` — Historical records

| Column        | Type           |
|---------------|----------------|
| `id`          | `SERIAL`       |
| `original_id` | `INTEGER`      |
| `title`       | `VARCHAR(255)` |
| `description` | `TEXT`         |
| `status`      | `VARCHAR(20)`  |
| `task_date`   | `DATE`         |
| `created_at`  | `TIMESTAMP`    |
| `updated_at`  | `TIMESTAMP`    |
| `archived_at` | `TIMESTAMP`    |

Index: `idx_archived_date`

### `daily_summaries` — Daily statistics

| Column                  | Type          |
|-------------------------|---------------|
| `id`                    | `SERIAL`      |
| `summary_date`          | `DATE`        |
| `total_tasks`           | `INTEGER`     |
| `completed_tasks`       | `INTEGER`     |
| `pending_tasks`         | `INTEGER`     |
| `completion_percentage` | `NUMERIC(5,2)`|
| `eod_executed_at`       | `TIMESTAMP`   |

Index: `idx_summaries_date`

---

## EOD Job

Runs via `node-cron` at **23:59 (Asia/Kolkata)** using a PostgreSQL transaction:

1. Fetch tasks for the date
2. Calculate totals: completed, pending, completion %
3. Update in-progress tasks to not-completed
4. Archive all tasks to `archived_tasks`
5. Delete from `tasks` table
6. Compute cumulative stats
7. Upsert `daily_summaries` row (idempotent)
8. Send HTML email summary via Mailtrap (failure doesn't rollback)
9. Commit transaction

All steps 3-7 are atomic.

### Test EOD

Click **EOD** button in Navbar or run:

```bash
curl -X POST http://localhost:5001/api/eod/trigger
```

Verify:
1. Check server logs for `[EOD]` sequence
2. Check Mailtrap inbox for email
3. Visit History page → today's date → archived tasks visible
4. Visit Summary page → completion stats displayed
5. Today Board → empty (tasks archived)
