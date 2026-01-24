/**
 * ElderNest AI - Sentiment Service
 * Unified sentiment analysis using configured AI provider.
 */

import { config } from '../config/env';
import * as openaiService from './openai.service';
import * as geminiService from './gemini.service';
import { SentimentResult } from '../types';
import { logger } from '../utils/logger';

export const analyzeSentiment = async (text: string): Promise<SentimentResult> => {
  try {
    if (config.ai.defaultProvider === 'gemini' && config.ai.geminiApiKey) {
      return await geminiService.analyzeSentiment(text);
    }
    
    if (config.ai.openaiApiKey) {
      return await openaiService.analyzeSentiment(text);
    }

    // Fallback: simple rule-based sentiment
    return simpleSentimentAnalysis(text);
  } catch (error) {
    logger.error('Sentiment analysis error:', error);
    return simpleSentimentAnalysis(text);
  }
};

// Simple fallback sentiment analysis
const simpleSentimentAnalysis = (text: string): SentimentResult => {
  const lowerText = text.toLowerCase();
  
  const positiveWords = ['happy', 'good', 'great', 'wonderful', 'love', 'thank', 'better', 'well', 'fine', 'excellent', 'joy', 'pleased'];
  const negativeWords = ['sad', 'bad', 'pain', 'hurt', 'lonely', 'scared', 'worried', 'tired', 'sick', 'angry', 'frustrated', 'depressed', 'anxious', 'help'];
  
  let score = 0;
  
  positiveWords.forEach((word) => {
    if (lowerText.includes(word)) score += 0.2;
  });
  
  negativeWords.forEach((word) => {
    if (lowerText.includes(word)) score -= 0.2;
  });
  
  score = Math.max(-1, Math.min(1, score));
  
  let label: 'positive' | 'neutral' | 'negative' = 'neutral';
  if (score > 0.1) label = 'positive';
  if (score < -0.1) label = 'negative';
  
  return { label, score, confidence: 0.6 };
};

export const getMoodLabelFromSentiment = (sentiment: SentimentResult): string => {
  if (sentiment.score >= 0.6) return 'very_good';
  if (sentiment.score >= 0.2) return 'good';
  if (sentiment.score >= -0.2) return 'neutral';
  if (sentiment.score >= -0.6) return 'bad';
  return 'very_bad';
};

export const getMoodScoreFromSentiment = (sentiment: SentimentResult): number => {
  // Convert -1 to 1 scale to 0 to 1 scale
  return (sentiment.score + 1) / 2;
};

export default { analyzeSentiment, getMoodLabelFromSentiment, getMoodScoreFromSentiment };
