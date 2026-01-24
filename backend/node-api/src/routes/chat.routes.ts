/**
 * ElderNest AI - Chat Routes
 */

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, sendChatValidation, chatHistoryValidation } from '../middleware/validator';
import * as chatController from '../controllers/chat.controller';

const router = Router();

/**
 * @swagger
 * /chat/send:
 *   post:
 *     summary: Send a message to AI companion
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 500
 */
router.post(
  '/send',
  authenticate,
  validate(sendChatValidation),
  chatController.sendMessage
);

/**
 * @swagger
 * /chat/history:
 *   get:
 *     summary: Get chat history
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 */
router.get(
  '/history',
  authenticate,
  validate(chatHistoryValidation),
  chatController.getChatHistory
);

/**
 * @swagger
 * /chat/history:
 *   delete:
 *     summary: Clear all chat history
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/history',
  authenticate,
  chatController.clearChatHistory
);

export default router;
