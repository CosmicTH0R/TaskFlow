import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// PUT /api/profile
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId;
  const { name } = req.body;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name },
    select: { id: true, email: true, name: true, avatar: true, createdAt: true },
  });

  res.json({ user });
};

// PUT /api/profile/password
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const userId = (req as any).userId;
  const { currentPassword, newPassword } = req.body;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  res.json({ message: 'Password changed successfully' });
};
