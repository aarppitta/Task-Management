/**
 * db.js
 * PostgreSQL connection pool using the 'pg' library.
 * Reads all connection config from environment variables (via dotenv).
 * Exports a single shared pool instance used throughout the server.
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create a connection pool using environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Test the connection on startup and log result
pool.connect((err, client, release) => {
  if (err) {
    console.error('Failed to connect to PostgreSQL:', err.message);
    return;
  }
  console.log('PostgreSQL connected successfully');
  release(); // return client back to pool
});

export default pool;
