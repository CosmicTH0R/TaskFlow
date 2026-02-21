import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createLabelSchema, assignLabelSchema } from '../schemas/index';
import {
  listLabels, createLabel, deleteLabel,
  addLabelToTask, removeLabelFromTask,
} from '../controllers/labelController';

const router = Router();

// Board-scoped label CRUD
router.get('/boards/:boardId/labels', authMiddleware, listLabels);
router.post('/boards/:boardId/labels', authMiddleware, validate(createLabelSchema), createLabel);
router.delete('/labels/:id', authMiddleware, deleteLabel);

// Task-label assignment
router.post('/tasks/:taskId/labels', authMiddleware, validate(assignLabelSchema), addLabelToTask);
router.delete('/tasks/:taskId/labels/:labelId', authMiddleware, removeLabelFromTask);

export default router;
