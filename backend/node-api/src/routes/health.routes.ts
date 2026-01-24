/**
 * ElderNest AI - Health Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as mlService from '../services/ml.service';
import * as firestoreService from '../services/firestore.service';
import { sendSuccess, sendServerError } from '../utils/responses';
import { AuthenticatedRequest } from '../types';
import { Response } from 'express';

const router = Router();

/**
 * @swagger
 * /health/risk:
 *   get:
 *     summary: Get current risk assessment
 *     tags: [Health]
 */
router.get('/risk', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const latestRisk = await firestoreService.getLatestRiskScore(userId);
    sendSuccess(res, latestRisk);
  } catch (error) {
    sendServerError(res, 'Failed to get risk score');
  }
});

/**
 * @swagger
 * /health/risk/predict:
 *   post:
 *     summary: Trigger new risk prediction
 *     tags: [Health]
 */
router.post('/risk/predict', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const features = await firestoreService.getUserFeaturesForML(userId);
    const result = await mlService.predictRisk(userId, features);
    sendSuccess(res, result);
  } catch (error) {
    sendServerError(res, 'Failed to predict risk');
  }
});

/**
 * @swagger
 * /health/features:
 *   get:
 *     summary: Get ML features for user
 *     tags: [Health]
 */
router.get('/features', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const features = await firestoreService.getUserFeaturesForML(userId);
    sendSuccess(res, features);
  } catch (error) {
    sendServerError(res, 'Failed to get features');
  }
});

/**
 * @swagger
 * /health/ml-status:
 *   get:
 *     summary: Check ML service health
 *     tags: [Health]
 */
router.get('/ml-status', async (_req, res) => {
  try {
    const isHealthy = await mlService.checkMLServiceHealth();
    sendSuccess(res, { 
      status: isHealthy ? 'healthy' : 'unavailable',
      timestamp: new Date().toISOString(),
    });
  } catch {
    sendSuccess(res, { status: 'unavailable' });
  }
});

export default router;
