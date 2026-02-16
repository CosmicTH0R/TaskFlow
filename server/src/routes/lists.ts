import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getListsByBoard, createList, updateList, deleteList, reorderLists,
} from '../controllers/listController';

const router = Router();

router.get('/boards/:boardId/lists', authMiddleware, getListsByBoard);
router.post('/', authMiddleware, createList);
router.put('/reorder', authMiddleware, reorderLists);
router.put('/:id', authMiddleware, updateList);
router.delete('/:id', authMiddleware, deleteList);

export default router;
