// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Auth Controller
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { Request, Response } from 'express';
import authService from '../services/auth.service';
import { logger } from '../utils/logger';

/**
 * Get request metadata
 */
function getMetadata(req: Request) {
    return {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
    };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Elder Signup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Elder signup step 1 - Initiate with phone
 * POST /api/auth/elder/signup/step1
 */
export async function elderSignupStep1(req: Request, res: Response): Promise<void> {
    try {
        const { phone, countryCode } = req.body;
        const result = await authService.elderSignupStep1(phone, countryCode, getMetadata(req));

        if (!result.success) {
            res.status(400).json(result);
            return;
        }

        res.json(result);
    } catch (error) {
        logger.error('Elder signup step 1 error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Elder signup step 2 - Verify phone OTP
 * POST /api/auth/elder/signup/step2
 */
export async function elderSignupStep2(req: Request, res: Response): Promise<void> {
    try {
        const { phone, countryCode, otp } = req.body;
        const result = await authService.elderSignupStep2(phone, countryCode, otp);

        if (!result.success) {
            res.status(400).json(result);
            return;
        }

        res.json(result);
    } catch (error) {
        logger.error('Elder signup step 2 error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Elder signup step 3 - Provide info and family phone
 * POST /api/auth/elder/signup/step3
 */
export async function elderSignupStep3(req: Request, res: Response): Promise<void> {
    try {
        const {
            phone,
            countryCode,
            fullName,
            age,
            familyPhone,
            familyCountryCode,
            familyRelation,
            verificationToken,
        } = req.body;

        const result = await authService.elderSignupStep3(
            phone,
            countryCode,
            fullName,
            parseInt(age, 10),
            familyPhone,
            familyCountryCode,
            familyRelation,
            verificationToken,
            getMetadata(req)
        );

        if (!result.success) {
            res.status(400).json(result);
            return;
        }

        res.json(result);
    } catch (error) {
        logger.error('Elder signup step 3 error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Elder signup step 4 - Family verifies, account created
 * POST /api/auth/elder/signup/step4
 */
export async function elderSignupStep4(req: Request, res: Response): Promise<void> {
    try {
        const { pendingConnectionId, otp } = req.body;
        const result = await authService.elderSignupStep4(pendingConnectionId, otp, getMetadata(req));

        if (!result.success) {
            res.status(400).json({ success: false, message: result.message });
            return;
        }

        res.json(result);
    } catch (error) {
        logger.error('Elder signup step 4 error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Family Signup
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Family signup with email/password
 * POST /api/auth/family/signup
 */
export async function familySignup(req: Request, res: Response): Promise<void> {
    try {
        const { email, password, fullName, phone, countryCode } = req.body;

        const result = await authService.familySignup(
            email,
            password,
            fullName,
            phone,
            countryCode,
            getMetadata(req)
        );

        if (!result.success) {
            res.status(400).json({ success: false, message: result.message });
            return;
        }

        res.status(201).json(result);
    } catch (error) {
        logger.error('Family signup error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Login
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Phone login step 1 - Send OTP
 * POST /api/auth/login/phone
 */
export async function phoneLoginStep1(req: Request, res: Response): Promise<void> {
    try {
        const { phone, countryCode } = req.body;
        const result = await authService.phoneLoginStep1(phone, countryCode, getMetadata(req));

        if (!result.success) {
            res.status(400).json(result);
            return;
        }

        res.json(result);
    } catch (error) {
        logger.error('Phone login step 1 error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Phone login step 2 - Verify OTP
 * POST /api/auth/login/phone/verify
 */
export async function phoneLoginStep2(req: Request, res: Response): Promise<void> {
    try {
        const { phone, countryCode, otp } = req.body;
        const result = await authService.phoneLoginStep2(phone, countryCode, otp, getMetadata(req));

        if (!result.success) {
            res.status(401).json({ success: false, message: result.message });
            return;
        }

        res.json(result);
    } catch (error) {
        logger.error('Phone login step 2 error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Email/password login
 * POST /api/auth/login/email
 */
export async function emailLogin(req: Request, res: Response): Promise<void> {
    try {
        const { email, password } = req.body;
        const result = await authService.emailLogin(email, password, getMetadata(req));

        if (!result.success) {
            res.status(401).json({ success: false, message: result.message });
            return;
        }

        res.json(result);
    } catch (error) {
        logger.error('Email login error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Google OAuth login
 * POST /api/auth/login/google
 */
export async function googleAuth(req: Request, res: Response): Promise<void> {
    try {
        const { idToken, role } = req.body;
        const result = await authService.googleAuth(idToken, role, getMetadata(req));

        if (!result.success) {
            res.status(401).json({ success: false, message: result.message });
            return;
        }

        res.json(result);
    } catch (error) {
        logger.error('Google auth error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Token Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Refresh access token
 * POST /api/auth/refresh
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
    try {
        const { refreshToken: token } = req.body;
        const result = await authService.refreshAccessToken(token);

        if (!result.success) {
            res.status(401).json(result);
            return;
        }

        res.json(result);
    } catch (error) {
        logger.error('Refresh token error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Logout
 * POST /api/auth/logout
 */
export async function logout(req: Request, res: Response): Promise<void> {
    try {
        const userId = req.user?.uid;
        const { refreshToken: token } = req.body;

        if (userId) {
            await authService.logout(userId, token);
        }

        res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        logger.error('Logout error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

/**
 * Get current user info
 * GET /api/auth/me
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: 'Not authenticated' });
            return;
        }

        res.json({
            success: true,
            user: req.user,
        });
    } catch (error) {
        logger.error('Get current user error', { error });
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
}

export default {
    elderSignupStep1,
    elderSignupStep2,
    elderSignupStep3,
    elderSignupStep4,
    familySignup,
    phoneLoginStep1,
    phoneLoginStep2,
    emailLogin,
    googleAuth,
    refreshToken,
    logout,
    getCurrentUser,
};
