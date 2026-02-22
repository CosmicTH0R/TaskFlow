import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// GET /api/notes
export async function listNotes(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { search, page = '1', boardId } = req.query;
    const limit = 50;
    const skip = (Number(page) - 1) * limit;

    let where: any = {};

    if (boardId) {
      // Check if user is a member of this board
      const membership = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId: String(boardId), userId } },
      });
      if (!membership) {
        res.status(403).json({ error: 'Access denied to this board' });
        return;
      }
      where.boardId = String(boardId);
    } else {
      // Personal notes
      where.userId = userId;
      where.boardId = null;
    }

    if (search) {
      where.title = { contains: String(search) };
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.note.count({ where }),
    ]);

    res.json({
      notes,
      pagination: {
        page: Number(page),
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('listNotes error:', err);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
}

// GET /api/notes/:id
export async function getNote(req: AuthRequest, res: Response) {
  try {
    const note = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!note) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (note.boardId) {
      // Verify board membership
      const membership = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId: note.boardId, userId: req.userId! } },
      });
      if (!membership) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    } else if (note.userId !== req.userId) {
      // Personal note ownership
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    res.json({ note });
  } catch (err) {
    console.error('getNote error:', err);
    res.status(500).json({ error: 'Failed to fetch note' });
  }
}

// POST /api/notes
  export async function createNote(req: AuthRequest, res: Response) {
    try {
      const { title, content, emoji, boardId, parentId } = req.body;
  
      if (boardId) {
        // Verify board membership
        const membership = await prisma.boardMember.findUnique({
          where: { boardId_userId: { boardId, userId: req.userId! } },
        });
        if (!membership) {
          res.status(403).json({ error: 'Access denied to this board' });
          return;
        }
      }
  
      const note = await prisma.note.create({
        data: {
          title,
          content: content || '',
          emoji: emoji || '📝',
          userId: req.userId!,
          boardId: boardId || null,
          parentId: parentId || null,
        },
      });
    res.status(201).json({ note });
  } catch (err) {
    console.error('createNote error:', err);
    res.status(500).json({ error: 'Failed to create note' });
  }
}

// PUT /api/notes/:id
export async function updateNote(req: AuthRequest, res: Response) {
  try {
    const existing = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (existing.boardId) {
      // Verify board membership
      const membership = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId: existing.boardId, userId: req.userId! } },
      });
      if (!membership) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    } else if (existing.userId !== req.userId) {
      // Verify personal note ownership
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const { title, content, emoji } = req.body;
    const note = await prisma.note.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(emoji !== undefined && { emoji }),
      },
    });
    res.json({ note });
  } catch (err) {
    console.error('updateNote error:', err);
    res.status(500).json({ error: 'Failed to update note' });
  }
}

// DELETE /api/notes/:id
export async function deleteNote(req: AuthRequest, res: Response) {
  try {
    const existing = await prisma.note.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Note not found' });
      return;
    }

    if (existing.boardId) {
      // Verify board membership
      const membership = await prisma.boardMember.findUnique({
        where: { boardId_userId: { boardId: existing.boardId, userId: req.userId! } },
      });
      if (!membership) {
        res.status(403).json({ error: 'Access denied' });
        return;
      }
    } else if (existing.userId !== req.userId) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    await prisma.note.delete({ where: { id: req.params.id } });
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error('deleteNote error:', err);
    res.status(500).json({ error: 'Failed to delete note' });
  }
}
