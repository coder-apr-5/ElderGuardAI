// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Request Validation Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { body, param, ValidationChain } from 'express-validator';

/**
 * Validation rules for chat endpoint
 */
export const chatValidation: ValidationChain[] = [
    body('userId')
        .notEmpty()
        .withMessage('User ID is required')
        .isString()
        .withMessage('User ID must be a string')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('User ID must be between 1 and 100 characters'),

    body('message')
        .notEmpty()
        .withMessage('Message is required')
        .isString()
        .withMessage('Message must be a string')
        .trim()
        .isLength({ min: 1, max: 1000 })
        .withMessage('Message must be between 1 and 1000 characters'),

    body('history')
        .optional()
        .isArray({ max: 50 })
        .withMessage('History must be an array with maximum 50 messages'),

    body('history.*.role')
        .optional()
        .isIn(['user', 'assistant', 'system'])
        .withMessage('Invalid message role'),

    body('history.*.content')
        .optional()
        .isString()
        .withMessage('Message content must be a string'),
];

/**
 * Validation rules for sentiment analysis endpoint
 */
export const sentimentValidation: ValidationChain[] = [
    body('text')
        .notEmpty()
        .withMessage('Text is required')
        .isString()
        .withMessage('Text must be a string')
        .trim()
        .isLength({ min: 1, max: 5000 })
        .withMessage('Text must be between 1 and 5000 characters'),

    body('useAI')
        .optional()
        .isBoolean()
        .withMessage('useAI must be a boolean'),
];

/**
 * Validation rules for mood analysis endpoint
 */
export const moodValidation: ValidationChain[] = [
    body('text')
        .notEmpty()
        .withMessage('Text is required')
        .isString()
        .withMessage('Text must be a string')
        .trim()
        .isLength({ min: 1, max: 5000 })
        .withMessage('Text must be between 1 and 5000 characters'),

    body('userId')
        .optional()
        .isString()
        .withMessage('User ID must be a string'),

    body('sentiment')
        .optional()
        .isObject()
        .withMessage('Sentiment must be an object'),
];

/**
 * Validation rules for risk calculation endpoint
 */
export const riskValidation: ValidationChain[] = [
    body('userId')
        .notEmpty()
        .withMessage('User ID is required')
        .isString()
        .withMessage('User ID must be a string')
        .trim(),

    body('timeWindowDays')
        .optional()
        .isInt({ min: 1, max: 90 })
        .withMessage('Time window must be between 1 and 90 days'),
];

/**
 * Validation rules for conversation context endpoint
 */
export const contextValidation: ValidationChain[] = [
    param('userId')
        .notEmpty()
        .withMessage('User ID is required')
        .isString()
        .withMessage('User ID must be a string')
        .trim(),
];

/**
 * Sanitize user input text
 */
export function sanitizeText(text: string): string {
    return text
        .trim()
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .slice(0, 5000); // Enforce max length
}

/**
 * Validate user ID format
 */
export function isValidUserId(userId: string): boolean {
    if (!userId || typeof userId !== 'string') return false;
    // Allow alphanumeric, dashes, underscores
    return /^[a-zA-Z0-9_-]{1,100}$/.test(userId);
}

/**
 * Validate chat message array
 */
export function isValidHistory(history: unknown): boolean {
    if (!Array.isArray(history)) return false;
    if (history.length > 50) return false;

    return history.every((msg) => {
        if (typeof msg !== 'object' || msg === null) return false;
        const { role, content } = msg as Record<string, unknown>;
        if (!['user', 'assistant', 'system'].includes(role as string)) return false;
        if (typeof content !== 'string') return false;
        return true;
    });
}

export default {
    chatValidation,
    sentimentValidation,
    moodValidation,
    riskValidation,
    contextValidation,
    sanitizeText,
    isValidUserId,
    isValidHistory,
};
