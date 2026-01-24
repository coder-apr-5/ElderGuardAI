// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Analysis Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Router } from 'express';
import {
    handleAnalyzeSentiment,
    handleAnalyzeMood,
    handleCalculateRisk,
    handleAnalyzePatterns,
    handleQuickRiskCheck,
} from '../controllers/analysis.controller';
import {
    sentimentValidation,
    moodValidation,
    riskValidation,
} from '../utils/validators';

const router = Router();

/**
 * POST /api/analyze/sentiment
 * Analyze sentiment of text
 * 
 * Request body:
 * {
 *   "text": "I had a wonderful day! My daughter visited.",
 *   "useAI": false
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "score": 0.75,
 *     "comparative": 0.15,
 *     "label": "positive",
 *     "confidence": 0.92,
 *     "tokens": ["wonderful", "day", "daughter", "visited"]
 *   }
 * }
 */
router.post('/sentiment', sentimentValidation, handleAnalyzeSentiment);

/**
 * POST /api/analyze/mood
 * Detect mood from text
 * 
 * Request body:
 * {
 *   "text": "I can't sleep. I keep worrying about everything.",
 *   "userId": "elder123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "primary": "anxious",
 *     "secondary": "distressed",
 *     "confidence": 0.82,
 *     "indicators": ["can't sleep", "worrying"],
 *     "sentiment": {...}
 *   }
 * }
 */
router.post('/mood', moodValidation, handleAnalyzeMood);

/**
 * POST /api/analyze/risk
 * Calculate risk score for a user
 * 
 * Request body:
 * {
 *   "userId": "elder123",
 *   "timeWindowDays": 7
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "riskLevel": "monitor",
 *     "riskScore": 0.55,
 *     "factors": ["Persistent negative mood detected", ...],
 *     "recommendations": ["Schedule check-in call", ...],
 *     "timestamp": "2026-01-22T10:30:00Z"
 *   }
 * }
 */
router.post('/risk', riskValidation, handleCalculateRisk);

/**
 * POST /api/analyze/patterns
 * Analyze behavioral patterns
 * 
 * Request body:
 * {
 *   "userId": "elder123",
 *   "timeWindowDays": 7
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "repeatedComplaints": ["pain", "tired"],
 *     "concerningKeywords": [],
 *     "isolationIndicators": true,
 *     "healthMentions": ["pain", "medicine"],
 *     "negativePatternCount": 2,
 *     "withdrawalDetected": false,
 *     "socialMentions": 1
 *   }
 * }
 */
router.post('/patterns', riskValidation, handleAnalyzePatterns);

/**
 * POST /api/analyze/quick-risk
 * Quick risk assessment from single message
 * 
 * Request body:
 * {
 *   "text": "I don't feel well today",
 *   "userId": "elder123"
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "mood": { "primary": "sad", ... },
 *     "isUrgent": false,
 *     "suggestedAction": "Consider reaching out..."
 *   }
 * }
 */
router.post('/quick-risk', moodValidation, handleQuickRiskCheck);

export default router;
