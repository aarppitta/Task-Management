# Daily Task Manager

A full-stack PERN application for managing daily tasks. Tasks live on a **Today Board** for the current day. Each night at 23:59, a scheduled End-of-Day (EOD) job archives all tasks, generates a daily summary, and sends an HTML summary email via Mailtrap.

---

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Runtime    | Node.js 18+                       |
| API Server | Express 5                         |
| Frontend   | React 19 + Vite 8                 |
| Database   | PostgreSQL (via `pg`)             |
| Styling    | Tailwind CSS 3                    |
| Scheduling | node-cron                         |
| Email      | Nodemailer + Mailtrap             |

---

## Features

- Create, edit, and delete tasks for the current day
- Four task statuses: **Pending**, **In Progress**, **Completed**, **Not Completed**
- **Today Board** — live view of today's active tasks with inline status transitions
- **History Page** — date picker with archived task list and daily summary statistics
- Automated EOD job at 23:59 that:
  - Generates a daily summary with completion statistics
  - Updates any remaining In Progress tasks to Not Completed
  - Archives all tasks transactionally (atomic — all steps commit or none do)
  - Sends an HTML summary email via Mailtrap
- Manual EOD trigger endpoint for development testing
- Idempotent EOD job — safe to trigger multiple times on the same day

---

## Project Structure

```
daily-task-manager/
├── client/                          # React frontend (Vite)
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── api/
│   │   │   └── taskApi.js           # Axios API client — all HTTP calls to the server
│   │   ├── components/
│   │   │   ├── EmptyState.jsx       # Placeholder UI for empty list states
│   │   │   ├── Navbar.jsx           # Sticky top nav with active NavLink styling
│   │   │   ├── StatusBadge.jsx      # Coloured pill badge for task status display
│   │   │   ├── TaskCard.jsx         # Task card with edit/delete/status action buttons
│   │   │   └── TaskForm.jsx         # Create and edit form with client-side validation
│   │   ├── pages/
│   │   │   ├── HistoryPage.jsx      # History view — date picker + archived tasks + summary
│   │   │   └── TodayBoard.jsx       # Main page — today's active tasks, full CRUD
│   │   ├── App.jsx                  # Root component — BrowserRouter + route definitions
│   │   ├── index.css                # Global styles and CSS custom properties
│   │   └── main.jsx                 # React DOM entry point
│   ├── .env                         # Local environment variables (git-ignored)
│   ├── .env.example                 # Environment variable template — copy to .env
│   ├── index.html                   # HTML shell — Vite entry point
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── vite.config.js               # Vite build configuration
│   └── package.json
├── server/                          # Node.js / Express backend
│   ├── config/
│   │   ├── db.js                    # PostgreSQL connection pool (pg)
│   │   └── migrate.js               # One-time DB migration — run once to create tables
│   ├── controllers/
│   │   └── taskController.js        # Route handler functions for all task endpoints
│   ├── jobs/
│   │   └── eodJob.js                # node-cron EOD job — archive, summarise, email
│   ├── middleware/
│   │   └── errorHandler.js          # Global Express error-handling middleware
│   ├── routes/
│   │   └── taskRoutes.js            # Express router with express-validator rules
│   ├── .env                         # Local environment variables (git-ignored)
│   ├── .env.example                 # Environment variable template — copy to .env
│   ├── index.js                     # Express app bootstrap — DB ping, server start, cron init
│   └── package.json
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** 20 or later
- **PostgreSQL** 14 or later (running locally or on a hosted service)
- A **Mailtrap** account at <https://mailtrap.io> (free tier is sufficient)
- **Docker** and **Docker Compose** (optional — for containerised setup)

---

## Quick Start with Docker

> Requires only Docker — no local Node.js or PostgreSQL needed.

### 1. Clone the repository

```bash
git clone <repo-url>
cd daily-task-manager
```

### 2. Start the containers

```bash
docker compose up --build -d
```

This spins up three containers:

| Container | Description            | Host Port |
|-----------|------------------------|-----------|
| `db`      | PostgreSQL 16          | —         |
| `server`  | Express API            | `3001`    |
| `client`  | React app (Vite)       | `4173`    |

Database migrations run automatically when the server container starts.

### 3. Open in browser

```
http://localhost:4173
```

The API is available at `http://localhost:3001/api`.

### 4. Useful Docker commands

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

### 5. Mailtrap (optional)

Pass your Mailtrap credentials as environment variables:

```bash
MAILTRAP_USER=your_user MAILTRAP_PASS=your_pass NOTIFY_EMAIL=you@example.com docker compose up --build -d
```

---

## Local Setup (without Docker)

### 1. Clone the repository

```bash
git clone <repo-url>
cd daily-task-manager
```

### 2. Set up the server

```bash
cd server
cp .env.example .env
# Open server/.env and fill in all values (see Environment Variables below)
npm install
```

### 3. Set up the database

With `server/.env` fully configured and PostgreSQL running, execute the migration once:

```bash
node config/migrate.js
```

Expected output:

```
Starting database migration...

✓ Table created: tasks
✓ Indexes created: tasks (created_at, status)
✓ Table created: archived_tasks
✓ Index created: archived_tasks (archive_date)
✓ Table created: daily_summaries
✓ Unique constraint verified: daily_summaries (summary_date)

Migration completed successfully.
```

### 4. Set up the client

```bash
cd ../client
cp .env.example .env
# Open client/.env and set VITE_API_URL to match your server address
npm install
```

### 5. Run the application

**Terminal 1** — API server (from the `server/` directory):

```bash
npm run dev
```

**Terminal 2** — React client (from the `client/` directory):

```bash
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
| `PORT`          | Express server port                     | `3000`                         |
| `DB_HOST`       | PostgreSQL host                         | `localhost`                    |
| `DB_PORT`       | PostgreSQL port                         | `5432`                         |
| `DB_NAME`       | Database name                           | `daily_task_manager`           |
| `DB_USER`       | Database user                           | `postgres`                     |
| `DB_PASSWORD`   | Database password                       | `yourpassword`                 |
| `CLIENT_URL`    | Frontend origin for CORS allow-list     | `http://localhost:5173`        |
| `MAILTRAP_HOST` | Mailtrap SMTP host                      | `sandbox.smtp.mailtrap.io`     |
| `MAILTRAP_PORT` | Mailtrap SMTP port                      | `2525`                         |
| `MAILTRAP_USER` | Mailtrap SMTP username                  | `your_mailtrap_user`           |
| `MAILTRAP_PASS` | Mailtrap SMTP password                  | `your_mailtrap_pass`           |
| `MAILTRAP_FROM` | Sender address shown in the email       | `noreply@dailytasks.dev`       |
| `NOTIFY_EMAIL`  | Recipient address for the daily summary | `you@example.com`              |

### Client (`client/.env`)

| Variable       | Description              | Example                     |
|----------------|--------------------------|-----------------------------|
| `VITE_API_URL` | Backend API base URL     | `http://localhost:3000/api` |

---

## API Endpoints

Base path: `/api/tasks`

| Method   | Endpoint          | Description                                         | Body / Params                                          |
|----------|-------------------|-----------------------------------------------------|--------------------------------------------------------|
| `GET`    | `/today`          | Fetch all tasks created today                       | —                                                      |
| `POST`   | `/`               | Create a new task                                   | Body: `{ title, description?, status? }`               |
| `PUT`    | `/:id`            | Update a task (partial update supported)            | Body: `{ title?, description?, status? }`              |
| `DELETE` | `/:id`            | Delete a task                                       | URL param: `id`                                        |
| `GET`    | `/history`        | Fetch archived tasks for a specific date            | Query: `date=YYYY-MM-DD` **(required)**                |
| `GET`    | `/summary`        | Fetch the daily summary for a date                  | Query: `date=YYYY-MM-DD` (optional, defaults to today) |
| `POST`   | `/dev/run-eod`    | Manually trigger the EOD job (dev only)             | —                                                      |

**Valid `status` values:** `Pending` · `In Progress` · `Completed` · `Not Completed`

**Health check:** `GET /` → `{ "success": true, "message": "API is running" }`

---

## Database Schema

### `tasks` — Active daily tasks

| Column        | Type                       | Notes                                                                              |
|---------------|----------------------------|------------------------------------------------------------------------------------|
| `id`          | `SERIAL`                   | Primary key                                                                        |
| `title`       | `VARCHAR(255)`             | Not null                                                                           |
| `description` | `TEXT`                     | Optional                                                                           |
| `status`      | `VARCHAR(50)`              | Default: `Pending`; CHECK IN (`Pending`, `In Progress`, `Completed`, `Not Completed`) |
| `created_at`  | `TIMESTAMP WITH TIME ZONE` | Default: `NOW()`                                                                   |
| `updated_at`  | `TIMESTAMP WITH TIME ZONE` | Default: `NOW()`                                                                   |

Indexes: `idx_tasks_created_at`, `idx_tasks_status`

---

### `archived_tasks` — Historical record after EOD archiving

| Column        | Type                       | Notes                                            |
|---------------|----------------------------|--------------------------------------------------|
| `id`          | `SERIAL`                   | Primary key                                      |
| `original_id` | `INTEGER`                  | The `id` from `tasks` at archive time            |
| `title`       | `VARCHAR(255)`             | Not null                                         |
| `description` | `TEXT`                     | Optional                                         |
| `status`      | `VARCHAR(50)`              | Final status at time of archiving                |
| `created_at`  | `TIMESTAMP WITH TIME ZONE` | Original creation time                           |
| `updated_at`  | `TIMESTAMP WITH TIME ZONE` | Last update time                                 |
| `archived_at` | `TIMESTAMP WITH TIME ZONE` | Default: `NOW()` — when the EOD job ran          |
| `archive_date`| `DATE`                     | Not null; the date the tasks belonged to         |

Index: `idx_archived_tasks_archive_date`

---

### `daily_summaries` — Per-day aggregated statistics

| Column                  | Type                       | Notes                                  |
|-------------------------|----------------------------|----------------------------------------|
| `id`                    | `SERIAL`                   | Primary key                            |
| `summary_date`          | `DATE`                     | Not null; unique per day               |
| `total_tasks`           | `INTEGER`                  | Default: `0`                           |
| `completed_tasks`       | `INTEGER`                  | Default: `0`                           |
| `pending_tasks`         | `INTEGER`                  | Default: `0`                           |
| `not_completed_tasks`   | `INTEGER`                  | Default: `0`                           |
| `completion_percentage` | `NUMERIC(5, 2)`            | Default: `0.00`                        |
| `eod_executed_at`       | `TIMESTAMP WITH TIME ZONE` | Timestamp when the EOD job ran         |
| `created_at`            | `TIMESTAMP WITH TIME ZONE` | Default: `NOW()`                       |

Unique constraint: `daily_summaries_summary_date_key` on `summary_date`

---

## EOD Job

The End-of-Day job runs via `node-cron` at **23:59 every night**. Steps 2–6 are wrapped in a single atomic PostgreSQL transaction — if any step fails, all changes roll back.

1. **Idempotency check** — queries `daily_summaries` for today. If a row already exists, the job logs "Already ran. Skipping." and exits without touching the database.
2. **Count tasks** — aggregates total, completed, pending, and not-completed counts for all tasks created today.
3. **Insert summary row** — writes the counts and completion percentage into `daily_summaries`.
4. **Downgrade stale tasks** — any task still `In Progress` is set to `Not Completed`.
5. **Archive tasks** — copies today's tasks into `archived_tasks` with `archive_date = today`.
6. **Delete from active table** — removes today's tasks from `tasks`.
7. **Commit transaction** — all DB writes from steps 3–6 commit atomically.
8. **Send email** — dispatches an HTML summary email via Mailtrap. This runs *after* the commit so an email failure cannot roll back the archive.

---

## Testing the EOD Job Manually

With the server running, use the dev trigger endpoint.

**cURL:**

```bash
curl -X POST http://localhost:3000/api/tasks/dev/run-eod
```

**Expected response:**

```json
{ "success": true, "message": "EOD job completed successfully" }
```

**Verify the results:**

1. Check the server terminal for the full `[EOD]` log sequence ending with `EOD Job completed successfully for: YYYY-MM-DD`.
2. Open your **Mailtrap inbox** — an HTML daily summary email should have arrived.
3. Go to the **History** page in the browser, select today's date — archived tasks and summary stats should appear.
4. Go to the **Today Board** — it should be empty because tasks were archived.

**Re-running the job on the same day** (for repeated testing):

The idempotency guard prevents re-execution if `daily_summaries` already has a row for today. To reset and run again, delete the summary row and add new tasks:

```sql
DELETE FROM daily_summaries WHERE summary_date = CURRENT_DATE;
```

Then create tasks via the Today Board and trigger the endpoint again.
