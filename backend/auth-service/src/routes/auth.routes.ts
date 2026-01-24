// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Auth Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { signupLimiter, loginLimiter, otpLimiter } from '../middleware/rateLimiter';
import {
    handleValidationErrors,
    elderSignupStep1Validators,
    elderSignupStep2Validators,
    elderSignupStep3Validators,
    elderSignupStep4Validators,
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
 * @route   POST /api/auth/elder/signup/step1
 * @desc    Initiate elder signup with phone number
 * @access  Public
 */
router.post(
    '/elder/signup/step1',
    signupLimiter,
    otpLimiter,
    elderSignupStep1Validators,
    handleValidationErrors,
    authController.elderSignupStep1
);

/**
 * @route   POST /api/auth/elder/signup/step2
 * @desc    Verify elder's phone with OTP
 * @access  Public
 */
router.post(
    '/elder/signup/step2',
    signupLimiter,
    elderSignupStep2Validators,
    handleValidationErrors,
    authController.elderSignupStep2
);

/**
 * @route   POST /api/auth/elder/signup/step3
 * @desc    Elder provides info and family member phone
 * @access  Public
 */
router.post(
    '/elder/signup/step3',
    signupLimiter,
    otpLimiter,
    elderSignupStep3Validators,
    handleValidationErrors,
    authController.elderSignupStep3
);

/**
 * @route   POST /api/auth/elder/signup/step4
 * @desc    Family verifies OTP, elder account created
 * @access  Public
 */
router.post(
    '/elder/signup/step4',
    signupLimiter,
    elderSignupStep4Validators,
    handleValidationErrors,
    authController.elderSignupStep4
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
