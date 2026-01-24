// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Chat Routes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import { Router } from 'express';
import {
    handleChat,
    handleGetContext,
    handleClearContext,
} from '../controllers/chat.controller';
import {
    chatValidation,
    contextValidation,
} from '../utils/validators';

const router = Router();

/**
 * POST /api/chat
 * Main chat endpoint for AI conversation
 * 
 * Request body:
 * {
 *   "userId": "elder123",
 *   "message": "I'm feeling really lonely today.",
 *   "history": [{ "role": "user", "content": "Hello" }]
 * }
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "aiResponse": "I'm sorry you're feeling lonely...",
 *     "sentiment": { "score": -0.6, "label": "negative", ... },
 *     "mood": { "primary": "lonely", "confidence": 0.78, ... }
 *   }
 * }
 */
router.post('/', chatValidation, handleChat);

/**
 * GET /api/chat/context/:userId
 * Get conversation context for a user
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "messages": [...],
 *     "moodHistory": [...],
 *     "lastAnalysis": {...},
 *     "summary": {...}
 *   }
 * }
 */
router.get('/context/:userId', contextValidation, handleGetContext);

/**
 * DELETE /api/chat/context/:userId
 * Clear conversation context for a user
 * 
 * Response:
 * {
 *   "success": true,
 *   "data": { "message": "Conversation context cleared" }
 * }
 */
router.delete('/context/:userId', contextValidation, handleClearContext);

export default router;
