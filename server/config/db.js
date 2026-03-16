import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err);
  process.exit(-1);
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending', 'in_progress', 'completed', 'not_completed')),
      task_date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS archived_tasks (
      id SERIAL PRIMARY KEY,
      original_id INTEGER NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) NOT NULL,
      task_date DATE NOT NULL,
      created_at TIMESTAMP,
      updated_at TIMESTAMP,
      archived_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS daily_summaries (
      id SERIAL PRIMARY KEY,
      summary_date DATE UNIQUE NOT NULL,
      total_tasks INTEGER NOT NULL,
      completed_tasks INTEGER NOT NULL,
      pending_tasks INTEGER NOT NULL,
      completion_percentage NUMERIC(5,2) NOT NULL,
      eod_executed_at TIMESTAMP DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_date       ON tasks(task_date);
    CREATE INDEX IF NOT EXISTS idx_archived_date    ON archived_tasks(task_date);
    CREATE INDEX IF NOT EXISTS idx_summaries_date   ON daily_summaries(summary_date);
  `);
  console.log('Database tables initialized');
}

export default pool;
