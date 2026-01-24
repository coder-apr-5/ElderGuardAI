// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Chat Service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AI-powered conversation service for elderly care

import type { ChatMessage, ConversationContext, MoodAnalysis } from '../types';
import { getGroqClient, ELDERLY_CARE_SYSTEM_PROMPT, GROQ_CONFIG } from '../config/groq';
import { getGeminiModel, GEMINI_SYSTEM_PROMPT } from '../config/gemini';
import { config } from '../config/env';
import { logger, logAICall } from '../utils/logger';
import { getFallbackResponse } from '../utils/responses';
import { analyzeSentiment } from './sentiment.service';
import { detectMood } from './mood.service';

/**
 * In-memory conversation context storage
 * In production, this should be replaced with Redis or a database
 */
const conversationContexts = new Map<string, ConversationContext>();

/**
 * Get or create conversation context for a user
 */
export function getConversationContext(userId: string): ConversationContext {
    let context = conversationContexts.get(userId);

    if (!context) {
        context = {
            userId,
            messages: [],
            moodHistory: [],
            conversationStarted: new Date(),
            lastActivity: new Date(),
        };
        conversationContexts.set(userId, context);
    }

    // Check if context has expired
    const expiryTime = config.contextExpiryHours * 60 * 60 * 1000;
    const timeSinceLastActivity = Date.now() - context.lastActivity.getTime();

    if (timeSinceLastActivity > expiryTime) {
        // Reset context if expired
        context = {
            userId,
            messages: [],
            moodHistory: [],
            conversationStarted: new Date(),
            lastActivity: new Date(),
        };
        conversationContexts.set(userId, context);
        logger.debug('Conversation context expired and reset', { userId });
    }

    return context;
}

/**
 * Save a message to conversation context
 */
export function saveMessage(userId: string, message: ChatMessage): void {
    const context = getConversationContext(userId);

    context.messages.push({
        ...message,
        timestamp: message.timestamp || new Date(),
    });

    // Keep only last N messages
    if (context.messages.length > config.maxContextMessages) {
        context.messages = context.messages.slice(-config.maxContextMessages);
    }

    context.lastActivity = new Date();
    conversationContexts.set(userId, context);
}

/**
 * Save mood analysis to context
 */
export function saveMoodAnalysis(userId: string, mood: MoodAnalysis): void {
    const context = getConversationContext(userId);

    context.moodHistory.push(mood);
    context.lastAnalysis = mood;

    // Keep only last 50 mood analyses
    if (context.moodHistory.length > 50) {
        context.moodHistory = context.moodHistory.slice(-50);
    }

    conversationContexts.set(userId, context);
}

/**
 * Clear conversation context for a user
 */
export function clearContext(userId: string): void {
    conversationContexts.delete(userId);
    logger.debug('Conversation context cleared', { userId });
}

/**
 * Get all contexts (for risk analysis)
 */
export function getContextsForUser(userId: string): ConversationContext[] {
    const context = conversationContexts.get(userId);
    return context ? [context] : [];
}

/**
 * Prepare conversation history for Groq (same format as OpenAI)
 */
function prepareGroqHistory(
    history: ChatMessage[],
    currentMessage: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: ELDERLY_CARE_SYSTEM_PROMPT },
    ];

    // Add last 6 messages for context
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
                role: msg.role,
                content: msg.content,
            });
        }
    }

    // Add current message
    messages.push({
        role: 'user',
        content: currentMessage,
    });

    return messages;
}

/**
 * Prepare conversation history for Gemini
 */
function prepareGeminiHistory(
    history: ChatMessage[],
    currentMessage: string
): string {
    let prompt = GEMINI_SYSTEM_PROMPT + '\n\n';
    prompt += 'CONVERSATION HISTORY:\n';

    // Add last 6 messages for context
    const recentHistory = history.slice(-6);
    for (const msg of recentHistory) {
        if (msg.role === 'user') {
            prompt += `Elder: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
            prompt += `You: ${msg.content}\n`;
        }
    }

    prompt += `\nElder: ${currentMessage}\n`;
    prompt += '\nYour response (2-3 sentences max):';

    return prompt;
}

/**
 * Chat with Groq
 */
async function chatWithGroq(
    history: ChatMessage[],
    message: string
): Promise<string> {
    const client = getGroqClient();

    if (!client) {
        throw new Error('Groq client not available');
    }

    const startTime = Date.now();

    try {
        const response = await client.chat.completions.create({
            model: GROQ_CONFIG.model,
            messages: prepareGroqHistory(history, message),
            temperature: GROQ_CONFIG.temperature,
            max_tokens: GROQ_CONFIG.maxTokens,
        });

        const content = response.choices[0]?.message?.content;

        logAICall('groq', 'chat', true, Date.now() - startTime);

        if (!content) {
            throw new Error('Empty response from Groq');
        }

        return content.trim();
    } catch (error) {
        logAICall('groq', 'chat', false, Date.now() - startTime);
        throw error;
    }
}

/**
 * Chat with Gemini
 */
async function chatWithGemini(
    history: ChatMessage[],
    message: string
): Promise<string> {
    const model = getGeminiModel();

    if (!model) {
        throw new Error('Gemini model not available');
    }

    const startTime = Date.now();

    try {
        const prompt = prepareGeminiHistory(history, message);
        const result = await model.generateContent(prompt);
        const content = result.response.text();

        logAICall('gemini', 'chat', true, Date.now() - startTime);

        if (!content) {
            throw new Error('Empty response from Gemini');
        }

        return content.trim();
    } catch (error) {
        logAICall('gemini', 'chat', false, Date.now() - startTime);
        throw error;
    }
}

/**
 * Main chat function with fallback handling
 */
export async function chat(
    userId: string,
    message: string,
    history: ChatMessage[] = []
): Promise<{
    response: string;
    sentiment: ReturnType<typeof analyzeSentiment> extends Promise<infer T> ? T : never;
    mood: MoodAnalysis;
}> {
    // Get or merge with existing context
    const context = getConversationContext(userId);
    const mergedHistory = [...context.messages, ...history];

    // Save the user's message
    saveMessage(userId, { role: 'user', content: message });

    // Perform sentiment and mood analysis
    const sentiment = await analyzeSentiment(message);
    const mood = await detectMood(message, sentiment, context);

    // Save mood analysis
    saveMoodAnalysis(userId, mood);

    let aiResponse: string;

    try {
        // Try primary AI provider
        if (config.aiProvider === 'groq') {
            aiResponse = await chatWithGroq(mergedHistory, message);
        } else {
            aiResponse = await chatWithGemini(mergedHistory, message);
        }
    } catch (primaryError) {
        logger.warn('Primary AI provider failed, trying fallback', {
            provider: config.aiProvider,
            error: primaryError
        });

        // Try secondary provider
        try {
            if (config.aiProvider === 'groq' && config.geminiApiKey) {
                aiResponse = await chatWithGemini(mergedHistory, message);
            } else if (config.aiProvider === 'gemini' && config.groqApiKey) {
                aiResponse = await chatWithGroq(mergedHistory, message);
            } else {
                throw new Error('No fallback provider available');
            }
        } catch (fallbackError) {
            logger.error('All AI providers failed, using fallback response', {
                error: fallbackError
            });

            // Use static fallback response based on detected mood
            aiResponse = getFallbackResponse(mood.primary);
        }
    }

    // Save assistant response
    saveMessage(userId, { role: 'assistant', content: aiResponse });

    return {
        response: aiResponse,
        sentiment,
        mood,
    };
}

/**
 * Get conversation summary
 */
export function getConversationSummary(userId: string): {
    messageCount: number;
    moodAnalysisCount: number;
    lastMood?: MoodAnalysis;
    conversationDuration: number;
} {
    const context = conversationContexts.get(userId);

    if (!context) {
        return {
            messageCount: 0,
            moodAnalysisCount: 0,
            conversationDuration: 0,
        };
    }

    return {
        messageCount: context.messages.length,
        moodAnalysisCount: context.moodHistory.length,
        lastMood: context.lastAnalysis,
        conversationDuration: Date.now() - context.conversationStarted.getTime(),
    };
}

export default {
    chat,
    getConversationContext,
    saveMessage,
    saveMoodAnalysis,
    clearContext,
    getContextsForUser,
    getConversationSummary,
};
