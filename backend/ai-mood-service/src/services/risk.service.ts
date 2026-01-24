// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Risk Scoring Service
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Weighted rule-based risk assessment (no ML required)

import type {
    RiskAssessment,
    RiskLevel,
    ConversationContext,
    PatternDetection,
    MoodAnalysis,
} from '../types';
import { config } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Risk factor weights (out of 100 total points)
 */
const RISK_WEIGHTS = {
    SENTIMENT: 20,      // Average sentiment score
    MOOD_PATTERN: 25,   // Mood distribution
    ISOLATION: 20,      // Social isolation indicators
    HEALTH: 15,         // Health concerns
    NEGATIVE_PATTERNS: 20, // Behavioral patterns
};

/**
 * Calculate average sentiment from conversation history
 */
function calculateAverageSentiment(conversations: ConversationContext[]): number {
    const allMoods = conversations.flatMap(c => c.moodHistory || []);

    if (allMoods.length === 0) return 0;

    const sentimentScores = allMoods.map(m => m.sentiment?.score || 0);
    return sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length;
}

/**
 * Count mood occurrences
 */
function countMoodOccurrences(
    conversations: ConversationContext[]
): Record<string, number> {
    const counts: Record<string, number> = {
        happy: 0,
        sad: 0,
        anxious: 0,
        lonely: 0,
        neutral: 0,
        distressed: 0,
    };

    for (const context of conversations) {
        for (const mood of context.moodHistory || []) {
            if (mood.primary in counts) {
                counts[mood.primary]++;
            }
        }
    }

    return counts;
}

/**
 * Main risk calculation function
 */
export async function calculateRisk(
    userId: string,
    conversations: ConversationContext[],
    patterns: PatternDetection
): Promise<RiskAssessment> {
    try {
        let riskScore = 0;
        const factors: string[] = [];
        const recommendations: string[] = [];

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 1. SENTIMENT ANALYSIS (20 points max)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const avgSentiment = calculateAverageSentiment(conversations);

        if (avgSentiment < -0.5) {
            riskScore += RISK_WEIGHTS.SENTIMENT;
            factors.push('Persistent negative mood detected');
            recommendations.push('Schedule check-in call with family member');
        } else if (avgSentiment < -0.2) {
            riskScore += RISK_WEIGHTS.SENTIMENT * 0.5;
            factors.push('Below-average mood recently');
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 2. MOOD PATTERNS (25 points max)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        const moodCounts = countMoodOccurrences(conversations);

        // Distress signals are critical (10 points each, max 25)
        if (moodCounts.distressed > 0) {
            const distressPoints = Math.min(RISK_WEIGHTS.MOOD_PATTERN, moodCounts.distressed * 10);
            riskScore += distressPoints;
            factors.push(`${moodCounts.distressed} distress signal(s) detected`);
            recommendations.push('URGENT: Contact elder immediately');
        }

        // Check if sad/anxious moods predominate
        const negativeTotal = moodCounts.sad + moodCounts.anxious + moodCounts.lonely;
        const positiveTotal = moodCounts.happy;

        if (negativeTotal > positiveTotal * 2 && negativeTotal >= 3) {
            riskScore += 15;
            factors.push('Predominantly negative mood pattern');
            recommendations.push('Consider mental health support resources');
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 3. ISOLATION INDICATORS (20 points max)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (patterns.isolationIndicators) {
            riskScore += RISK_WEIGHTS.ISOLATION;
            factors.push('Signs of social isolation');
            recommendations.push('Encourage social activities or family visits');
        } else if (patterns.socialMentions === 0 && conversations.length >= 5) {
            // No social mentions might indicate isolation
            riskScore += RISK_WEIGHTS.ISOLATION * 0.5;
            factors.push('Limited social interaction mentions');
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 4. HEALTH CONCERNS (15 points max)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (patterns.healthMentions.length >= 3) {
            riskScore += RISK_WEIGHTS.HEALTH;
            factors.push(`Multiple health concerns: ${patterns.healthMentions.slice(0, 3).join(', ')}`);
            recommendations.push('Suggest medical consultation');
        } else if (patterns.healthMentions.length > 0) {
            riskScore += RISK_WEIGHTS.HEALTH * 0.5;
            factors.push('Some health mentions noted');
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // 5. NEGATIVE PATTERNS (20 points max)
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        if (patterns.repeatedComplaints.length > 0) {
            riskScore += 10;
            factors.push(`Repeated concerns: ${patterns.repeatedComplaints.slice(0, 3).join(', ')}`);
        }

        if (patterns.withdrawalDetected) {
            riskScore += 10;
            factors.push('Withdrawal pattern detected (shorter responses)');
            recommendations.push('Increase engagement frequency');
        }

        if (patterns.concerningKeywords.length > 0) {
            riskScore += 10;
            factors.push('Concerning language patterns detected');
            recommendations.push('Review recent conversations for context');
        }

        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        // NORMALIZE AND DETERMINE RISK LEVEL
        // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

        // Normalize to 0-1 scale (max possible = 100)
        const normalizedScore = Math.min(1, riskScore / 100);

        // Determine risk level based on thresholds
        let riskLevel: RiskLevel;

        if (normalizedScore >= config.riskHighThreshold) {
            riskLevel = 'high';
            recommendations.unshift('⚠️ IMMEDIATE ACTION REQUIRED');
        } else if (normalizedScore >= config.riskMonitorThreshold) {
            riskLevel = 'monitor';
            recommendations.push('Increase monitoring frequency');
        } else {
            riskLevel = 'safe';
            recommendations.push('Continue regular check-ins');
        }

        // Ensure we have at least one factor
        if (factors.length === 0) {
            factors.push('No major concerns detected');
        }

        logger.info('Risk assessment completed', {
            userId,
            riskLevel,
            riskScore: normalizedScore,
            factorCount: factors.length,
        });

        return {
            riskLevel,
            riskScore: normalizedScore,
            factors,
            recommendations,
            timestamp: new Date(),
        };
    } catch (error) {
        logger.error('Risk calculation error', { error, userId });

        // Return safe default on error
        return {
            riskLevel: 'safe',
            riskScore: 0,
            factors: ['Unable to complete risk assessment'],
            recommendations: ['Retry risk calculation', 'Manual review recommended'],
            timestamp: new Date(),
        };
    }
}

/**
 * Quick risk check based on single message
 */
export function quickRiskCheck(mood: MoodAnalysis): {
    isUrgent: boolean;
    suggestedAction?: string;
} {
    if (mood.primary === 'distressed' && mood.confidence > 0.7) {
        return {
            isUrgent: true,
            suggestedAction: 'Immediate contact with elder or emergency services required',
        };
    }

    if (mood.primary === 'distressed') {
        return {
            isUrgent: true,
            suggestedAction: 'Verify elder wellbeing as soon as possible',
        };
    }

    if (['sad', 'anxious', 'lonely'].includes(mood.primary) && mood.confidence > 0.8) {
        return {
            isUrgent: false,
            suggestedAction: 'Consider reaching out for a supportive conversation',
        };
    }

    return { isUrgent: false };
}

/**
 * Get risk summary for reporting
 */
export function getRiskSummary(assessment: RiskAssessment): string {
    const levelEmoji = {
        safe: '✅',
        monitor: '⚠️',
        high: '🚨',
    };

    const summary = [
        `${levelEmoji[assessment.riskLevel]} Risk Level: ${assessment.riskLevel.toUpperCase()}`,
        `Score: ${(assessment.riskScore * 100).toFixed(0)}%`,
        '',
        'Factors:',
        ...assessment.factors.map(f => `  • ${f}`),
        '',
        'Recommendations:',
        ...assessment.recommendations.map(r => `  • ${r}`),
    ];

    return summary.join('\n');
}

export default {
    calculateRisk,
    quickRiskCheck,
    getRiskSummary,
};
