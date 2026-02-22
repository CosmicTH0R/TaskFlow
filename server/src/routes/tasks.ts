import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createTaskSchema, updateTaskSchema, moveTaskSchema, assignTaskSchema,
  createSubTaskSchema, updateSubTaskSchema, addDependencySchema,
} from '../schemas';
import {
  listTasks, createTask, updateTask, deleteTask,
  moveTask, assignTask, unassignTask,
} from '../controllers/taskController';
import {
  createSubTask, updateSubTask, deleteSubTask,
  addDependency, removeDependency, getSubTasksAndDeps,
} from '../controllers/subtaskController';

const router = Router();

router.get('/', authMiddleware, listTasks);
router.post('/', authMiddleware, validate(createTaskSchema), createTask);
router.put('/:id', authMiddleware, validate(updateTaskSchema), updateTask);
router.delete('/:id', authMiddleware, deleteTask);
router.put('/:id/move', authMiddleware, validate(moveTaskSchema), moveTask);
router.post('/:id/assign', authMiddleware, validate(assignTaskSchema), assignTask);
router.delete('/:id/assign/:userId', authMiddleware, unassignTask);

// Subtasks
router.get('/:id/details', authMiddleware, getSubTasksAndDeps);
router.post('/:id/subtasks', authMiddleware, validate(createSubTaskSchema), createSubTask);
router.patch('/:id/subtasks/:subId', authMiddleware, validate(updateSubTaskSchema), updateSubTask);
router.delete('/:id/subtasks/:subId', authMiddleware, deleteSubTask);

// Dependencies
router.post('/:id/dependencies', authMiddleware, validate(addDependencySchema), addDependency);
router.delete('/:id/dependencies/:depId', authMiddleware, removeDependency);

export default router;
