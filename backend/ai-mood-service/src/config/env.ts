// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Environment Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import dotenv from 'dotenv';
import type { EnvConfig } from '../types';

// Load environment variables
dotenv.config();

/**
 * Validates and parses environment variables
 */
function getEnvConfig(): EnvConfig {
    const config: EnvConfig = {
        // Server
        nodeEnv: process.env.NODE_ENV || 'development',
        port: parseInt(process.env.PORT || '4000', 10),

        // AI Provider - now supports 'groq' or 'gemini'
        aiProvider: (process.env.AI_PROVIDER as 'groq' | 'gemini') || 'groq',

        // Groq (replacing OpenAI)
        groqApiKey: process.env.GROQ_API_KEY,
        groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

        // Gemini (backup)
        geminiApiKey: process.env.GEMINI_API_KEY,
        geminiModel: process.env.GEMINI_MODEL || 'gemini-pro',

        // CORS
        allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5000,http://localhost:5173')
            .split(',')
            .map(origin => origin.trim()),

        // Risk Thresholds
        riskHighThreshold: parseFloat(process.env.RISK_HIGH_THRESHOLD || '0.7'),
        riskMonitorThreshold: parseFloat(process.env.RISK_MONITOR_THRESHOLD || '0.4'),

        // Rate Limiting
        rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        rateLimitWindowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || '15', 10),

        // Logging
        logLevel: process.env.LOG_LEVEL || 'info',

        // Context
        maxContextMessages: parseInt(process.env.MAX_CONTEXT_MESSAGES || '10', 10),
        contextExpiryHours: parseInt(process.env.CONTEXT_EXPIRY_HOURS || '24', 10),
    };

    return config;
}

/**
 * Validates required configuration based on AI provider
 */
export function validateConfig(config: EnvConfig): void {
    if (config.aiProvider === 'groq' && !config.groqApiKey) {
        console.warn('⚠️  Warning: GROQ_API_KEY not set. Groq features will be unavailable.');
    }

    if (config.aiProvider === 'gemini' && !config.geminiApiKey) {
        console.warn('⚠️  Warning: GEMINI_API_KEY not set. Gemini features will be unavailable.');
    }

    if (!config.groqApiKey && !config.geminiApiKey) {
        console.warn('⚠️  Warning: No AI API keys configured. Chat will use fallback responses only.');
    }
}

export const config = getEnvConfig();

export default config;
