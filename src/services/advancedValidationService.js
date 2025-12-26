/**
 * BLUE NINJA - Advanced Validation Service (Production Ready)
 * File: src/services/advancedValidationService.js
 * 
 * This is the enterprise-grade analytics validation pipeline that replaces
 * the basic 12-field check. It provides 4 tiers of validation with 25+ quality gates.
 */

import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// PART 1: SCHEMA DEFINITION
// ============================================================================

const SCHEMA_DEFINITION = {
    questionId: {
        type: 'string',
        minLength: 3,
        maxLength: 100,
        required: true,
        description: 'Unique identifier for the question'
    },
    studentAnswer: {
        type: 'string',
        required: true,
        minLength: 1,
        description: 'The answer provided by the student'
    },
    correctAnswer: {
        type: 'string',
        required: true,
        minLength: 1,
        description: 'Ground truth: the correct answer'
    },
    isCorrect: {
        type: 'boolean',
        required: true,
        description: 'Whether the student answered correctly'
    },
    timeSpent: {
        type: 'number',
        min: 50,
        max: 600000,
        required: true,
        description: 'Time spent on question in milliseconds (50ms to 10min)'
    },
    timestamp: {
        type: 'Date',
        required: true,
        description: 'When the attempt was made'
    },
    atomId: {
        type: 'string',
        required: true,
        pattern: /^atom_[a-z0-9_]+$/,
        description: 'Curriculum unit identifier'
    },
    diagnosticTag: {
        type: 'string',
        required: true,
        minLength: 1,
        description: 'Identifies the specific misconception/hurdle being targeted'
    },
    speedRating: {
        type: 'enum',
        values: ['SPRINT', 'STEADY', 'DEEP'],
        required: true,
        description: 'Categorization of thinking speed'
    },
    masteryBefore: {
        type: 'number',
        min: 0,
        max: 1,
        required: true,
        description: 'Student confidence before attempt (0-1)'
    },
    masteryAfter: {
        type: 'number',
        min: 0,
        max: 1,
        required: true,
        description: 'Student confidence after attempt (0-1)'
    },
    isRecovery: {
        type: 'boolean',
        default: false,
        description: 'Whether this is a bonus mission recovery attempt'
    },
    primaryTime: {
        type: 'number',
        min: 50,
        max: 600000,
        required: false, // Required only if isRecovery=true
        description: 'Time spent on original (primary) attempt'
    },
    recoveryTime: {
        type: 'number',
        min: 50,
        max: 600000,
        required: false, // Required only if isRecovery=true
        description: 'Time spent on recovery attempt'
    },
    recoveryVelocity: {
        type: 'number',
        min: -1,
        max: 1,
        required: false, // Required only if isRecovery=true
        description: 'Calculated speed improvement in recovery attempt'
    }
};

// ============================================================================
// TIER 1: SCHEMA VALIDATION
// ============================================================================

/**
 * TIER 1: Schema Validation
 * Ensures data structure is correct and complete
 */
export async function validateSchema(attemptData) {
    const errors = [];
    const warnings = [];

    try {
        // Check for null/undefined input
        if (!attemptData || typeof attemptData !== 'object') {
            return {
                tier: 'SCHEMA',
                isValid: false,
                errors: [{
                    severity: 'CRITICAL',
                    code: 'INVALID_INPUT',
                    message: 'Input must be a non-null object'
                }],
                warnings: [],
                fieldCount: 0
            };
        }

        // Check for extra fields (potential data pollution)
        const validFields = Object.keys(SCHEMA_DEFINITION);
        const providedFields = Object.keys(attemptData);
        const extraFields = providedFields.filter(f => !validFields.includes(f));

        if (extraFields.length > 0) {
            warnings.push({
                severity: 'WARNING',
                code: 'EXTRA_FIELDS_DETECTED',
                message: `Found ${extraFields.length} unexpected fields: ${extraFields.join(', ')}`,
                fields: extraFields
            });
        }

        // Validate each required field
        for (const [fieldName, fieldSchema] of Object.entries(SCHEMA_DEFINITION)) {
            const value = attemptData[fieldName];

            // Determine if field is required
            const isRequired = fieldSchema.required === true ||
                (fieldSchema.required && attemptData.isRecovery &&
                    ['primaryTime', 'recoveryTime', 'recoveryVelocity'].includes(fieldName));

            // Missing field check
            if (isRequired && (value === undefined || value === null)) {
                errors.push({
                    severity: 'CRITICAL',
                    code: 'MISSING_REQUIRED_FIELD',
                    field: fieldName,
                    message: `Required field "${fieldName}" is missing`,
                    description: fieldSchema.description
                });
                continue;
            }

            // Optional field not provided
            if (!isRequired && (value === undefined || value === null)) {
                continue;
            }

            // TYPE VALIDATION
            if (fieldSchema.type === 'number') {
                if (typeof value !== 'number' || isNaN(value)) {
                    errors.push({
                        severity: 'CRITICAL',
                        code: 'INVALID_TYPE',
                        field: fieldName,
                        message: `Field "${fieldName}" must be a number, got ${typeof value}`,
                        received: value,
                        expected: 'number'
                    });
                    continue;
                }
            }

            if (fieldSchema.type === 'boolean') {
                if (typeof value !== 'boolean') {
                    errors.push({
                        severity: 'CRITICAL',
                        code: 'INVALID_TYPE',
                        field: fieldName,
                        message: `Field "${fieldName}" must be boolean, got ${typeof value}`,
                        expected: 'boolean',
                        received: typeof value
                    });
                    continue;
                }
            }

            if (fieldSchema.type === 'string') {
                if (typeof value !== 'string') {
                    errors.push({
                        severity: 'CRITICAL',
                        code: 'INVALID_TYPE',
                        field: fieldName,
                        message: `Field "${fieldName}" must be string, got ${typeof value}`,
                        expected: 'string',
                        received: typeof value
                    });
                    continue;
                }
            }

            if (fieldSchema.type === 'Date') {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    errors.push({
                        severity: 'CRITICAL',
                        code: 'INVALID_DATE',
                        field: fieldName,
                        message: `Field "${fieldName}" must be a valid ISO8601 date`,
                        received: value
                    });
                    continue;
                }
            }

            // LENGTH VALIDATION for strings
            if (fieldSchema.minLength && typeof value === 'string' && value.length < fieldSchema.minLength) {
                errors.push({
                    severity: 'CRITICAL',
                    code: 'STRING_TOO_SHORT',
                    field: fieldName,
                    message: `Field "${fieldName}" must be at least ${fieldSchema.minLength} characters`,
                    minLength: fieldSchema.minLength,
                    received: value.length
                });
            }

            if (fieldSchema.maxLength && typeof value === 'string' && value.length > fieldSchema.maxLength) {
                errors.push({
                    severity: 'CRITICAL',
                    code: 'STRING_TOO_LONG',
                    field: fieldName,
                    message: `Field "${fieldName}" must be at most ${fieldSchema.maxLength} characters`,
                    maxLength: fieldSchema.maxLength,
                    received: value.length
                });
            }

            // RANGE VALIDATION for numbers
            if (typeof value === 'number') {
                if (fieldSchema.min !== undefined && value < fieldSchema.min) {
                    errors.push({
                        severity: 'CRITICAL',
                        code: 'VALUE_OUT_OF_RANGE',
                        field: fieldName,
                        message: `Field "${fieldName}" must be >= ${fieldSchema.min}, got ${value}`,
                        expected: `>= ${fieldSchema.min}`,
                        received: value
                    });
                }
                if (fieldSchema.max !== undefined && value > fieldSchema.max) {
                    errors.push({
                        severity: 'CRITICAL',
                        code: 'VALUE_OUT_OF_RANGE',
                        field: fieldName,
                        message: `Field "${fieldName}" must be <= ${fieldSchema.max}, got ${value}`,
                        expected: `<= ${fieldSchema.max}`,
                        received: value
                    });
                }
            }

            // ENUM VALIDATION
            if (fieldSchema.values && !fieldSchema.values.includes(value)) {
                errors.push({
                    severity: 'CRITICAL',
                    code: 'INVALID_ENUM_VALUE',
                    field: fieldName,
                    message: `Field "${fieldName}" must be one of ${fieldSchema.values.join(', ')}, got "${value}"`,
                    validValues: fieldSchema.values,
                    received: value
                });
            }

            // PATTERN VALIDATION (regex)
            if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
                errors.push({
                    severity: 'CRITICAL',
                    code: 'INVALID_PATTERN',
                    field: fieldName,
                    message: `Field "${fieldName}" does not match required pattern`,
                    pattern: fieldSchema.pattern.toString(),
                    received: value,
                    hint: `Expected format like: ${fieldName === 'atomId' ? 'atom_algebra_linear' : ''}`
                });
            }
        }

        return {
            tier: 'SCHEMA',
            isValid: errors.length === 0,
            errors,
            warnings,
            fieldCount: providedFields.length,
            requiredFieldCount: Object.values(SCHEMA_DEFINITION)
                .filter(s => s.required === true).length,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            tier: 'SCHEMA',
            isValid: false,
            errors: [{
                severity: 'CRITICAL',
                code: 'VALIDATION_ERROR',
                message: 'Unexpected error during schema validation',
                error: error.message
            }],
            warnings: []
        };
    }
}

// ============================================================================
// TIER 2: SEMANTIC VALIDATION
// ============================================================================

/**
 * TIER 2: Semantic Validation
 * Ensures values are logically consistent
 */
export async function validateSemantics(attemptData) {
    const errors = [];
    const warnings = [];

    try {
        // 1. Answer consistency check
        if (!attemptData.isCorrect && attemptData.studentAnswer === attemptData.correctAnswer) {
            errors.push({
                severity: 'CRITICAL',
                code: 'ANSWER_CONSISTENCY_MISMATCH',
                message: 'isCorrect=false but studentAnswer === correctAnswer (logical contradiction)',
                studentAnswer: attemptData.studentAnswer,
                correctAnswer: attemptData.correctAnswer,
                implication: 'Either answer data is wrong or isCorrect flag is wrong'
            });
        }

        // 2. Empty answer check
        if (!attemptData.studentAnswer || attemptData.studentAnswer.trim() === '') {
            errors.push({
                severity: 'CRITICAL',
                code: 'EMPTY_STUDENT_ANSWER',
                message: 'Student answer cannot be empty',
                implication: 'Likely a form submission error'
            });
        }

        if (!attemptData.correctAnswer || attemptData.correctAnswer.trim() === '') {
            errors.push({
                severity: 'CRITICAL',
                code: 'EMPTY_CORRECT_ANSWER',
                message: 'Correct answer cannot be empty (data integrity issue in question library)',
                implication: 'This question needs to be reviewed'
            });
        }

        // 3. Speed rating vs time consistency
        const timeSpent = attemptData.timeSpent;
        const expectedSpeedRating = calculateSpeedRating(timeSpent);

        if (attemptData.speedRating !== expectedSpeedRating) {
            warnings.push({
                severity: 'WARNING',
                code: 'SPEED_RATING_MISMATCH',
                message: `Speed rating "${attemptData.speedRating}" doesn't match time ${timeSpent}ms (expected "${expectedSpeedRating}")`,
                calculated: expectedSpeedRating,
                received: attemptData.speedRating,
                timeSpent,
                threshold: {
                    SPRINT: '< 2000ms',
                    STEADY: '2000ms - 15000ms',
                    DEEP: '> 15000ms'
                }
            });
        }

        // 4. Mastery progression logic
        const masteryDelta = attemptData.masteryAfter - attemptData.masteryBefore;

        // Student got it right but mastery decreased significantly
        if (attemptData.isCorrect && masteryDelta < -0.1) {
            warnings.push({
                severity: 'WARNING',
                code: 'UNEXPECTED_MASTERY_DECREASE',
                message: 'Student answered correctly but mastery decreased significantly',
                masteryChange: `${masteryDelta.toFixed(2)} (${(masteryDelta * 100).toFixed(0)}%)`,
                masteryBefore: attemptData.masteryBefore,
                masteryAfter: attemptData.masteryAfter,
                implication: 'This might indicate a penalty system or Bayesian adjustment'
            });
        }

        // Student got it wrong but mastery increased
        if (!attemptData.isCorrect && masteryDelta > 0.05) {
            warnings.push({
                severity: 'WARNING',
                code: 'MASTERY_INCREASE_AFTER_WRONG',
                message: 'Student answered incorrectly but mastery increased',
                masteryChange: `+${(masteryDelta * 100).toFixed(0)}%`,
                masteryBefore: attemptData.masteryBefore,
                masteryAfter: attemptData.masteryAfter,
                implication: 'Possible: partial credit, learning from feedback, or data error'
            });
        }

        // No mastery change at all (unlikely)
        if (Math.abs(masteryDelta) < 0.001) {
            warnings.push({
                severity: 'WARNING',
                code: 'NO_MASTERY_CHANGE',
                message: 'Mastery did not change despite attempt',
                masteryBefore: attemptData.masteryBefore,
                masteryAfter: attemptData.masteryAfter,
                implication: 'Unusual but possible if using fixed mastery levels'
            });
        }

        // 5. Recovery-specific validations
        if (attemptData.isRecovery) {
            // Recovery should be faster
            if (attemptData.recoveryTime >= attemptData.primaryTime) {
                warnings.push({
                    severity: 'WARNING',
                    code: 'NO_IMPROVEMENT_IN_RECOVERY',
                    message: 'Recovery attempt was not faster than primary attempt',
                    primaryTime: attemptData.primaryTime,
                    recoveryTime: attemptData.recoveryTime,
                    timeDelta: attemptData.recoveryTime - attemptData.primaryTime,
                    implication: 'Student did not improve on second attempt'
                });
            }

            // Verify recovery velocity math
            if (attemptData.recoveryVelocity !== undefined) {
                const calculatedVelocity = (attemptData.primaryTime - attemptData.recoveryTime) / attemptData.primaryTime;
                const velocityDiff = Math.abs(calculatedVelocity - attemptData.recoveryVelocity);

                if (velocityDiff > 0.01) { // Allow 1% tolerance
                    errors.push({
                        severity: 'CRITICAL',
                        code: 'RECOVERY_VELOCITY_MISMATCH',
                        message: 'Recovery velocity calculation is incorrect',
                        formula: '(primaryTime - recoveryTime) / primaryTime',
                        calculated: calculatedVelocity.toFixed(4),
                        received: attemptData.recoveryVelocity.toFixed(4),
                        difference: velocityDiff.toFixed(4),
                        tolerance: '0.01'
                    });
                }
            }

            // First attempt should be wrong (before recovery)
            if (attemptData.isRecovery && !attemptData.isCorrect) {
                warnings.push({
                    severity: 'INFO',
                    code: 'RECOVERY_STILL_INCORRECT',
                    message: 'Student still got the recovery attempt wrong',
                    implication: 'This is a "failed recovery" - important learning signal'
                });
            }
        }

        // 6. Question and atom ID format checks
        if (!attemptData.questionId.match(/^[a-z0-9_]+$/i)) {
            warnings.push({
                severity: 'WARNING',
                code: 'QUESTIONID_FORMAT_UNUSUAL',
                message: 'Question ID has unusual format',
                received: attemptData.questionId,
                expectedPattern: 'alphanumeric with underscores',
                example: 'q_algebra_linear_001'
            });
        }

        // 7. Diagnostic tag validation
        if (!attemptData.diagnosticTag || attemptData.diagnosticTag.trim() === '') {
            errors.push({
                severity: 'CRITICAL',
                code: 'EMPTY_DIAGNOSTIC_TAG',
                message: 'Diagnostic tag (hurdle/misconception ID) cannot be empty',
                implication: 'Cannot track learning progress without knowing what was being tested'
            });
        }

        // 8. Timestamp recency check
        const now = Date.now();
        const attemptTime = new Date(attemptData.timestamp).getTime();
        const timeDiff = now - attemptTime;

        // Future timestamp
        if (timeDiff < -60000) { // More than 1 minute in future
            errors.push({
                severity: 'CRITICAL',
                code: 'FUTURE_TIMESTAMP',
                message: 'Timestamp is in the future (clock skew?)',
                timestamp: attemptData.timestamp,
                now: new Date(now).toISOString(),
                futureByMs: Math.abs(timeDiff),
                futureByMin: (Math.abs(timeDiff) / 60000).toFixed(1)
            });
        }

        // Stale timestamp
        if (timeDiff > 86400000) { // More than 24 hours old
            warnings.push({
                severity: 'WARNING',
                code: 'STALE_TIMESTAMP',
                message: 'Timestamp is more than 24 hours old',
                timestamp: attemptData.timestamp,
                ageHours: (timeDiff / 3600000).toFixed(1),
                implication: 'Possible delayed submission or offline storage'
            });
        }

        return {
            tier: 'SEMANTIC',
            isValid: errors.length === 0,
            errors,
            warnings,
            masteryDelta: (attemptData.masteryAfter - attemptData.masteryBefore).toFixed(3),
            speedConsistency: attemptData.speedRating === expectedSpeedRating,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            tier: 'SEMANTIC',
            isValid: false,
            errors: [{
                severity: 'CRITICAL',
                code: 'VALIDATION_ERROR',
                message: 'Unexpected error during semantic validation',
                error: error.message
            }],
            warnings: []
        };
    }
}

/**
 * Helper: Calculate expected speed rating from time
 */
function calculateSpeedRating(timeSpent) {
    if (timeSpent < 2000) return 'SPRINT';      // < 2 seconds (quick recall)
    if (timeSpent < 15000) return 'STEADY';     // 2-15 seconds (normal thinking)
    return 'DEEP';                               // > 15 seconds (deep thinking)
}

// ============================================================================
// TIER 3: CONTEXTUAL VALIDATION
// ============================================================================

/**
 * TIER 3: Contextual Validation
 * Checks consistency across student's history
 */
export async function validateContextual(attemptData, studentHistory = []) {
    const errors = [];
    const warnings = [];
    const insights = [];

    try {
        // Get historical context for this specific hurdle
        const historicalAttempts = studentHistory.filter(a =>
            a.diagnosticTag === attemptData.diagnosticTag
        );

        if (historicalAttempts.length === 0) {
            // No history yet - can't do contextual analysis
            return {
                tier: 'CONTEXTUAL',
                isValid: true,
                errors: [],
                warnings: [],
                insights: [{
                    type: 'FIRST_ATTEMPT',
                    message: 'This is the first attempt on this topic'
                }],
                historicalContext: {
                    totalAttemptsOnTag: 0,
                    isFirstAttempt: true
                },
                timestamp: new Date().toISOString()
            };
        }

        // ===== ANALYSIS 1: Success Rate Pattern =====
        const recentAttempts = historicalAttempts.slice(-10);
        const recentSuccessRate = recentAttempts.filter(a => a.isCorrect).length / recentAttempts.length;

        if (attemptData.isCorrect && recentSuccessRate < 0.3) {
            // BREAKTHROUGH: First success after repeated failures
            insights.push({
                type: 'LEARNING_BREAKTHROUGH',
                severity: 'INFO',
                code: 'FIRST_SUCCESS_AFTER_FAILURES',
                message: 'Student got this right! First correct answer after repeated wrong attempts.',
                recentSuccessRate: recentSuccessRate.toFixed(2),
                consecutiveFailuresBefore: countFailureStreak(historicalAttempts),
                attempts: recentAttempts.length,
                recommendation: 'Reinforce with similar problems to consolidate learning'
            });
        }

        if (!attemptData.isCorrect && recentSuccessRate > 0.7) {
            // REGRESSION: Usually gets it right but failed this time
            insights.push({
                type: 'REGRESSION_DETECTED',
                severity: 'WARNING',
                code: 'UNEXPECTED_FAILURE_AFTER_SUCCESS',
                message: 'Student usually gets this right (70%+) but failed this time',
                recentSuccessRate: recentSuccessRate.toFixed(2),
                recommendation: 'Check for fatigue, distraction, or changed conditions'
            });
        }

        // ===== ANALYSIS 2: Speed Pattern Change =====
        const avgHistoricalTime = recentAttempts.reduce((sum, a) => sum + a.timeSpent, 0) / recentAttempts.length;
        const speedChange = (attemptData.timeSpent - avgHistoricalTime) / avgHistoricalTime;

        if (speedChange > 0.5) { // 50% slower than average
            warnings.push({
                severity: 'WARNING',
                code: 'SIGNIFICANT_SPEED_SLOWDOWN',
                message: `Student is ${(speedChange * 100).toFixed(0)}% slower than their usual pace on this topic`,
                currentTime: attemptData.timeSpent,
                averageTime: Math.round(avgHistoricalTime),
                changePercent: (speedChange * 100).toFixed(0),
                implication: 'Possible confusion, lack of confidence, or deliberate thoughtfulness',
                recommendation: 'Monitor next attempts to see if this is a temporary blip'
            });
        }

        if (speedChange < -0.5) { // 50% faster than average
            insights.push({
                severity: 'INFO',
                code: 'SIGNIFICANT_SPEED_IMPROVEMENT',
                message: `Student is ${Math.abs(speedChange * 100).toFixed(0)}% faster than usual on this topic`,
                currentTime: attemptData.timeSpent,
                averageTime: Math.round(avgHistoricalTime),
                implication: 'Possible: automation, guessing, or genuine fluency gain',
                recommendation: 'Check if answer is correct (fluency) or incorrect (guessing)'
            });
        }

        // ===== ANALYSIS 3: Time vs Correctness Correlation =====
        const correctAttempts = recentAttempts.filter(a => a.isCorrect);
        const wrongAttempts = recentAttempts.filter(a => !a.isCorrect);

        if (correctAttempts.length > 0 && wrongAttempts.length > 2) {
            const avgCorrectTime = correctAttempts.reduce((sum, a) => sum + a.timeSpent, 0) / correctAttempts.length;
            const avgWrongTime = wrongAttempts.reduce((sum, a) => sum + a.timeSpent, 0) / wrongAttempts.length;

            if (avgWrongTime < avgCorrectTime * 0.5) {
                // Guessing pattern: fast wrong, slow correct
                insights.push({
                    type: 'GUESSING_PATTERN_DETECTED',
                    severity: 'WARNING',
                    code: 'FAST_WRONG_SLOW_CORRECT',
                    message: 'Student answers wrong questions much faster than correct ones (potential guessing)',
                    avgCorrectTime: Math.round(avgCorrectTime),
                    avgWrongTime: Math.round(avgWrongTime),
                    ratio: (avgWrongTime / avgCorrectTime).toFixed(2),
                    implication: 'Pattern suggests student is guessing rather than thinking',
                    recommendation: 'Encourage slower, more thoughtful work. Use time bonuses to incentivize thinking time.'
                });
            }
        }

        // ===== ANALYSIS 4: Streak Detection =====
        if (recentAttempts.length >= 4) {
            const failureStreak = countConsecutiveFailures(recentAttempts);
            const successStreak = countConsecutiveSuccesses(recentAttempts);

            if (failureStreak >= 4 && !attemptData.isCorrect) {
                insights.push({
                    type: 'STRUGGLING_STREAK',
                    severity: 'CRITICAL',
                    code: 'MULTIPLE_CONSECUTIVE_FAILURES',
                    message: `Student has failed ${failureStreak} attempts in a row on this topic`,
                    consecutiveFailures: failureStreak,
                    successRateOnThisTopic: recentSuccessRate.toFixed(2),
                    implication: 'Pattern indicates deep misconception or lack of understanding',
                    recommendation: 'CRITICAL: Escalate to teacher for 1-on-1 intervention or AI coaching'
                });
            }

            if (successStreak >= 5 && attemptData.isCorrect) {
                insights.push({
                    type: 'MASTERY_ACHIEVED',
                    severity: 'INFO',
                    code: 'SUCCESS_STREAK',
                    message: `Student has ${successStreak} correct in a row - showing consistent mastery`,
                    consecutiveCorrect: successStreak,
                    recommendation: 'Consider moving to more advanced topics or removing from rotation'
                });
            }
        }

        // ===== ANALYSIS 5: Time to Mastery Trend =====
        const timeToMasteryTrend = analyzeTimeToMastery(recentAttempts);
        if (timeToMasteryTrend && timeToMasteryTrend.isDeclining) {
            insights.push({
                type: 'LEARNING_CURVE',
                severity: 'INFO',
                code: 'IMPROVING_EFFICIENCY',
                message: 'Student is getting faster at this topic while maintaining accuracy (learning curve)',
                trend: 'Improving',
                recommendation: 'This is healthy learning progress. Continue current practice level.'
            });
        }

        return {
            tier: 'CONTEXTUAL',
            isValid: errors.length === 0,
            errors,
            warnings,
            insights,
            historicalContext: {
                totalAttemptsOnTag: historicalAttempts.length,
                successRate: recentSuccessRate.toFixed(2),
                successRateHistory: {
                    last5: (historicalAttempts.slice(-5).filter(a => a.isCorrect).length / Math.min(5, historicalAttempts.length)).toFixed(2),
                    last10: recentSuccessRate.toFixed(2),
                    allTime: (historicalAttempts.filter(a => a.isCorrect).length / historicalAttempts.length).toFixed(2)
                },
                averageTime: Math.round(avgHistoricalTime),
                speedTrend: speedChange > 0.1 ? 'Slowing Down' : speedChange < -0.1 ? 'Speeding Up' : 'Stable'
            },
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            tier: 'CONTEXTUAL',
            isValid: false,
            errors: [{
                severity: 'CRITICAL',
                code: 'VALIDATION_ERROR',
                message: 'Unexpected error during contextual validation',
                error: error.message
            }],
            warnings: []
        };
    }
}

function countFailureStreak(attempts) {
    let streak = 0;
    for (let i = attempts.length - 1; i >= 0; i--) {
        if (!attempts[i].isCorrect) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

function countConsecutiveFailures(attempts) {
    return countFailureStreak(attempts);
}

function countConsecutiveSuccesses(attempts) {
    let streak = 0;
    for (let i = attempts.length - 1; i >= 0; i--) {
        if (attempts[i].isCorrect) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
}

function analyzeTimeToMastery(attempts) {
    if (attempts.length < 3) return null;

    const recent = attempts.slice(-5);
    const correctOnly = recent.filter(a => a.isCorrect);

    if (correctOnly.length < 2) return null;

    const firstCorrectTime = correctOnly[0].timeSpent;
    const lastCorrectTime = correctOnly[correctOnly.length - 1].timeSpent;

    return {
        isDeclining: lastCorrectTime < firstCorrectTime * 0.8,
        averageTime: Math.round(correctOnly.reduce((sum, a) => sum + a.timeSpent, 0) / correctOnly.length),
        trend: 'Improving'
    };
}

// ============================================================================
// TIER 4: PEDAGOGICAL VALIDATION
// ============================================================================

/**
 * TIER 4: Pedagogical Validation
 * Extracts learning signals and generates actionable recommendations
 */
export async function validatePedagogical(attemptData, contextualAnalysis) {
    const insights = [];
    const recommendations = [];
    const learningSignals = {};

    try {
        // ===== LEARNING STATE DETECTION =====

        // 1. LATENT KNOWLEDGE: Fast + Correct
        if (attemptData.isCorrect && attemptData.speedRating === 'SPRINT') {
            learningSignals.learningState = 'LATENT_KNOWLEDGE';
            insights.push({
                category: 'LEARNING_STATE',
                code: 'LATENT_KNOWLEDGE',
                type: 'CARELESS_ERROR_CORRECTED',
                meaning: 'Student knows this well but made a careless/quick error',
                indicator: 'Fast correct answer in recovery indicates knowledge was already there',
                confidence: 'HIGH'
            });
            recommendations.push({
                priority: 'LOW',
                for: 'SYSTEM',
                action: 'ACCELERATE_PROGRESSION',
                text: 'Remove from intensive rotation; accelerate to harder problems'
            });
            recommendations.push({
                priority: 'LOW',
                for: 'STUDENT',
                text: '⚡ Great catch! You clearly know this. Ready for a bigger challenge?'
            });
        }

        // 2. ACTIVE LEARNING: Slow + Correct + Mastery Gain
        if (attemptData.isCorrect && attemptData.speedRating === 'DEEP' &&
            (attemptData.masteryAfter - attemptData.masteryBefore) > 0.02) {
            learningSignals.learningState = 'ACTIVE_LEARNING';
            insights.push({
                category: 'LEARNING_STATE',
                code: 'ACTIVE_LEARNING',
                type: 'CONCEPTUAL_MASTERY_BUILDING',
                meaning: 'Student engaged in real thinking and achieved correct answer',
                indicator: 'Slow work + correct answer + mastery gain = genuine learning happening',
                confidence: 'HIGH'
            });
            recommendations.push({
                priority: 'HIGH',
                for: 'SYSTEM',
                action: 'CONTINUE_PRACTICE',
                text: 'Continue with similar difficulty; reinforce with 2-3 similar problems'
            });
            recommendations.push({
                priority: 'HIGH',
                for: 'TEACHER',
                text: '📈 This student is actively learning. Provide similar problems to consolidate understanding.'
            });
            recommendations.push({
                priority: 'MEDIUM',
                for: 'STUDENT',
                text: '💪 Excellent work! You figured this out. Let\'s practice a few more like this.'
            });
        }

        // 3. LEARNING GAP: Slow + Wrong + Streak
        if (!attemptData.isCorrect && attemptData.speedRating === 'DEEP' &&
            contextualAnalysis?.insights?.some(i => i.type === 'STRUGGLING_STREAK')) {
            learningSignals.learningState = 'LEARNING_GAP';
            insights.push({
                category: 'LEARNING_STATE',
                code: 'LEARNING_GAP',
                type: 'CONCEPTUAL_MISUNDERSTANDING',
                meaning: 'Student is thinking but has wrong conceptual model',
                indicator: 'Slow work + repeated failures = misconception (not just carelessness)',
                confidence: 'HIGH'
            });
            recommendations.push({
                priority: 'CRITICAL',
                for: 'SYSTEM',
                action: 'PROVIDE_SCAFFOLDING',
                text: 'Show worked examples, reduce problem complexity, add hints'
            });
            recommendations.push({
                priority: 'CRITICAL',
                for: 'TEACHER',
                text: '🚨 Student needs immediate help. Schedule 1-on-1 session or provide scaffolded practice.'
            });
            recommendations.push({
                priority: 'CRITICAL',
                for: 'STUDENT',
                text: '📚 Let\'s take a step back. Work through a simpler version together, then build up.'
            });
        }

        // 4. RESISTANT MISCONCEPTION: Fast + Wrong + Guessing Pattern
        if (!attemptData.isCorrect && attemptData.speedRating === 'SPRINT' &&
            contextualAnalysis?.insights?.some(i => i.type === 'GUESSING_PATTERN_DETECTED')) {
            learningSignals.learningState = 'RESISTANT_MISCONCEPTION';
            insights.push({
                category: 'LEARNING_STATE',
                code: 'RESISTANT_MISCONCEPTION',
                type: 'DEEP_MISCONCEPTION',
                meaning: 'Student has deeply held wrong model or is guessing',
                indicator: 'Fast incorrect answers + pattern of failure = not engaging with material',
                confidence: 'MEDIUM'
            });
            recommendations.push({
                priority: 'CRITICAL',
                for: 'SYSTEM',
                action: 'ESCALATE_TO_AI_COACHING',
                text: 'Switch to guided, adaptive AI assistance with conceptual explanations'
            });
            recommendations.push({
                priority: 'CRITICAL',
                for: 'TEACHER',
                text: '🆘 ESCALATION NEEDED. Student is struggling with core concept. Consider re-teaching from fundamentals.'
            });
            recommendations.push({
                priority: 'CRITICAL',
                for: 'STUDENT',
                text: '🎓 This is tricky! Let\'s get help from an interactive tutor to rebuild understanding.'
            });
        }

        // ===== RECOVERY PATTERN ANALYSIS =====
        if (attemptData.isRecovery) {
            const velocity = attemptData.recoveryVelocity;

            if (velocity >= 0.75) {
                learningSignals.recoveryPattern = 'INSTANT_CORRECTION';
                insights.push({
                    category: 'RECOVERY_PATTERN',
                    code: 'INSTANT_CORRECTION',
                    type: 'CARELESS_MISTAKE',
                    speedup: `${(velocity * 100).toFixed(0)}% faster on retry`,
                    meaning: 'Student knew answer, just made a slip the first time',
                    recommendation: 'This counts as mastery. Move forward.'
                });
                recommendations.push({
                    priority: 'LOW',
                    for: 'SYSTEM',
                    action: 'MARK_AS_LEARNED',
                    text: 'Fast recovery indicates careless error, not misconception'
                });
            } else if (velocity >= 0.5) {
                learningSignals.recoveryPattern = 'LEARNING_CONSOLIDATION';
                insights.push({
                    category: 'RECOVERY_PATTERN',
                    code: 'LEARNING_CONSOLIDATION',
                    type: 'MODERATE_IMPROVEMENT',
                    speedup: `${(velocity * 100).toFixed(0)}% faster on retry`,
                    meaning: 'Student is beginning to internalize the concept',
                    recommendation: 'Provide more similar problems to consolidate'
                });
                recommendations.push({
                    priority: 'MEDIUM',
                    for: 'SYSTEM',
                    action: 'CONTINUE_PRACTICE',
                    text: 'Provide 2-3 more similar problems for reinforcement'
                });
            } else if (velocity >= 0.2) {
                learningSignals.recoveryPattern = 'SLOW_LEARNING';
                insights.push({
                    category: 'RECOVERY_PATTERN',
                    code: 'SLOW_LEARNING',
                    type: 'MINIMAL_IMPROVEMENT',
                    speedup: `${(velocity * 100).toFixed(0)}% faster on retry`,
                    meaning: 'Student made progress but still struggling',
                    recommendation: 'Provide scaffolding and guided practice'
                });
                recommendations.push({
                    priority: 'HIGH',
                    for: 'SYSTEM',
                    action: 'PROVIDE_SCAFFOLDING',
                    text: 'Show worked examples, provide hints on next attempt'
                });
            } else {
                learningSignals.recoveryPattern = 'NO_PROGRESS';
                insights.push({
                    category: 'RECOVERY_PATTERN',
                    code: 'NO_PROGRESS',
                    type: 'PERSISTENT_DIFFICULTY',
                    speedup: velocity < 0 ? 'Even slower on retry' : 'No improvement',
                    meaning: 'Student did not benefit from seeing the problem again',
                    recommendation: 'Change strategy; possibly escalate'
                });
                recommendations.push({
                    priority: 'CRITICAL',
                    for: 'SYSTEM',
                    action: 'ESCALATE_TEACHING_METHOD',
                    text: 'Try different approach: video, AI coach, worked examples'
                });
            }
        }

        // ===== EFFORT & ENGAGEMENT =====
        if (attemptData.timeSpent < 100) {
            learningSignals.engagement = 'LOW_EFFORT';
            recommendations.push({
                priority: 'MEDIUM',
                for: 'STUDENT',
                text: '⏱️ Slow down! Rushing usually leads to mistakes. Take your time to think.'
            });
        }

        if (attemptData.timeSpent > 120000) { // > 2 minutes
            learningSignals.engagement = 'EXCESSIVE_TIME_OR_STRUGGLE';
            recommendations.push({
                priority: 'MEDIUM',
                for: 'TEACHER',
                text: '⚠️ Student spent >2 min on one question. Check if they need help or if question is broken.'
            });
        }

        if (attemptData.timeSpent > 180000) { // > 3 minutes
            recommendations.push({
                priority: 'HIGH',
                for: 'SYSTEM',
                action: 'OFFER_HELP_BUTTON',
                text: 'Student has been stuck >3min. Show "Need Help?" button with hint or AI assist.'
            });
        }

        // ===== DETERMINE NEXT STEPS =====
        const nextSteps = generateNextSteps(learningSignals, attemptData);
        const platformAction = determinePlatformAction(learningSignals, attemptData);

        return {
            tier: 'PEDAGOGICAL',
            learningSignals,
            insights,
            recommendations,
            nextSteps,
            platformAction,
            actionPriority: getPriorityLevel(learningSignals),
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        return {
            tier: 'PEDAGOGICAL',
            isValid: false,
            error: error.message,
            recommendations: [{
                priority: 'HIGH',
                for: 'SYSTEM',
                action: 'LOG_ERROR',
                text: 'Error generating pedagogical recommendations'
            }]
        };
    }
}

function generateNextSteps(learningSignals, attemptData) {
    const steps = [];

    switch (learningSignals.learningState) {
        case 'LATENT_KNOWLEDGE':
            steps.push('Remove from practice rotation');
            steps.push('Move to harder problems in same topic');
            steps.push('Track in "mastered topics" dashboard');
            break;
        case 'ACTIVE_LEARNING':
            steps.push('Show 2-3 similar problems at same level');
            steps.push('Increase difficulty by 1 level after 3 consecutive correct');
            steps.push('Update mastery level +0.05');
            break;
        case 'LEARNING_GAP':
            steps.push('Show worked example with explanation');
            steps.push('Provide 3-5 guided practice problems with hints');
            steps.push('Offer video explanation of concept');
            steps.push('Recommend topic review before next problem');
            break;
        case 'RESISTANT_MISCONCEPTION':
            steps.push('Flag for teacher review in dashboard');
            steps.push('Escalate to AI coaching module');
            steps.push('Schedule 1-on-1 teacher intervention');
            steps.push('Provide alternative teaching modalities (video, interactive, visual)');
            break;
    }

    return steps;
}

function determinePlatformAction(learningSignals, attemptData) {
    if (learningSignals.learningState === 'RESISTANT_MISCONCEPTION') {
        return 'ESCALATE_IMMEDIATELY_TO_AI_COACH';
    }
    if (learningSignals.learningState === 'LEARNING_GAP') {
        return 'PROVIDE_SCAFFOLDING_AND_HINT';
    }
    if (learningSignals.learningState === 'ACTIVE_LEARNING') {
        return 'CONTINUE_PRACTICE_SAME_DIFFICULTY';
    }
    if (learningSignals.learningState === 'LATENT_KNOWLEDGE') {
        return 'ACCELERATE_TO_HARDER_PROBLEMS';
    }
    return 'STANDARD_NEXT_PROBLEM';
}

function getPriorityLevel(learningSignals) {
    switch (learningSignals.learningState) {
        case 'RESISTANT_MISCONCEPTION': return 'CRITICAL';
        case 'LEARNING_GAP': return 'HIGH';
        case 'ACTIVE_LEARNING': return 'MEDIUM';
        case 'LATENT_KNOWLEDGE': return 'LOW';
        default: return 'NORMAL';
    }
}

// ============================================================================
// MASTER VALIDATION PIPELINE
// ============================================================================

/**
 * MASTER VALIDATION PIPELINE
 * Orchestrates all 4 validation tiers into a single comprehensive report
 */
export async function validateAttemptComprehensive(attemptData, studentHistory = [], metadata = {}) {
    const startTime = Date.now();
    const validationId = uuidv4();

    const validationReport = {
        validationId,
        submitted: new Date().toISOString(),
        tiers: {},
        isCompletelyValid: false,
        qualityScore: 0,
        actionRequired: [],
        studentFeedback: [],
        teacherFeedback: [],
        metadata
    };

    try {
        // ===== TIER 1: SCHEMA =====
        console.log(`[${validationId}] 🔍 Tier 1: Schema Validation...`);
        validationReport.tiers.schema = await validateSchema(attemptData);

        if (!validationReport.tiers.schema.isValid) {
            validationReport.isCompletelyValid = false;
            validationReport.actionRequired.push('QUARANTINE_AND_ALERT_ADMIN');
            validationReport.adminAlert = {
                severity: 'CRITICAL',
                code: 'SCHEMA_VALIDATION_FAILED',
                message: 'Data schema validation failed. Attempt cannot be processed.',
                errors: validationReport.tiers.schema.errors,
                validationId
            };
            validationReport.processingTime = Date.now() - startTime;
            return validationReport; // STOP HERE
        }

        // ===== TIER 2: SEMANTIC =====
        console.log(`[${validationId}] ✓ Tier 1 passed. Tier 2: Semantic Validation...`);
        validationReport.tiers.semantic = await validateSemantics(attemptData);

        if (!validationReport.tiers.semantic.isValid) {
            validationReport.isCompletelyValid = false;
            validationReport.actionRequired.push('MANUAL_REVIEW_REQUIRED');
            validationReport.adminAlert = {
                severity: 'CRITICAL',
                code: 'SEMANTIC_VALIDATION_FAILED',
                message: 'Semantic validation failed. Manual review needed.',
                errors: validationReport.tiers.semantic.errors,
                validationId
            };
            // Don't stop; continue to contextual/pedagogical for insights
        }

        // ===== TIER 3: CONTEXTUAL =====
        console.log(`[${validationId}] ✓ Tier 2 checked. Tier 3: Contextual Validation...`);
        validationReport.tiers.contextual = await validateContextual(attemptData, studentHistory);

        // ===== TIER 4: PEDAGOGICAL =====
        console.log(`[${validationId}] ✓ Tier 3 analyzed. Tier 4: Pedagogical Validation...`);
        validationReport.tiers.pedagogical = await validatePedagogical(
            attemptData,
            validationReport.tiers.contextual
        );

        // ===== CALCULATE QUALITY SCORE =====
        validationReport.qualityScore = calculateQualityScore(validationReport);

        // ===== FINAL VALIDITY DETERMINATION =====
        validationReport.isCompletelyValid =
            validationReport.tiers.schema.isValid &&
            validationReport.tiers.semantic.isValid &&
            validationReport.qualityScore >= 0.75;

        // ===== EXTRACT FEEDBACK =====
        validationReport.studentFeedback = extractStudentRecommendations(validationReport);
        validationReport.teacherFeedback = extractTeacherRecommendations(validationReport);

        // ===== PERFORMANCE METRICS =====
        validationReport.processingTime = Date.now() - startTime;

        // ===== LOG SUMMARY =====
        console.log(`
╔════════════════════════════════════════╗
║   VALIDATION COMPLETE [${validationId.substring(0, 8)}...]                  ║
╠════════════════════════════════════════╣
║ Quality Score: ${validationReport.qualityScore.toFixed(2)}/1.00       ║
║ Overall Valid: ${validationReport.isCompletelyValid ? 'YES ✓' : 'NO ✗'}              ║
║ Processing: ${validationReport.processingTime}ms        ║
║ Learning State: ${(validationReport.tiers.pedagogical?.learningSignals?.learningState || 'UNKNOWN').padEnd(21)} ║
║ Recommendations: ${validationReport.studentFeedback.length} for student       ║
╚════════════════════════════════════════╝
    `);

        return validationReport;
    } catch (error) {
        console.error(`[${validationId}] CRITICAL ERROR:`, error);
        return {
            validationId,
            submitted: new Date().toISOString(),
            isCompletelyValid: false,
            qualityScore: 0,
            error: error.message,
            adminAlert: {
                severity: 'CRITICAL',
                code: 'VALIDATION_PIPELINE_ERROR',
                message: 'Unexpected error in validation pipeline',
                error: error.message
            },
            processingTime: Date.now() - startTime
        };
    }
}

function calculateQualityScore(report) {
    let score = 1.0;

    // Schema errors are catastrophic (-0.3 each)
    const schemaErrors = report.tiers.schema?.errors?.length || 0;
    score -= schemaErrors * 0.3;

    // Semantic errors are serious (-0.15 each)
    const semanticErrors = report.tiers.semantic?.errors?.length || 0;
    score -= semanticErrors * 0.15;

    // Semantic warnings are minor (-0.05 each)
    const semanticWarnings = report.tiers.semantic?.warnings?.length || 0;
    score -= semanticWarnings * 0.05;

    // Contextual warnings are minimal (-0.02 each)
    const contextualWarnings = report.tiers.contextual?.warnings?.length || 0;
    score -= contextualWarnings * 0.02;

    // Clamp between 0 and 1
    return Math.max(0, Math.min(1, score));
}

function extractStudentRecommendations(report) {
    const recs = [];

    if (report.tiers.pedagogical?.recommendations) {
        recs.push(...report.tiers.pedagogical.recommendations
            .filter(r => r.for === 'STUDENT')
            .map(r => ({
                priority: r.priority,
                message: r.text,
                actionable: true,
                type: 'ENCOURAGEMENT_OR_GUIDANCE'
            })));
    }

    return recs;
}

function extractTeacherRecommendations(report) {
    const recs = [];

    if (report.tiers.pedagogical?.recommendations) {
        recs.push(...report.tiers.pedagogical.recommendations
            .filter(r => r.for === 'TEACHER')
            .map(r => ({
                priority: r.priority,
                message: r.text,
                actionable: true,
                followUpNeeded: r.priority === 'CRITICAL',
                type: 'INSTRUCTIONAL_GUIDANCE'
            })));
    }

    return recs;
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
    validateAttemptComprehensive,
    validateSchema,
    validateSemantics,
    validateContextual,
    validatePedagogical
};