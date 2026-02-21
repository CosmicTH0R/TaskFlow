import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createTaskSchema, updateTaskSchema, moveTaskSchema, assignTaskSchema,
} from '../schemas';
import {
  listTasks, createTask, updateTask, deleteTask,
  moveTask, assignTask, unassignTask,
} from '../controllers/taskController';

const router = Router();

router.get('/', authMiddleware, listTasks);
router.post('/', authMiddleware, validate(createTaskSchema), createTask);
router.put('/:id', authMiddleware, validate(updateTaskSchema), updateTask);
router.delete('/:id', authMiddleware, deleteTask);
router.put('/:id/move', authMiddleware, validate(moveTaskSchema), moveTask);
router.post('/:id/assign', authMiddleware, validate(assignTaskSchema), assignTask);
router.delete('/:id/assign/:userId', authMiddleware, unassignTask);

export default router;
