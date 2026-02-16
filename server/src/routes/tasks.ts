import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  listTasks, createTask, updateTask, deleteTask,
  moveTask, assignTask, unassignTask,
} from '../controllers/taskController';

const router = Router();

router.get('/', authMiddleware, listTasks);
router.post('/', authMiddleware, createTask);
router.put('/:id', authMiddleware, updateTask);
router.delete('/:id', authMiddleware, deleteTask);
router.put('/:id/move', authMiddleware, moveTask);
router.post('/:id/assign', authMiddleware, assignTask);
router.delete('/:id/assign/:userId', authMiddleware, unassignTask);

export default router;
