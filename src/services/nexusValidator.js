/**
 * nexusValidator.js - v5.0
 * 
 * THE VALIDATOR
 * Unified validation orchestrator
 * Tier 1: Schema Validation
 * Tier 2: Semantic Validation
 * Tier 3: Actionable Insights (optional)
 */

import { nexusDB } from './nexusSync';
import {
    ANALYTICS_SCHEMA,
    VALIDATION_CODES,
    FIELD_GROUPS,
    getRequiredFields
} from './analyticsSchema';
import { validateSemanticIntegrity } from './semanticValidator';
import { generateStudentInsights } from './insightGenerator';

/**
 * MAIN ENTRY POINT
 * 
 * validateNexusLogs(options)
 * @param {Object} options
 * @param {boolean} options.detailed - Include detailed field breakdown
 * @param {boolean} options.insights - Generate insights from patterns
 * @param {number} options.sampleSize - How many recent logs to analyze (default: 10)
 * 
 * @returns {Object} Comprehensive validation report
 */
export const validateNexusLogs = async (options = {}) => {
    const {
        detailed = false,
        insights = true,
        sampleSize = 10
    } = options;

    const startTime = performance.now();

    try {
        // Step 1: Fetch logs from IndexedDB
        const allLogs = await nexusDB.logs.orderBy('timestamp').reverse().toArray();

        if (allLogs.length === 0) {
            return {
                status: 'EMPTY',
                message: 'No local logs found in NexusDB',
                timestamp: new Date().toISOString(),
                executionTime: `${(performance.now() - startTime).toFixed(2)}ms`,
                missingFields: []
            };
        }

        // Step 2: Identify latest and recent logs
        const latestLog = allLogs[0];
        const recentLogs = allLogs.slice(0, sampleSize);

        // Step 3: Run all three tiers of validation
        const schemaVal = validateSchema(latestLog);
        const semanticVal = validateSemanticIntegrity(latestLog);
        let insightsVal = null;

        // Step 4: Generate insights if enabled
        if (insights && allLogs.length >= 5) {
            try {
                insightsVal = generateStudentInsights(allLogs.slice(0, 20), {});
            } catch (err) {
                console.warn('Insights generation failed (non-critical):', err);
            }
        }

        // Step 5: Extract missing fields for UI display
        const missingFields = schemaVal.issues
            .filter(issue => issue.code === VALIDATION_CODES.FAIL_MISSING_REQUIRED)
            .map(issue => issue.field);

        // Step 6: Compile comprehensive report
        const report = {
            // Meta
            status: schemaVal.valid && semanticVal.valid ? 'PASS' : 'FAIL',
            timestamp: new Date().toISOString(),
            executionTime: `${(performance.now() - startTime).toFixed(2)}ms`,
            latestLog: latestLog,

            // Log Metrics
            metrics: {
                totalLogs: allLogs.length,
                recentLogsSampled: recentLogs.length,
                latestLogId: latestLog?.id,
                oldestLogId: allLogs[allLogs.length - 1]?.id
            },

            // Validation Results
            validation: {
                schema: {
                    valid: schemaVal.valid,
                    errorCount: schemaVal.errorCount,
                    warningCount: schemaVal.warningCount,
                    issues: schemaVal.issues
                },
                semantic: {
                    valid: semanticVal.valid,
                    score: (semanticVal.semanticScore * 100).toFixed(0) + '%',
                    issues: semanticVal.issues
                }
            },

            // Missing fields for UI display (CRITICAL FIX)
            missingFields: missingFields,

            // Insights (if enabled)
            insights: insightsVal || null,

            // Detailed breakdown (if enabled)
            detailedReport: detailed ? generateDetailedReport(recentLogs, schemaVal) : null,

            // Quick Summary for UI
            summary: {
                allFieldsPresent: schemaVal.valid,
                allFieldsValid: schemaVal.valid && semanticVal.valid,
                semanticHealthy: semanticVal.semanticScore > 0.7,
                readyForProduction: schemaVal.valid && semanticVal.valid && (semanticVal.semanticScore > 0.7),
                actionable: insightsVal ? insightsVal.nextActions.length > 0 : false
            }
        };

        return report;
    } catch (error) {
        console.error('❌ Validation Script Error:', error);
        return {
            status: 'ERROR',
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            executionTime: `${(performance.now() - startTime).toFixed(2)}ms`,
            missingFields: []
        };
    }
};

/**
 * TIER 1: SCHEMA VALIDATION
 * Checks field presence, type, range, and logical consistency
 */
const validateSchema = (log) => {
    const issues = [];
    const requiredFields = getRequiredFields();

    // Iterate through schema and validate each field
    Object.entries(ANALYTICS_SCHEMA).forEach(([fieldName, fieldSpec]) => {
        const value = log[fieldName];
        const fieldIssue = validateField(fieldName, value, fieldSpec, log);

        if (fieldIssue) {
            issues.push(fieldIssue);
        }
    });

    // Separate errors from warnings
    const errors = issues.filter(i => i.severity === 'ERROR');
    const warnings = issues.filter(i => i.severity === 'WARNING');

    return {
        valid: errors.length === 0,
        issues,
        errorCount: errors.length,
        warningCount: warnings.length
    };
};

/**
 * Validate a single field against its schema definition
 */
const validateField = (fieldName, value, fieldSpec, fullLog) => {
    // ────────────────────────────────────────────────────────────────────────
    // REQUIRED CHECK
    // ────────────────────────────────────────────────────────────────────────

    if (fieldSpec.required && (value === undefined || value === null || value === '')) {
        return {
            field: fieldName,
            code: VALIDATION_CODES.FAIL_MISSING_REQUIRED,
            message: `Required field missing: ${fieldName}`,
            severity: 'ERROR'
        };
    }

    // CONDITIONAL REQUIRED CHECK
    if (fieldSpec.conditionalRequired && fieldSpec.conditionalRequired(fullLog) && !value) {
        return {
            field: fieldName,
            code: VALIDATION_CODES.FAIL_MISSING_REQUIRED,
            message: fieldSpec.conditionalValidationError,
            severity: 'ERROR'
        };
    }

    // Skip remaining checks if value not provided (optional field)
    if (value === undefined || value === null || value === '') {
        return null;
    }

    // ────────────────────────────────────────────────────────────────────────
    // TYPE CHECK
    // ────────────────────────────────────────────────────────────────────────

    if (typeof value !== fieldSpec.type) {
        return {
            field: fieldName,
            code: VALIDATION_CODES.FAIL_TYPE_MISMATCH,
            message: `Expected ${fieldSpec.type} but got ${typeof value}`,
            severity: 'ERROR'
        };
    }

    // ────────────────────────────────────────────────────────────────────────
    // ENUM CHECK
    // ────────────────────────────────────────────────────────────────────────

    if (fieldSpec.enum && !fieldSpec.enum.includes(value)) {
        return {
            field: fieldName,
            code: VALIDATION_CODES.FAIL_INVALID_ENUM,
            message: `"${value}" not in allowed: ${fieldSpec.enum.join(', ')}`,
            severity: 'ERROR'
        };
    }

    // ────────────────────────────────────────────────────────────────────────
    // RANGE CHECKS
    // ────────────────────────────────────────────────────────────────────────

    if (fieldSpec.minimum !== undefined && value < fieldSpec.minimum) {
        return {
            field: fieldName,
            code: VALIDATION_CODES.FAIL_OUT_OF_RANGE,
            message: `${value} < minimum ${fieldSpec.minimum}`,
            severity: 'ERROR'
        };
    }

    if (fieldSpec.maximum !== undefined && value > fieldSpec.maximum) {
        return {
            field: fieldName,
            code: VALIDATION_CODES.FAIL_OUT_OF_RANGE,
            message: `${value} > maximum ${fieldSpec.maximum}`,
            severity: 'ERROR'
        };
    }

    // ────────────────────────────────────────────────────────────────────────
    // STRING LENGTH CHECKS
    // ────────────────────────────────────────────────────────────────────────

    if (fieldSpec.minLength && value.length < fieldSpec.minLength) {
        return {
            field: fieldName,
            code: VALIDATION_CODES.FAIL_OUT_OF_RANGE,
            message: `String length ${value.length} < minimum ${fieldSpec.minLength}`,
            severity: 'ERROR'
        };
    }

    if (fieldSpec.maxLength && value.length > fieldSpec.maxLength) {
        return {
            field: fieldName,
            code: VALIDATION_CODES.FAIL_OUT_OF_RANGE,
            message: `String length ${value.length} > maximum ${fieldSpec.maxLength}`,
            severity: 'ERROR'
        };
    }

    // ────────────────────────────────────────────────────────────────────────
    // LOGICAL VALIDATION (Cross-field rules)
    // ────────────────────────────────────────────────────────────────────────

    if (fieldSpec.logicalValidation) {
        const logicalResult = fieldSpec.logicalValidation(fullLog);

        if (!logicalResult.valid) {
            return {
                field: fieldName,
                code: logicalResult.error
                    ? VALIDATION_CODES.FAIL_LOGICAL_CONTRADICTION
                    : VALIDATION_CODES.WARNING_DATA_QUALITY,
                message: logicalResult.error || logicalResult.warning,
                severity: logicalResult.severity || 'WARNING',
                expected: logicalResult.expected
            };
        }
    }

    // No issues found
    return null;
};

/**
 * Generate detailed breakdown for debugging
 */
const generateDetailedReport = (logs, schemaValidation) => {
    return {
        fieldsChecked: Object.keys(ANALYTICS_SCHEMA).length,
        requiredFields: getRequiredFields().length,
        fieldGroups: Object.keys(FIELD_GROUPS),
        logsSampled: logs.length,
        issuesFound: schemaValidation.issues.length,
        issuesByField: groupBy(schemaValidation.issues, 'field'),
        issuesBySeverity: groupBy(schemaValidation.issues, 'severity')
    };
};

const groupBy = (arr, key) => {
    return arr.reduce((acc, obj) => {
        if (!acc[obj[key]]) acc[obj[key]] = [];
        acc[obj[key]].push(obj);
        return acc;
    }, {});
};

/**
 * Export helper for testing
 */
export { validateSemanticIntegrity };