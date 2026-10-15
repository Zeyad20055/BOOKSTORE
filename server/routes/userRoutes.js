import { Router } from 'express';
import { listUsers, getUser, updateUserRole, deleteUser } from '../controllers/userController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect, adminOnly); // every user-management route is admin-only

router.get('/', listUsers);
router.get('/:id', getUser);
router.patch('/:id/role', updateUserRole);
router.delete('/:id', deleteUser);

export default router;
