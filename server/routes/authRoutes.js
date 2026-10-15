import { Router } from 'express';
import { register, login, me } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();
const limiter = rateLimit({ max: 30 });

router.post('/register', limiter, register);
router.post('/login', limiter, login);
router.get('/me', protect, me);

export default router;
