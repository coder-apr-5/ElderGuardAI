// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Rate Limiter Middleware
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

/**
 * General API rate limiter
 */
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per windowMs
    message: {
        success: false,
        error: 'Too many requests. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict limiter for auth endpoints
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 requests per windowMs
    message: {
        success: false,
        error: 'Too many authentication attempts. Please try again later.',
        code: 'AUTH_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Very strict limiter for OTP endpoints
 */
export const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 OTP requests per hour
    message: {
        success: false,
        error: 'Too many OTP requests. Please try again after an hour.',
        code: 'OTP_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        // Rate limit by phone number if available, otherwise by IP
        const phone = req.body?.phone || req.body?.phoneNumber;
        return phone || req.ip || 'unknown';
    },
});

/**
 * Signup rate limiter
 */
export const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 signup attempts per hour
    message: {
        success: false,
        error: 'Too many signup attempts. Please try again later.',
        code: 'SIGNUP_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Login rate limiter
 */
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 login attempts per 15 minutes
    message: {
        success: false,
        error: 'Too many login attempts. Please try again later.',
        code: 'LOGIN_RATE_LIMIT_EXCEEDED',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
        // Rate limit by email/phone if available
        const identifier = req.body?.email || req.body?.phone || req.body?.phoneNumber;
        return identifier || req.ip || 'unknown';
    },
});

export default {
    generalLimiter,
    authLimiter,
    otpLimiter,
    signupLimiter,
    loginLimiter,
};
