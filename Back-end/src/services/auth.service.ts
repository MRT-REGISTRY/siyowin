import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import { repo } from '../data/repository.js';
import { publicUser } from '../data/store.js';

export const authService = {
  async login({ email, username, password, role }: { email?: string; username?: string; password?: string; role?: string }) {
    if (!password) {
      throw new Error('Password is required.');
    }

    if (role === 'student') {
      if (!username) {
        throw new Error('Username is required for students.');
      }
      if (email) {
        throw new Error('Invalid credentials.');
      }
    } else if (role) {
      if (!email) {
        throw new Error('Email is required for teachers and admins.');
      }
      if (username) {
        throw new Error('Invalid credentials.');
      }
    }

    let user;
    if (username) {
      user = await repo.findUserByUsername(username);
    } else if (email) {
      user = await repo.findUserByEmail(email);
    }

    // If role not provided by client, enforce identifier type based on the found user's role
    if (!role && user) {
      if (user.role === 'student' && email) {
        throw new Error('Invalid credentials.');
      }
      if (user.role !== 'student' && username) {
        throw new Error('Invalid credentials.');
      }
    }

    if (!user || user.isActive === false || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new Error('Invalid credentials.');
    }

    // Allow teacher login for both teachers and admins/super-admins
    const roleMatches = !role || role === 'student'
      ? user.role === role
      : role === 'teacher'
        ? user.role === 'teacher' || user.role === 'admin' || user.role === 'super-admin'
        : user.role === role;

    if (!roleMatches) {
      throw new Error(`This account is not registered as ${role}.`);
    }

    const signOptions: SignOptions = {
      expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
    };
    const token = jwt.sign({ sub: user.id, role: user.role }, env.jwtSecret, signOptions);

    return {
      token,
      user: publicUser(user),
    };
  }
};
