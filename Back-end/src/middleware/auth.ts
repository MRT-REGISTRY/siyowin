import jwt from 'jsonwebtoken';
import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env.js';
import { publicUser } from '../data/store.js';
import { UserRole } from '../types.js';

type JwtPayload = {
  sub: string;
  role: UserRole;
  name: string;
  teacherId: string | null;
  studentId: string | null;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : null;

  if (!token) {
    res.status(401).json({ message: 'Authentication token is required.' });
    return;
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as JwtPayload;

    // Hydrate req.user entirely from JWT claims — no DB round-trip needed.
    req.user = {
      id: payload.sub,
      name: payload.name,
      username: '',          // not needed after login; claims carry what routes need
      email: '',             // same — stored in JWT but not needed on every request
      role: payload.role,
      teacherId: payload.teacherId ?? undefined,
      studentId: payload.studentId ?? undefined,
      isActive: true,
    };

    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

export const requireRoles =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: 'You do not have permission to access this resource.' });
      return;
    }

    next();
  };
