import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema, changePasswordSchema } from '../schemas/index';
import { updateProfile, changePassword } from '../controllers/profileController';

const router = Router();

router.put('/', authMiddleware, validate(updateProfileSchema), updateProfile);
router.put('/password', authMiddleware, validate(changePasswordSchema), changePassword);

export default router;
