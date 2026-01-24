/**
 * ElderNest AI - Notification Service
 * Firebase Cloud Messaging (FCM) for push notifications.
 */

import { messaging, collections } from '../config/firebase';
import { logger } from '../utils/logger';
import { Notification, NotificationType } from '../types';

interface FCMMessage {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  android?: {
    priority: 'high' | 'normal';
    notification: {
      channelId?: string;
      priority?: 'high' | 'max';
      sound?: string;
    };
  };
  apns?: {
    payload: {
      aps: {
        sound?: string;
        badge?: number;
      };
    };
  };
}

export const sendPushNotification = async (
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  priority: 'high' | 'normal' = 'high'
): Promise<boolean> => {
  try {
    const message: FCMMessage = {
      token: fcmToken,
      notification: { title, body },
      data,
      android: {
        priority,
        notification: {
          channelId: 'eldernest_alerts',
          priority: priority === 'high' ? 'max' : 'high',
          sound: 'default',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    await messaging.send(message as any);
    logger.info(`Push notification sent to token: ${fcmToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    logger.error('FCM send error:', error);
    return false;
  }
};

export const sendNotificationToUser = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  priority: Notification['priority'] = 'medium'
): Promise<void> => {
  try {
    // Get user's FCM token
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) return;

    const fcmToken = userDoc.data()?.fcmToken;
    
    // Save notification to Firestore
    await collections.notifications.add({
      recipientId: userId,
      elderId: userId,
      type,
      title,
      message,
      priority,
      read: false,
      timestamp: new Date(),
    });

    // Send push if token exists
    if (fcmToken) {
      const fcmPriority = priority === 'urgent' || priority === 'high' ? 'high' : 'normal';
      await sendPushNotification(fcmToken, title, message, { type }, fcmPriority);
    }
  } catch (error) {
    logger.error('Error sending notification:', error);
  }
};

export const sendEmergencyAlert = async (
  elderId: string,
  elderName: string,
  alertType: 'sos' | 'fall' | 'medical',
  customMessage?: string
): Promise<void> => {
  try {
    const elderDoc = await collections.elders.doc(elderId).get();
    if (!elderDoc.exists) return;

    const familyMembers: string[] = elderDoc.data()?.familyMembers || [];
    
    const alertMessages = {
      sos: '🆘 Emergency SOS triggered!',
      fall: '⚠️ Fall detected!',
      medical: '🏥 Medical emergency reported!',
    };

    const title = `${alertMessages[alertType]}`;
    const body = customMessage || `${elderName} needs immediate assistance.`;

    // Send to all family members
    for (const familyId of familyMembers) {
      const familyDoc = await collections.families.doc(familyId).get();
      if (!familyDoc.exists) continue;

      const fcmToken = familyDoc.data()?.fcmToken;
      
      // Save notification
      await collections.notifications.add({
        recipientId: familyId,
        elderId,
        elderName,
        type: 'emergency',
        title,
        message: body,
        priority: 'urgent',
        read: false,
        timestamp: new Date(),
      });

      // Send push
      if (fcmToken) {
        await sendPushNotification(fcmToken, title, body, { 
          type: 'emergency',
          elderId,
          alertType,
        }, 'high');
      }
    }

    logger.info(`Emergency alert sent for elder ${elderId}`);
  } catch (error) {
    logger.error('Error sending emergency alert:', error);
  }
};

export const getUnreadNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const snapshot = await collections.notifications
      .where('recipientId', '==', userId)
      .where('read', '==', false)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as Notification[];
  } catch (error) {
    logger.error('Error getting notifications:', error);
    return [];
  }
};

export const markNotificationRead = async (notificationId: string): Promise<void> => {
  try {
    await collections.notifications.doc(notificationId).update({
      read: true,
      readAt: new Date(),
    });
  } catch (error) {
    logger.error('Error marking notification read:', error);
  }
};

export default {
  sendPushNotification,
  sendNotificationToUser,
  sendEmergencyAlert,
  getUnreadNotifications,
  markNotificationRead,
};
