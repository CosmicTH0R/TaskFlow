import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { checkBoardRole } from '../middleware/rbac';

const prisma = new PrismaClient();

export const listTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const boardId = req.query.boardId as string;
    const listId = req.query.listId as string;
    const priority = req.query.priority as string;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (boardId) where.boardId = boardId;
    if (listId) where.listId = listId;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignees: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          labels: {
            include: { label: true },
          },
          list: { select: { id: true, title: true } },
        },
        orderBy: { position: 'asc' },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      tasks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, listId, boardId, priority, dueDate } = req.body;

    if (!title || !listId || !boardId) {
      res.status(400).json({ error: 'Title, listId, and boardId are required' });
      return;
    }

    const canEdit = await checkBoardRole(req.userId!, boardId, ['OWNER', 'EDITOR']);
    if (!canEdit) {
      res.status(403).json({ error: 'Only owners and editors can create tasks' });
      return;
    }

    const maxPos = await prisma.task.aggregate({
      where: { listId },
      _max: { position: true },
    });

    const task = await prisma.task.create({
      data: {
        title,
        description,
        listId,
        boardId,
        position: (maxPos._max.position ?? -1) + 1,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
      include: {
        assignees: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        labels: {
          include: { label: true },
        },
        list: { select: { id: true, title: true } },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId,
        userId: req.userId!,
        taskId: task.id,
        action: 'TASK_CREATED',
        details: JSON.stringify({ title: task.title, listTitle: task.list.title }),
      },
    });

    // Broadcast real-time event
    req.broadcastToBoard?.(boardId, 'task:created', task);

    res.status(201).json({ task });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, priority, dueDate } = req.body;

    const existing = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const canEdit = await checkBoardRole(req.userId!, existing.boardId, ['OWNER', 'EDITOR']);
    if (!canEdit) {
      res.status(403).json({ error: 'Only owners and editors can update tasks' });
      return;
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      },
      include: {
        assignees: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        labels: {
          include: { label: true },
        },
        list: { select: { id: true, title: true } },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId: task.boardId,
        userId: req.userId!,
        taskId: task.id,
        action: 'TASK_UPDATED',
        details: JSON.stringify({ title: task.title }),
      },
    });

    // Broadcast real-time event
    req.broadcastToBoard?.(task.boardId, 'task:updated', task);

    res.json({ task });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const { boardId, listId, title } = task;

    const canEdit = await checkBoardRole(req.userId!, boardId, ['OWNER', 'EDITOR']);
    if (!canEdit) {
      res.status(403).json({ error: 'Only owners and editors can delete tasks' });
      return;
    }

    await prisma.task.delete({ where: { id: req.params.id } });

    // Re-order remaining tasks
    const remaining = await prisma.task.findMany({
      where: { listId },
      orderBy: { position: 'asc' },
    });
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].position !== i) {
        await prisma.task.update({ where: { id: remaining[i].id }, data: { position: i } });
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        boardId,
        userId: req.userId!,
        action: 'TASK_DELETED',
        details: JSON.stringify({ title }),
      },
    });

    // Broadcast real-time event
    req.broadcastToBoard?.(boardId, 'task:deleted', { taskId: req.params.id, listId });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const moveTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { listId, position } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { list: { select: { title: true } } },
    });

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const canEdit = await checkBoardRole(req.userId!, task.boardId, ['OWNER', 'EDITOR']);
    if (!canEdit) {
      res.status(403).json({ error: 'Only owners and editors can move tasks' });
      return;
    }

    const oldListId = task.listId;
    const oldPosition = task.position;

    // If moving within the same list
    if (oldListId === listId) {
      if (position > oldPosition) {
        await prisma.task.updateMany({
          where: {
            listId,
            position: { gt: oldPosition, lte: position },
          },
          data: { position: { decrement: 1 } },
        });
      } else if (position < oldPosition) {
        await prisma.task.updateMany({
          where: {
            listId,
            position: { gte: position, lt: oldPosition },
          },
          data: { position: { increment: 1 } },
        });
      }
    } else {
      // Moving to a different list
      await prisma.task.updateMany({
        where: {
          listId: oldListId,
          position: { gt: oldPosition },
        },
        data: { position: { decrement: 1 } },
      });

      await prisma.task.updateMany({
        where: {
          listId,
          position: { gte: position },
        },
        data: { position: { increment: 1 } },
      });
    }

    // Update the moved task
    const updatedTask = await prisma.task.update({
      where: { id: req.params.id },
      data: { listId, position },
      include: {
        assignees: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        list: { select: { id: true, title: true } },
      },
    });

    // Log activity
    const newList = await prisma.list.findUnique({ where: { id: listId } });
    await prisma.activity.create({
      data: {
        boardId: task.boardId,
        userId: req.userId!,
        taskId: task.id,
        action: 'TASK_MOVED',
        details: JSON.stringify({
          title: task.title,
          fromList: task.list.title,
          toList: newList?.title,
        }),
      },
    });

    // Broadcast real-time event
    req.broadcastToBoard?.(task.boardId, 'task:moved', { ...updatedTask, fromListId: oldListId });

    res.json({ task: updatedTask });
  } catch (error) {
    console.error('Move task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const assignTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const canEdit = await checkBoardRole(req.userId!, task.boardId, ['OWNER', 'EDITOR']);
    if (!canEdit) {
      res.status(403).json({ error: 'Only owners and editors can assign tasks' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existing = await prisma.taskAssignee.findUnique({
      where: { taskId_userId: { taskId: req.params.id, userId } },
    });
    if (existing) {
      res.status(409).json({ error: 'User is already assigned' });
      return;
    }

    const assignment = await prisma.taskAssignee.create({
      data: { taskId: req.params.id, userId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId: task.boardId,
        userId: req.userId!,
        taskId: task.id,
        action: 'TASK_ASSIGNED',
        details: JSON.stringify({ title: task.title, assigneeName: user.name }),
      },
    });

    res.status(201).json({ assignee: assignment });
  } catch (error) {
    console.error('Assign task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const unassignTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    const canEdit = await checkBoardRole(req.userId!, task.boardId, ['OWNER', 'EDITOR']);
    if (!canEdit) {
      res.status(403).json({ error: 'Only owners and editors can unassign tasks' });
      return;
    }

    await prisma.taskAssignee.deleteMany({
      where: { taskId: req.params.id, userId: req.params.userId },
    });

    // Log activity
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
    await prisma.activity.create({
      data: {
        boardId: task.boardId,
        userId: req.userId!,
        taskId: task.id,
        action: 'TASK_UNASSIGNED',
        details: JSON.stringify({ title: task.title, assigneeName: user?.name }),
      },
    });

    res.json({ message: 'User unassigned successfully' });
  } catch (error) {
    console.error('Unassign task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
