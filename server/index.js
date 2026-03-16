import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import { initDB } from './config/db.js';
import taskRoutes from './routes/tasks.js';
import summaryRoutes from './routes/summaries.js';
import eodRoutes from './routes/eod.js';
import { eodJob } from './jobs/scheduler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — support multiple origins via env
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((o) => o.trim());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/summaries', summaryRoutes);
app.use('/api/eod', eodRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// Global error handler
app.use((err, req, res, _next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start cron scheduler
eodJob.start();
console.log('[Scheduler] EOD cron job started (runs at midnight daily)');

// Initialize database tables, then start server
initDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on 0.0.0.0:${PORT}`);
  });
}).catch((err) => {
  console.error('[DB] Failed to initialize database:', err);
  process.exit(1);
});
