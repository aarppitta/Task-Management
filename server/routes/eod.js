import { Router } from 'express';
import { triggerEOD } from '../controllers/eodController.js';

const router = Router();

// POST /api/eod/trigger
router.post('/trigger', triggerEOD);

export default router;
