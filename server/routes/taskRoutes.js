/**
 * taskRoutes.js
 * Express router for all /api/tasks endpoints.
 * Handles routing and input validation only — no business logic here.
 * Route order matters: specific paths (/today, /history, /summary) must come
 * before parameterized paths (/:id) to prevent Express from treating them as IDs.
 */

import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import {
  getTodayTasks,
  createTask,
  updateTask,
  deleteTask,
  getHistory,
  getDailySummary,
} from '../controllers/taskController.js';

const router = Router();

/**
 * Validation middleware — runs after express-validator chains.
 * Returns 400 with the full errors array if any validation failed.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
};

// ── Specific routes first (must precede /:id) ──

// GET /api/tasks/today
router.get('/today', getTodayTasks);

// GET /api/tasks/history?date=YYYY-MM-DD
router.get('/history', getHistory);

// GET /api/tasks/summary?date=YYYY-MM-DD
router.get('/summary', getDailySummary);

// ── Collection / parameterized routes ──

// POST /api/tasks
router.post(
  '/',
  [
    body('title')
      .notEmpty().withMessage('Title is required')
      .trim()
      .isLength({ max: 255 }).withMessage('Title must be 255 characters or fewer'),
  ],
  validate,
  createTask
);

// PUT /api/tasks/:id
router.put(
  '/:id',
  [
    body('title')
      .optional()
      .trim()
      .isLength({ max: 255 }).withMessage('Title must be 255 characters or fewer'),
    body('status')
      .optional()
      .isIn(['Pending', 'In Progress', 'Completed'])
      .withMessage("Status must be 'Pending', 'In Progress', or 'Completed'"),
  ],
  validate,
  updateTask
);

// DELETE /api/tasks/:id
router.delete('/:id', deleteTask);

export default router;
