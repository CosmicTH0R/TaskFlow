import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/tasks/:taskId/comments
export const listComments = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = 20;

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comment.count({ where: { taskId } }),
  ]);

  res.json({
    comments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

// POST /api/tasks/:taskId/comments
export const createComment = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const userId = (req as any).userId;
  const { content } = req.body;

  // Verify the task exists and user has access (is a board member)
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { board: { include: { members: true } } },
  });

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const isMember = task.board.members.some((m) => m.userId === userId);
  if (!isMember) {
    res.status(403).json({ error: 'You are not a member of this board' });
    return;
  }

  const comment = await prisma.comment.create({
    data: { content, taskId, userId },
    include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  // Emit real-time event to the board room
  const io = req.app.get('io');
  if (io) {
    io.to(`board:${task.boardId}`).emit('comment:created', comment);
  }

  res.status(201).json({ comment });
};

// DELETE /api/comments/:id
export const deleteComment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = (req as any).userId;

  const comment = await prisma.comment.findUnique({
    where: { id },
    include: { task: true },
  });

  if (!comment) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }

  // Only the comment author can delete it
  if (comment.userId !== userId) {
    res.status(403).json({ error: 'You can only delete your own comments' });
    return;
  }

  await prisma.comment.delete({ where: { id } });

  // Emit real-time event
  const io = req.app.get('io');
  if (io) {
    io.to(`board:${comment.task.boardId}`).emit('comment:deleted', {
      commentId: id,
      taskId: comment.taskId,
    });
  }

  res.json({ message: 'Comment deleted' });
};
