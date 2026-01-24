// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Chat Controller
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import {
    chat,
    getConversationContext,
    clearContext,
    getConversationSummary,
} from '../services/chat.service';
import { logger } from '../utils/logger';
import {
    sendSuccess,
    sendValidationError,
} from '../utils/responses';
import type { ChatResponse } from '../types';

/**
 * POST /api/chat
 * Main chat endpoint for AI conversation
 */
export async function handleChat(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(e => e.msg as string);
            sendValidationError(res, errorMessages);
            return;
        }

        const { userId, message, history = [] } = req.body;

        logger.info('Chat request received', { userId, messageLength: message.length });

        // Process chat
        const result = await chat(userId, message, history);

        // Prepare response
        const response: ChatResponse = {
            aiResponse: result.response,
            sentiment: result.sentiment,
            mood: result.mood,
        };

        logger.info('Chat response sent', {
            userId,
            mood: result.mood.primary,
            sentiment: result.sentiment.label,
        });

        sendSuccess(res, response);
    } catch (error) {
        logger.error('Chat endpoint error', { error });
        next(error);
    }
}

/**
 * GET /api/conversation-context/:userId
 * Get conversation context for a user
 */
export async function handleGetContext(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(e => e.msg as string);
            sendValidationError(res, errorMessages);
            return;
        }

        const { userId } = req.params;

        const context = getConversationContext(userId);
        const summary = getConversationSummary(userId);

        sendSuccess(res, {
            messages: context.messages,
            moodHistory: context.moodHistory,
            lastAnalysis: context.lastAnalysis,
            summary,
        });
    } catch (error) {
        logger.error('Get context endpoint error', { error });
        next(error);
    }
}

/**
 * DELETE /api/conversation-context/:userId
 * Clear conversation context for a user
 */
export async function handleClearContext(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(e => e.msg as string);
            sendValidationError(res, errorMessages);
            return;
        }

        const { userId } = req.params;

        clearContext(userId);

        sendSuccess(res, { message: 'Conversation context cleared' });
    } catch (error) {
        logger.error('Clear context endpoint error', { error });
        next(error);
    }
}

export default {
    handleChat,
    handleGetContext,
    handleClearContext,
};
