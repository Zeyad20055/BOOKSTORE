import { Router } from 'express';
import { listBooks, listCategories, getBook, createBook, updateBook, deleteBook } from '../controllers/bookController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', listBooks);
router.get('/categories', listCategories); // must stay above "/:id"
router.get('/:id', getBook);
router.post('/', protect, adminOnly, createBook);
router.put('/:id', protect, adminOnly, updateBook);
router.delete('/:id', protect, adminOnly, deleteBook);

export default router;
