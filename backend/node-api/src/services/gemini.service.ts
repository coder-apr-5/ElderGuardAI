/**
 * ElderNest AI - Google Gemini Service
 * Alternative AI provider using Gemini API.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';
import { logger, logAI } from '../utils/logger';
import { ChatMessage, SentimentResult } from '../types';

const genAI = new GoogleGenerativeAI(config.ai.geminiApiKey);

const ELDERLY_CARE_SYSTEM_PROMPT = `You are ElderNest, a caring AI companion for elderly people.

Rules:
- Keep responses SHORT (2-3 sentences)
- Be warm, empathetic, patient
- Use simple, clear language
- Check on wellbeing regularly
- Detect distress or health concerns
- For emergencies, suggest contacting family
- You're a companion, not a doctor`;

export const generateChatResponse = async (
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> => {
  const startTime = Date.now();
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Build conversation context
    const historyText = conversationHistory
      .slice(-10)
      .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n');

    const prompt = `${ELDERLY_CARE_SYSTEM_PROMPT}

${historyText ? `Previous conversation:\n${historyText}\n\n` : ''}User: ${userMessage}

Respond as ElderNest (2-3 sentences max):`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    logAI('Gemini', 'chat completion', Date.now() - startTime);
    return response || "I'm here for you. How can I help?";
  } catch (error) {
    logger.error('Gemini chat error:', error);
    throw new Error('Failed to generate AI response');
  }
};

export const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
  const startTime = Date.now();
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Analyze sentiment. Reply with JSON only:
{"label": "positive" or "neutral" or "negative", "score": -1 to 1, "confidence": 0 to 1}

Text: "${text}"`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      logAI('Gemini', 'sentiment analysis', Date.now() - startTime);
      return {
        label: parsed.label || 'neutral',
        score: typeof parsed.score === 'number' ? parsed.score : 0,
        confidence: parsed.confidence || 0.8,
      };
    }

    return { label: 'neutral', score: 0, confidence: 0.5 };
  } catch (error) {
    logger.error('Gemini sentiment error:', error);
    return { label: 'neutral', score: 0, confidence: 0.5 };
  }
};

export default { generateChatResponse, analyzeSentiment };
