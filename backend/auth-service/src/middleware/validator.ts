// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Request Validators
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { body, ValidationChain, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';

/**
 * Handle validation errors
 */
export function handleValidationErrors(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(e => e.msg);
        res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: errorMessages,
            code: 'VALIDATION_ERROR',
        });
        return;
    }

    next();
}

/**
 * Phone number validation
 */
export const validatePhone: ValidationChain[] = [
    body('phone')
        .trim()
        .notEmpty()
        .withMessage('Phone number is required')
        .isLength({ min: 6, max: 20 })
        .withMessage('Phone number must be between 6 and 20 characters'),
    body('countryCode')
        .trim()
        .notEmpty()
        .withMessage('Country code is required')
        .isLength({ min: 2, max: 2 })
        .withMessage('Country code must be 2 characters')
        .isAlpha()
        .withMessage('Country code must contain only letters')
        .toUpperCase(),
];

/**
 * OTP validation
 */
export const validateOTP: ValidationChain[] = [
    body('otp')
        .trim()
        .notEmpty()
        .withMessage('OTP is required')
        .isLength({ min: 6, max: 6 })
        .withMessage('OTP must be 6 digits')
        .isNumeric()
        .withMessage('OTP must contain only numbers'),
];

/**
 * Email validation
 */
export const validateEmail: ValidationChain[] = [
    body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Invalid email format')
        .normalizeEmail()
        .isLength({ max: 254 })
        .withMessage('Email is too long'),
];

/**
 * Password validation
 */
export const validatePassword: ValidationChain[] = [
    body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters')
        .isLength({ max: 128 })
        .withMessage('Password is too long')
        .matches(/[a-z]/)
        .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
        .withMessage('Password must contain at least one uppercase letter')
        .matches(/[0-9]/)
        .withMessage('Password must contain at least one number'),
];

/**
 * Name validation
 */
export const validateName: ValidationChain[] = [
    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Full name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .matches(/^[a-zA-Z\s\-'\.]+$/)
        .withMessage('Name contains invalid characters'),
];

/**
 * Age validation
 */
export const validateAge: ValidationChain[] = [
    body('age')
        .notEmpty()
        .withMessage('Age is required')
        .isInt({ min: 1, max: 120 })
        .withMessage('Age must be between 1 and 120'),
];

/**
 * Family relation validation
 */
export const validateFamilyRelation: ValidationChain[] = [
    body('familyRelation')
        .trim()
        .notEmpty()
        .withMessage('Family relation is required')
        .isIn(['son', 'daughter', 'spouse', 'caregiver', 'sibling', 'grandchild', 'other'])
        .withMessage('Invalid family relation'),
];

/**
 * Role validation
 */
export const validateRole: ValidationChain[] = [
    body('role')
        .trim()
        .notEmpty()
        .withMessage('Role is required')
        .isIn(['elder', 'family'])
        .withMessage('Role must be either "elder" or "family"'),
];

/**
 * Pending connection ID validation
 */
export const validatePendingId: ValidationChain[] = [
    body('pendingConnectionId')
        .trim()
        .notEmpty()
        .withMessage('Connection ID is required')
        .isUUID()
        .withMessage('Invalid connection ID'),
];

/**
 * Google ID token validation
 */
export const validateGoogleToken: ValidationChain[] = [
    body('idToken')
        .trim()
        .notEmpty()
        .withMessage('Google ID token is required')
        .isLength({ min: 100 })
        .withMessage('Invalid Google ID token'),
];

/**
 * Refresh token validation
 */
export const validateRefreshToken: ValidationChain[] = [
    body('refreshToken')
        .trim()
        .notEmpty()
        .withMessage('Refresh token is required'),
];

// Combined validators for different endpoints
export const elderSignupStep1Validators = [...validatePhone];
export const elderSignupStep2Validators = [...validatePhone, ...validateOTP];
export const elderSignupStep3Validators = [
    ...validatePhone,
    ...validateName,
    ...validateAge,
    body('familyPhone').trim().notEmpty().withMessage('Family phone is required'),
    body('familyCountryCode').trim().notEmpty().withMessage('Family country code is required').toUpperCase(),
    ...validateFamilyRelation,
];
export const elderSignupStep4Validators = [...validatePendingId, ...validateOTP];
export const familySignupValidators = [...validateEmail, ...validatePassword, ...validateName];
export const phoneLoginValidators = [...validatePhone];
export const phoneLoginVerifyValidators = [...validatePhone, ...validateOTP];
export const emailLoginValidators = [...validateEmail, body('password').notEmpty().withMessage('Password is required')];
export const googleAuthValidators = [...validateGoogleToken, ...validateRole];
export const refreshTokenValidators = [...validateRefreshToken];

export default {
    handleValidationErrors,
    validatePhone,
    validateOTP,
    validateEmail,
    validatePassword,
    validateName,
    validateAge,
    validateFamilyRelation,
    validateRole,
    validatePendingId,
    validateGoogleToken,
    validateRefreshToken,
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
};
