import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getBoardActivity } from '../controllers/activityController';

const router = Router();

router.get('/boards/:boardId/activity', authMiddleware, getBoardActivity);

export default router;
