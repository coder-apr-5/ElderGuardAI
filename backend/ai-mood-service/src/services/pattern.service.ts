// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Pattern Recognition Service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Behavioral pattern detection for elderly wellbeing monitoring

import type {
    ConversationContext,
    PatternDetection,
    ChatMessage,
} from '../types';
import { logger } from '../utils/logger';

/**
 * Keywords indicating health concerns
 */
const HEALTH_KEYWORDS = [
    'pain', 'ache', 'hurts', 'sore', 'headache', 'dizzy', 'nausea',
    'tired', 'exhausted', 'weak', 'medicine', 'pills', 'medication',
    'doctor', 'hospital', 'appointment', 'surgery', 'symptoms',
    'blood pressure', 'diabetes', 'arthritis', 'heart', 'breathing',
    'fell', 'fall', 'tripped', 'balance', 'memory', 'forget', 'confused',
    'can\'t sleep', 'insomnia', 'appetite', 'eating', 'weight',
];

/**
 * Keywords indicating social isolation
 */
const ISOLATION_KEYWORDS = [
    'alone', 'lonely', 'no visitors', 'nobody called', 'no one',
    'by myself', 'isolated', 'haven\'t seen', 'nobody comes',
    'empty house', 'quiet', 'silent', 'miss family', 'wish someone',
    'don\'t see anyone', 'no friends', 'forgotten',
];

/**
 * Keywords indicating social engagement (positive)
 */
const SOCIAL_KEYWORDS = [
    'visited', 'called', 'talked to', 'saw', 'met', 'friend',
    'family', 'daughter', 'son', 'grandchildren', 'neighbor',
    'church', 'community', 'group', 'together', 'lunch with',
    'dinner with', 'coffee with', 'walk with',
];

/**
 * Keywords indicating concerning mental state
 */
const CONCERNING_KEYWORDS = [
    'hopeless', 'worthless', 'useless', 'burden', 'give up',
    'don\'t want to', 'what\'s the point', 'tired of',
    'nobody cares', 'alone forever', 'no reason',
];

/**
 * Extract user messages from conversations
 */
function extractUserMessages(
    conversations: ConversationContext[],
    cutoffDate: Date
): string[] {
    const messages: string[] = [];

    for (const context of conversations) {
        if (context.conversationStarted >= cutoffDate) {
            for (const message of context.messages) {
                if (message.role === 'user') {
                    messages.push(message.content.toLowerCase());
                }
            }
        }
    }

    return messages;
}

/**
 * Count keyword occurrences across messages
 */
function countKeywords(messages: string[], keywords: string[]): Map<string, number> {
    const counts = new Map<string, number>();

    for (const message of messages) {
        for (const keyword of keywords) {
            if (message.includes(keyword)) {
                counts.set(keyword, (counts.get(keyword) || 0) + 1);
            }
        }
    }

    return counts;
}

/**
 * Detect repeated complaints (mentioned 3+ times)
 */
function detectRepeatedComplaints(
    healthCounts: Map<string, number>,
    concerningCounts: Map<string, number>
): string[] {
    const repeated: string[] = [];

    for (const [keyword, count] of healthCounts) {
        if (count >= 3) {
            repeated.push(keyword);
        }
    }

    for (const [keyword, count] of concerningCounts) {
        if (count >= 3) {
            repeated.push(keyword);
        }
    }

    return repeated;
}

/**
 * Check for withdrawal patterns (shorter responses over time)
 */
function detectWithdrawal(messages: ChatMessage[]): boolean {
    if (messages.length < 10) return false;

    // Compare first half vs second half average message length
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length < 6) return false;

    const midpoint = Math.floor(userMessages.length / 2);
    const firstHalf = userMessages.slice(0, midpoint);
    const secondHalf = userMessages.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.content.length, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.content.length, 0) / secondHalf.length;

    // If average message length dropped by more than 40%, flag as withdrawal
    return secondAvg < firstAvg * 0.6;
}

/**
 * Main pattern analysis function
 */
export async function analyzePatterns(
    userId: string,
    recentConversations: ConversationContext[],
    timeWindowDays = 7
): Promise<PatternDetection> {
    try {
        const patterns: PatternDetection = {
            repeatedComplaints: [],
            concerningKeywords: [],
            isolationIndicators: false,
            healthMentions: [],
            negativePatternCount: 0,
            withdrawalDetected: false,
            socialMentions: 0,
        };

        // Calculate cutoff date
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeWindowDays);

        // Filter conversations within time window
        const relevantConversations = recentConversations.filter(
            c => c.conversationStarted >= cutoffDate
        );

        if (relevantConversations.length === 0) {
            logger.debug('No conversations in time window for pattern analysis', { userId, timeWindowDays });
            return patterns;
        }

        // Extract all user messages
        const messages = extractUserMessages(relevantConversations, cutoffDate);

        if (messages.length === 0) {
            return patterns;
        }

        // Count keyword occurrences
        const healthCounts = countKeywords(messages, HEALTH_KEYWORDS);
        const isolationCounts = countKeywords(messages, ISOLATION_KEYWORDS);
        const socialCounts = countKeywords(messages, SOCIAL_KEYWORDS);
        const concerningCounts = countKeywords(messages, CONCERNING_KEYWORDS);

        // Detect repeated complaints
        patterns.repeatedComplaints = detectRepeatedComplaints(healthCounts, concerningCounts);

        // Collect health mentions
        patterns.healthMentions = Array.from(healthCounts.keys());

        // Collect concerning keywords
        patterns.concerningKeywords = Array.from(concerningCounts.keys());

        // Check for isolation indicators
        const isolationTotal = Array.from(isolationCounts.values()).reduce((a, b) => a + b, 0);
        const socialTotal = Array.from(socialCounts.values()).reduce((a, b) => a + b, 0);
        patterns.socialMentions = socialTotal;

        // Isolation is indicated if:
        // 1. 3+ isolation keywords OR
        // 2. No social mentions in 5+ days with some conversation
        if (isolationTotal >= 3 || (socialTotal === 0 && timeWindowDays >= 5 && messages.length >= 5)) {
            patterns.isolationIndicators = true;
        }

        // Check for withdrawal patterns
        const allMessages = relevantConversations.flatMap(c => c.messages);
        patterns.withdrawalDetected = detectWithdrawal(allMessages);

        // Count negative patterns
        if (patterns.isolationIndicators) patterns.negativePatternCount++;
        if (patterns.withdrawalDetected) patterns.negativePatternCount++;
        if (patterns.repeatedComplaints.length > 0) patterns.negativePatternCount++;
        if (patterns.concerningKeywords.length > 0) patterns.negativePatternCount++;

        logger.debug('Pattern analysis complete', {
            userId,
            patternsFound: patterns.negativePatternCount,
            healthMentions: patterns.healthMentions.length,
        });

        return patterns;
    } catch (error) {
        logger.error('Pattern analysis error', { error, userId });

        // Return empty patterns on error
        return {
            repeatedComplaints: [],
            concerningKeywords: [],
            isolationIndicators: false,
            healthMentions: [],
            negativePatternCount: 0,
            withdrawalDetected: false,
            socialMentions: 0,
        };
    }
}

/**
 * Quick check for concerning patterns in a single message
 */
export function quickPatternCheck(text: string): {
    hasConcerning: boolean;
    hasHealth: boolean;
    hasIsolation: boolean;
} {
    const normalized = text.toLowerCase();

    return {
        hasConcerning: CONCERNING_KEYWORDS.some(k => normalized.includes(k)),
        hasHealth: HEALTH_KEYWORDS.some(k => normalized.includes(k)),
        hasIsolation: ISOLATION_KEYWORDS.some(k => normalized.includes(k)),
    };
}

/**
 * Calculate isolation score (0-1)
 */
export function calculateIsolationScore(
    isolationMentions: number,
    socialMentions: number,
    daysWithoutSocial: number
): number {
    let score = 0;

    // Base score from isolation mentions
    score += Math.min(0.4, isolationMentions * 0.1);

    // Increase if no social mentions
    if (socialMentions === 0) {
        score += 0.2;
    } else if (isolationMentions > socialMentions * 2) {
        score += 0.1;
    }

    // Increase for prolonged lack of social interaction
    if (daysWithoutSocial >= 7) {
        score += 0.3;
    } else if (daysWithoutSocial >= 4) {
        score += 0.2;
    }

    return Math.min(1, score);
}

export default {
    analyzePatterns,
    quickPatternCheck,
    calculateIsolationScore,
};
