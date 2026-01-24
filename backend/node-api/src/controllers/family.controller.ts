/**
 * ElderNest AI - Family Controller
 * Handles family member API endpoints.
 */

import { Response } from 'express';
import { AuthenticatedRequest, ElderStatus } from '../types';
import { sendSuccess, sendNotFound, sendServerError, sendBadRequest, sendForbidden } from '../utils/responses';
import { logger } from '../utils/logger';
import { collections, serverTimestamp, arrayUnion } from '../config/firebase';
import * as firestoreService from '../services/firestore.service';
import * as notificationService from '../services/notification.service';

export const getConnectedElders = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    
    const familyDoc = await collections.families.doc(userId).get();
    if (!familyDoc.exists) {
      sendSuccess(res, { elders: [] });
      return;
    }

    const eldersConnected: string[] = familyDoc.data()?.eldersConnected || [];
    
    const elders = await Promise.all(
      eldersConnected.map(async (elderId) => {
        const elderDoc = await collections.elders.doc(elderId).get();
        if (!elderDoc.exists) return null;
        
        const latestRisk = await firestoreService.getLatestRiskScore(elderId);
        
        return {
          id: elderDoc.id,
          fullName: elderDoc.data()?.fullName,
          age: elderDoc.data()?.age,
          profilePicture: elderDoc.data()?.profilePicture,
          lastActive: elderDoc.data()?.lastActive,
          riskLevel: latestRisk?.riskLevel || 'safe',
        };
      })
    );

    sendSuccess(res, { elders: elders.filter(Boolean) });
  } catch (error) {
    logger.error('Get elders error:', error);
    sendServerError(res, 'Failed to fetch connected elders');
  }
};

export const getElderStatus = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const elderId = req.params.id;

    // Verify family is connected to elder
    const familyDoc = await collections.families.doc(userId).get();
    const eldersConnected: string[] = familyDoc.data()?.eldersConnected || [];
    
    if (!eldersConnected.includes(elderId)) {
      sendForbidden(res, 'You are not connected to this elder');
      return;
    }

    // Get elder data
    const elderDoc = await collections.elders.doc(elderId).get();
    if (!elderDoc.exists) {
      sendNotFound(res, 'Elder not found');
      return;
    }

    // Get latest mood
    const moods = await firestoreService.getMoodHistory(elderId, 1);
    const currentMood = moods[0] || null;

    // Get latest risk score
    const latestRisk = await firestoreService.getLatestRiskScore(elderId);

    // Get today's medicine status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const medicineLogsSnapshot = await collections.medicineLogs
      .where('userId', '==', elderId)
      .where('timestamp', '>=', today)
      .get();

    const medicineLogs = medicineLogsSnapshot.docs.map((d) => d.data());
    const medicinesTaken = medicineLogs.filter((l) => l.taken).length;
    const totalMedicines = medicineLogs.length || 1;

    // Get last activity
    const activities = await firestoreService.getActivityTimeline(elderId, 1);

    const status: ElderStatus = {
      elder: { id: elderDoc.id, ...elderDoc.data() } as any,
      currentMood,
      latestRisk: latestRisk || undefined,
      medicineAdherence: medicinesTaken / totalMedicines,
      lastActivity: activities[0] || null,
      todaysMedicines: {
        total: totalMedicines,
        taken: medicinesTaken,
        pending: medicineLogs.filter((l) => !l.taken && !l.skipped) as any,
      },
      recentEmotions: [],
    };

    sendSuccess(res, status);
  } catch (error) {
    logger.error('Get elder status error:', error);
    sendServerError(res, 'Failed to fetch elder status');
  }
};

export const getElderRiskHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const elderId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 10;

    const snapshot = await collections.riskScores
      .where('userId', '==', elderId)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const riskHistory = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }));

    sendSuccess(res, { riskHistory });
  } catch (error) {
    logger.error('Get risk history error:', error);
    sendServerError(res, 'Failed to fetch risk history');
  }
};

export const getElderActivity = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const elderId = req.params.id;
    const limit = parseInt(req.query.limit as string) || 20;

    const activities = await firestoreService.getActivityTimeline(elderId, limit);
    sendSuccess(res, { activities });
  } catch (error) {
    logger.error('Get activity error:', error);
    sendServerError(res, 'Failed to fetch activity timeline');
  }
};

export const getNotifications = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    
    const snapshot = await collections.notifications
      .where('recipientId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }));

    sendSuccess(res, { notifications });
  } catch (error) {
    logger.error('Get notifications error:', error);
    sendServerError(res, 'Failed to fetch notifications');
  }
};

export const markNotificationRead = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const notificationId = req.params.id;
    await notificationService.markNotificationRead(notificationId);
    sendSuccess(res, null, 'Notification marked as read');
  } catch (error) {
    logger.error('Mark notification read error:', error);
    sendServerError(res, 'Failed to update notification');
  }
};

export const connectToElder = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { code, relationship } = req.body;

    if (!code) {
      sendBadRequest(res, 'Connection code is required');
      return;
    }

    // Find elder with this connection code
    const eldersSnapshot = await collections.elders
      .where('connectionCode', '==', code.toUpperCase())
      .limit(1)
      .get();

    if (eldersSnapshot.empty) {
      sendNotFound(res, 'Invalid connection code');
      return;
    }

    const elderDoc = eldersSnapshot.docs[0];
    const elderId = elderDoc.id;
    const elderName = elderDoc.data()?.fullName || 'Elder';

    // Update family's connected elders
    await collections.families.doc(userId).set({
      eldersConnected: arrayUnion(elderId),
      relationship,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Update elder's family members
    await collections.elders.doc(elderId).update({
      familyMembers: arrayUnion(userId),
    });

    sendSuccess(res, {
      elderId,
      elderName,
      connected: true,
    }, `Successfully connected to ${elderName}`);
  } catch (error) {
    logger.error('Connect to elder error:', error);
    sendServerError(res, 'Failed to connect to elder');
  }
};

export default {
  getConnectedElders,
  getElderStatus,
  getElderRiskHistory,
  getElderActivity,
  getNotifications,
  markNotificationRead,
  connectToElder,
};
