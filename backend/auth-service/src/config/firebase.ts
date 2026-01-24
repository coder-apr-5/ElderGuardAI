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

    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

    // Check if we are using mock credentials
    if (!projectId || !privateKey || !clientEmail || privateKey.includes('MOCK') || isDev) {
        if (!isDev) {
            logger.warn('Missing or mock Firebase credentials in non-development environment');
        } else {
            logger.info(`Firebase initialized in development mode (Project: demo-eldernest)`);
        }

        if (admin.apps.length === 0) {
            firebaseApp = admin.initializeApp({
                projectId: 'demo-eldernest',
            });
        } else {
            firebaseApp = admin.app();
        }
        return firebaseApp;
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
