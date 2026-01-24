// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ElderNest AI Mood Service - Type Definitions
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Chat message structure for conversation history
 */
export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
}

/**
 * Result of sentiment analysis on text
 */
export interface SentimentResult {
    score: number;        // -1 to 1 (negative to positive)
    comparative: number;  // Score relative to text length
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;   // 0 to 1
    tokens: string[];     // Words analyzed
}

/**
 * Mood categories for elderly care
 */
export type MoodCategory = 'happy' | 'sad' | 'anxious' | 'lonely' | 'neutral' | 'distressed';

/**
 * Complete mood analysis result
 */
export interface MoodAnalysis {
    primary: MoodCategory;      // Primary detected mood
    secondary?: MoodCategory;   // Secondary emotion if detected
    confidence: number;         // 0 to 1
    indicators: string[];       // Keywords/phrases that influenced detection
    sentiment: SentimentResult;
}

/**
 * Risk levels for elder wellbeing
 */
export type RiskLevel = 'safe' | 'monitor' | 'high';

/**
 * Complete risk assessment result
 */
export interface RiskAssessment {
    riskLevel: RiskLevel;
    riskScore: number;          // 0 to 1
    factors: string[];          // Contributing risk factors
    recommendations: string[];  // Suggested actions
    timestamp: Date;
}

/**
 * Conversation context for a user session
 */
export interface ConversationContext {
    userId: string;
    messages: ChatMessage[];
    moodHistory: MoodAnalysis[];
    lastAnalysis?: MoodAnalysis;
    conversationStarted: Date;
    lastActivity: Date;
}

/**
 * Pattern detection results from conversation history
 */
export interface PatternDetection {
    repeatedComplaints: string[];
    concerningKeywords: string[];
    isolationIndicators: boolean;
    healthMentions: string[];
    negativePatternCount: number;
    withdrawalDetected: boolean;
    socialMentions: number;
}

/**
 * API Response wrapper
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    code?: string;
    statusCode?: number;
}

/**
 * Chat endpoint request body
 */
export interface ChatRequest {
    userId: string;
    message: string;
    history?: ChatMessage[];
}

/**
 * Chat endpoint response data
 */
export interface ChatResponse {
    aiResponse: string;
    sentiment: SentimentResult;
    mood: MoodAnalysis;
}

/**
 * Sentiment analysis request
 */
export interface SentimentRequest {
    text: string;
    useAI?: boolean;
}

/**
 * Mood analysis request
 */
export interface MoodRequest {
    text: string;
    sentiment?: SentimentResult;
    userId?: string;
}

/**
 * Risk calculation request
 */
export interface RiskRequest {
    userId: string;
    timeWindowDays?: number;
}

/**
 * Environment configuration
 */
export interface EnvConfig {
    nodeEnv: string;
    port: number;
    aiProvider: 'groq' | 'gemini';
    groqApiKey?: string;
    groqModel: string;
    geminiApiKey?: string;
    geminiModel: string;
    allowedOrigins: string[];
    riskHighThreshold: number;
    riskMonitorThreshold: number;
    rateLimitMax: number;
    rateLimitWindowMinutes: number;
    logLevel: string;
    maxContextMessages: number;
    contextExpiryHours: number;
}

/**
 * AI sentiment analysis response from Groq/Gemini
 */
export interface AISentimentResponse {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
    reasoning: string;
}

/**
 * Mood score calculation result
 */
export interface MoodScores {
    happy: number;
    sad: number;
    anxious: number;
    lonely: number;
    neutral: number;
    distressed: number;
}

/**
 * Keyword extraction result
 */
export interface KeywordExtraction {
    keywords: string[];
    moodMatches: Record<MoodCategory, string[]>;
}
