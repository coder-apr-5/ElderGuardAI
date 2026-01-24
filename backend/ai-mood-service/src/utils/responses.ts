// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// API Response Utilities
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { Response } from 'express';
import type { ApiResponse } from '../types';

/**
 * Error codes for consistent API responses
 */
export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
    RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
    UNAUTHORIZED = 'UNAUTHORIZED',
    BAD_REQUEST = 'BAD_REQUEST',
    CONTEXT_EXPIRED = 'CONTEXT_EXPIRED',
}

/**
 * Send a successful response
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
    const response: ApiResponse<T> = {
        success: true,
        data,
    };
    res.status(statusCode).json(response);
}

/**
 * Send an error response
 */
export function sendError(
    res: Response,
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode = 500
): void {
    const response: ApiResponse = {
        success: false,
        error: message,
        code,
        statusCode,
    };
    res.status(statusCode).json(response);
}

/**
 * Send validation error response
 */
export function sendValidationError(res: Response, errors: string[]): void {
    const response: ApiResponse = {
        success: false,
        error: errors.join(', '),
        code: ErrorCode.VALIDATION_ERROR,
        statusCode: 400,
    };
    res.status(400).json(response);
}

/**
 * Send not found response
 */
export function sendNotFound(res: Response, resource: string): void {
    sendError(res, `${resource} not found`, ErrorCode.NOT_FOUND, 404);
}

/**
 * Send AI service error response
 */
export function sendAIError(res: Response, message?: string): void {
    sendError(
        res,
        message || 'AI service is temporarily unavailable. Please try again later.',
        ErrorCode.AI_SERVICE_ERROR,
        503
    );
}

/**
 * Send rate limit error response
 */
export function sendRateLimitError(res: Response): void {
    sendError(
        res,
        'Too many requests. Please wait a moment before trying again.',
        ErrorCode.RATE_LIMIT_EXCEEDED,
        429
    );
}

/**
 * Fallback responses for AI failures
 */
export const FALLBACK_RESPONSES = {
    general: [
        "I'm here for you. Please tell me more about how you're feeling.",
        "I understand. Would you like to talk about what's on your mind?",
        "Thank you for sharing. How has your day been so far?",
        "I'm listening. What else would you like to share with me?",
        "That's interesting. Tell me more about that.",
    ],

    distress: [
        "I hear that you're going through a difficult time. It might help to talk to a family member or your doctor about this.",
        "I'm sorry you're feeling this way. Please remember you're not alone - consider reaching out to a loved one.",
        "What you're feeling is important. Would you like me to help you connect with someone who can support you?",
    ],

    lonely: [
        "I'm here to keep you company. Loneliness is hard, but you're not alone. Have you considered calling a friend or family member today?",
        "I understand that feeling. It can help to reach out to someone you care about. Is there anyone you'd like to talk to?",
    ],

    happy: [
        "That's wonderful to hear! What made your day so special?",
        "I'm so glad you're feeling good! Tell me more about what's making you happy.",
        "That sounds lovely! It's great to hear you're having a good time.",
    ],
};

/**
 * Get a random fallback response based on mood
 */
export function getFallbackResponse(mood?: string): string {
    let responses: string[];

    switch (mood) {
        case 'distressed':
            responses = FALLBACK_RESPONSES.distress;
            break;
        case 'lonely':
            responses = FALLBACK_RESPONSES.lonely;
            break;
        case 'happy':
            responses = FALLBACK_RESPONSES.happy;
            break;
        default:
            responses = FALLBACK_RESPONSES.general;
    }

    return responses[Math.floor(Math.random() * responses.length)];
}

export default {
    sendSuccess,
    sendError,
    sendValidationError,
    sendNotFound,
    sendAIError,
    sendRateLimitError,
    getFallbackResponse,
    ErrorCode,
    FALLBACK_RESPONSES,
};
