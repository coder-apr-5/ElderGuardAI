/**
 * ElderNest AI - Chat Controller
 * Handles chat-related API endpoints.
 */

import { Response } from 'express';
import { AuthenticatedRequest, ChatMessage } from '../types';
import { sendSuccess, sendBadRequest, sendServerError } from '../utils/responses';
import { logger } from '../utils/logger';
import { config } from '../config/env';
import * as openaiService from '../services/openai.service';
import * as geminiService from '../services/gemini.service';
import * as sentimentService from '../services/sentiment.service';
import * as firestoreService from '../services/firestore.service';
import * as mlService from '../services/ml.service';

export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      sendBadRequest(res, 'Message cannot be empty');
      return;
    }

    // Get last 10 messages for context
    const recentChats = await firestoreService.getChatHistory(userId, 10);
    const conversationHistory: ChatMessage[] = recentChats
      .reverse()
      .flatMap((chat) => [
        { role: 'user' as const, content: chat.userMessage },
        { role: 'assistant' as const, content: chat.aiResponse },
      ]);

    // Generate AI response
    let aiResponse: string;
    if (config.ai.defaultProvider === 'gemini' && config.ai.geminiApiKey) {
      aiResponse = await geminiService.generateChatResponse(message, conversationHistory);
    } else {
      aiResponse = await openaiService.generateChatResponse(message, conversationHistory);
    }

    // Analyze sentiment
    const sentiment = await sentimentService.analyzeSentiment(message);

    // Save chat to Firestore
    const chatId = await firestoreService.saveChat(userId, message, aiResponse, sentiment);

    // Log activity
    await firestoreService.logActivity(userId, 'chat', 'Sent a message to ElderNest AI');

    // If negative sentiment, update mood and trigger risk prediction
    if (sentiment.label === 'negative') {
      const moodScore = sentimentService.getMoodScoreFromSentiment(sentiment);
      const moodLabel = sentimentService.getMoodLabelFromSentiment(sentiment);
      await firestoreService.saveMood(userId, moodScore, moodLabel, 'chat');

      // Async risk prediction
      setImmediate(async () => {
        try {
          const features = await firestoreService.getUserFeaturesForML(userId);
          await mlService.predictRisk(userId, features);
        } catch (error) {
          logger.error('Background risk prediction failed:', error);
        }
      });
    }

    sendSuccess(res, {
      chatId,
      aiResponse,
      sentiment,
    }, 'Message sent successfully');
  } catch (error) {
    logger.error('Send message error:', error);
    sendServerError(res, 'Failed to process message');
  }
};

export const getChatHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    const limit = parseInt(req.query.limit as string) || 50;

    const chats = await firestoreService.getChatHistory(userId, limit);

    sendSuccess(res, {
      chats,
      total: chats.length,
    });
  } catch (error) {
    logger.error('Get chat history error:', error);
    sendServerError(res, 'Failed to fetch chat history');
  }
};

export const clearChatHistory = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.uid;
    await firestoreService.clearChatHistory(userId);
    sendSuccess(res, null, 'Chat history cleared successfully');
  } catch (error) {
    logger.error('Clear chat history error:', error);
    sendServerError(res, 'Failed to clear chat history');
  }
};

export default { sendMessage, getChatHistory, clearChatHistory };
