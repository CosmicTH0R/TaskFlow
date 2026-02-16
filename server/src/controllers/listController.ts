import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const getListsByBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const lists = await prisma.list.findMany({
      where: { boardId: req.params.boardId },
      orderBy: { position: 'asc' },
      include: {
        tasks: {
          orderBy: { position: 'asc' },
          include: {
            assignees: {
              include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
            },
          },
        },
      },
    });

    res.json({ lists });
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, boardId } = req.body;

    if (!title || !boardId) {
      res.status(400).json({ error: 'Title and boardId are required' });
      return;
    }

    const maxPos = await prisma.list.aggregate({
      where: { boardId },
      _max: { position: true },
    });

    const list = await prisma.list.create({
      data: {
        title,
        boardId,
        position: (maxPos._max.position ?? -1) + 1,
      },
      include: {
        tasks: true,
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId,
        userId: req.userId!,
        action: 'LIST_CREATED',
        details: JSON.stringify({ title: list.title }),
      },
    });

    // Broadcast real-time event
    req.broadcastToBoard?.(boardId, 'list:created', list);

    res.status(201).json({ list });
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title } = req.body;

    const list = await prisma.list.update({
      where: { id: req.params.id },
      data: { title },
      include: { tasks: true },
    });

    res.json({ list });
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const list = await prisma.list.findUnique({ where: { id: req.params.id } });
    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    const { boardId } = list;

    await prisma.list.delete({ where: { id: req.params.id } });

    // Re-order remaining lists
    const remainingLists = await prisma.list.findMany({
      where: { boardId },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < remainingLists.length; i++) {
      if (remainingLists[i].position !== i) {
        await prisma.list.update({
          where: { id: remainingLists[i].id },
          data: { position: i },
        });
      }
    }

    // Log activity
    await prisma.activity.create({
      data: {
        boardId,
        userId: req.userId!,
        action: 'LIST_DELETED',
        details: JSON.stringify({ title: list.title }),
      },
    });

    // Broadcast real-time event
    req.broadcastToBoard?.(boardId, 'list:deleted', req.params.id);

    res.json({ message: 'List deleted successfully' });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const reorderLists = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { boardId, listIds } = req.body as { boardId: string; listIds: string[] };

    if (!boardId || !listIds || !Array.isArray(listIds)) {
      res.status(400).json({ error: 'boardId and listIds array are required' });
      return;
    }

    const updatePromises = listIds.map((id, index) =>
      prisma.list.update({ where: { id }, data: { position: index } })
    );

    await Promise.all(updatePromises);
    res.json({ message: 'Lists reordered successfully' });
  } catch (error) {
    console.error('Reorder lists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
