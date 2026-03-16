import { Router } from 'express';
import { getSummary } from '../controllers/summaryController.js';

const router = Router();

// GET /api/summaries/:date
router.get('/:date', getSummary);

export default router;
