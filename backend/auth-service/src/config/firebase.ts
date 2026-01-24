// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Firebase Admin Configuration
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { logger } from '../utils/logger';

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase(): admin.app.App {
    if (firebaseApp) {
        return firebaseApp;
    }

    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
        logger.warn('Firebase credentials not fully configured. Using emulator or default settings.');

        // For development without credentials
        if (process.env.NODE_ENV === 'development') {
            firebaseApp = admin.initializeApp({
                projectId: 'demo-eldernest',
            });
            logger.info('Firebase initialized in development mode');
            return firebaseApp;
        }

        throw new Error('Firebase credentials are required in production');
    }

    try {
        firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                privateKey,
                clientEmail,
            }),
            databaseURL: process.env.FIREBASE_DATABASE_URL,
        });

        logger.info('Firebase Admin SDK initialized successfully');
        return firebaseApp;
    } catch (error) {
        logger.error('Failed to initialize Firebase', { error });
        throw error;
    }
}

/**
 * Get Firestore database instance
 */
export function getDb() {
    if (!firebaseApp) {
        initializeFirebase();
    }
    return getFirestore();
}

/**
 * Get Firebase Auth instance
 */
export function getFirebaseAuth() {
    if (!firebaseApp) {
        initializeFirebase();
    }
    return getAuth();
}

/**
 * Firestore collections
 */
export const Collections = {
    USERS: 'users',
    OTPS: 'otps',
    OTP_RATE_LIMITS: 'otp_rate_limits',
    PENDING_CONNECTIONS: 'pending_connections',
    REFRESH_TOKENS: 'refresh_tokens',
    AUTH_LOGS: 'auth_logs',
} as const;

export default {
    initializeFirebase,
    getDb,
    getFirebaseAuth,
    Collections,
};
