import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { checkBoardRole } from '../middleware/rbac';

const prisma = new PrismaClient();

export const listBoards = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 12;
    const search = req.query.search as string;
    const skip = (page - 1) * limit;

    const where = {
      members: { some: { userId: req.userId! } },
      ...(search ? { title: { contains: search } } : {}),
    };

    const [boards, total] = await Promise.all([
      prisma.board.findMany({
        where,
        include: {
          owner: { select: { id: true, name: true, email: true, avatar: true } },
          members: {
            include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
          },
          _count: { select: { tasks: true, lists: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.board.count({ where }),
    ]);

    res.json({
      boards,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        lists: {
          orderBy: { position: 'asc' },
          include: {
            tasks: {
              orderBy: { position: 'asc' },
              include: {
                assignees: {
                  include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
                },
                labels: {
                  include: { label: true },
                },
                subTasks: {
                  orderBy: { position: 'asc' },
                  select: { id: true, completed: true },
                },
              },
            },
          },
        },
      },
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const isMember = board.members.some((m) => m.userId === req.userId);
    if (!isMember) {
      res.status(403).json({ error: 'Not a member of this board' });
      return;
    }

    res.json({ board });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, color } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const board = await prisma.board.create({
      data: {
        title,
        description,
        color: color || '#6366f1',
        ownerId: req.userId!,
        members: {
          create: { userId: req.userId!, role: 'OWNER' },
        },
      },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
        _count: { select: { tasks: true, lists: true } },
      },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId: board.id,
        userId: req.userId!,
        action: 'BOARD_CREATED',
        details: JSON.stringify({ title: board.title }),
      },
    });

    res.status(201).json({ board });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, color } = req.body;

    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    if (board.ownerId !== req.userId) {
      res.status(403).json({ error: 'Only the owner can update the board' });
      return;
    }

    const updated = await prisma.board.update({
      where: { id: req.params.id },
      data: { title, description, color },
      include: {
        owner: { select: { id: true, name: true, email: true, avatar: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
        },
      },
    });

    res.json({ board: updated });
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteBoard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const board = await prisma.board.findUnique({ where: { id: req.params.id } });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const isOwner = await checkBoardRole(req.userId!, req.params.id, ['OWNER']);
    if (!isOwner) {
      res.status(403).json({ error: 'Only the owner can delete the board' });
      return;
    }

    await prisma.board.delete({ where: { id: req.params.id } });
    res.json({ message: 'Board deleted successfully' });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, role } = req.body;

    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
      include: { members: true },
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const canAdd = await checkBoardRole(req.userId!, req.params.id, ['OWNER', 'EDITOR']);
    if (!canAdd) {
      res.status(403).json({ error: 'Only owners and editors can add members' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const alreadyMember = board.members.some((m) => m.userId === user.id);
    if (alreadyMember) {
      res.status(409).json({ error: 'User is already a member' });
      return;
    }

    const membership = await prisma.boardMember.create({
      data: { boardId: board.id, userId: user.id, role: role || 'VIEWER' },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    // Log activity
    await prisma.activity.create({
      data: {
        boardId: board.id,
        userId: req.userId!,
        action: 'MEMBER_ADDED',
        details: JSON.stringify({ memberName: user.name, memberEmail: user.email }),
      },
    });

    res.status(201).json({ member: membership });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const board = await prisma.board.findUnique({
      where: { id: req.params.id },
    });

    if (!board) {
      res.status(404).json({ error: 'Board not found' });
      return;
    }

    const isOwner = await checkBoardRole(req.userId!, req.params.id, ['OWNER']);
    if (!isOwner) {
      res.status(403).json({ error: 'Only the owner can remove members' });
      return;
    }

    if (req.params.userId === board.ownerId) {
      res.status(400).json({ error: 'Cannot remove the board owner' });
      return;
    }

    await prisma.boardMember.deleteMany({
      where: { boardId: req.params.id, userId: req.params.userId },
    });

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateMemberRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role } = req.body;

    const isOwner = await checkBoardRole(req.userId!, req.params.id, ['OWNER']);
    if (!isOwner) {
      res.status(403).json({ error: 'Only the owner can update member roles' });
      return;
    }

    const board = await prisma.board.findUnique({ where: { id: req.params.id } });
    if (board?.ownerId === req.params.userId) {
      res.status(400).json({ error: 'Cannot change the role of the board owner' });
      return;
    }

    const membership = await prisma.boardMember.update({
      where: { boardId_userId: { boardId: req.params.id, userId: req.params.userId } },
      data: { role },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });

    res.json({ member: membership });
  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

