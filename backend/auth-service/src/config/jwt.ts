// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// JWT Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import jwt from 'jsonwebtoken';
import type { JWTPayload } from '../types';
import { logger } from '../utils/logger';

/**
 * JWT Configuration
 */
export const jwtConfig = {
    accessTokenSecret: process.env.JWT_SECRET || 'default-dev-secret-change-in-production',
    accessTokenExpiry: process.env.JWT_EXPIRES_IN || '24h',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'default-refresh-secret-change-in-production',
    refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    issuer: 'eldernest-auth',
    audience: 'eldernest-api',
};

/**
 * Generate access token
 */
export function generateAccessToken(payload: JWTPayload): string {
    return jwt.sign(payload as object, jwtConfig.accessTokenSecret, {
        expiresIn: jwtConfig.accessTokenExpiry,
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
    } as jwt.SignOptions);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
    const refreshPayload = { uid: payload.uid, type: 'refresh' };
    return jwt.sign(refreshPayload, jwtConfig.refreshTokenSecret, {
        expiresIn: jwtConfig.refreshTokenExpiry,
        issuer: jwtConfig.issuer,
    } as jwt.SignOptions);
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, jwtConfig.accessTokenSecret, {
            issuer: jwtConfig.issuer,
            audience: jwtConfig.audience,
        }) as JWTPayload;
        return decoded;
    } catch (error) {
        logger.debug('Access token verification failed', { error });
        return null;
    }
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): { uid: string } | null {
    try {
        const decoded = jwt.verify(token, jwtConfig.refreshTokenSecret, {
            issuer: jwtConfig.issuer,
        }) as { uid: string; type: string };

        if (decoded.type !== 'refresh') {
            return null;
        }

        return { uid: decoded.uid };
    } catch (error) {
        logger.debug('Refresh token verification failed', { error });
        return null;
    }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): JWTPayload | null {
    try {
        return jwt.decode(token) as JWTPayload;
    } catch {
        return null;
    }
}

/**
 * Get token expiry in seconds
 */
export function getTokenExpirySeconds(expiry: string): number {
    const match = expiry.match(/^(\d+)([hdm])$/);
    if (!match) return 86400; // Default 24 hours

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
        case 'h': return num * 3600;
        case 'd': return num * 86400;
        case 'm': return num * 60;
        default: return 86400;
    }
}

export default {
    jwtConfig,
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    decodeToken,
    getTokenExpirySeconds,
};
