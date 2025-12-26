/**
 * semanticValidator.js - v5.0
 * 
 * Tier 2: Semantic Validation
 * Checks if data MEANS something educationally valid
 * (beyond just type/range correctness)
 */

import { VALIDATION_CODES } from './analyticsSchema';

/**
 * Main entry point: Validates semantic consistency of a log entry
 * Returns: { valid: boolean, issues: [], semanticScore: 0-1 }
 */
export const validateSemanticIntegrity = (log) => {
    const issues = [];

    // ────────────────────────────────────────────────────────────────────────
    // CHECK 1: Speed-Accuracy Mismatch
    // ────────────────────────────────────────────────────────────────────────
    // If student answers correctly VERY quickly but shows low confidence,
    // it suggests a lucky guess rather than understanding

    if (log.speedRating === 'SPRINT' && log.isCorrect && log.masteryAfter < 0.3) {
        issues.push({
            code: VALIDATION_CODES.WARNING_DATA_QUALITY,
            severity: 'WARNING',
            category: 'SPEED_ACCURACY_MISMATCH',
            message: 'Student answered correctly very quickly (SPRINT) but shows low confidence',
            interpretation: 'Likely lucky guess rather than understanding',
            recommendation: 'Flag for manual review. Consider reasking similar question for true mastery check',
            fields: ['speedRating', 'isCorrect', 'masteryAfter']
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // CHECK 2: Confidence Paradox After Correct Answer
    // ────────────────────────────────────────────────────────────────────────
    // If student gets it right but mastery DECREASES significantly,
    // they don't believe they understand

    if (log.isCorrect && log.masteryAfter < log.masteryBefore - 0.1) {
        issues.push({
            code: VALIDATION_CODES.WARNING_DATA_QUALITY,
            severity: 'WARNING',
            category: 'CONFIDENCE_PARADOX',
            message: 'Mastery decreased despite correct answer (possible uncertainty)',
            interpretation: 'Student answered correctly but feels less confident. May be lucky guess.',
            recommendation: 'Provide more similar questions to build confidence',
            fields: ['isCorrect', 'masteryBefore', 'masteryAfter']
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // CHECK 3: Misconception Resistance (Slow Recovery)
    // ────────────────────────────────────────────────────────────────────────
    // If student recovered a mistake but took similar/longer time,
    // the misconception is deeply rooted

    if (log.isRecovered && log.recoveryVelocity !== undefined && log.recoveryVelocity < 0.2) {
        issues.push({
            code: VALIDATION_CODES.WARNING_SUSPICIOUS,
            severity: 'ERROR',
            category: 'RESISTANT_MISCONCEPTION',
            message: `Misconception shows minimal recovery (velocity: ${(log.recoveryVelocity * 100).toFixed(0)}%)`,
            interpretation: 'Student barely improved on retry. Misconception is persistent.',
            recommendation: 'Escalate to interactive coaching with scaffolded explanations',
            fields: ['isRecovered', 'recoveryVelocity', 'diagnosticTag']
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // CHECK 4: Time Inconsistency
    // ────────────────────────────────────────────────────────────────────────
    // If student takes DEEP time (10+ sec) but answers wrong,
    // suggests genuine struggle (not careless mistake)

    if (log.speedRating === 'DEEP' && !log.isCorrect && !log.diagnosticTag) {
        issues.push({
            code: VALIDATION_CODES.WARNING_DATA_QUALITY,
            severity: 'WARNING',
            category: 'DEEP_STRUGGLE_NO_DIAGNOSIS',
            message: 'Student spent 10+ seconds but no diagnostic tag recorded',
            interpretation: 'Student struggled but we didn\'t capture WHY',
            recommendation: 'Have diagnostic tag populated for all wrong answers',
            fields: ['speedRating', 'isCorrect', 'diagnosticTag']
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // CHECK 5: Overconfidence Before Wrong Answer
    // ────────────────────────────────────────────────────────────────────────
    // If masteryBefore >= 0.8 but answer is wrong,
    // student has a misconception they don't realize

    if (log.masteryBefore >= 0.8 && !log.isCorrect) {
        issues.push({
            code: VALIDATION_CODES.WARNING_SUSPICIOUS,
            severity: 'ERROR',
            category: 'HIDDEN_MISCONCEPTION',
            message: 'Student showed high confidence (0.8+) but answered incorrectly',
            interpretation: 'Student has a hidden misconception - they think they understand but don\'t',
            recommendation: 'This is CRITICAL. Address misconception before it solidifies. Use scaffolded approach.',
            fields: ['masteryBefore', 'isCorrect', 'diagnosticTag']
        });
    }

    // ────────────────────────────────────────────────────────────────────────
    // CHECK 6: No Mastery Growth After Many Questions
    // ────────────────────────────────────────────────────────────────────────
    // (Requires historical context - checked in insights generator)

    // ────────────────────────────────────────────────────────────────────────
    // Calculate Overall Semantic Score
    // ────────────────────────────────────────────────────────────────────────

    const semanticScore = calculateSemanticScore(issues);

    return {
        valid: issues.filter(i => i.severity === 'ERROR').length === 0,
        issues,
        semanticScore, // 0-1, where 1.0 is perfect
        issueCount: issues.length,
        errorCount: issues.filter(i => i.severity === 'ERROR').length,
        warningCount: issues.filter(i => i.severity === 'WARNING').length
    };
};

/**
 * Calculate semantic score (0-1) based on issues found
 * ERROR = -0.3 points each
 * WARNING = -0.1 points each
 */
const calculateSemanticScore = (issues) => {
    let score = 1.0;

    issues.forEach(issue => {
        if (issue.severity === 'ERROR') score -= 0.3;
        if (issue.severity === 'WARNING') score -= 0.1;
    });

    return Math.max(0, Math.min(1, score));
};

/**
 * Detailed semantic analysis with scores and categories
 */
export const analyzeSemanticPatterns = (log) => {
    const validation = validateSemanticIntegrity(log);

    return {
        ...validation,
        categories: {
            speedAccuracy: extractIssueCategory(validation.issues, 'SPEED_ACCURACY_MISMATCH'),
            confidence: extractIssueCategory(validation.issues, 'CONFIDENCE_PARADOX'),
            misconception: extractIssueCategory(validation.issues, 'RESISTANT_MISCONCEPTION'),
            hidden: extractIssueCategory(validation.issues, 'HIDDEN_MISCONCEPTION')
        }
    };
};

const extractIssueCategory = (issues, category) => {
    return issues.find(i => i.category === category) || null;
};

/**
 * Generate human-readable semantic report
 */
export const generateSemanticReport = (log) => {
    const validation = validateSemanticIntegrity(log);

    const report = {
        overallHealth: getHealthStatus(validation.semanticScore),
        score: (validation.semanticScore * 100).toFixed(0) + '%',
        issues: validation.issues.map(issue => ({
            severity: issue.severity,
            title: issue.category.replace(/_/g, ' '),
            message: issue.message,
            interpretation: issue.interpretation,
            actionableAdvice: issue.recommendation
        }))
    };

    return report;
};

const getHealthStatus = (score) => {
    if (score >= 0.9) return { status: 'EXCELLENT', emoji: '💚' };
    if (score >= 0.7) return { status: 'GOOD', emoji: '💛' };
    if (score >= 0.5) return { status: 'CAUTION', emoji: '🟡' };
    return { status: 'CRITICAL', emoji: '❤️' };
};
