import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service.js';

const loginSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(1),
  role: z.enum(['student', 'teacher', 'admin', 'super-admin']).optional(),
});

export const authController = {
  async login(req: Request, res: Response) {
    try {
      const { email, username, password, role } = req.body as z.infer<typeof loginSchema>;
      
      const result = await authService.login({ email, username, password, role });
      res.json(result);
    } catch (error: any) {
      if (error.message === 'Username is required for students.' || 
          error.message === 'Email is required for teachers and admins.') {
        res.status(400).json({ message: error.message });
      } else if (error.message === 'Invalid credentials.') {
        res.status(401).json({ message: error.message });
      } else if (error.message.startsWith('This account is not registered as')) {
        res.status(403).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error.' });
      }
    }
  },

  getMe(req: Request, res: Response) {
    res.json({ user: req.user });
  }
};
