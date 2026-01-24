/**
 * ElderNest AI - Authentication Middleware
 * Firebase token verification and role-based access control.
 */

import { Response, NextFunction } from 'express';
import { auth, collections } from '../config/firebase';
import { AuthenticatedRequest, UserRole, DecodedUser } from '../types';
import { sendUnauthorized, sendForbidden } from '../utils/responses';
import { logger } from '../utils/logger';

const extractToken = (authHeader?: string): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req.headers.authorization);

    if (!token) {
      sendUnauthorized(res, 'No authentication token provided');
      return;
    }

    const decodedToken = await auth.verifyIdToken(token);

    let role: UserRole = 'elder';
    try {
      const userDoc = await collections.users.doc(decodedToken.uid).get();
      if (userDoc.exists) {
        role = userDoc.data()?.role || 'elder';
      }
    } catch (firestoreError) {
      logger.warn('Could not fetch user role:', firestoreError);
    }

    const decodedUser: DecodedUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role,
      emailVerified: decodedToken.email_verified,
    };

    req.user = decodedUser;
    logger.debug(`Authenticated user: ${decodedUser.uid} (${decodedUser.role})`);
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        sendUnauthorized(res, 'Token expired. Please log in again.');
        return;
      }
    }
    sendUnauthorized(res, 'Invalid authentication token');
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req.headers.authorization);
    if (token) {
      const decodedToken = await auth.verifyIdToken(token);
      let role: UserRole = 'elder';
      try {
        const userDoc = await collections.users.doc(decodedToken.uid).get();
        if (userDoc.exists) role = userDoc.data()?.role || 'elder';
      } catch { /* ignore */ }
      req.user = { uid: decodedToken.uid, email: decodedToken.email, role };
    }
    next();
  } catch {
    next();
  }
};

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'Authentication required');
      return;
    }
    if (!req.user.role || !allowedRoles.includes(req.user.role)) {
      sendForbidden(res, 'You do not have permission to access this resource');
      return;
    }
    next();
  };
};

export const requireElder = requireRole('elder');
export const requireFamily = requireRole('family');
export const requireElderOrFamily = requireRole('elder', 'family');
export const requireAdmin = requireRole('admin');

export default authenticate;
