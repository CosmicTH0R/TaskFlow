import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { signupSchema, loginSchema } from '../schemas';
import { signup, login, getMe, searchUsers } from '../controllers/authController';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.get('/me', authMiddleware, getMe);
router.get('/users', authMiddleware, searchUsers);

export default router;
