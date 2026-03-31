// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Auth Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { signupLimiter, loginLimiter, otpLimiter } from '../middleware/rateLimiter';
import {
    handleValidationErrors,
    initiateFamilyVerificationValidators,
    completeElderSignupValidators,
    familySignupValidators,
    phoneLoginValidators,
    phoneLoginVerifyValidators,
    emailLoginValidators,
    googleAuthValidators,
    refreshTokenValidators,
} from '../middleware/validator';

const router = Router();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Elder Signup Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   POST /api/auth/elder/initiate-family-verification
 * @desc    Initiate elder signup by requesting family verification
 * @access  Public
 */
router.post(
    '/elder/initiate-family-verification',
    signupLimiter,
    otpLimiter,
    initiateFamilyVerificationValidators,
    handleValidationErrors,
    authController.initiateFamilyVerification
);

/**
 * @route   POST /api/auth/elder/complete-signup
 * @desc    Complete elder signup after family verification
 * @access  Public
 */
router.post(
    '/elder/complete-signup',
    signupLimiter,
    completeElderSignupValidators,
    handleValidationErrors,
    authController.completeElderSignup
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Family Signup Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   POST /api/auth/family/signup
 * @desc    Family member signup with email/password
 * @access  Public
 */
router.post(
    '/family/signup',
    signupLimiter,
    familySignupValidators,
    handleValidationErrors,
    authController.familySignup
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Login Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   POST /api/auth/login/phone
 * @desc    Phone login - send OTP
 * @access  Public
 */
router.post(
    '/login/phone',
    loginLimiter,
    otpLimiter,
    phoneLoginValidators,
    handleValidationErrors,
    authController.phoneLoginStep1
);

/**
 * @route   POST /api/auth/login/phone/verify
 * @desc    Phone login - verify OTP
 * @access  Public
 */
router.post(
    '/login/phone/verify',
    loginLimiter,
    phoneLoginVerifyValidators,
    handleValidationErrors,
    authController.phoneLoginStep2
);

/**
 * @route   POST /api/auth/login/email
 * @desc    Email/password login
 * @access  Public
 */
router.post(
    '/login/email',
    loginLimiter,
    emailLoginValidators,
    handleValidationErrors,
    authController.emailLogin
);

/**
 * @route   POST /api/auth/login/google
 * @desc    Google OAuth login
 * @access  Public
 */
router.post(
    '/login/google',
    loginLimiter,
    googleAuthValidators,
    handleValidationErrors,
    authController.googleAuth
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Token Management Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
    '/refresh',
    refreshTokenValidators,
    handleValidationErrors,
    authController.refreshToken
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, authController.getCurrentUser);

export default router;
