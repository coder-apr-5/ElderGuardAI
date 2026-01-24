// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Auth Middleware
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { getDb, Collections } from '../config/firebase';
import type { JWTPayload, UserRole } from '../types';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

/**
 * Authenticate request with JWT
 */
export async function authenticate(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: 'Authentication required',
            code: 'UNAUTHORIZED',
        });
        return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
        res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN',
        });
        return;
    }

    // Optionally verify user still exists and is active
    const db = getDb();
    const userDoc = await db.collection(Collections.USERS).doc(payload.uid).get();

    if (!userDoc.exists) {
        res.status(401).json({
            success: false,
            error: 'User not found',
            code: 'USER_NOT_FOUND',
        });
        return;
    }

    const userData = userDoc.data()!;

    if (userData.accountStatus === 'suspended') {
        res.status(403).json({
            success: false,
            error: 'Account is suspended',
            code: 'ACCOUNT_SUSPENDED',
        });
        return;
    }

    if (userData.accountStatus === 'locked') {
        res.status(403).json({
            success: false,
            error: 'Account is locked',
            code: 'ACCOUNT_LOCKED',
        });
        return;
    }

    req.user = payload;
    next();
}

/**
 * Authorize specific roles
 */
export function authorize(...allowedRoles: UserRole[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required',
                code: 'UNAUTHORIZED',
            });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Access denied',
                code: 'FORBIDDEN',
            });
            return;
        }

        next();
    };
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export function optionalAuth(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        next();
        return;
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (payload) {
        req.user = payload;
    }

    next();
}

export default {
    authenticate,
    authorize,
    optionalAuth,
};
