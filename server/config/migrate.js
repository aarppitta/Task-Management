/**
 * migrate.js
 * One-time database migration script.
 * Creates all required tables and indexes for the Daily Task Manager.
 *
 * Run once with:  node config/migrate.js
 *
 * Tables created:
 *  - tasks            Active daily tasks
 *  - archived_tasks   Historical record of tasks after EOD archiving
 *  - daily_summaries  Per-day aggregated statistics
 */

import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// ── SQL Statements ────────────────────────────────────────────────────────────

const createTasksTable = `
  CREATE TABLE IF NOT EXISTS tasks (
    id          SERIAL PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    description TEXT,
    status      VARCHAR(50)  NOT NULL DEFAULT 'Pending'
                  CHECK (status IN ('Pending', 'In Progress', 'Completed', 'Not Completed')),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

const createTasksIndexes = `
  CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks (created_at);
  CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks (status);
`;

const createArchivedTasksTable = `
  CREATE TABLE IF NOT EXISTS archived_tasks (
    id           SERIAL PRIMARY KEY,
    original_id  INTEGER NOT NULL,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    status       VARCHAR(50)  NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE,
    updated_at   TIMESTAMP WITH TIME ZONE,
    archived_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    archive_date DATE NOT NULL
  );
`;

const createArchivedTasksIndexes = `
  CREATE INDEX IF NOT EXISTS idx_archived_tasks_archive_date ON archived_tasks (archive_date);
`;

const createDailySummariesTable = `
  CREATE TABLE IF NOT EXISTS daily_summaries (
    id                    SERIAL PRIMARY KEY,
    summary_date          DATE    NOT NULL UNIQUE,
    total_tasks           INTEGER DEFAULT 0,
    completed_tasks       INTEGER DEFAULT 0,
    pending_tasks         INTEGER DEFAULT 0,
    not_completed_tasks   INTEGER DEFAULT 0,
    completion_percentage NUMERIC(5, 2) DEFAULT 0.00,
    eod_executed_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at            TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
`;

// The UNIQUE constraint on summary_date is already declared inline above,
// but we add it explicitly here as well for clarity (IF NOT EXISTS is safe).
const createDailySummariesConstraint = `
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'daily_summaries_summary_date_key'
    ) THEN
      ALTER TABLE daily_summaries ADD CONSTRAINT daily_summaries_summary_date_key UNIQUE (summary_date);
    END IF;
  END
  $$;
`;

// ── Migration Runner ──────────────────────────────────────────────────────────

const runMigration = async () => {
  const client = await pool.connect();

  try {
    console.log('Starting database migration...\n');

    // tasks
    await client.query(createTasksTable);
    console.log('✓ Table created: tasks');
    await client.query(createTasksIndexes);
    console.log('✓ Indexes created: tasks (created_at, status)');

    // archived_tasks
    await client.query(createArchivedTasksTable);
    console.log('✓ Table created: archived_tasks');
    await client.query(createArchivedTasksIndexes);
    console.log('✓ Index created: archived_tasks (archive_date)');

    // daily_summaries
    await client.query(createDailySummariesTable);
    console.log('✓ Table created: daily_summaries');
    await client.query(createDailySummariesConstraint);
    console.log('✓ Unique constraint verified: daily_summaries (summary_date)');

    console.log('\nMigration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

runMigration();
