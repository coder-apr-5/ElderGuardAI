// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Analysis Controller
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import type { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { analyzeSentiment } from '../services/sentiment.service';
import { detectMood } from '../services/mood.service';
import { analyzePatterns } from '../services/pattern.service';
import { calculateRisk, quickRiskCheck } from '../services/risk.service';
import { getConversationContext, getContextsForUser } from '../services/chat.service';
import { logger } from '../utils/logger';
import {
    sendSuccess,
    sendValidationError,
} from '../utils/responses';
import type {
    SentimentResult,
} from '../types';

/**
 * POST /api/analyze-sentiment
 * Analyze sentiment of text
 */
export async function handleAnalyzeSentiment(
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

        const { text, useAI = false } = req.body;

        logger.info('Sentiment analysis request', { textLength: text.length, useAI });

        const result = await analyzeSentiment(text, useAI);

        logger.info('Sentiment analysis complete', {
            label: result.label,
            score: result.score.toFixed(2),
        });

        sendSuccess(res, result);
    } catch (error) {
        logger.error('Sentiment analysis error', { error });
        next(error);
    }
}

/**
 * POST /api/analyze-mood
 * Detect mood from text
 */
export async function handleAnalyzeMood(
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

        const { text, sentiment, userId } = req.body;

        logger.info('Mood analysis request', { textLength: text.length, userId });

        // Get or calculate sentiment
        let sentimentResult: SentimentResult;
        if (sentiment) {
            sentimentResult = sentiment;
        } else {
            sentimentResult = await analyzeSentiment(text);
        }

        // Get context if userId provided
        const context = userId ? getConversationContext(userId) : undefined;

        // Detect mood
        const mood = await detectMood(text, sentimentResult, context);

        logger.info('Mood analysis complete', {
            primary: mood.primary,
            confidence: mood.confidence.toFixed(2),
        });

        sendSuccess(res, mood);
    } catch (error) {
        logger.error('Mood analysis error', { error });
        next(error);
    }
}

/**
 * POST /api/calculate-risk
 * Calculate risk score for a user
 */
export async function handleCalculateRisk(
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

        const { userId, timeWindowDays = 7 } = req.body;

        logger.info('Risk calculation request', { userId, timeWindowDays });

        // Get conversation contexts for user
        const conversations = getContextsForUser(userId);

        if (conversations.length === 0) {
            sendSuccess(res, {
                riskLevel: 'safe',
                riskScore: 0,
                factors: ['No conversation history available'],
                recommendations: ['Start conversations to enable risk assessment'],
                timestamp: new Date(),
            });
            return;
        }

        // Analyze patterns
        const patterns = await analyzePatterns(userId, conversations, timeWindowDays);

        // Calculate risk
        const riskAssessment = await calculateRisk(userId, conversations, patterns);

        logger.info('Risk calculation complete', {
            userId,
            riskLevel: riskAssessment.riskLevel,
            riskScore: riskAssessment.riskScore.toFixed(2),
        });

        sendSuccess(res, riskAssessment);
    } catch (error) {
        logger.error('Risk calculation error', { error });
        next(error);
    }
}

/**
 * POST /api/analyze-patterns
 * Analyze behavioral patterns for a user
 */
export async function handleAnalyzePatterns(
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

        const { userId, timeWindowDays = 7 } = req.body;

        logger.info('Pattern analysis request', { userId, timeWindowDays });

        // Get conversation contexts for user
        const conversations = getContextsForUser(userId);

        if (conversations.length === 0) {
            sendSuccess(res, {
                repeatedComplaints: [],
                concerningKeywords: [],
                isolationIndicators: false,
                healthMentions: [],
                negativePatternCount: 0,
                withdrawalDetected: false,
                socialMentions: 0,
                message: 'No conversation history available',
            });
            return;
        }

        // Analyze patterns
        const patterns = await analyzePatterns(userId, conversations, timeWindowDays);

        logger.info('Pattern analysis complete', {
            userId,
            negativePatternCount: patterns.negativePatternCount,
        });

        sendSuccess(res, patterns);
    } catch (error) {
        logger.error('Pattern analysis error', { error });
        next(error);
    }
}

/**
 * POST /api/quick-risk-check
 * Quick risk assessment based on single mood analysis
 */
export async function handleQuickRiskCheck(
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

        const { text, sentiment, userId } = req.body;

        // Get or calculate sentiment
        let sentimentResult: SentimentResult;
        if (sentiment) {
            sentimentResult = sentiment;
        } else {
            sentimentResult = await analyzeSentiment(text);
        }

        // Get context if userId provided
        const context = userId ? getConversationContext(userId) : undefined;

        // Detect mood
        const mood = await detectMood(text, sentimentResult, context);

        // Quick risk check
        const quickCheck = quickRiskCheck(mood);

        sendSuccess(res, {
            mood,
            ...quickCheck,
        });
    } catch (error) {
        logger.error('Quick risk check error', { error });
        next(error);
    }
}

export default {
    handleAnalyzeSentiment,
    handleAnalyzeMood,
    handleCalculateRisk,
    handleAnalyzePatterns,
    handleQuickRiskCheck,
};
