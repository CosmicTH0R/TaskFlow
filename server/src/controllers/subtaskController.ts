import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { checkBoardRole } from '../middleware/rbac';

const prisma = new PrismaClient();

// ─── SubTasks ────────────────────────────────────────────────────────────────

export const createSubTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title } = req.body;
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }

    const canEdit = await checkBoardRole(req.userId!, task.boardId, ['OWNER', 'EDITOR']);
    if (!canEdit) { res.status(403).json({ error: 'Insufficient permissions' }); return; }

    const maxPos = await prisma.subTask.aggregate({ where: { taskId: task.id }, _max: { position: true } });

    const subTask = await prisma.subTask.create({
      data: { title, taskId: task.id, position: (maxPos._max.position ?? -1) + 1 },
    });

    res.status(201).json({ subTask });
  } catch (error) {
    console.error('Create subtask error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateSubTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, completed } = req.body;
    const subTask = await prisma.subTask.findUnique({
      where: { id: req.params.subId },
      include: { task: true },
    });
    if (!subTask) { res.status(404).json({ error: 'Subtask not found' }); return; }

    const canEdit = await checkBoardRole(req.userId!, subTask.task.boardId, ['OWNER', 'EDITOR']);
    if (!canEdit) { res.status(403).json({ error: 'Insufficient permissions' }); return; }

    const updated = await prisma.subTask.update({
      where: { id: req.params.subId },
      data: {
        ...(title !== undefined && { title }),
        ...(completed !== undefined && { completed }),
      },
    });

    res.json({ subTask: updated });
  } catch (error) {
    console.error('Update subtask error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteSubTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const subTask = await prisma.subTask.findUnique({
      where: { id: req.params.subId },
      include: { task: true },
    });
    if (!subTask) { res.status(404).json({ error: 'Subtask not found' }); return; }

    const canEdit = await checkBoardRole(req.userId!, subTask.task.boardId, ['OWNER', 'EDITOR']);
    if (!canEdit) { res.status(403).json({ error: 'Insufficient permissions' }); return; }

    await prisma.subTask.delete({ where: { id: req.params.subId } });
    res.json({ message: 'Subtask deleted' });
  } catch (error) {
    console.error('Delete subtask error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// ─── Dependencies ────────────────────────────────────────────────────────────

export const addDependency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { dependsOnTaskId } = req.body;
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) { res.status(404).json({ error: 'Task not found' }); return; }

    const canEdit = await checkBoardRole(req.userId!, task.boardId, ['OWNER', 'EDITOR']);
    if (!canEdit) { res.status(403).json({ error: 'Insufficient permissions' }); return; }

    if (dependsOnTaskId === task.id) {
      res.status(400).json({ error: 'A task cannot depend on itself' }); return;
    }

    const blockerTask = await prisma.task.findUnique({ where: { id: dependsOnTaskId } });
    if (!blockerTask || blockerTask.boardId !== task.boardId) {
      res.status(400).json({ error: 'Dependency task not found on this board' }); return;
    }

    const dep = await prisma.taskDependency.create({
      data: { taskId: task.id, dependsOnTaskId },
      include: { dependsOn: { select: { id: true, title: true, listId: true } } },
    });

    res.status(201).json({ dependency: dep });
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'This dependency already exists' }); return;
    }
    console.error('Add dependency error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeDependency = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const dep = await prisma.taskDependency.findUnique({
      where: { id: req.params.depId },
      include: { task: true },
    });
    if (!dep) { res.status(404).json({ error: 'Dependency not found' }); return; }

    const canEdit = await checkBoardRole(req.userId!, dep.task.boardId, ['OWNER', 'EDITOR']);
    if (!canEdit) { res.status(403).json({ error: 'Insufficient permissions' }); return; }

    await prisma.taskDependency.delete({ where: { id: req.params.depId } });
    res.json({ message: 'Dependency removed' });
  } catch (error) {
    console.error('Remove dependency error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getSubTasksAndDeps = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [subTasks, dependencies] = await Promise.all([
      prisma.subTask.findMany({ where: { taskId: req.params.id }, orderBy: { position: 'asc' } }),
      prisma.taskDependency.findMany({
        where: { taskId: req.params.id },
        include: { dependsOn: { select: { id: true, title: true, listId: true } } },
      }),
    ]);
    res.json({ subTasks, dependencies });
  } catch (error) {
    console.error('Get subtasks/deps error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
