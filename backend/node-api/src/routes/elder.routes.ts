/**
 * ElderNest AI - Elder Routes
 */

import { Router } from 'express';
import { authenticate, requireElder } from '../middleware/auth';
import { validate, moodValidation, profileValidation, medicineIdValidation, emotionAnalysisValidation } from '../middleware/validator';
import * as elderController from '../controllers/elder.controller';

const router = Router();

// All routes require elder authentication
router.use(authenticate);
router.use(requireElder);

/**
 * @swagger
 * /elder/profile:
 *   get:
 *     summary: Get elder profile
 *     tags: [Elder]
 */
router.get('/profile', elderController.getProfile);

/**
 * @swagger
 * /elder/profile:
 *   put:
 *     summary: Update elder profile
 *     tags: [Elder]
 */
router.put('/profile', validate(profileValidation), elderController.updateProfile);

/**
 * @swagger
 * /elder/mood:
 *   post:
 *     summary: Log mood check-in
 *     tags: [Elder]
 */
router.post('/mood', validate(moodValidation), elderController.logMood);

/**
 * @swagger
 * /elder/mood/history:
 *   get:
 *     summary: Get mood history
 *     tags: [Elder]
 */
router.get('/mood/history', elderController.getMoodHistory);

/**
 * @swagger
 * /elder/medicines:
 *   get:
 *     summary: Get medicine schedule
 *     tags: [Elder]
 */
router.get('/medicines', elderController.getMedicines);

/**
 * @swagger
 * /elder/medicine/:id/take:
 *   post:
 *     summary: Mark medicine as taken
 *     tags: [Elder]
 */
router.post('/medicine/:id/take', validate(medicineIdValidation), elderController.takeMedicine);

/**
 * @swagger
 * /elder/emergency:
 *   post:
 *     summary: Trigger emergency alert
 *     tags: [Elder]
 */
router.post('/emergency', elderController.triggerEmergency);

/**
 * @swagger
 * /elder/emotion:
 *   post:
 *     summary: Analyze emotion from image
 *     tags: [Elder]
 */
router.post('/emotion', validate(emotionAnalysisValidation), elderController.analyzeEmotion);

/**
 * @swagger
 * /elder/vision:
 *   post:
 *     summary: Comprehensive vision analysis
 *     tags: [Elder]
 */
router.post('/vision', elderController.analyzeVision);

export default router;
