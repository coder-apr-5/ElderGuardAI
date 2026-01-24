/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * ElderNest AI - Firebase Admin SDK Configuration
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * 
 * Initializes Firebase Admin SDK with service account credentials.
 * Provides access to Firestore, Auth, and FCM services.
 */

import admin from 'firebase-admin';
import { config } from './env';
import { logger } from '../utils/logger';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Firebase Admin Initialization
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

let firebaseApp: admin.app.App;

const initializeFirebase = (): admin.app.App => {
  // Check if already initialized
  if (admin.apps.length) {
    return admin.apps[0]!;
  }

  try {
    const { projectId, privateKey, clientEmail } = config.firebase;
    
    // Check if credentials are placeholder or missing
    const isPlaceholder = (key?: string) => {
      if (!key) return true;
      return key.includes('YOUR_') || 
             key.includes('your-') || 
             key.includes('xxxxx') ||
             key.length < 50;
    };

    const hasValidCredentials = 
      projectId && 
      clientEmail && 
      privateKey && 
      !isPlaceholder(projectId) &&
      !isPlaceholder(privateKey) &&
      privateKey.includes('-----BEGIN PRIVATE KEY-----') &&
      privateKey.length > 200;

    if (!hasValidCredentials) {
      logger.warn('⚠️ Firebase credentials not configured or using placeholders.');
      logger.warn('   Running in demo mode. Set proper credentials in .env for production.');
      
      // Initialize with project ID only for development (limited functionality)
      firebaseApp = admin.initializeApp({
        projectId: projectId || 'demo-eldernest',
      });
      
      logger.info('✅ Firebase initialized in demo mode');
      return firebaseApp;
    }

    // Initialize with full credentials
    const serviceAccount: admin.ServiceAccount = {
      projectId,
      privateKey,
      clientEmail,
    };

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: config.firebase.databaseUrl,
    });

    logger.info('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
    
    // In development, continue with limited mode
    if (config.isDevelopment) {
      logger.warn('⚠️ Falling back to demo mode due to Firebase initialization error');
      firebaseApp = admin.initializeApp({
        projectId: 'demo-eldernest',
      });
      return firebaseApp;
    }
    
    throw error;
  }
};

// Initialize Firebase
firebaseApp = initializeFirebase();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Firebase Service Exports
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Firestore Database
export const db = admin.firestore();

// Firebase Authentication
export const auth = admin.auth();

// Firebase Cloud Messaging (for push notifications)
export const messaging = admin.messaging();

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Firestore Collection References
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const collections = {
  // User collections
  users: db.collection('users'),
  elders: db.collection('elders'),
  families: db.collection('families'),

  // Chat & Communication
  chats: db.collection('chats'),
  notifications: db.collection('notifications'),

  // Health & Wellness
  moods: db.collection('moods'),
  medicines: db.collection('medicines'),
  medicineLogs: db.collection('medicineLogs'),
  activities: db.collection('activities'),

  // Risk & Analytics
  riskScores: db.collection('riskScores'),
  emotions: db.collection('emotions'),

  // Emergency
  emergencies: db.collection('emergencies'),

  // Connection codes
  connectionCodes: db.collection('connectionCodes'),
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Firestore Helpers
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Get a Firestore timestamp for current time
 */
export const serverTimestamp = () => admin.firestore.FieldValue.serverTimestamp();

/**
 * Get a Firestore timestamp for a specific date
 */
export const toTimestamp = (date: Date) => admin.firestore.Timestamp.fromDate(date);

/**
 * Convert Firestore timestamp to Date
 */
export const fromTimestamp = (timestamp: admin.firestore.Timestamp): Date => {
  return timestamp.toDate();
};

/**
 * Increment a field value
 */
export const increment = (value: number) => admin.firestore.FieldValue.increment(value);

/**
 * Add to an array field
 */
export const arrayUnion = (...elements: unknown[]) => 
  admin.firestore.FieldValue.arrayUnion(...elements);

/**
 * Remove from an array field
 */
export const arrayRemove = (...elements: unknown[]) => 
  admin.firestore.FieldValue.arrayRemove(...elements);

/**
 * Delete a field
 */
export const deleteField = () => admin.firestore.FieldValue.delete();

// Export Firebase Admin instance
export { admin };
export default firebaseApp;
