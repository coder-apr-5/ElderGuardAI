// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// WebSocket Chat Handler
// Real-time chat connection management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, ElderProfile, ConversationContext } from './types';
import { generateResponse, clearSession } from './ai-service';
import { getUpcomingRoutines, getRoutinesForElder } from './routine-scheduler';

// Store conversation history per elder (in production, use database)
const conversationHistory: Map<string, ChatMessage[]> = new Map();

// Store online elders
const onlineElders: Map<string, { socket: Socket; profile: ElderProfile }> = new Map();

// Mock elder profile (in production, fetch from database)
const mockElderProfile: ElderProfile = {
    uid: 'elder-demo',
    fullName: 'Grandmother Mary',
    preferredName: 'Mary',
    age: 75,
    timezone: 'Asia/Kolkata',
    language: 'en',
    interests: ['gardening', 'cooking', 'reading', 'music'],
    healthConditions: ['mild hypertension'],
    familyMembers: [
        { name: 'Sarah', relation: 'daughter' },
        { name: 'Tom', relation: 'son' },
        { name: 'Emma', relation: 'granddaughter' },
    ],
    preferences: {
        voiceEnabled: false,
        fontSize: 'large',
        reminderTone: 'gentle',
    },
};

/**
 * Initialize WebSocket chat handler
 */
export function initializeChatHandler(io: SocketIOServer): void {
    io.on('connection', (socket: Socket) => {
        console.log(`🔌 Client connected: ${socket.id}`);

        let currentElderId: string | null = null;

        // Handle elder joining chat
        socket.on('elder:join', async (data: { elderId: string; profile?: ElderProfile }) => {
            const elderId = data.elderId || 'elder-demo';
            currentElderId = elderId;

            // Get profile (use provided or mock)
            const profile = data.profile || mockElderProfile;

            // Join elder's room
            socket.join(`elder:${elderId}`);
            onlineElders.set(elderId, { socket, profile });

            console.log(`👋 Elder joined: ${profile.preferredName || profile.fullName} (${elderId})`);

            // Get conversation history
            const history = conversationHistory.get(elderId) || [];

            // Send welcome message if new conversation
            if (history.length === 0) {
                const context = buildContext(elderId, profile);

                // Generate personalized welcome
                const welcomeResponse = await generateResponse('', {
                    ...context,
                    recentMessages: [{
                        id: 'init',
                        elderId,
                        role: 'system',
                        content: 'Elder has just started a new conversation. Greet them warmly and personally.',
                        timestamp: new Date(),
                    }],
                });

                const welcomeMessage: ChatMessage = {
                    id: uuidv4(),
                    elderId,
                    role: 'assistant',
                    content: welcomeResponse.message,
                    timestamp: new Date(),
                    metadata: { isProactive: true },
                };

                history.push(welcomeMessage);
                conversationHistory.set(elderId, history);

                socket.emit('chat:response', welcomeMessage);
            } else {
                // Send history to the client
                socket.emit('chat:history', history.slice(-20));
            }

            // Send any pending reminders
            const upcomingRoutines = getUpcomingRoutines(elderId, 30);
            if (upcomingRoutines.length > 0) {
                socket.emit('routines:upcoming', upcomingRoutines);
            }
        });

        // Handle incoming chat message
        socket.on('chat:message', async (data: { content: string; elderId?: string }) => {
            const elderId = data.elderId || currentElderId || 'elder-demo';
            const content = data.content?.trim();

            if (!content) return;

            console.log(`💬 Message from ${elderId}: ${content.substring(0, 50)}...`);

            // Get elder info
            const elderInfo = onlineElders.get(elderId) || { profile: mockElderProfile };

            // Create user message
            const userMessage: ChatMessage = {
                id: uuidv4(),
                elderId,
                role: 'user',
                content,
                timestamp: new Date(),
            };

            // Store in history
            const history = conversationHistory.get(elderId) || [];
            history.push(userMessage);

            // Keep history manageable
            if (history.length > 50) {
                history.splice(0, history.length - 50);
            }
            conversationHistory.set(elderId, history);

            // Acknowledge receipt
            socket.emit('chat:received', { messageId: userMessage.id });

            // Show typing indicator
            socket.emit('chat:typing', { isTyping: true });

            try {
                // Build context
                const context = buildContext(elderId, elderInfo.profile, history);

                // Generate AI response
                const aiResponse = await generateResponse(content, context);

                // Create assistant message
                const assistantMessage: ChatMessage = {
                    id: uuidv4(),
                    elderId,
                    role: 'assistant',
                    content: aiResponse.message,
                    timestamp: new Date(),
                    metadata: {
                        mood: aiResponse.mood as any,
                        sentiment: aiResponse.shouldFollowUp ? -0.5 : 0.5,
                    },
                };

                // Store in history
                history.push(assistantMessage);
                conversationHistory.set(elderId, history);

                // Stop typing indicator
                socket.emit('chat:typing', { isTyping: false });

                // Send response
                socket.emit('chat:response', assistantMessage);

                // Log mood if detected
                if (aiResponse.mood) {
                    console.log(`🎭 Mood detected for ${elderId}: ${aiResponse.mood}`);

                    // Notify family if concerning mood
                    if (['sad', 'lonely', 'anxious'].includes(aiResponse.mood)) {
                        io.to(`family:${elderId}`).emit('elder:mood-alert', {
                            elderId,
                            mood: aiResponse.mood,
                            message: content,
                            timestamp: new Date(),
                        });
                    }
                }

                // Schedule follow-up if needed
                if (aiResponse.shouldFollowUp && aiResponse.followUpDelay) {
                    scheduleFollowUp(io, elderId, elderInfo.profile, aiResponse.followUpDelay);
                }

            } catch (error) {
                console.error('Error generating response:', error);
                socket.emit('chat:typing', { isTyping: false });
                socket.emit('chat:response', {
                    id: uuidv4(),
                    elderId,
                    role: 'assistant',
                    content: `I'm here with you! Sometimes I need a moment to think. Could you say that again, please? 😊`,
                    timestamp: new Date(),
                });
            }
        });

        // Handle typing indicator from elder
        socket.on('chat:typing', (data: { elderId: string }) => {
            // Could notify family that elder is typing
            io.to(`family:${data.elderId}`).emit('elder:typing', { elderId: data.elderId });
        });

        // Handle routine acknowledgement
        socket.on('routine:acknowledge', async (data: { routineId: string; elderId?: string }) => {
            const elderId = data.elderId || currentElderId || 'elder-demo';
            const elderInfo = onlineElders.get(elderId) || { profile: mockElderProfile };

            console.log(`✅ Routine acknowledged: ${data.routineId} by ${elderId}`);

            // Generate encouraging response
            const context = buildContext(elderId, elderInfo.profile);
            const encouragement = await generateResponse(
                `[SYSTEM: Elder just completed a routine. Give brief positive reinforcement.]`,
                context
            );

            const message: ChatMessage = {
                id: uuidv4(),
                elderId,
                role: 'assistant',
                content: encouragement.message,
                timestamp: new Date(),
                metadata: { routineRelated: true, routineId: data.routineId },
            };

            socket.emit('chat:response', message);

            // Notify family of routine completion
            io.to(`family:${elderId}`).emit('routine:completed', {
                elderId,
                routineId: data.routineId,
                completedAt: new Date(),
            });
        });

        // Handle family member joining to monitor
        socket.on('family:join', (data: { elderId: string; familyId: string }) => {
            socket.join(`family:${data.elderId}`);
            console.log(`👨‍👩‍👧 Family member joined for elder: ${data.elderId}`);
        });

        // Handle disconnection
        socket.on('disconnect', () => {
            if (currentElderId) {
                onlineElders.delete(currentElderId);
                console.log(`👋 Elder disconnected: ${currentElderId}`);
            }
            console.log(`🔌 Client disconnected: ${socket.id}`);
        });
    });
}

/**
 * Build conversation context for AI
 */
function buildContext(
    elderId: string,
    profile: ElderProfile,
    history?: ChatMessage[]
): ConversationContext {
    const recentMessages = history || conversationHistory.get(elderId) || [];
    const activeRoutines = getRoutinesForElder(elderId);
    const pendingReminders = getUpcomingRoutines(elderId, 60);

    return {
        elderId,
        elderProfile: profile,
        recentMessages: recentMessages.slice(-10),
        activeRoutines,
        pendingReminders,
        lastInteractionTime: recentMessages.length > 0
            ? recentMessages[recentMessages.length - 1].timestamp
            : undefined,
    };
}

/**
 * Schedule a follow-up message
 */
function scheduleFollowUp(
    io: SocketIOServer,
    elderId: string,
    profile: ElderProfile,
    delayMinutes: number
): void {
    setTimeout(async () => {
        const context = buildContext(elderId, profile);

        // Check if elder has sent any messages since
        const history = conversationHistory.get(elderId) || [];
        const lastMessage = history[history.length - 1];

        if (lastMessage && Date.now() - new Date(lastMessage.timestamp).getTime() < delayMinutes * 60 * 1000) {
            // Elder has been active, no need for follow-up
            return;
        }

        const followUp = await generateResponse(
            '[SYSTEM: Check in on the elder, they seemed to be having a difficult time earlier. Be gentle and caring.]',
            context
        );

        const message: ChatMessage = {
            id: uuidv4(),
            elderId,
            role: 'assistant',
            content: followUp.message,
            timestamp: new Date(),
            metadata: { isProactive: true },
        };

        history.push(message);
        conversationHistory.set(elderId, history);

        io.to(`elder:${elderId}`).emit('companion:proactive', message);

    }, delayMinutes * 60 * 1000);
}

/**
 * Get elder profile (mock implementation)
 */
export async function getElderProfile(elderId: string): Promise<ElderProfile | null> {
    // In production, fetch from database
    if (elderId === 'elder-demo') {
        return mockElderProfile;
    }
    return mockElderProfile; // Return mock for any elder for now
}

/**
 * Get conversation history for an elder
 */
export function getConversationHistory(elderId: string): ChatMessage[] {
    return conversationHistory.get(elderId) || [];
}

/**
 * Clear conversation history
 */
export function clearConversationHistory(elderId: string): void {
    conversationHistory.delete(elderId);
    clearSession(elderId);
}

export default {
    initializeChatHandler,
    getElderProfile,
    getConversationHistory,
    clearConversationHistory,
};
