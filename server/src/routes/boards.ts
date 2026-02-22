import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createBoardSchema, updateBoardSchema, addMemberSchema, updateMemberRoleSchema } from '../schemas';
import {
  listBoards, getBoard, createBoard, updateBoard, deleteBoard,
  addMember, removeMember, updateMemberRole
} from '../controllers/boardController';

const router = Router();

router.get('/', authMiddleware, listBoards);
router.get('/:id', authMiddleware, getBoard);
router.post('/', authMiddleware, validate(createBoardSchema), createBoard);
router.put('/:id', authMiddleware, validate(updateBoardSchema), updateBoard);
router.delete('/:id', authMiddleware, deleteBoard);
router.post('/:id/members', authMiddleware, validate(addMemberSchema), addMember);
router.patch('/:id/members/:userId', authMiddleware, validate(updateMemberRoleSchema), updateMemberRole);
router.delete('/:id/members/:userId', authMiddleware, removeMember);

export default router;
