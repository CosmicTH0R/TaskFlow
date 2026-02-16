import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  listBoards, getBoard, createBoard, updateBoard, deleteBoard,
  addMember, removeMember,
} from '../controllers/boardController';

const router = Router();

router.get('/', authMiddleware, listBoards);
router.get('/:id', authMiddleware, getBoard);
router.post('/', authMiddleware, createBoard);
router.put('/:id', authMiddleware, updateBoard);
router.delete('/:id', authMiddleware, deleteBoard);
router.post('/:id/members', authMiddleware, addMember);
router.delete('/:id/members/:userId', authMiddleware, removeMember);

export default router;
