import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createNoteSchema, updateNoteSchema } from '../schemas';
import {
  listNotes, getNote, createNote, updateNote, deleteNote
} from '../controllers/noteController';

const router = Router();

router.get('/', authMiddleware, listNotes);
router.get('/:id', authMiddleware, getNote);
router.post('/', authMiddleware, validate(createNoteSchema), createNote);
router.put('/:id', authMiddleware, validate(updateNoteSchema), updateNote);
router.delete('/:id', authMiddleware, deleteNote);

export default router;
