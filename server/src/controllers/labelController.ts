import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/boards/:boardId/labels
export const listLabels = async (req: Request, res: Response): Promise<void> => {
  const { boardId } = req.params;
  const labels = await prisma.label.findMany({
    where: { boardId },
    include: { _count: { select: { tasks: true } } },
    orderBy: { name: 'asc' },
  });
  res.json({ labels });
};

// POST /api/boards/:boardId/labels
export const createLabel = async (req: Request, res: Response): Promise<void> => {
  const { boardId } = req.params;
  const userId = (req as any).userId;
  const { name, color } = req.body;

  // Verify board membership
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId, userId } },
  });
  if (!member) {
    res.status(403).json({ error: 'You are not a member of this board' });
    return;
  }

  const label = await prisma.label.create({
    data: { name, color: color || '#6366f1', boardId },
  });

  res.status(201).json({ label });
};

// DELETE /api/labels/:id
export const deleteLabel = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const userId = (req as any).userId;

  const label = await prisma.label.findUnique({ where: { id } });
  if (!label) {
    res.status(404).json({ error: 'Label not found' });
    return;
  }

  // Verify board membership
  const member = await prisma.boardMember.findUnique({
    where: { boardId_userId: { boardId: label.boardId, userId } },
  });
  if (!member) {
    res.status(403).json({ error: 'You are not a member of this board' });
    return;
  }

  await prisma.label.delete({ where: { id } });
  res.json({ message: 'Label deleted' });
};

// POST /api/tasks/:taskId/labels
export const addLabelToTask = async (req: Request, res: Response): Promise<void> => {
  const { taskId } = req.params;
  const { labelId } = req.body;

  // Check if already assigned
  const existing = await prisma.taskLabel.findUnique({
    where: { taskId_labelId: { taskId, labelId } },
  });
  if (existing) {
    res.status(400).json({ error: 'Label already assigned to this task' });
    return;
  }

  const taskLabel = await prisma.taskLabel.create({
    data: { taskId, labelId },
    include: { label: true },
  });

  res.status(201).json({ taskLabel });
};

// DELETE /api/tasks/:taskId/labels/:labelId
export const removeLabelFromTask = async (req: Request, res: Response): Promise<void> => {
  const { taskId, labelId } = req.params;

  const existing = await prisma.taskLabel.findUnique({
    where: { taskId_labelId: { taskId, labelId } },
  });
  if (!existing) {
    res.status(404).json({ error: 'Label not assigned to this task' });
    return;
  }

  await prisma.taskLabel.delete({ where: { id: existing.id } });
  res.json({ message: 'Label removed from task' });
};
