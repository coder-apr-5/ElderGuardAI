/**
 * ElderNest AI - ML Service Client
 * Communicates with Python ML microservice for predictions.
 */

import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';
import { logger, logML } from '../utils/logger';
import {
  MLFeatures, RiskPredictionResponse, EmotionAnalysisResponse, RiskFactor, VisionComprehensiveResponse
} from '../types';
import * as firestoreService from './firestore.service';

const mlClient: AxiosInstance = axios.create({
  baseURL: config.ml.serviceUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

export const predictRisk = async (
  userId: string,
  features: MLFeatures
): Promise<RiskPredictionResponse> => {
  const startTime = Date.now();

  try {
    const response = await mlClient.post<RiskPredictionResponse>('/api/predict-risk', {
      userId,
      features,
    });

    const result = response.data;
    logML('/api/predict-risk', true, Date.now() - startTime);

    // Save to Firestore
    await firestoreService.saveRiskScore(
      userId,
      result.riskLevel,
      result.riskScore,
      result.factors,
      features
    );

    // Notify family if high risk
    if (result.riskLevel === 'high') {
      await firestoreService.notifyFamily(
        userId,
        'Elder',
        'risk_alert',
        '⚠️ High Risk Alert',
        `Risk level is HIGH. Factors: ${result.factors.map((f) => f.description).join(', ')}`,
        'urgent'
      );
    }

    return result;
  } catch (error) {
    logML('/api/predict-risk', false, Date.now() - startTime);
    logger.error('ML risk prediction error:', error);

    // Return fallback prediction
    return fallbackRiskPrediction(features);
  }
};

export const analyzeEmotion = async (
  userId: string,
  imageBase64: string
): Promise<EmotionAnalysisResponse> => {
  const startTime = Date.now();

  try {
    const response = await mlClient.post<EmotionAnalysisResponse>('/api/analyze-emotion', {
      userId,
      image: imageBase64,
    });

    const result = response.data;
    logML('/api/analyze-emotion', true, Date.now() - startTime);

    // Save emotion data
    await firestoreService.saveEmotionData(userId, result.emotion, result.confidence);

    // Log activity
    await firestoreService.logActivity(
      userId,
      'emotion_detected',
      `Detected emotion: ${result.emotion}`,
      { confidence: result.confidence }
    );

    return result;
  } catch (error) {
    logML('/api/analyze-emotion', false, Date.now() - startTime);
    logger.error('ML emotion analysis error:', error);

    return { emotion: 'Neutral', confidence: 0.5 };
  }
};

export const analyzeVisionComprehensive = async (
  userId: string,
  imageBase64: string
): Promise<VisionComprehensiveResponse> => {
  const startTime = Date.now();

  try {
    const response = await mlClient.post<VisionComprehensiveResponse>('/api/vision/comprehensive-analysis', {
      userId,
      image: imageBase64,
      timestamp: new Date().toISOString()
    });

    const result = response.data;
    logger.debug(`ML Result for ${userId}: fall=${result.fall?.fall_detected}, emotion=${result.emotion?.emotion}`);
    logML('/api/vision/comprehensive-analysis', true, Date.now() - startTime);

    // If fall detected, we should log it
    if (result.fall?.fall_detected) {
      await firestoreService.logActivity(
        userId,
        'fall_detected',
        '⚠️ FALL DETECTED via Camera!',
        { confidence: result.fall.confidence }
      );
    }

    // Save emotion if present
    if (result.emotion?.emotion) {
      await firestoreService.saveEmotionData(userId, result.emotion.emotion, result.emotion.confidence || 0.5);
    }

    return result;
  } catch (error) {
    logML('/api/vision/comprehensive-analysis', false, Date.now() - startTime);
    logger.error('ML comprehensive vision analysis error:', error);

    return {
      timestamp: new Date().toISOString(),
      userId,
      emotion: { emotion: 'Neutral', confidence: 0.5 },
      fall: { fall_detected: false, confidence: 0 },
      health_state: { state: 'normal', alert_level: 'none' },
      security: { intruder_detected: false },
      alerts: []
    };
  }
};

// Fallback risk prediction when ML service is unavailable
const fallbackRiskPrediction = (features: MLFeatures): RiskPredictionResponse => {
  const factors: RiskFactor[] = [];
  let riskScore = 0;

  if (features.avgMoodScore < 0.4) {
    factors.push({
      factor: 'avgMoodScore',
      value: features.avgMoodScore,
      threshold: 0.4,
      description: 'Low mood scores detected',
    });
    riskScore += 0.25;
  }

  if (features.medicineAdherence < 0.7) {
    factors.push({
      factor: 'medicineAdherence',
      value: features.medicineAdherence,
      threshold: 0.7,
      description: 'Poor medicine adherence',
    });
    riskScore += 0.25;
  }

  if (features.avgSentiment < -0.3) {
    factors.push({
      factor: 'avgSentiment',
      value: features.avgSentiment,
      threshold: -0.3,
      description: 'Negative chat sentiment',
    });
    riskScore += 0.2;
  }

  if (features.inactivityDays > 3) {
    factors.push({
      factor: 'inactivityDays',
      value: features.inactivityDays,
      threshold: 3,
      description: 'High inactivity period',
    });
    riskScore += 0.15;
  }

  if (features.missedMedicines > 2) {
    factors.push({
      factor: 'missedMedicines',
      value: features.missedMedicines,
      threshold: 2,
      description: 'Multiple missed medicines',
    });
    riskScore += 0.15;
  }

  let riskLevel: 'safe' | 'monitor' | 'high' = 'safe';
  if (riskScore >= 0.6) riskLevel = 'high';
  else if (riskScore >= 0.3) riskLevel = 'monitor';

  return { riskLevel, riskScore: Math.min(1, riskScore), factors };
};

export const checkMLServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await mlClient.get('/health', { timeout: 5000 });
    return response.status === 200;
  } catch {
    return false;
  }
};

export default { predictRisk, analyzeEmotion, analyzeVisionComprehensive, checkMLServiceHealth };
