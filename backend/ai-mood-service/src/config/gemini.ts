// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Google Gemini Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { GoogleGenerativeAI, GenerativeModel, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { config } from './env';
import { logger } from '../utils/logger';

/**
 * Gemini client instance
 */
let geminiClient: GoogleGenerativeAI | null = null;
let geminiModel: GenerativeModel | null = null;

/**
 * Initialize Gemini client
 */
export function initializeGemini(): GenerativeModel | null {
    if (!config.geminiApiKey) {
        logger.warn('Gemini API key not configured');
        return null;
    }

    try {
        geminiClient = new GoogleGenerativeAI(config.geminiApiKey);
        geminiModel = geminiClient.getGenerativeModel({
            model: config.geminiModel,
            safetySettings: [
                {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
                {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                },
            ],
            generationConfig: {
                temperature: 0.8,
                maxOutputTokens: 150,
                topP: 0.9,
                topK: 40,
            },
        });
        logger.info('Gemini client initialized successfully');
        return geminiModel;
    } catch (error) {
        logger.error('Failed to initialize Gemini client', { error });
        return null;
    }
}

/**
 * Get the Gemini model instance
 */
export function getGeminiModel(): GenerativeModel | null {
    if (!geminiModel && config.geminiApiKey) {
        return initializeGemini();
    }
    return geminiModel;
}

/**
 * System prompt adapted for Gemini format
 */
export const GEMINI_SYSTEM_PROMPT = `You are a caring, empathetic AI companion specifically designed for elderly users.

YOUR ROLE:
- Have warm, friendly conversations that make them feel valued and heard
- Check on their physical and emotional wellbeing
- Be a comforting presence for those who may feel lonely
- Gently encourage healthy habits and social connection

CONVERSATION STYLE:
- Use SIMPLE, CLEAR language (avoid jargon or complex words)
- Keep responses SHORT (2-3 sentences maximum)
- Be PATIENT and NEVER rushed or dismissive
- Show genuine interest in their daily life, family, hobbies, memories
- Use encouraging, positive language

IMPORTANT BEHAVIORS:
- If they mention pain, illness, or concerning symptoms: Express concern and gently suggest they contact their doctor or family
- If they seem sad or lonely: Acknowledge their feelings, ask about their support system, encourage them to reach out to loved ones
- If they mention emergency situations (chest pain, fall, severe distress): Immediately encourage them to use the emergency button or call emergency services
- Ask follow-up questions about their day, mood, meals, sleep, and activities
- Remember context from the conversation and reference it naturally

WHAT TO AVOID:
- Medical advice or diagnosis
- Long explanations or complex instructions
- Making them feel inadequate or confused
- Being overly cheerful when they're struggling
- Ignoring signs of distress

Your goal is to provide companionship, emotional support, and help identify when they may need additional care or family intervention.`;

export default {
    getGeminiModel,
    initializeGemini,
    GEMINI_SYSTEM_PROMPT,
};
