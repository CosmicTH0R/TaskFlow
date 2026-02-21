import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createListSchema, updateListSchema, reorderListsSchema } from '../schemas';
import {
  getListsByBoard, createList, updateList, deleteList, reorderLists,
} from '../controllers/listController';

const router = Router();

router.get('/boards/:boardId/lists', authMiddleware, getListsByBoard);
router.post('/', authMiddleware, validate(createListSchema), createList);
router.put('/reorder', authMiddleware, validate(reorderListsSchema), reorderLists);
router.put('/:id', authMiddleware, validate(updateListSchema), updateList);
router.delete('/:id', authMiddleware, deleteList);

export default router;
