import { Router } from 'express';
import { body } from 'express-validator';
import { getTasks, createTask, updateTask, deleteTask, getArchivedTasks } from '../controllers/taskController.js';

const router = Router();

const VALID_STATUSES = ['pending', 'in_progress', 'completed', 'not_completed'];

// GET /api/tasks/archived?date=YYYY-MM-DD  — must be defined before /:id
router.get('/archived', getArchivedTasks);

// GET /api/tasks or GET /api/tasks?date=YYYY-MM-DD
router.get('/', getTasks);

// POST /api/tasks
router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('status')
      .optional()
      .isIn(VALID_STATUSES)
      .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  ],
  createTask
);

// PUT /api/tasks/:id
router.put(
  '/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('status')
      .optional()
      .isIn(VALID_STATUSES)
      .withMessage(`Status must be one of: ${VALID_STATUSES.join(', ')}`),
  ],
  updateTask
);

// DELETE /api/tasks/:id
router.delete('/:id', deleteTask);

export default router;
