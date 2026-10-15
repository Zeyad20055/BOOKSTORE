import { Router } from 'express';
import { createOrder, myOrders, getOrder, listAllOrders, updateOrderStatus } from '../controllers/orderController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

router.post('/', createOrder);
router.get('/mine', myOrders);
router.get('/', adminOnly, listAllOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', adminOnly, updateOrderStatus);

export default router;
