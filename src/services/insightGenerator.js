/**
 * INSIGHT GENERATOR
 * Tier 3: Converts validated data into actionable insights
 * 
 * INPUT: Array of validated analytics logs
 * OUTPUT: Student insights report with recommendations
 */

import { semanticValidate } from './semanticValidator.js';
import { getAtom } from '../data/mathAtoms.js';

/**
 * Generate comprehensive insights from session logs
 * @param {Array} logs - Array of student interaction logs (from analytics schema)
 * @returns {Object} - Comprehensive insights report
 */
export function generateStudentInsights(logs) {
    if (!logs || logs.length === 0) {
        return {
            status: 'NO_DATA',
            message: 'Complete at least one practice session to see insights.',
            data: null,
        };
    }

    // Calculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics(logs);

    // Identify hurdles and misconceptions
    const hurdles = identifyHurdles(logs);

    // Detect learning patterns
    const patterns = detectPatterns(logs);

    // Generate personalized recommendations
    const recommendations = generateRecommendations(
        performanceMetrics,
        hurdles,
        patterns
    );

    // Calculate semantic health score
    const semanticScore = calculateSemanticHealth(logs);

    return {
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        performanceMetrics,
        hurdles: hurdles.sorted,
        hurdleCount: hurdles.sorted.length,
        patterns,
        semanticScore,
        recommendations,
        nextActions: prioritizeNextActions(hurdles.sorted, patterns),
    };
}

/**
 * Calculate core performance metrics
 */
function calculatePerformanceMetrics(logs) {
    const total = logs.length;
    const correct = logs.filter(l => l.isCorrect).length;
    const incorrect = total - correct;
    const successRate = (correct / total * 100).toFixed(1);

    // Calculate confidence trend
    const confidences = logs.map(l => l.confidenceAfter || 0);
    const avgConfidence = (confidences.reduce((a, b) => a + b, 0) / confidences.length).toFixed(2);
    const confidenceTrend = confidences.length > 1
        ? confidences[confidences.length - 1] - confidences[0] > 0 ? 'GAINING' : 'LOSING'
        : 'NEUTRAL';

    // Calculate speed metrics
    const times = logs.map(l => l.timeSpent || 0);
    const avgTime = (times.reduce((a, b) => a + b, 0) / times.length / 1000).toFixed(1);
    const sprintCount = logs.filter(l => l.speedRating === 'SPRINT').length;

    // Determine trend
    const recentAccuracy = logs.slice(-5).filter(l => l.isCorrect).length / Math.min(5, logs.length);
    const overallAccuracy = successRate / 100;
    const trend = recentAccuracy > overallAccuracy
        ? 'IMPROVING'
        : recentAccuracy < overallAccuracy * 0.8
            ? 'STRUGGLING'
            : 'STABLE';

    return {
        successRate: `${successRate}%`,
        totalAttempts: total,
        correctAnswers: correct,
        incorrectAnswers: incorrect,
        averageConfidence: avgConfidence,
        confidenceTrend,
        averageResponseTime: `${avgTime}s`,
        sprintCount,
        trend,
        trendDescription: getTrendDescription(trend),
    };
}

/**
 * Identify misconceptions and hurdles
 */
function identifyHurdles(logs) {
    const hurdleMap = {};

    logs.forEach(log => {
        // Only look at incorrect answers with diagnosticTags
        if (!log.isCorrect && log.diagnosticTag) {
            const tag = log.diagnosticTag;
            if (!hurdleMap[tag]) {
                hurdleMap[tag] = {
                    tag,
                    name: getHurdleName(tag),
                    count: 0,
                    attempts: 0,
                    recovered: 0,
                    lastSeen: null,
                    recoveryVelocity: 0,
                };
            }
            hurdleMap[tag].count++;
            hurdleMap[tag].attempts++;
            hurdleMap[tag].lastSeen = log.timestamp;
            if (log.isRecovered) {
                hurdleMap[tag].recovered++;
            }
        }
    });

    // Calculate recovery velocity for each hurdle
    Object.values(hurdleMap).forEach(hurdle => {
        hurdle.recoveryVelocity = hurdle.attempts > 0
            ? (hurdle.recovered / hurdle.attempts * 100).toFixed(0)
            : 0;
        hurdle.severity = calculateHurdleSeverity(hurdle);
        hurdle.description = getHurdleDescription(hurdle.tag);
        hurdle.recovery = getHurdleRecoveryStrategy(hurdle.tag);
    });

    // Sort by severity
    const sorted = Object.values(hurdleMap)
        .sort((a, b) => {
            const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            return severityOrder[a.severity] - severityOrder[b.severity];
        });

    return {
        map: hurdleMap,
        sorted,
    };
}

/**
 * Calculate severity of each hurdle
 * (Count + Low Recovery Velocity = Critical)
 */
function calculateHurdleSeverity(hurdle) {
    if (hurdle.count >= 3 && hurdle.recoveryVelocity < 30) {
        return 'CRITICAL';
    }
    if (hurdle.count >= 2 && hurdle.recoveryVelocity < 50) {
        return 'HIGH';
    }
    if (hurdle.count >= 1 && hurdle.recoveryVelocity < 70) {
        return 'MEDIUM';
    }
    return 'LOW';
}

/**
 * Detect learning patterns
 */
function detectPatterns(logs) {
    const patterns = {
        luckyGuesses: [],
        hiddenMisconceptions: [],
        resistantMisconceptions: [],
        slowProcessing: [],
        dataQualityIssues: [],
    };

    logs.forEach(log => {
        // Lucky Guess: Correct + SPRINT + Low confidence
        if (log.isCorrect && log.speedRating === 'SPRINT' && log.confidenceAfter < 0.5) {
            patterns.luckyGuesses.push({
                questionId: log.questionId,
                message: 'Lucky guess detected - consider reviewing this concept',
            });
        }

        // Hidden Misconception: Confident but wrong
        if (!log.isCorrect && log.confidenceBefore > 0.7) {
            patterns.hiddenMisconceptions.push({
                tag: log.diagnosticTag,
                message: `High confidence but wrong answer suggests hidden misconception`,
            });
        }

        // Resistant Misconception: Multiple attempts, slow recovery
        if (log.isRecovered && log.timeSpent > 5000) {
            patterns.resistantMisconceptions.push({
                tag: log.diagnosticTag,
                message: 'Takes long time to recover from this error',
            });
        }

        // Slow Processing
        if (log.timeSpent > 10000 && log.speedRating === 'DEEP') {
            patterns.slowProcessing.push({
                questionId: log.questionId,
                timeSpent: log.timeSpent,
            });
        }

        // Data Quality Issues
        if (!log.studentAnswer && log.isCorrect) {
            patterns.dataQualityIssues.push({
                questionId: log.questionId,
                issue: 'Missing student answer',
            });
        }
    });

    return patterns;
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(metrics, hurdles, patterns) {
    const recs = [];

    // Recommendation 1: Focus on top hurdle
    if (hurdles.sorted.length > 0) {
        const topHurdle = hurdles.sorted[0];
        recs.push({
            priority: 1,
            category: 'FOCUS_AREA',
            message: `Your top challenge: ${topHurdle.name} (${topHurdle.count} mistakes)`,
            action: `Review the concept, then solve 3 guided examples and 5 practice problems`,
            timeEstimate: '15 minutes',
            urgency: topHurdle.severity,
        });
    }

    // Recommendation 2: Confidence trend
    if (metrics.confidenceTrend === 'LOSING') {
        recs.push({
            priority: 2,
            category: 'CONFIDENCE',
            message: 'Your confidence is decreasing. Time to slow down and regroup.',
            action: 'Take a 5-minute break, review successful past problems, then restart',
            timeEstimate: '10 minutes',
            urgency: 'HIGH',
        });
    }

    // Recommendation 3: Lucky guesses
    if (patterns.luckyGuesses.length > 2) {
        recs.push({
            priority: 3,
            category: 'VERIFICATION',
            message: `${patterns.luckyGuesses.length} lucky guesses detected. Don't trust speed.`,
            action: 'Slow down and think through each step',
            timeEstimate: 'Ongoing',
            urgency: 'MEDIUM',
        });
    }

    // Recommendation 4: Hidden misconceptions
    if (patterns.hiddenMisconceptions.length > 0) {
        recs.push({
            priority: 4,
            category: 'MISCONCEPTION',
            message: 'You feel confident but made mistakes. This suggests a hidden misconception.',
            action: 'Ask your teacher to clarify this concept',
            timeEstimate: '5 minutes with teacher',
            urgency: 'MEDIUM',
        });
    }

    // Recommendation 5: Speed variation
    const sprintRate = (metrics.sprintCount / metrics.totalAttempts * 100).toFixed(0);
    if (sprintRate > 50) {
        recs.push({
            priority: 5,
            category: 'PACE',
            message: `You're rushing on ${sprintRate}% of questions. Accuracy suffers.`,
            action: 'Aim for DEEP thinking (take your time to understand, not just answer)',
            timeEstimate: 'Ongoing',
            urgency: 'MEDIUM',
        });
    }

    return recs.sort((a, b) => a.priority - b.priority);
}

/**
 * Prioritize next actions for student
 */
function prioritizeNextActions(hurdles, patterns) {
    const actions = [];

    if (hurdles.length === 0) {
        return [{
            step: 1,
            action: 'Take another practice session',
            time: '10 minutes',
            reason: 'Build confidence and identify subtle gaps',
        }];
    }

    const topHurdle = hurdles[0];
    actions.push({
        step: 1,
        action: `Review: ${topHurdle.name}`,
        time: '3 minutes',
        reason: `You made ${topHurdle.count} mistakes on this`,
    });

    actions.push({
        step: 2,
        action: `Guided examples: ${topHurdle.name}`,
        time: '5 minutes',
        reason: 'Work through examples with step-by-step help',
    });

    actions.push({
        step: 3,
        action: `Practice: 5 problems on ${topHurdle.name}`,
        time: '8 minutes',
        reason: 'Build fluency and confidence',
    });

    if (hurdles.length > 1) {
        const secondHurdle = hurdles[1];
        actions.push({
            step: 4,
            action: `Light review: ${secondHurdle.name}`,
            time: '3 minutes',
            reason: `Also saw some mistakes (${secondHurdle.count}) - reinforce`,
        });
    }

    const totalTime = actions
        .reduce((sum, a) => sum + parseInt(a.time), 0);

    actions.push({
        step: 'TOTAL',
        action: 'Time to master these concepts',
        time: `~${totalTime} minutes`,
        reason: 'Focused practice with feedback',
    });

    return actions;
}

/**
 * Calculate overall semantic health score (0-100)
 * Combines data quality, pedagogical soundness, and insights quality
 */
function calculateSemanticHealth(logs) {
    let score = 100;

    // Deduct for data quality issues
    const qualityIssues = logs.filter(l => !l.studentAnswer || !l.diagnosticTag).length;
    score -= qualityIssues * 5;

    // Deduct for lucky guesses (indicate poor data quality)
    const luckyGuesses = logs.filter(
        l => l.isCorrect && l.speedRating === 'SPRINT' && l.confidenceAfter < 0.5
    ).length;
    score -= luckyGuesses * 3;

    // Deduct for hidden misconceptions (data quality issue)
    const hiddenMisconceptions = logs.filter(
        l => !l.isCorrect && l.confidenceBefore > 0.7
    ).length;
    score -= hiddenMisconceptions * 5;

    return Math.max(0, Math.min(100, score));
}

/**
 * Helper: Get hurdle name from tag
 */
function getHurdleName(tag) {
    const names = {
        SIGN_IGNORANCE: 'Sign Mistakes (+ and - confusion)',
        FRACTION_ADDITION: 'Adding Fractions',
        ADDS_DENOMINATORS: 'Adding Denominators (Wrong!)',
        INVERTED_FRACTION: 'Inverted Fractions (flipped)',
        IGNORES_SHADED: 'Misreading Visuals',
        MULTIPLIES_EXPONENTS: 'Exponent Mistakes',
        CONFUSES_WITH_QUADRILATERAL: 'Triangle vs Quadrilateral',
    };
    return names[tag] || tag;
}

/**
 * Helper: Get hurdle description
 */
function getHurdleDescription(tag) {
    const descriptions = {
        SIGN_IGNORANCE: 'You\'re forgetting +/- signs. This is costing you points.',
        ADDS_DENOMINATORS: 'Common mistake: when adding fractions, keep the denominator the same!',
        INVERTED_FRACTION: 'You\'re flipping numerator and denominator.',
        MULTIPLIES_EXPONENTS: 'When combining like terms, add coefficients—don\'t multiply exponents.',
    };
    return descriptions[tag] || 'You struggled with this concept.';
}

/**
 * Helper: Get recovery strategy
 */
function getHurdleRecoveryStrategy(tag) {
    const strategies = {
        SIGN_IGNORANCE: [
            'Step 1: Say the signs out loud: "negative three plus positive five"',
            'Step 2: Use a number line to visualize',
            'Step 3: Practice 5 more problems with this pattern',
        ],
        ADDS_DENOMINATORS: [
            'Step 1: Remember: denominators must be SAME, numerators ADD',
            'Step 2: Shade two fractions to visualize',
            'Step 3: Solve 5 similar problems',
        ],
    };
    return strategies[tag] || ['Review the concept', 'Try again with hints', 'Ask your teacher'];
}

/**
 * Helper: Get trend description
 */
function getTrendDescription(trend) {
    const descriptions = {
        IMPROVING: '📈 You\'re getting better! Keep it up.',
        STRUGGLING: '⚠️ You need help on this topic.',
        STABLE: '➡️ Consistent performance. Ready for harder problems?',
    };
    return descriptions[trend] || '';
}

/**
 * Generate teacher-facing insights
 */
export function generateTeacherInsights(studentLogs, classLogs) {
    const studentInsights = generateStudentInsights(studentLogs);

    // Class-wide analysis
    const classHurdles = {};
    classLogs.forEach(log => {
        if (log.diagnosticTag) {
            classHurdles[log.diagnosticTag] = (classHurdles[log.diagnosticTag] || 0) + 1;
        }
    });

    const topClassHurdles = Object.entries(classHurdles)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({
            tag,
            count,
            affectedStudents: 'TBD', // Would compute from class roster
        }));

    return {
        studentInsights,
        classAnalysis: {
            topHurdles: topClassHurdles,
            recommendedFocus: topClassHurdles[0]?.tag || 'General Review',
            studentsNeedingIntervention: [], // Compute from thresholds
        },
    };
}

export default {
    generateStudentInsights,
    generateTeacherInsights,
};