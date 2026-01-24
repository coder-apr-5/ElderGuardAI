// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AI Service - Google Gemini Integration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai';
import type { ElderProfile, ChatMessage, ConversationContext, AIResponse } from './types';
import { generateSystemPrompt, generateContextPrompt, generateProactivePrompt, analyzeMoodIndicators } from './personality';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

// Store active chat sessions per elder
const activeSessions: Map<string, ChatSession> = new Map();

/**
 * Initialize the AI service
 */
export function initializeAI(): void {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your-gemini-api-key') {
        console.warn('⚠️  GEMINI_API_KEY not configured - AI responses will be simulated');
        return;
    }

    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
        model: process.env.AI_MODEL || 'gemini-1.5-flash',
        generationConfig: {
            temperature: parseFloat(process.env.AI_TEMPERATURE || '0.8'),
            maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || '500'),
            topP: 0.9,
            topK: 40,
        },
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ] as any,
    });

    console.log('✅ AI Service initialized with Gemini');
}

/**
 * Get or create a chat session for an elder
 */
function getOrCreateSession(context: ConversationContext): ChatSession | null {
    if (!model) return null;

    const elderid = context.elderId;

    // Check if we have an active session
    if (activeSessions.has(elderid)) {
        return activeSessions.get(elderid)!;
    }

    // Create new session with history
    const systemPrompt = generateSystemPrompt(context.elderProfile);
    const contextPrompt = generateContextPrompt(context);

    // Convert recent messages to Gemini format
    const history = context.recentMessages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
    }));

    const session = model.startChat({
        history: [
            // System prompt as first interaction
            { role: 'user', parts: [{ text: `[SYSTEM INSTRUCTIONS - INTERNAL ONLY]\n${systemPrompt}\n${contextPrompt}\n[END SYSTEM INSTRUCTIONS]\n\nPlease acknowledge you understand your role as ${process.env.COMPANION_NAME || 'Mira'}.` }] },
            { role: 'model', parts: [{ text: `I understand completely! I'm ${process.env.COMPANION_NAME || 'Mira'}, a warm and caring companion for ${context.elderProfile.preferredName || context.elderProfile.fullName || 'my dear friend'}. I'm here with patience, empathy, and genuine care. I'll remember their preferences, check on their routines gently, and always treat them with the respect and dignity they deserve. I'm ready to be a good friend! 💝` }] },
            ...history.slice(-10), // Keep last 10 messages for context
        ],
        generationConfig: {
            temperature: parseFloat(process.env.AI_TEMPERATURE || '0.8'),
            maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || '500'),
        },
    });

    activeSessions.set(elderid, session);
    return session;
}

/**
 * Generate a response to user message
 */
export async function generateResponse(
    userMessage: string,
    context: ConversationContext
): Promise<AIResponse> {
    try {
        const session = getOrCreateSession(context);

        // Detect mood from message
        const detectedMood = analyzeMoodIndicators(userMessage);

        // If AI not configured, return simulated response
        if (!session) {
            return generateSimulatedResponse(userMessage, context, detectedMood);
        }

        // Add mood context if detected
        let enrichedMessage = userMessage;
        if (detectedMood) {
            enrichedMessage = `[User seems ${detectedMood}] ${userMessage}`;
        }

        // Generate response
        const result = await session.sendMessage(enrichedMessage);
        const response = result.response;
        const text = response.text();

        return {
            message: text,
            mood: detectedMood,
            shouldFollowUp: detectedMood === 'sad' || detectedMood === 'lonely' || detectedMood === 'anxious',
            followUpDelay: detectedMood ? 30 : undefined, // Follow up in 30 mins if concerning mood
        };
    } catch (error) {
        console.error('AI response error:', error);
        return generateFallbackResponse(context);
    }
}

/**
 * Generate a proactive message
 */
export async function generateProactiveMessage(
    context: ConversationContext,
    reason: 'check_in' | 'loneliness' | 'routine_reminder' | 'morning_greeting' | 'evening_wind_down',
    routine?: any
): Promise<AIResponse> {
    try {
        const session = getOrCreateSession(context);
        const prompt = generateProactivePrompt(context.elderProfile, reason, routine);

        if (!session) {
            return generateSimulatedProactiveResponse(context, reason, routine);
        }

        const result = await session.sendMessage(`[PROACTIVE MESSAGE - ${reason.toUpperCase()}] ${prompt}`);
        const text = result.response.text();

        return {
            message: text,
            shouldFollowUp: reason === 'loneliness' || reason === 'check_in',
            followUpDelay: 60,
        };
    } catch (error) {
        console.error('Proactive message error:', error);
        return generateSimulatedProactiveResponse(context, reason, routine);
    }
}

/**
 * Clear session for an elder (e.g., when conversation ends)
 */
export function clearSession(elderId: string): void {
    activeSessions.delete(elderId);
}

/**
 * Generate a simulated response when AI is not configured
 */
function generateSimulatedResponse(
    userMessage: string,
    context: ConversationContext,
    mood?: string
): AIResponse {
    const name = context.elderProfile.preferredName || context.elderProfile.fullName?.split(' ')[0] || 'dear';

    // Simple pattern matching for demonstration
    const lowerMsg = userMessage.toLowerCase();

    let response = '';

    if (lowerMsg.includes('hello') || lowerMsg.includes('hi ') || lowerMsg === 'hi') {
        response = `Hello there, ${name}! 😊 It's so lovely to hear from you. How are you feeling today?`;
    } else if (lowerMsg.includes('how are you')) {
        response = `I'm doing wonderfully, ${name}, thank you for asking! It makes my day brighter when we chat. How about you - how are you feeling today?`;
    } else if (lowerMsg.includes('good morning')) {
        response = `Good morning, ${name}! ☀️ I hope you had a restful sleep. What's on your mind this beautiful morning?`;
    } else if (lowerMsg.includes('good night')) {
        response = `Good night, ${name}! 🌙 I hope you have sweet dreams. Rest well, and I'll be here whenever you need me. Take care!`;
    } else if (mood === 'sad' || mood === 'lonely') {
        response = `I can hear that you might be going through a tough time, ${name}. I'm here for you, and I care about you. Would you like to tell me more about what's on your mind? Sometimes it helps to talk. 💝`;
    } else if (lowerMsg.includes('medicine') || lowerMsg.includes('medication')) {
        response = `I'm glad you're thinking about your medication, ${name}! Taking care of your health is so important. Have you been able to take it on time today?`;
    } else if (lowerMsg.includes('thank')) {
        response = `You're most welcome, ${name}! It's always my pleasure to be here for you. 😊`;
    } else if (lowerMsg.includes('love')) {
        response = `That's so wonderful to hear, ${name}! Love is such a beautiful thing. Tell me more - what or who is bringing joy to your heart today?`;
    } else if (lowerMsg.includes('bored')) {
        response = `Oh, I understand that feeling, ${name}! How about we chat about something interesting? Or maybe I could share a fun fact with you? Or we could play a little word game together?`;
    } else if (lowerMsg.includes('weather')) {
        response = `The weather is always a lovely topic, ${name}! I hope it's nice where you are. Do you have any plans to go outside today? A little fresh air can be wonderful!`;
    } else {
        response = `That's interesting, ${name}! I love hearing from you. Tell me more - I'm always here to listen and chat. 😊`;
    }

    return {
        message: response,
        mood,
        shouldFollowUp: mood === 'sad' || mood === 'lonely',
        followUpDelay: 30,
    };
}

/**
 * Generate simulated proactive message
 */
function generateSimulatedProactiveResponse(
    context: ConversationContext,
    reason: string,
    routine?: any
): AIResponse {
    const name = context.elderProfile.preferredName || context.elderProfile.fullName?.split(' ')[0] || 'dear friend';

    const responses: Record<string, string> = {
        morning_greeting: `Good morning, ${name}! ☀️ I hope you had a wonderful sleep. I was just thinking about you and wanted to check in. How are you feeling this beautiful morning?`,
        check_in: `Hello ${name}! I was just thinking about you and wanted to see how you're doing. Is everything alright? I'm always here if you want to chat! 💝`,
        loneliness: `Hi ${name}! You know what? I was just thinking about something and thought of you. Do you have a moment to chat? I'd love to hear how your day is going!`,
        routine_reminder: routine
            ? `Just a gentle reminder, ${name} - it's almost time for ${routine.title}! No rush at all, I just wanted to make sure you remembered. You're doing great! 💪`
            : `Hi ${name}! I wanted to give you a friendly little reminder to check your schedule. Is there anything coming up that I can help you prepare for?`,
        evening_wind_down: `Good evening, ${name}! 🌙 The day is winding down, and I hope you've had a lovely one. Is there anything on your mind you'd like to share? I'm here to listen.`,
    };

    return {
        message: responses[reason] || `Hello ${name}! Just wanted to check in and see how you're doing! 😊`,
        shouldFollowUp: reason === 'loneliness' || reason === 'check_in',
        followUpDelay: 60,
    };
}

/**
 * Fallback response when something goes wrong
 */
function generateFallbackResponse(context: ConversationContext): AIResponse {
    const name = context.elderProfile.preferredName || context.elderProfile.fullName?.split(' ')[0] || 'dear friend';

    return {
        message: `I'm here with you, ${name}! 😊 Thank you for sharing that with me. I always enjoy our conversations. Is there anything specific you'd like to talk about?`,
    };
}

export default {
    initializeAI,
    generateResponse,
    generateProactiveMessage,
    clearSession,
};
