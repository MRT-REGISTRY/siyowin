import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authController } from '../controllers/auth.controller.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(1),
  role: z.enum(['student', 'teacher', 'admin', 'super-admin']).optional(),
});

router.post('/login', validateBody(loginSchema), asyncHandler(authController.login));

router.get('/me', requireAuth, authController.getMe);

export default router;
