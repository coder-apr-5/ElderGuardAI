/**
 * ElderNest AI - Elder Controller
 * Handles elder-specific API endpoints.
 */

import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { sendSuccess, sendNotFound, sendServerError, sendBadRequest } from '../utils/responses';
import { logger } from '../utils/logger';
import { collections, serverTimestamp } from '../config/firebase';
import * as firestoreService from '../services/firestore.service';
import * as notificationService from '../services/notification.service';
import * as mlService from '../services/ml.service';

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const elderDoc = await collections.elders.doc(userId).get();

    if (!elderDoc.exists) {
      sendNotFound(res, 'Elder profile not found');
      return;
    }

    sendSuccess(res, {
      id: elderDoc.id,
      ...elderDoc.data(),
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    sendServerError(res, 'Failed to fetch profile');
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const updates = req.body;

    // Remove sensitive fields
    delete updates.uid;
    delete updates.email;
    delete updates.connectionCode;
    delete updates.familyMembers;

    await collections.elders.doc(userId).update({
      ...updates,
      updatedAt: serverTimestamp(),
    });

    await firestoreService.logActivity(userId, 'profile_update', 'Updated profile information');

    sendSuccess(res, null, 'Profile updated successfully');
  } catch (error) {
    logger.error('Update profile error:', error);
    sendServerError(res, 'Failed to update profile');
  }
};

export const logMood = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { score, label, notes } = req.body;

    const moodId = await firestoreService.saveMood(userId, score, label, 'manual', notes);
    await firestoreService.logActivity(userId, 'mood_log', `Logged mood: ${label}`);

    // Check if mood is very low
    if (score < 0.3) {
      const features = await firestoreService.getUserFeaturesForML(userId);
      await mlService.predictRisk(userId, features);
    }

    sendSuccess(res, { moodId }, 'Mood logged successfully');
  } catch (error) {
    logger.error('Log mood error:', error);
    sendServerError(res, 'Failed to log mood');
  }
};

export const getMedicines = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    
    const snapshot = await collections.medicines
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get();

    const medicines = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    sendSuccess(res, { medicines });
  } catch (error) {
    logger.error('Get medicines error:', error);
    sendServerError(res, 'Failed to fetch medicines');
  }
};

export const takeMedicine = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const medicineId = req.params.id;

    // Verify medicine exists and belongs to user
    const medicineDoc = await collections.medicines.doc(medicineId).get();
    if (!medicineDoc.exists || medicineDoc.data()?.userId !== userId) {
      sendNotFound(res, 'Medicine not found');
      return;
    }

    // Log medicine taken
    await collections.medicineLogs.add({
      medicineId,
      userId,
      scheduledTime: new Date(),
      takenAt: new Date(),
      taken: true,
      skipped: false,
      timestamp: serverTimestamp(),
    });

    await firestoreService.logActivity(
      userId,
      'medicine_taken',
      `Took medicine: ${medicineDoc.data()?.name}`
    );

    sendSuccess(res, null, 'Medicine marked as taken');
  } catch (error) {
    logger.error('Take medicine error:', error);
    sendServerError(res, 'Failed to record medicine');
  }
};

export const triggerEmergency = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { type = 'sos', message, location } = req.body;

    // Get elder info
    const elderDoc = await collections.elders.doc(userId).get();
    if (!elderDoc.exists) {
      sendNotFound(res, 'Elder profile not found');
      return;
    }

    const elderName = elderDoc.data()?.fullName || 'Elder';

    // Create emergency record
    const emergencyRef = await collections.emergencies.add({
      elderId: userId,
      elderName,
      type,
      message,
      location,
      status: 'active',
      timestamp: serverTimestamp(),
    });

    // Send emergency notification to family
    await notificationService.sendEmergencyAlert(userId, elderName, type, message);

    await firestoreService.logActivity(userId, 'emergency_alert', `Emergency ${type} triggered`);

    sendSuccess(res, { 
      emergencyId: emergencyRef.id,
      message: 'Emergency alert sent to your family members'
    });
  } catch (error) {
    logger.error('Emergency trigger error:', error);
    sendServerError(res, 'Failed to send emergency alert');
  }
};

export const getMoodHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const days = parseInt(req.query.days as string) || 7;

    const moods = await firestoreService.getMoodHistory(userId, days);
    sendSuccess(res, { moods });
  } catch (error) {
    logger.error('Get mood history error:', error);
    sendServerError(res, 'Failed to fetch mood history');
  }
};

export const analyzeEmotion = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { image } = req.body;

    if (!image) {
      sendBadRequest(res, 'Image is required');
      return;
    }

    const result = await mlService.analyzeEmotion(userId, image);
    sendSuccess(res, result, 'Emotion analyzed successfully');
  } catch (error) {
    logger.error('Emotion analysis error:', error);
    sendServerError(res, 'Failed to analyze emotion');
  }
};

export default {
  getProfile,
  updateProfile,
  logMood,
  getMedicines,
  takeMedicine,
  triggerEmergency,
  getMoodHistory,
  analyzeEmotion,
};
