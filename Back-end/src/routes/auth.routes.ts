import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { publicUser } from '../data/store.js';
import { repo } from '../data/repository.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().optional(),
  username: z.string().optional(),
  password: z.string().min(1),
  role: z.enum(['student', 'teacher', 'admin', 'super-admin']).optional(),
});


router.post('/login', validateBody(loginSchema), async (req, res) => {
  const { email, username, password, role } = req.body as z.infer<typeof loginSchema>;

  if (role === 'student') {
    if (!username) {
      res.status(400).json({ message: 'Username is required for students.' });
      return;
    }
    if (email) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }
  } else {
    if (!email) {
      res.status(400).json({ message: 'Email is required for teachers and admins.' });
      return;
    }
    if (username) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }
  }

  let user;
  if (username) {
    user = await repo.findUserByUsername(username);
  } else {
    user = await repo.findUserByEmail(email as string);
  }

  // If role not provided by client, enforce identifier type based on the found user's role
  if (!role && user) {
    if (user.role === 'student' && email) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }
    if (user.role !== 'student' && username) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }
  }

  if (!user || user.isActive === false || !bcrypt.compareSync(password, user.passwordHash)) {
    res.status(401).json({ message: 'Invalid credentials.' });
    return;
  }

  // Allow teacher login for both teachers and admins/super-admins
  const roleMatches = !role || role === 'student'
    ? user.role === role
    : role === 'teacher'
      ? user.role === 'teacher' || user.role === 'admin' || user.role === 'super-admin'
      : user.role === role;

  if (!roleMatches) {
    res.status(403).json({ message: `This account is not registered as ${role}.` });
    return;
  }

  const signOptions: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, signOptions);

  res.json({
    token,
    user: publicUser(user),
  });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
