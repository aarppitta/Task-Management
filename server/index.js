/**
 * index.js
 * Entry point for the Express API server.
 * Responsibilities:
 *  - Load environment variables
 *  - Apply global middleware (JSON parsing, CORS)
 *  - Mount route handlers
 *  - Apply global error handler
 *  - Connect to PostgreSQL, then start listening
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import taskRoutes from './routes/taskRoutes.js';
import errorHandler from './middleware/errorHandler.js';

// Load .env variables into process.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────

// Parse incoming JSON request bodies
app.use(express.json());

// Enable CORS — only allow requests from the React dev server
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// ── Routes ────────────────────────────────────────────────────────────────────

// All task-related endpoints are under /api/tasks
app.use('/api/tasks', taskRoutes);

// ── Global Error Handler ──────────────────────────────────────────────────────
// Must be registered AFTER all routes
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
// Verify DB connection first, then begin accepting requests
const startServer = async () => {
  try {
    // Ping the DB to confirm the pool is working before accepting traffic
    await pool.query('SELECT 1');
    console.log('Database connection verified');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server — DB connection error:', err.message);
    process.exit(1);
  }
};

startServer();
