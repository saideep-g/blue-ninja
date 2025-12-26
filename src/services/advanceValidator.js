/**
 * Advanced Validation Service
 * Validates all 25 fields with format checking, range validation, and consistency rules
 */

export interface AnalyticsRecord {
    // Core 12 fields
    questionId: string;
    studentAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    timeSpent: number; // ms
    speedRating: 'SPRINT' | 'STEADY' | 'DEEP';
    atomId: string;
    timestamp: number;
    diagnosticTag: string;
    isRecovered: boolean;
    masteryBefore: number; // 0-1
    masteryAfter: number; // 0-1

    // Enhanced 13 fields
    sessionId: string;
    attemptNumber: number;
    recoveryVelocity: number; // 0-1 or null
    cognitiveLoad: 'HIGH' | 'MEDIUM' | 'LOW';
    focusConsistency: number; // 0-1 (1=perfect consistency)
    correctnessPattern: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'UNKNOWN';
    distractionScore: number; // 0-100
    confidenceGap: number; // 0-1
    conceptualCohesion: string[]; // related atomIds
    spaceRepetitionDue: number; // unix timestamp
    peerPercentile: number; // 0-100
    suggestedIntervention: 'NONE' | 'HINT' | 'SCAFFOLDING' | 'COACHING';
    dataQuality: 'VALID' | 'ANOMALOUS' | 'INCOMPLETE';
}

export interface ValidationResult {
    isValid: boolean;
    score: number; // 0-100
    errors: ValidationError[];
    warnings: ValidationWarning[];
    anomalies: AnomalyDetection[];
    suggestions: string[];
    debugInfo: Record<string, any>;
}

export interface ValidationError {
    field: string;
    message: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    expectedFormat: string;
    actualValue: any;
}

export interface ValidationWarning {
    field: string;
    message: string;
    riskLevel: number; // 0-100
}

export interface AnomalyDetection {
    type: 'TIMING' | 'PATTERN' | 'CONSISTENCY' | 'LOGIC' | 'OUTLIER';
    field: string;
    description: string;
    confidence: number; // 0-1
    suggestedAction: string;
}

export class AdvancedValidator {
    /**
     * Main validation orchestrator
     * Runs all checks and compiles comprehensive report
     */
    static validateRecord(record: Partial<AnalyticsRecord>): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];
        const anomalies: AnomalyDetection[] = [];
        const suggestions: string[] = [];
        const debugInfo: Record<string, any> = {};

        // Phase 1: Format validation (12 core + 13 enhanced)
        this.validateCoreFields(record, errors, debugInfo);
        this.validateEnhancedFields(record, errors, debugInfo);

        // Phase 2: Type checking
        this.validateDataTypes(record, errors, warnings);

        // Phase 3: Range validation
        this.validateRanges(record, errors, warnings);

        // Phase 4: Logical consistency
        this.validateLogicalConsistency(record, errors, anomalies, suggestions);

        // Phase 5: Anomaly detection (advanced)
        this.detectAnomalies(record, anomalies, debugInfo);

        // Phase 6: Cross-field validation
        this.validateCrossFieldRelationships(record, errors, anomalies, suggestions);

        // Calculate overall validation score
        const score = this.calculateValidationScore(errors, warnings, anomalies);

        return {
            isValid: errors.length === 0 && score >= 80,
            score,
            errors,
            warnings,
            anomalies,
            suggestions,
            debugInfo
        };
    }

    /**
     * Validate core 12 fields
     */
    private static validateCoreFields(
        record: Partial<AnalyticsRecord>,
        errors: ValidationError[],
        debugInfo: Record<string, any>
    ): void {
        // questionId: Must be non-empty UUID or alphanumeric
        if (!record.questionId || typeof record.questionId !== 'string') {
            errors.push({
                field: 'questionId',
                message: 'Question ID is required and must be a string',
                severity: 'CRITICAL',
                expectedFormat: 'UUID or alphanumeric identifier',
                actualValue: record.questionId
            });
        } else if (!/^[a-zA-Z0-9\-_]{5,}$/.test(record.questionId)) {
            errors.push({
                field: 'questionId',
                message: 'Question ID format invalid',
                severity: 'HIGH',
                expectedFormat: 'At least 5 alphanumeric characters',
                actualValue: record.questionId
            });
        }
        debugInfo.questionIdValid = errors.filter(e => e.field === 'questionId').length === 0;

        // studentAnswer: Must exist and match correctAnswer format
        if (record.studentAnswer === undefined || record.studentAnswer === null) {
            errors.push({
                field: 'studentAnswer',
                message: 'Student answer is required',
                severity: 'CRITICAL',
                expectedFormat: 'string | number | boolean',
                actualValue: record.studentAnswer
            });
        } else if (typeof record.studentAnswer !== typeof record.correctAnswer) {
            errors.push({
                field: 'studentAnswer',
                message: 'Answer type mismatch with correct answer',
                severity: 'HIGH',
                expectedFormat: `${typeof record.correctAnswer}`,
                actualValue: `${typeof record.studentAnswer}`
            });
        }
        debugInfo.studentAnswerValid = errors.filter(e => e.field === 'studentAnswer').length === 0;

        // correctAnswer: Must be non-empty
        if (record.correctAnswer === undefined || record.correctAnswer === null) {
            errors.push({
                field: 'correctAnswer',
                message: 'Correct answer is required',
                severity: 'CRITICAL',
                expectedFormat: 'string | number | boolean',
                actualValue: record.correctAnswer
            });
        }
        debugInfo.correctAnswerValid = errors.filter(e => e.field === 'correctAnswer').length === 0;

        // isCorrect: Must be boolean
        if (typeof record.isCorrect !== 'boolean') {
            errors.push({
                field: 'isCorrect',
                message: 'isCorrect must be a boolean',
                severity: 'CRITICAL',
                expectedFormat: 'boolean',
                actualValue: record.isCorrect
            });
        }
        debugInfo.isCorrectValid = typeof record.isCorrect === 'boolean';

        // timeSpent: Must be positive number (milliseconds)
        if (typeof record.timeSpent !== 'number' || record.timeSpent <= 0) {
            errors.push({
                field: 'timeSpent',
                message: 'Time spent must be a positive number (milliseconds)',
                severity: 'CRITICAL',
                expectedFormat: 'number > 0',
                actualValue: record.timeSpent
            });
        } else if (record.timeSpent > 5 * 60 * 1000) {
            // Warning: More than 5 minutes is unusual
            errors.push({
                field: 'timeSpent',
                message: 'Time spent exceeds typical question duration (5 minutes)',
                severity: 'MEDIUM',
                expectedFormat: 'number <= 300000 (5 min)',
                actualValue: record.timeSpent
            });
        }
        debugInfo.timeSpentValid = typeof record.timeSpent === 'number' && record.timeSpent > 0;

        // speedRating: Must be one of three values
        const validSpeeds = ['SPRINT', 'STEADY', 'DEEP'];
        if (!validSpeeds.includes(record.speedRating as string)) {
            errors.push({
                field: 'speedRating',
                message: 'Speed rating must be SPRINT, STEADY, or DEEP',
                severity: 'CRITICAL',
                expectedFormat: 'SPRINT | STEADY | DEEP',
                actualValue: record.speedRating
            });
        } else {
            // Infer cognitiveLoad from speedRating
            debugInfo.inferredCognitiveLoad = record.speedRating === 'SPRINT' ? 'LOW' :
                record.speedRating === 'STEADY' ? 'MEDIUM' : 'HIGH';
        }
        debugInfo.speedRatingValid = validSpeeds.includes(record.speedRating as string);

        // atomId: Must be non-empty
        if (!record.atomId || typeof record.atomId !== 'string') {
            errors.push({
                field: 'atomId',
                message: 'Atom ID is required',
                severity: 'HIGH',
                expectedFormat: 'non-empty string',
                actualValue: record.atomId
            });
        }
        debugInfo.atomIdValid = !!record.atomId && typeof record.atomId === 'string';

        // timestamp: Must be valid Unix timestamp (in reasonable range)
        if (typeof record.timestamp !== 'number') {
            errors.push({
                field: 'timestamp',
                message: 'Timestamp must be a number (Unix milliseconds)',
                severity: 'CRITICAL',
                expectedFormat: 'number',
                actualValue: record.timestamp
            });
        } else if (record.timestamp < 1000000000000 || record.timestamp > Date.now() + 1000) {
            // Before 2001 or in the future
            errors.push({
                field: 'timestamp',
                message: 'Timestamp is not a valid Unix millisecond timestamp',
                severity: 'HIGH',
                expectedFormat: 'Unix milliseconds (1970-now)',
                actualValue: new Date(record.timestamp).toISOString()
            });
        }
        debugInfo.timestampValid = typeof record.timestamp === 'number' &&
            record.timestamp > 1000000000000 &&
            record.timestamp <= Date.now() + 1000;

        // diagnosticTag: Must be non-empty (identifies misconception/hurdle)
        if (!record.diagnosticTag || typeof record.diagnosticTag !== 'string') {
            errors.push({
                field: 'diagnosticTag',
                message: 'Diagnostic tag (misconception ID) is required',
                severity: 'CRITICAL',
                expectedFormat: 'non-empty string (e.g., SIGN_IGNORANCE)',
                actualValue: record.diagnosticTag
            });
        }
        debugInfo.diagnosticTagValid = !!record.diagnosticTag && typeof record.diagnosticTag === 'string';

        // isRecovered: Must be boolean
        if (typeof record.isRecovered !== 'boolean') {
            errors.push({
                field: 'isRecovered',
                message: 'isRecovered must be a boolean',
                severity: 'MEDIUM',
                expectedFormat: 'boolean',
                actualValue: record.isRecovered
            });
        }
        debugInfo.isRecoveredValid = typeof record.isRecovered === 'boolean';

        // masteryBefore: Must be 0-1
        if (typeof record.masteryBefore !== 'number' ||
            record.masteryBefore < 0 || record.masteryBefore > 1) {
            errors.push({
                field: 'masteryBefore',
                message: 'Mastery before must be a number between 0 and 1',
                severity: 'HIGH',
                expectedFormat: 'number in range [0, 1]',
                actualValue: record.masteryBefore
            });
        }
        debugInfo.masteryBeforeValid = typeof record.masteryBefore === 'number' &&
            record.masteryBefore >= 0 &&
            record.masteryBefore <= 1;

        // masteryAfter: Must be 0-1 and >= masteryBefore OR masteryBefore for recovery
        if (typeof record.masteryAfter !== 'number' ||
            record.masteryAfter < 0 || record.masteryAfter > 1) {
            errors.push({
                field: 'masteryAfter',
                message: 'Mastery after must be a number between 0 and 1',
                severity: 'HIGH',
                expectedFormat: 'number in range [0, 1]',
                actualValue: record.masteryAfter
            });
        }
        debugInfo.masteryAfterValid = typeof record.masteryAfter === 'number' &&
            record.masteryAfter >= 0 &&
            record.masteryAfter <= 1;
    }

    /**
     * Validate enhanced 13 fields
     */
    private static validateEnhancedFields(
        record: Partial<AnalyticsRecord>,
        errors: ValidationError[],
        debugInfo: Record<string, any>
    ): void {
        // sessionId: UUID format
        if (!record.sessionId || typeof record.sessionId !== 'string') {
            errors.push({
                field: 'sessionId',
                message: 'Session ID is required',
                severity: 'HIGH',
                expectedFormat: 'UUID',
                actualValue: record.sessionId
            });
        }
        debugInfo.sessionIdValid = !!record.sessionId && typeof record.sessionId === 'string';

        // attemptNumber: Positive integer
        if (typeof record.attemptNumber !== 'number' || record.attemptNumber < 1) {
            errors.push({
                field: 'attemptNumber',
                message: 'Attempt number must be a positive integer',
                severity: 'MEDIUM',
                expectedFormat: 'integer >= 1',
                actualValue: record.attemptNumber
            });
        }
        debugInfo.attemptNumberValid = typeof record.attemptNumber === 'number' && record.attemptNumber >= 1;

        // recoveryVelocity: 0-1 or null
        if (record.recoveryVelocity !== null && record.recoveryVelocity !== undefined) {
            if (typeof record.recoveryVelocity !== 'number' ||
                record.recoveryVelocity < 0 || record.recoveryVelocity > 1) {
                errors.push({
                    field: 'recoveryVelocity',
                    message: 'Recovery velocity must be 0-1 or null',
                    severity: 'MEDIUM',
                    expectedFormat: 'number in [0, 1] or null',
                    actualValue: record.recoveryVelocity
                });
            }
        }
        debugInfo.recoveryVelocityValid = record.recoveryVelocity === null ||
            (typeof record.recoveryVelocity === 'number' &&
                record.recoveryVelocity >= 0 &&
                record.recoveryVelocity <= 1);

        // cognitiveLoad: Must be one of three
        const validLoads = ['HIGH', 'MEDIUM', 'LOW'];
        if (!validLoads.includes(record.cognitiveLoad as string)) {
            errors.push({
                field: 'cognitiveLoad',
                message: 'Cognitive load must be HIGH, MEDIUM, or LOW',
                severity: 'MEDIUM',
                expectedFormat: 'HIGH | MEDIUM | LOW',
                actualValue: record.cognitiveLoad
            });
        }
        debugInfo.cognitiveLoadValid = validLoads.includes(record.cognitiveLoad as string);

        // focusConsistency: 0-1
        if (typeof record.focusConsistency !== 'number' ||
            record.focusConsistency < 0 || record.focusConsistency > 1) {
            errors.push({
                field: 'focusConsistency',
                message: 'Focus consistency must be 0-1',
                severity: 'LOW',
                expectedFormat: 'number in [0, 1]',
                actualValue: record.focusConsistency
            });
        }
        debugInfo.focusConsistencyValid = typeof record.focusConsistency === 'number' &&
            record.focusConsistency >= 0 &&
            record.focusConsistency <= 1;

        // correctnessPattern: One of four values
        const validPatterns = ['IMPROVING', 'STABLE', 'DECLINING', 'UNKNOWN'];
        if (!validPatterns.includes(record.correctnessPattern as string)) {
            errors.push({
                field: 'correctnessPattern',
                message: 'Correctness pattern must be IMPROVING, STABLE, DECLINING, or UNKNOWN',
                severity: 'LOW',
                expectedFormat: 'IMPROVING | STABLE | DECLINING | UNKNOWN',
                actualValue: record.correctnessPattern
            });
        }
        debugInfo.correctnessPatternValid = validPatterns.includes(record.correctnessPattern as string);

        // distractionScore: 0-100
        if (typeof record.distractionScore !== 'number' ||
            record.distractionScore < 0 || record.distractionScore > 100) {
            errors.push({
                field: 'distractionScore',
                message: 'Distraction score must be 0-100',
                severity: 'LOW',
                expectedFormat: 'number in [0, 100]',
                actualValue: record.distractionScore
            });
        }
        debugInfo.distractionScoreValid = typeof record.distractionScore === 'number' &&
            record.distractionScore >= 0 &&
            record.distractionScore <= 100;

        // confidenceGap: 0-1
        if (typeof record.confidenceGap !== 'number' ||
            record.confidenceGap < 0 || record.confidenceGap > 1) {
            errors.push({
                field: 'confidenceGap',
                message: 'Confidence gap must be 0-1',
                severity: 'LOW',
                expectedFormat: 'number in [0, 1]',
                actualValue: record.confidenceGap
            });
        }
        debugInfo.confidenceGapValid = typeof record.confidenceGap === 'number' &&
            record.confidenceGap >= 0 &&
            record.confidenceGap <= 1;

        // conceptualCohesion: Array of strings
        if (!Array.isArray(record.conceptualCohesion) ||
            !record.conceptualCohesion.every(id => typeof id === 'string')) {
            errors.push({
                field: 'conceptualCohesion',
                message: 'Conceptual cohesion must be an array of strings',
                severity: 'LOW',
                expectedFormat: 'string[]',
                actualValue: typeof record.conceptualCohesion
            });
        }
        debugInfo.conceptualCohesionValid = Array.isArray(record.conceptualCohesion) &&
            record.conceptualCohesion.every(id => typeof id === 'string');

        // spaceRepetitionDue: Unix timestamp in future
        if (typeof record.spaceRepetitionDue !== 'number' ||
            record.spaceRepetitionDue <= Date.now()) {
            errors.push({
                field: 'spaceRepetitionDue',
                message: 'Space repetition due must be a future Unix timestamp',
                severity: 'LOW',
                expectedFormat: 'Unix milliseconds > now',
                actualValue: new Date(record.spaceRepetitionDue || 0).toISOString()
            });
        }
        debugInfo.spaceRepetitionDueValid = typeof record.spaceRepetitionDue === 'number' &&
            record.spaceRepetitionDue > Date.now();

        // peerPercentile: 0-100
        if (typeof record.peerPercentile !== 'number' ||
            record.peerPercentile < 0 || record.peerPercentile > 100) {
            errors.push({
                field: 'peerPercentile',
                message: 'Peer percentile must be 0-100',
                severity: 'LOW',
                expectedFormat: 'number in [0, 100]',
                actualValue: record.peerPercentile
            });
        }
        debugInfo.peerPercentileValid = typeof record.peerPercentile === 'number' &&
            record.peerPercentile >= 0 &&
            record.peerPercentile <= 100;

        // suggestedIntervention: One of four values
        const validInterventions = ['NONE', 'HINT', 'SCAFFOLDING', 'COACHING'];
        if (!validInterventions.includes(record.suggestedIntervention as string)) {
            errors.push({
                field: 'suggestedIntervention',
                message: 'Suggested intervention must be NONE, HINT, SCAFFOLDING, or COACHING',
                severity: 'LOW',
                expectedFormat: 'NONE | HINT | SCAFFOLDING | COACHING',
                actualValue: record.suggestedIntervention
            });
        }
        debugInfo.suggestedInterventionValid = validInterventions.includes(record.suggestedIntervention as string);

        // dataQuality: One of three values
        const validQualities = ['VALID', 'ANOMALOUS', 'INCOMPLETE'];
        if (!validQualities.includes(record.dataQuality as string)) {
            errors.push({
                field: 'dataQuality',
                message: 'Data quality must be VALID, ANOMALOUS, or INCOMPLETE',
                severity: 'MEDIUM',
                expectedFormat: 'VALID | ANOMALOUS | INCOMPLETE',
                actualValue: record.dataQuality
            });
        }
        debugInfo.dataQualityValid = validQualities.includes(record.dataQuality as string);
    }

    private static validateDataTypes(
        record: Partial<AnalyticsRecord>,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        // Ensure numeric fields are numbers (not strings)
        const numericFields: (keyof AnalyticsRecord)[] = [
            'timeSpent', 'masteryBefore', 'masteryAfter', 'attemptNumber',
            'recoveryVelocity', 'focusConsistency', 'distractionScore', 'confidenceGap',
            'spaceRepetitionDue', 'peerPercentile'
        ];

        numericFields.forEach(field => {
            const value = record[field];
            if (value !== null && value !== undefined && typeof value !== 'number') {
                warnings.push({
                    field: String(field),
                    message: `${field} is not a number, type coercion may occur`,
                    riskLevel: 50
                });
            }
        });
    }

    private static validateRanges(
        record: Partial<AnalyticsRecord>,
        errors: ValidationError[],
        warnings: ValidationWarning[]
    ): void {
        // timeSpent: Reasonable range 500ms - 5 min
        if (record.timeSpent && (record.timeSpent < 500 || record.timeSpent > 5 * 60 * 1000)) {
            warnings.push({
                field: 'timeSpent',
                message: `Time spent (${record.timeSpent}ms) outside typical range (500ms-5min)`,
                riskLevel: 40
            });
        }

        // masteryBefore === masteryAfter (no change)
        if (record.masteryBefore === record.masteryAfter && record.attemptNumber === 1) {
            warnings.push({
                field: 'masteryBefore/After',
                message: 'Mastery unchanged between before/after on first attempt',
                riskLevel: 30
            });
        }
    }

    private static validateLogicalConsistency(
        record: Partial<AnalyticsRecord>,
        errors: ValidationError[],
        anomalies: AnomalyDetection[],
        suggestions: string[]
    ): void {
        // Rule 1: If isCorrect=true, masteryAfter should be >= masteryBefore
        if (record.isCorrect === true &&
            record.masteryAfter !== undefined &&
            record.masteryBefore !== undefined &&
            record.masteryAfter < record.masteryBefore) {
            anomalies.push({
                type: 'LOGIC',
                field: 'masteryBefore/After',
                description: 'Mastery decreased after correct answer',
                confidence: 0.9,
                suggestedAction: 'Review mastery calculation logic'
            });
            suggestions.push('Ensure mastery increases on correct answers');
        }

        // Rule 2: If isRecovered=true, recoveryVelocity should be populated
        if (record.isRecovered === true && !record.recoveryVelocity) {
            anomalies.push({
                type: 'LOGIC',
                field: 'recoveryVelocity',
                description: 'Recovery attempt without velocity calculation',
                confidence: 0.95,
                suggestedAction: 'Calculate recovery velocity for all recovery attempts'
            });
            suggestions.push('Populate recoveryVelocity when isRecovered=true');
        }

        // Rule 3: Speed rating must align with timeSpent
        if (record.speedRating === 'SPRINT' && record.timeSpent && record.timeSpent > 10000) {
            anomalies.push({
                type: 'CONSISTENCY',
                field: 'speedRating/timeSpent',
                description: 'SPRINT rating with >10s response time inconsistent',
                confidence: 0.85,
                suggestedAction: 'Review speed rating logic or time measurement'
            });
        }

        if (record.speedRating === 'DEEP' && record.timeSpent && record.timeSpent < 2000) {
            anomalies.push({
                type: 'CONSISTENCY',
                field: 'speedRating/timeSpent',
                description: 'DEEP rating with <2s response time inconsistent',
                confidence: 0.8,
                suggestedAction: 'Verify student was actually thinking deeply'
            });
        }
    }

    private static detectAnomalies(
        record: Partial<AnalyticsRecord>,
        anomalies: AnomalyDetection[],
        debugInfo: Record<string, any>
    ): void {
        // Outlier detection: timeSpent
        if (record.timeSpent && record.timeSpent < 300) {
            anomalies.push({
                type: 'OUTLIER',
                field: 'timeSpent',
                description: 'Very fast response (<300ms) - guessing suspected',
                confidence: 0.6,
                suggestedAction: 'Consider whether this is a guess vs knowledge'
            });
        }

        // Outlier detection: peerPercentile extremes
        if (record.peerPercentile !== undefined) {
            if (record.peerPercentile < 5) {
                anomalies.push({
                    type: 'OUTLIER',
                    field: 'peerPercentile',
                    description: 'Very low percentile (<5) - student significantly behind',
                    confidence: 0.95,
                    suggestedAction: 'Recommend additional support/scaffolding'
                });
            }
            if (record.peerPercentile > 95) {
                anomalies.push({
                    type: 'OUTLIER',
                    field: 'peerPercentile',
                    description: 'Very high percentile (>95) - exceptional performance',
                    confidence: 0.95,
                    suggestedAction: 'Consider advanced/enrichment content'
                });
            }
        }

        debugInfo.anomalyCount = anomalies.length;
    }

    private static validateCrossFieldRelationships(
        record: Partial<AnalyticsRecord>,
        errors: ValidationError[],
        anomalies: AnomalyDetection[],
        suggestions: string[]
    ): void {
        // If attemptNumber > 1, should have previous data
        if (record.attemptNumber && record.attemptNumber > 1 && !record.recoveryVelocity) {
            anomalies.push({
                type: 'LOGIC',
                field: 'attemptNumber/recoveryVelocity',
                description: 'Multiple attempts recorded but no recovery velocity calculated',
                confidence: 0.8,
                suggestedAction: 'Calculate recovery metrics for all retry attempts'
            });
        }

        // sessionId should be present for all records
        if (!record.sessionId) {
            errors.push({
                field: 'sessionId',
                message: 'Session ID missing - cannot group questions into session',
                severity: 'HIGH',
                expectedFormat: 'UUID',
                actualValue: record.sessionId
            });
        }

        // Confidence gap should equal |masteryBefore - isCorrect|
        if (record.masteryBefore !== undefined && record.isCorrect !== undefined) {
            const expectedGap = Math.abs(record.masteryBefore - (record.isCorrect ? 1 : 0));
            if (record.confidenceGap !== undefined &&
                Math.abs(record.confidenceGap - expectedGap) > 0.01) {
                anomalies.push({
                    type: 'LOGIC',
                    field: 'confidenceGap',
                    description: `Confidence gap mismatch: expected ${expectedGap}, got ${record.confidenceGap}`,
                    confidence: 0.9,
                    suggestedAction: 'Verify gap calculation: |masteryBefore - correctness|'
                });
                suggestions.push(`Calculate confidenceGap as |${record.masteryBefore} - ${record.isCorrect ? 1 : 0}| = ${expectedGap}`);
            }
        }
    }

    private static calculateValidationScore(
        errors: ValidationError[],
        warnings: ValidationWarning[],
        anomalies: AnomalyDetection[]
    ): number {
        let score = 100;

        // Critical errors: -30 each
        const criticalErrors = errors.filter(e => e.severity === 'CRITICAL').length;
        score -= criticalErrors * 30;

        // High severity errors: -15 each
        const highErrors = errors.filter(e => e.severity === 'HIGH').length;
        score -= highErrors * 15;

        // Medium severity errors: -8 each
        const mediumErrors = errors.filter(e => e.severity === 'MEDIUM').length;
        score -= mediumErrors * 8;

        // Warnings: -2 each
        score -= warnings.length * 2;

        // Anomalies: -3 * confidence each
        anomalies.forEach(a => {
            score -= 3 * a.confidence;
        });

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Generate human-readable report
     */
    static generateReport(result: ValidationResult): string {
        let report = '📊 VALIDATION REPORT\n';
        report += `${'='.repeat(60)}\n\n`;
        report += `Overall Score: ${result.score}/100\n`;
        report += `Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}\n\n`;

        if (result.errors.length > 0) {
            report += `🔴 ERRORS (${result.errors.length}):\n`;
            result.errors.forEach(e => {
                report += `  [${e.severity}] ${e.field}: ${e.message}\n`;
                report += `    Expected: ${e.expectedFormat}\n`;
                report += `    Got: ${JSON.stringify(e.actualValue)}\n\n`;
            });
        }

        if (result.warnings.length > 0) {
            report += `🟡 WARNINGS (${result.warnings.length}):\n`;
            result.warnings.forEach(w => {
                report += `  [${w.riskLevel}%] ${w.field}: ${w.message}\n`;
            });
            report += '\n';
        }

        if (result.anomalies.length > 0) {
            report += `🟠 ANOMALIES DETECTED (${result.anomalies.length}):\n`;
            result.anomalies.forEach(a => {
                report += `  [${a.type}] ${a.field} (confidence: ${(a.confidence * 100).toFixed(0)}%)\n`;
                report += `    ${a.description}\n`;
                report += `    → ${a.suggestedAction}\n\n`;
            });
        }

        if (result.suggestions.length > 0) {
            report += `💡 SUGGESTIONS (${result.suggestions.length}):\n`;
            result.suggestions.forEach((s, i) => {
                report += `  ${i + 1}. ${s}\n`;
            });
        }

        return report;
    }
}

// Export for testing
export default AdvancedValidator;
