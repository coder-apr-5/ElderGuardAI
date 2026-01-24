/**
 * ElderNest AI - OpenAI Service
 * Handles chat completion and sentiment analysis using OpenAI API.
 */

import OpenAI from 'openai';
import { config } from '../config/env';
import { logger, logAI } from '../utils/logger';
import { ChatMessage, SentimentResult } from '../types';

const openai = new OpenAI({
  apiKey: config.ai.openaiApiKey,
});

const ELDERLY_CARE_SYSTEM_PROMPT = `You are a caring AI companion for elderly people. Your name is ElderNest.

Guidelines:
- Keep responses SHORT (2-3 sentences max)
- Be warm, empathetic, and patient
- Use simple, clear language
- Check on their wellbeing regularly
- Gently remind about medicines when appropriate
- Detect signs of distress, loneliness, or health concerns
- Offer encouragement and positive reinforcement
- If they mention pain, falls, or emergencies, express concern and suggest contacting family
- Be a good listener and show genuine interest in their stories

Remember: You're their friendly companion, not a medical professional. For health concerns, encourage them to consult their doctor or family.`;

export const generateChatResponse = async (
  userMessage: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> => {
  const startTime = Date.now();
  
  try {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: ELDERLY_CARE_SYSTEM_PROMPT },
      ...conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userMessage },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 150,
      temperature: 0.8,
    });

    const response = completion.choices[0]?.message?.content || 
      "I'm here for you. How can I help?";

    logAI('OpenAI', 'chat completion', Date.now() - startTime, completion.usage?.total_tokens);
    return response;
  } catch (error) {
    logger.error('OpenAI chat error:', error);
    throw new Error('Failed to generate AI response');
  }
};

export const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
  const startTime = Date.now();
  
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Analyze the sentiment of the text. Respond with JSON only:
{"label": "positive" | "neutral" | "negative", "score": number from -1 to 1, "confidence": number from 0 to 1}

Score guide: -1 = very negative, 0 = neutral, 1 = very positive`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 50,
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    logAI('OpenAI', 'sentiment analysis', Date.now() - startTime);

    return {
      label: result.label || 'neutral',
      score: typeof result.score === 'number' ? result.score : 0,
      confidence: result.confidence || 0.8,
    };
  } catch (error) {
    logger.error('OpenAI sentiment error:', error);
    return { label: 'neutral', score: 0, confidence: 0.5 };
  }
};

export default { generateChatResponse, analyzeSentiment };
