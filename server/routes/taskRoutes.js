/**
 * taskRoutes.js
 * Express router for all /api/tasks endpoints.
 * Routes will be wired to controller functions in Phase 2.
 */

import { Router } from 'express';

const router = Router();

// Placeholder health-check route — returns empty array until Phase 2
// GET /api/tasks
router.get('/', (req, res) => {
  res.status(200).json({ success: true, data: [] });
});

export default router;
