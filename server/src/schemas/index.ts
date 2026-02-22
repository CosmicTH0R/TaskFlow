import { z } from 'zod';

// ─── Auth ────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Boards ──────────────────────────────────────────────────────────────────

export const createBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(2000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color').optional(),
});

export const updateBoardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const addMemberSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// ─── Lists ───────────────────────────────────────────────────────────────────

export const createListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  boardId: z.string().min(1, 'Board ID is required'),
});

export const updateListSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
});

export const reorderListsSchema = z.object({
  boardId: z.string().min(1, 'Board ID is required'),
  listIds: z.array(z.string()).min(1, 'At least one list ID is required'),
});

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional().nullable(),
  listId: z.string().min(1, 'List ID is required'),
  boardId: z.string().min(1, 'Board ID is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  dueDate: z.string().optional().nullable(),
});

export const moveTaskSchema = z.object({
  listId: z.string().min(1, 'List ID is required'),
  position: z.number().int().min(0, 'Position must be a non-negative integer'),
});

export const assignTaskSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
});

// ─── Comments ────────────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(5000, 'Comment is too long'),
});

// ─── Labels ──────────────────────────────────────────────────────────────────

export const createLabelSchema = z.object({
  name: z.string().min(1, 'Label name is required').max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color').optional(),
});

export const assignLabelSchema = z.object({
  labelId: z.string().min(1, 'Label ID is required'),
});

// ─── Profile ─────────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).optional(),
  email: z.string().email('Invalid email format').optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});
