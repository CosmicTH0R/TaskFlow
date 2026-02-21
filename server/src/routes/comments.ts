import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCommentSchema } from '../schemas/index';
import { listComments, createComment, deleteComment } from '../controllers/commentController';

const router = Router();

// Task-scoped comment routes
router.get('/tasks/:taskId/comments', authMiddleware, listComments);
router.post('/tasks/:taskId/comments', authMiddleware, validate(createCommentSchema), createComment);
router.delete('/comments/:id', authMiddleware, deleteComment);

export default router;
