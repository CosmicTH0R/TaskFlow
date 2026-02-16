import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { signup, login, getMe, searchUsers } from '../controllers/authController';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.get('/users', authMiddleware, searchUsers);

export default router;
