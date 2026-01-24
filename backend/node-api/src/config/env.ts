/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ElderNest AI - Environment Configuration
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Centralized environment variable management with validation.
 * Uses Zod for runtime type checking and validation.
 */

import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Environment Schema Definition
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const envSchema = z.object({
  // Application Settings
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  API_VERSION: z.string().default('v1'),

  // Firebase Configuration
  FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase Project ID is required'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'Firebase Private Key is required'),
  FIREBASE_CLIENT_EMAIL: z.string().email('Invalid Firebase Client Email'),
  FIREBASE_DATABASE_URL: z.string().url().optional(),

  // AI Services
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  DEFAULT_AI_PROVIDER: z.enum(['openai', 'gemini']).default('openai'),

  // Python ML Service
  PYTHON_ML_SERVICE_URL: z.string().url().default('http://localhost:8000'),

  // Security & CORS
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://localhost:5174'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
  LOG_FILE_PATH: z.string().default('./logs'),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Parse and Validate Environment
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n');
      console.error('❌ Environment validation failed:\n', missingVars);
      
      // In development, continue with warnings
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Running in development mode with missing environment variables');
        return envSchema.partial().parse(process.env);
      }
      
      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
};

const parsedEnv = parseEnv();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Structured Configuration Export
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const config = {
  // Environment
  env: parsedEnv.NODE_ENV || 'development',
  isDevelopment: parsedEnv.NODE_ENV === 'development',
  isProduction: parsedEnv.NODE_ENV === 'production',
  isTest: parsedEnv.NODE_ENV === 'test',

  // Server
  server: {
    port: parsedEnv.PORT || 5000,
    apiVersion: parsedEnv.API_VERSION || 'v1',
  },

  // Firebase
  firebase: {
    projectId: parsedEnv.FIREBASE_PROJECT_ID || '',
    privateKey: parsedEnv.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || '',
    clientEmail: parsedEnv.FIREBASE_CLIENT_EMAIL || '',
    databaseUrl: parsedEnv.FIREBASE_DATABASE_URL,
  },

  // AI Services
  ai: {
    openaiApiKey: parsedEnv.OPENAI_API_KEY || '',
    geminiApiKey: parsedEnv.GEMINI_API_KEY || '',
    defaultProvider: parsedEnv.DEFAULT_AI_PROVIDER || 'openai',
  },

  // ML Service
  ml: {
    serviceUrl: parsedEnv.PYTHON_ML_SERVICE_URL || 'http://localhost:8000',
  },

  // Security
  security: {
    allowedOrigins: (parsedEnv.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()),
    rateLimit: {
      windowMs: parsedEnv.RATE_LIMIT_WINDOW_MS || 900000,
      maxRequests: parsedEnv.RATE_LIMIT_MAX_REQUESTS || 100,
    },
  },

  // Logging
  logging: {
    level: parsedEnv.LOG_LEVEL || 'info',
    filePath: parsedEnv.LOG_FILE_PATH || './logs',
  },
} as const;

// Type export for config object
export type Config = typeof config;

export default config;
