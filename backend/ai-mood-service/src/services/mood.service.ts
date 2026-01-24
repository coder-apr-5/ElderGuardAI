// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Mood Detection Service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Multi-signal mood detection for elderly care

import type {
    MoodAnalysis,
    MoodCategory,
    MoodScores,
    SentimentResult,
    ConversationContext,
    KeywordExtraction,
} from '../types';
import { logger } from '../utils/logger';

/**
 * Keywords associated with each mood category
 */
const MOOD_KEYWORDS: Record<MoodCategory, string[]> = {
    happy: [
        'happy', 'great', 'wonderful', 'enjoyed', 'fun', 'loved', 'blessed',
        'grateful', 'good day', 'feeling better', 'excited', 'joyful', 'pleased',
        'delighted', 'cheerful', 'content', 'relaxed', 'peaceful', 'fantastic',
        'amazing', 'lovely', 'beautiful', 'smiled', 'laughed', 'celebrated',
    ],
    sad: [
        'sad', 'depressed', 'down', 'crying', 'miss', 'lost', 'grief', 'upset',
        'blue', 'heartbroken', 'miserable', 'unhappy', 'sorrowful', 'tearful',
        'mourning', 'disappointed', 'devastated', 'gloomy', 'melancholy',
        'passed away', 'funeral', 'dying', 'regret', 'wish things were different',
    ],
    anxious: [
        'worried', 'nervous', 'anxious', 'scared', 'afraid', 'stress', 'overwhelmed',
        'panic', 'can\'t sleep', 'restless', 'uneasy', 'tense', 'frightened',
        'terrified', 'apprehensive', 'dread', 'concern', 'insomnia', 'nightmare',
        'racing thoughts', 'can\'t relax', 'on edge', 'jittery', 'fear',
    ],
    lonely: [
        'alone', 'lonely', 'nobody', 'isolated', 'miss', 'no one', 'by myself',
        'wish someone', 'no visitors', 'no calls', 'forgotten', 'abandoned',
        'left out', 'don\'t see anyone', 'no friends', 'no family around',
        'empty house', 'silent', 'quiet', 'nobody cares', 'all by myself',
    ],
    neutral: [
        'okay', 'fine', 'alright', 'same', 'usual', 'normal', 'regular',
        'nothing special', 'average', 'so-so', 'getting by', 'managing',
    ],
    distressed: [
        'help', 'emergency', 'pain', 'can\'t breathe', 'chest pain', 'fell',
        'hurt', 'crisis', 'unbearable', 'severe', 'terrible', 'awful',
        'want to die', 'hurt myself', 'give up', 'end it', 'suicide', '911',
        'ambulance', 'hospital', 'collapsed', 'unconscious', 'bleeding',
        'choking', 'heart attack', 'stroke', 'not waking up', 'unresponsive',
    ],
};

/**
 * Immediate distress keywords that should trigger alerts
 */
const IMMEDIATE_DISTRESS_KEYWORDS = [
    'help', 'emergency', '911', 'ambulance',
    'chest pain', 'can\'t breathe', 'fell down',
    'want to die', 'hurt myself', 'suicide',
    'heart attack', 'stroke', 'collapsed',
];

/**
 * Extract keywords and match them to mood categories
 */
function extractKeywords(text: string): KeywordExtraction {
    const normalizedText = text.toLowerCase();
    const keywords: string[] = [];
    const moodMatches: Record<MoodCategory, string[]> = {
        happy: [],
        sad: [],
        anxious: [],
        lonely: [],
        neutral: [],
        distressed: [],
    };

    // Check each mood category for keyword matches
    for (const [mood, moodKeywords] of Object.entries(MOOD_KEYWORDS)) {
        for (const keyword of moodKeywords) {
            if (normalizedText.includes(keyword)) {
                keywords.push(keyword);
                moodMatches[mood as MoodCategory].push(keyword);
            }
        }
    }

    return { keywords, moodMatches };
}

/**
 * Check if text contains immediate distress signals
 */
function checkImmediateDistress(text: string): boolean {
    const normalizedText = text.toLowerCase();
    return IMMEDIATE_DISTRESS_KEYWORDS.some(keyword =>
        normalizedText.includes(keyword)
    );
}

/**
 * Calculate mood score for a specific category
 */
function calculateMoodScore(
    mood: MoodCategory,
    keywordMatches: string[],
    sentiment: SentimentResult
): number {
    let score = 0;

    // Base score from keyword matches (0.2 per keyword, max 0.6)
    score += Math.min(0.6, keywordMatches.length * 0.2);

    // Adjust based on sentiment
    switch (mood) {
        case 'happy':
            if (sentiment.score > 0.3) score += 0.3;
            else if (sentiment.score > 0) score += 0.1;
            break;

        case 'sad':
        case 'distressed':
            if (sentiment.score < -0.3) score += 0.3;
            else if (sentiment.score < 0) score += 0.1;
            break;

        case 'anxious':
            if (sentiment.score < 0) score += 0.2;
            // Anxiety often comes with mixed signals
            if (sentiment.confidence < 0.6) score += 0.1;
            break;

        case 'lonely':
            if (sentiment.score < 0) score += 0.2;
            if (sentiment.score > -0.3 && sentiment.score < 0.1) score += 0.1;
            break;

        case 'neutral':
            if (sentiment.label === 'neutral') score += 0.4;
            if (keywordMatches.length === 0) score += 0.2;
            break;
    }

    return Math.min(1, score);
}

/**
 * Adjust scores based on conversation context
 */
function adjustScoresWithContext(
    scores: MoodScores,
    context: ConversationContext
): void {
    if (!context.moodHistory || context.moodHistory.length === 0) return;

    // Get recent mood history (last 5 analyses)
    const recentMoods = context.moodHistory.slice(-5);

    // Count mood occurrences
    const moodCounts: Partial<Record<MoodCategory, number>> = {};
    for (const analysis of recentMoods) {
        moodCounts[analysis.primary] = (moodCounts[analysis.primary] || 0) + 1;
    }

    // Boost scores for persistent moods
    for (const [mood, count] of Object.entries(moodCounts)) {
        if (count >= 3) {
            // Strong pattern - boost by 0.2
            scores[mood as MoodCategory] += 0.2;
        } else if (count >= 2) {
            // Moderate pattern - boost by 0.1
            scores[mood as MoodCategory] += 0.1;
        }
    }

    // Normalize scores to 0-1 range
    for (const mood of Object.keys(scores) as MoodCategory[]) {
        scores[mood] = Math.min(1, Math.max(0, scores[mood]));
    }
}

/**
 * Main mood detection function
 */
export async function detectMood(
    text: string,
    sentiment: SentimentResult,
    context?: ConversationContext
): Promise<MoodAnalysis> {
    try {
        // Check for immediate distress first
        if (checkImmediateDistress(text)) {
            logger.warn('Immediate distress detected', { text: text.slice(0, 100) });

            return {
                primary: 'distressed',
                confidence: 0.95,
                indicators: IMMEDIATE_DISTRESS_KEYWORDS.filter(k =>
                    text.toLowerCase().includes(k)
                ),
                sentiment,
            };
        }

        // Extract keywords
        const { keywords, moodMatches } = extractKeywords(text);

        // Calculate scores for each mood
        const scores: MoodScores = {
            happy: calculateMoodScore('happy', moodMatches.happy, sentiment),
            sad: calculateMoodScore('sad', moodMatches.sad, sentiment),
            anxious: calculateMoodScore('anxious', moodMatches.anxious, sentiment),
            lonely: calculateMoodScore('lonely', moodMatches.lonely, sentiment),
            neutral: calculateMoodScore('neutral', moodMatches.neutral, sentiment),
            distressed: calculateMoodScore('distressed', moodMatches.distressed, sentiment),
        };

        // Adjust scores with context if available
        if (context) {
            adjustScoresWithContext(scores, context);
        }

        // Find primary mood (highest score)
        const primary = (Object.keys(scores) as MoodCategory[]).reduce(
            (a, b) => (scores[a] > scores[b] ? a : b)
        );

        // Find secondary mood if score is significant
        const sortedMoods = (Object.entries(scores) as [MoodCategory, number][])
            .sort((a, b) => b[1] - a[1]);

        const secondary = sortedMoods[1][1] > 0.3 && sortedMoods[1][0] !== primary
            ? sortedMoods[1][0]
            : undefined;

        // Calculate confidence
        const confidence = scores[primary];

        return {
            primary,
            secondary,
            confidence: Math.max(0.3, confidence), // Minimum confidence of 0.3
            indicators: keywords,
            sentiment,
        };
    } catch (error) {
        logger.error('Mood detection error', { error });

        // Return safe default
        return {
            primary: 'neutral',
            confidence: 0.3,
            indicators: [],
            sentiment,
        };
    }
}

/**
 * Get mood trend from history
 */
export function getMoodTrend(
    moodHistory: MoodAnalysis[]
): 'improving' | 'declining' | 'stable' {
    if (moodHistory.length < 3) return 'stable';

    const recentMoods = moodHistory.slice(-7);

    // Count positive vs negative moods
    let positiveCount = 0;
    let negativeCount = 0;

    for (const mood of recentMoods) {
        if (mood.primary === 'happy') positiveCount++;
        if (['sad', 'anxious', 'lonely', 'distressed'].includes(mood.primary)) {
            negativeCount++;
        }
    }

    // Check first half vs second half
    const firstHalf = recentMoods.slice(0, Math.floor(recentMoods.length / 2));
    const secondHalf = recentMoods.slice(Math.floor(recentMoods.length / 2));

    const firstNegative = firstHalf.filter(m =>
        ['sad', 'anxious', 'lonely', 'distressed'].includes(m.primary)
    ).length;

    const secondNegative = secondHalf.filter(m =>
        ['sad', 'anxious', 'lonely', 'distressed'].includes(m.primary)
    ).length;

    if (secondNegative > firstNegative + 1) return 'declining';
    if (firstNegative > secondNegative + 1) return 'improving';

    return 'stable';
}

/**
 * Check if mood requires intervention
 */
export function requiresIntervention(mood: MoodAnalysis): boolean {
    return (
        mood.primary === 'distressed' ||
        (mood.primary === 'sad' && mood.confidence > 0.7) ||
        (mood.primary === 'lonely' && mood.confidence > 0.8)
    );
}

export default {
    detectMood,
    getMoodTrend,
    requiresIntervention,
    checkImmediateDistress,
};
