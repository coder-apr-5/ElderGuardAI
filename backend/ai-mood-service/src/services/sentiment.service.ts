// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sentiment Analysis Service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Hybrid sentiment analysis using local libraries and optional AI enhancement

import Sentiment from 'sentiment';
import natural from 'natural';
import nlp from 'compromise';
import type { SentimentResult, AISentimentResponse } from '../types';
import { getGroqClient } from '../config/groq';
import { getGeminiModel } from '../config/gemini';
import { config } from '../config/env';
import { logger } from '../utils/logger';

// Initialize sentiment analyzer
const sentimentAnalyzer = new Sentiment();

// Custom word lists for elderly care context
const ELDERLY_POSITIVE_WORDS: Record<string, number> = {
    family: 3,
    visited: 3,
    better: 2,
    happy: 4,
    enjoyed: 3,
    loved: 4,
    grandchildren: 4,
    grandson: 3,
    granddaughter: 3,
    children: 2,
    daughter: 2,
    son: 2,
    friend: 3,
    blessed: 4,
    grateful: 4,
    thankful: 3,
    wonderful: 4,
    lovely: 3,
    beautiful: 3,
    peaceful: 3,
    comfortable: 2,
    rested: 2,
    walked: 2,
    exercise: 2,
    garden: 2,
    church: 2,
    community: 2,
    laughed: 4,
    smiled: 3,
    hugged: 4,
};

const ELDERLY_NEGATIVE_WORDS: Record<string, number> = {
    alone: -3,
    lonely: -4,
    pain: -4,
    ache: -3,
    tired: -2,
    exhausted: -3,
    sad: -4,
    worried: -3,
    scared: -4,
    afraid: -4,
    forgot: -2,
    confused: -3,
    lost: -3,
    miss: -2,
    passed: -3,
    died: -4,
    funeral: -3,
    hospital: -2,
    doctor: -1,
    medicine: -1,
    pills: -1,
    hurts: -4,
    aching: -3,
    dizzy: -3,
    weak: -3,
    fallen: -4,
    fell: -3,
    nobody: -4,
    'no one': -4,
    isolated: -4,
    burden: -4,
    useless: -4,
    helpless: -4,
    hopeless: -5,
    'can\'t sleep': -3,
    insomnia: -3,
    nightmare: -3,
};

// Register custom words with sentiment analyzer
sentimentAnalyzer.registerLanguage('en', {
    labels: { ...ELDERLY_POSITIVE_WORDS, ...ELDERLY_NEGATIVE_WORDS },
});

/**
 * Analyze sentiment using local libraries (fast, no API cost)
 */
export async function localSentimentAnalysis(text: string): Promise<SentimentResult> {
    try {
        // Basic sentiment analysis
        const result = sentimentAnalyzer.analyze(text);

        // Use natural for tokenization (kept for future enhancements)
        new natural.WordTokenizer().tokenize(text.toLowerCase());

        // Use compromise for advanced NLP (negations, intensifiers)
        const doc = nlp(text);
        const negations = doc.match('#Negative').out('array');
        const hasNegation = negations.length > 0 || /\b(not|no|never|don't|doesn't|didn't|won't|can't|couldn't|shouldn't)\b/i.test(text);

        // Adjust score for negations
        let adjustedScore = result.comparative;
        if (hasNegation && adjustedScore > 0) {
            adjustedScore = -adjustedScore * 0.5; // Flip positive to negative
        }

        // Check for intensifiers
        const intensifiers = /\b(very|really|so|extremely|incredibly|absolutely|totally)\b/i;
        if (intensifiers.test(text)) {
            adjustedScore *= 1.5;
        }

        // Normalize score to -1 to 1 range
        const normalizedScore = Math.max(-1, Math.min(1, adjustedScore));

        // Calculate confidence based on token matches
        const matchedTokens = result.positive.length + result.negative.length;
        const confidence = Math.min(0.95, 0.5 + (matchedTokens * 0.1));

        // Determine label
        let label: 'positive' | 'neutral' | 'negative';
        if (normalizedScore > 0.2) {
            label = 'positive';
        } else if (normalizedScore < -0.2) {
            label = 'negative';
        } else {
            label = 'neutral';
        }

        return {
            score: normalizedScore,
            comparative: result.comparative,
            label,
            confidence,
            tokens: [...result.positive, ...result.negative],
        };
    } catch (error) {
        logger.error('Local sentiment analysis error', { error });
        // Return neutral result on error
        return {
            score: 0,
            comparative: 0,
            label: 'neutral',
            confidence: 0.3,
            tokens: [],
        };
    }
}

/**
 * Analyze sentiment using AI (more nuanced, has API cost)
 */
export async function aiSentimentAnalysis(text: string): Promise<SentimentResult> {
    const prompt = `Analyze the emotional tone of this text from an elderly person. Consider context like loneliness, health concerns, and family relationships.

Text: "${text}"

Respond ONLY with valid JSON (no markdown, no explanation):
{"score": number between -1 and 1, "label": "positive" or "neutral" or "negative", "confidence": number between 0 and 1, "reasoning": "brief explanation"}`;

    try {
        if (config.aiProvider === 'groq') {
            const client = getGroqClient();
            if (!client) {
                return localSentimentAnalysis(text);
            }

            const response = await client.chat.completions.create({
                model: config.groqModel,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.3,
                max_tokens: 100,
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                return localSentimentAnalysis(text);
            }

            const aiResult: AISentimentResponse = JSON.parse(content);

            return {
                score: aiResult.score,
                comparative: aiResult.score,
                label: aiResult.label,
                confidence: aiResult.confidence,
                tokens: [],
            };
        } else {
            const model = getGeminiModel();
            if (!model) {
                return localSentimentAnalysis(text);
            }

            const result = await model.generateContent(prompt);
            const content = result.response.text();

            // Parse JSON from response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                return localSentimentAnalysis(text);
            }

            const aiResult: AISentimentResponse = JSON.parse(jsonMatch[0]);

            return {
                score: aiResult.score,
                comparative: aiResult.score,
                label: aiResult.label,
                confidence: aiResult.confidence,
                tokens: [],
            };
        }
    } catch (error) {
        logger.error('AI sentiment analysis error, falling back to local', { error });
        return localSentimentAnalysis(text);
    }
}

/**
 * Main sentiment analysis function
 * @param text - Text to analyze
 * @param useAI - Whether to use AI-enhanced analysis (default: false)
 */
export async function analyzeSentiment(text: string, useAI = false): Promise<SentimentResult> {
    if (useAI) {
        return aiSentimentAnalysis(text);
    }
    return localSentimentAnalysis(text);
}

/**
 * Quick sentiment check (returns just the label)
 */
export async function quickSentimentCheck(text: string): Promise<'positive' | 'neutral' | 'negative'> {
    const result = await localSentimentAnalysis(text);
    return result.label;
}

/**
 * Calculate average sentiment from multiple texts
 */
export function averageSentiment(results: SentimentResult[]): number {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return sum / results.length;
}

export default {
    analyzeSentiment,
    localSentimentAnalysis,
    aiSentimentAnalysis,
    quickSentimentCheck,
    averageSentiment,
};
