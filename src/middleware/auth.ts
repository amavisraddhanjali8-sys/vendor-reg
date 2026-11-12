import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { verifySessionToken } from '../utils/auth-helpers.ts';

export interface AuthUser {
  userId?: number;
  uid: string;
  username?: string;
  email: string;
  role: 'admin' | 'officer' | 'viewer';
  displayName?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

// Middleware to authenticate either Firebase ID tokens or Session tokens
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // 1. Try parsing session token
  const sessionUser = verifySessionToken(token);
  if (sessionUser) {
    req.user = {
      userId: sessionUser.userId,
      uid: sessionUser.uid,
      username: sessionUser.username,
      email: sessionUser.email,
      role: (sessionUser.role as 'admin' | 'officer' | 'viewer') || 'admin',
    };
    return next();
  }

  // 2. Try verifying with Firebase Admin
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      displayName: decodedToken.name || '',
      role: 'admin', // Default authenticated Google users to admin
    };
    return next();
  } catch (error) {
    console.error('Error verifying Firebase/Session token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

// Admin-only middleware
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin privilege required' });
  }
  next();
};
