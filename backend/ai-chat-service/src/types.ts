// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Type Definitions for AI Chat Service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface ElderProfile {
    uid: string;
    fullName: string;
    preferredName?: string;
    age?: number;
    timezone?: string;
    language?: string;
    interests?: string[];
    healthConditions?: string[];
    familyMembers?: { name: string; relation: string }[];
    preferences?: {
        voiceEnabled?: boolean;
        fontSize?: 'normal' | 'large' | 'extra-large';
        reminderTone?: 'gentle' | 'friendly' | 'cheerful';
    };
}

export interface Routine {
    id: string;
    elderId: string;
    type: 'medication' | 'meal' | 'exercise' | 'appointment' | 'social' | 'custom';
    title: string;
    description?: string;
    time: string; // HH:MM format
    days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
    enabled: boolean;
    reminderMinutesBefore: number;
    importance: 'low' | 'medium' | 'high' | 'critical';
    lastCompleted?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ChatMessage {
    id: string;
    elderId: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: {
        mood?: 'happy' | 'neutral' | 'sad' | 'anxious' | 'lonely' | 'excited';
        routineRelated?: boolean;
        routineId?: string;
        sentiment?: number; // -1 to 1
        isProactive?: boolean;
    };
}

export interface ConversationContext {
    elderId: string;
    elderProfile: ElderProfile;
    recentMessages: ChatMessage[];
    currentMood?: string;
    lastInteractionTime?: Date;
    activeRoutines: Routine[];
    pendingReminders: Routine[];
}

export interface AIResponse {
    message: string;
    mood?: string;
    shouldFollowUp?: boolean;
    followUpDelay?: number; // minutes
    suggestedActions?: string[];
}

export interface RoutineReminder {
    routine: Routine;
    reminderMessage: string;
    sentAt: Date;
    acknowledged: boolean;
}

// Client to Server events
export type ClientToServerEvents = {
    'chat:message': { content: string; elderId: string };
    'chat:typing': { elderId: string };
    'routine:acknowledge': { routineId: string; elderId: string };
    'mood:update': { mood: string; elderId: string };
    'elder:join': { elderId: string; profile?: ElderProfile };
    'family:join': { elderId: string; familyId: string };
};

// Server to Client events
export type ServerToClientEvents = {
    'chat:response': ChatMessage;
    'chat:received': { messageId: string };
    'chat:history': ChatMessage[];
    'chat:typing': { isTyping: boolean };
    'routine:reminder': RoutineReminder;
    'routines:upcoming': Routine[];
    'companion:proactive': ChatMessage;
    'elder:mood-alert': { elderId: string; mood: string; message: string; timestamp: Date };
    'elder:typing': { elderId: string };
    'routine:completed': { elderId: string; routineId: string; completedAt: Date };
    'error': { message: string; code: string };
};

