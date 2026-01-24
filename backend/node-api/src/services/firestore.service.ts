/**
 * ElderNest AI - Firestore Service
 * Database operations for all collections.
 */

import { collections, serverTimestamp, toTimestamp } from '../config/firebase';
import { logger, logFirestore } from '../utils/logger';
import { 
  Chat, Mood, RiskScore, Notification, MLFeatures, 
  Activity, SentimentResult 
} from '../types';

// ━━━ CHAT OPERATIONS ━━━

export const saveChat = async (
  userId: string,
  userMessage: string,
  aiResponse: string,
  sentiment: SentimentResult
): Promise<string> => {
  try {
    const chatData = {
      userId,
      userMessage,
      aiResponse,
      sentiment,
      timestamp: serverTimestamp(),
    };
    
    const docRef = await collections.chats.add(chatData);
    logFirestore('create', 'chats', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('Error saving chat:', error);
    throw error;
  }
};

export const getChatHistory = async (
  userId: string, 
  limit: number = 50
): Promise<Chat[]> => {
  try {
    const snapshot = await collections.chats
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as Chat[];
  } catch (error) {
    logger.error('Error getting chat history:', error);
    return [];
  }
};

export const clearChatHistory = async (userId: string): Promise<void> => {
  try {
    const snapshot = await collections.chats.where('userId', '==', userId).get();
    const batch = collections.chats.firestore.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    logFirestore('delete', 'chats', `all for ${userId}`);
  } catch (error) {
    logger.error('Error clearing chat history:', error);
    throw error;
  }
};

// ━━━ MOOD OPERATIONS ━━━

export const saveMood = async (
  userId: string,
  score: number,
  label: string,
  source: 'manual' | 'chat' | 'emotion_detection',
  notes?: string
): Promise<string> => {
  try {
    const moodData = { userId, score, label, source, notes, timestamp: serverTimestamp() };
    const docRef = await collections.moods.add(moodData);
    logFirestore('create', 'moods', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('Error saving mood:', error);
    throw error;
  }
};

export const getMoodHistory = async (userId: string, days: number = 7): Promise<Mood[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const snapshot = await collections.moods
      .where('userId', '==', userId)
      .where('timestamp', '>=', toTimestamp(startDate))
      .orderBy('timestamp', 'desc')
      .get();
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as Mood[];
  } catch (error) {
    logger.error('Error getting mood history:', error);
    return [];
  }
};

// ━━━ ML FEATURES AGGREGATION ━━━

export const getUserFeaturesForML = async (userId: string): Promise<MLFeatures> => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  try {
    // Get moods for average
    const moodsSnapshot = await collections.moods
      .where('userId', '==', userId)
      .where('timestamp', '>=', toTimestamp(sevenDaysAgo))
      .get();
    
    const moods = moodsSnapshot.docs.map((d) => d.data().score as number);
    const avgMoodScore = moods.length > 0 
      ? moods.reduce((a, b) => a + b, 0) / moods.length 
      : 0.5;

    // Get medicine logs for adherence
    const medicineLogsSnapshot = await collections.medicineLogs
      .where('userId', '==', userId)
      .where('timestamp', '>=', toTimestamp(sevenDaysAgo))
      .get();
    
    const logs = medicineLogsSnapshot.docs.map((d) => d.data());
    const totalMedicines = logs.length || 1;
    const takenMedicines = logs.filter((l) => l.taken).length;
    const medicineAdherence = takenMedicines / totalMedicines;
    const missedMedicines = logs.filter((l) => !l.taken && !l.skipped).length;

    // Get chats for sentiment
    const chatsSnapshot = await collections.chats
      .where('userId', '==', userId)
      .where('timestamp', '>=', toTimestamp(sevenDaysAgo))
      .get();
    
    const sentiments = chatsSnapshot.docs.map((d) => d.data().sentiment?.score as number || 0);
    const avgSentiment = sentiments.length > 0 
      ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length 
      : 0;
    const negativeChatCount = sentiments.filter((s) => s < -0.3).length;

    // Calculate inactivity days
    const allDates = moodsSnapshot.docs.map((d) => d.data().timestamp?.toDate());
    const uniqueDays = new Set(allDates.map((d) => d?.toDateString()));
    const inactivityDays = 7 - uniqueDays.size;

    return {
      avgMoodScore,
      medicineAdherence,
      avgSentiment,
      inactivityDays,
      missedMedicines,
      negativeChatCount,
    };
  } catch (error) {
    logger.error('Error getting ML features:', error);
    return {
      avgMoodScore: 0.5,
      medicineAdherence: 1,
      avgSentiment: 0,
      inactivityDays: 0,
      missedMedicines: 0,
      negativeChatCount: 0,
    };
  }
};

// ━━━ RISK SCORE OPERATIONS ━━━

export const saveRiskScore = async (
  userId: string,
  riskLevel: string,
  riskScore: number,
  factors: { factor: string; value: number; threshold: number; description: string }[],
  features: MLFeatures
): Promise<string> => {
  try {
    const data = { userId, riskLevel, riskScore, factors, features, timestamp: serverTimestamp() };
    const docRef = await collections.riskScores.add(data);
    logFirestore('create', 'riskScores', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('Error saving risk score:', error);
    throw error;
  }
};

export const getLatestRiskScore = async (userId: string): Promise<RiskScore | null> => {
  try {
    const snapshot = await collections.riskScores
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();
    
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data(), timestamp: doc.data().timestamp?.toDate() } as RiskScore;
  } catch (error) {
    logger.error('Error getting risk score:', error);
    return null;
  }
};

// ━━━ NOTIFICATION OPERATIONS ━━━

export const createNotification = async (notification: Omit<Notification, 'id'>): Promise<string> => {
  try {
    const data = { ...notification, timestamp: serverTimestamp() };
    const docRef = await collections.notifications.add(data);
    logFirestore('create', 'notifications', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw error;
  }
};

export const notifyFamily = async (
  elderId: string,
  elderName: string,
  type: Notification['type'],
  title: string,
  message: string,
  priority: Notification['priority'] = 'medium'
): Promise<void> => {
  try {
    // Get elder's connected family members
    const elderDoc = await collections.elders.doc(elderId).get();
    if (!elderDoc.exists) return;
    
    const familyMembers: string[] = elderDoc.data()?.familyMembers || [];
    
    const batch = collections.notifications.firestore.batch();
    
    for (const familyId of familyMembers) {
      const notifRef = collections.notifications.doc();
      batch.set(notifRef, {
        recipientId: familyId,
        elderId,
        elderName,
        type,
        title,
        message,
        priority,
        read: false,
        timestamp: serverTimestamp(),
      });
    }
    
    await batch.commit();
    logger.info(`Notified ${familyMembers.length} family members for elder ${elderId}`);
  } catch (error) {
    logger.error('Error notifying family:', error);
  }
};

// ━━━ EMOTION OPERATIONS ━━━

export const saveEmotionData = async (
  userId: string,
  emotion: string,
  confidence: number,
  source: 'camera' | 'upload' = 'camera'
): Promise<string> => {
  try {
    const data = { userId, emotion, confidence, source, timestamp: serverTimestamp() };
    const docRef = await collections.emotions.add(data);
    logFirestore('create', 'emotions', docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error('Error saving emotion:', error);
    throw error;
  }
};

// ━━━ ACTIVITY LOGGING ━━━

export const logActivity = async (
  userId: string,
  type: Activity['type'],
  description: string,
  metadata?: Record<string, unknown>
): Promise<void> => {
  try {
    await collections.activities.add({
      userId,
      type,
      description,
      metadata,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    logger.error('Error logging activity:', error);
  }
};

export const getActivityTimeline = async (
  userId: string,
  limit: number = 20
): Promise<Activity[]> => {
  try {
    const snapshot = await collections.activities
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as Activity[];
  } catch (error) {
    logger.error('Error getting activities:', error);
    return [];
  }
};

export default {
  saveChat, getChatHistory, clearChatHistory,
  saveMood, getMoodHistory,
  getUserFeaturesForML,
  saveRiskScore, getLatestRiskScore,
  createNotification, notifyFamily,
  saveEmotionData,
  logActivity, getActivityTimeline,
};
