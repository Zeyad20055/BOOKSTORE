import { Router } from 'express';
import { getStats } from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.get('/stats', protect, adminOnly, getStats);

export default router;
