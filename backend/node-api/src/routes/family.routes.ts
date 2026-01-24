/**
 * ElderNest AI - Family Routes
 */

import { Router } from 'express';
import { authenticate, requireFamily } from '../middleware/auth';
import { validate, elderIdValidation, connectCodeValidation, notificationIdValidation } from '../middleware/validator';
import * as familyController from '../controllers/family.controller';

const router = Router();

// All routes require family authentication
router.use(authenticate);
router.use(requireFamily);

/**
 * @swagger
 * /family/elders:
 *   get:
 *     summary: Get connected elders
 *     tags: [Family]
 */
router.get('/elders', familyController.getConnectedElders);

/**
 * @swagger
 * /family/elder/:id/status:
 *   get:
 *     summary: Get elder's current status
 *     tags: [Family]
 */
router.get('/elder/:id/status', validate(elderIdValidation), familyController.getElderStatus);

/**
 * @swagger
 * /family/elder/:id/risk:
 *   get:
 *     summary: Get elder's risk score history
 *     tags: [Family]
 */
router.get('/elder/:id/risk', validate(elderIdValidation), familyController.getElderRiskHistory);

/**
 * @swagger
 * /family/elder/:id/activity:
 *   get:
 *     summary: Get elder's activity timeline
 *     tags: [Family]
 */
router.get('/elder/:id/activity', validate(elderIdValidation), familyController.getElderActivity);

/**
 * @swagger
 * /family/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Family]
 */
router.get('/notifications', familyController.getNotifications);

/**
 * @swagger
 * /family/notification/:id/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Family]
 */
router.put('/notification/:id/read', validate(notificationIdValidation), familyController.markNotificationRead);

/**
 * @swagger
 * /family/connect:
 *   post:
 *     summary: Connect to elder via code
 *     tags: [Family]
 */
router.post('/connect', validate(connectCodeValidation), familyController.connectToElder);

export default router;
