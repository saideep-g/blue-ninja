import AdvancedValidator, { AnalyticsRecord, ValidationResult } from '../advancedValidator';

describe('AdvancedValidator', () => {
    describe('Core Field Validation', () => {
        test('should accept valid record with all 25 fields', () => {
            const validRecord: Partial<AnalyticsRecord> = {
                // Core 12
                questionId: 'q123-abc456',
                studentAnswer: 'B',
                correctAnswer: 'B',
                isCorrect: true,
                timeSpent: 3500,
                speedRating: 'STEADY',
                atomId: 'A001_DIVISION_BASICS',
                timestamp: Date.now(),
                diagnosticTag: 'SIGN_IGNORANCE',
                isRecovered: false,
                masteryBefore: 0.45,
                masteryAfter: 0.65,

                // Enhanced 13
                sessionId: 'sess-uuid-1234',
                attemptNumber: 1,
                recoveryVelocity: null,
                cognitiveLoad: 'MEDIUM',
                focusConsistency: 0.92,
                correctnessPattern: 'STABLE',
                distractionScore: 15,
                confidenceGap: 0.35,
                conceptualCohesion: ['A001', 'A002'],
                spaceRepetitionDue: Date.now() + 2 * 24 * 60 * 60 * 1000,
                peerPercentile: 62,
                suggestedIntervention: 'NONE',
                dataQuality: 'VALID'
            };

            const result = AdvancedValidator.validateRecord(validRecord);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.score).toBeGreaterThanOrEqual(90);
        });

        test('should catch missing critical fields', () => {
            const invalidRecord: Partial<AnalyticsRecord> = {
                studentAnswer: 'B',
                // Missing: questionId, correctAnswer, isCorrect, etc.
            };

            const result = AdvancedValidator.validateRecord(invalidRecord);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(5);
            expect(result.errors.some(e => e.severity === 'CRITICAL')).toBe(true);
        });

        test('should validate timeSpent range', () => {
            const record: Partial<AnalyticsRecord> = {
                questionId: 'q1',
                studentAnswer: 'A',
                correctAnswer: 'A',
                isCorrect: true,
                timeSpent: 100, // Too fast
                speedRating: 'SPRINT',
                atomId: 'A001',
                timestamp: Date.now(),
                diagnosticTag: 'TAG',
                isRecovered: false,
                masteryBefore: 0.5,
                masteryAfter: 0.6,
                sessionId: 'sess1',
                attemptNumber: 1
            };

            const result = AdvancedValidator.validateRecord(record);
            const anomalies = result.anomalies.filter(a => a.field === 'timeSpent');
            expect(anomalies.length).toBeGreaterThan(0);
        });
    });

    describe('Format Validation', () => {
        test('should validate masteryBefore/After as 0-1', () => {
            const record: Partial<AnalyticsRecord> = {
                questionId: 'q1',
                studentAnswer: 'A',
                correctAnswer: 'A',
                isCorrect: true,
                timeSpent: 3000,
                speedRating: 'STEADY',
                atomId: 'A001',
                timestamp: Date.now(),
                diagnosticTag: 'TAG',
                isRecovered: false,
                masteryBefore: 1.5, // Invalid: > 1
                masteryAfter: 0.5,
                sessionId: 'sess1',
                attemptNumber: 1
            };

            const result = AdvancedValidator.validateRecord(record);
            expect(result.errors.some(e => e.field === 'masteryBefore')).toBe(true);
        });

        test('should validate speedRating enum', () => {
            const record: Partial<AnalyticsRecord> = {
                questionId: 'q1',
                studentAnswer: 'A',
                correctAnswer: 'A',
                isCorrect: true,
                timeSpent: 3000,
                speedRating: 'INVALID', // Invalid enum
                atomId: 'A001',
                timestamp: Date.now(),
                diagnosticTag: 'TAG',
                isRecovered: false,
                masteryBefore: 0.5,
                masteryAfter: 0.6,
                sessionId: 'sess1',
                attemptNumber: 1
            };

            const result = AdvancedValidator.validateRecord(record);
            expect(result.errors.some(e => e.field === 'speedRating')).toBe(true);
        });
    });

    describe('Logical Consistency', () => {
        test('should detect mastery decrease on correct answer', () => {
            const record: Partial<AnalyticsRecord> = {
                questionId: 'q1',
                studentAnswer: 'A',
                correctAnswer: 'A',
                isCorrect: true, // Correct
                timeSpent: 3000,
                speedRating: 'STEADY',
                atomId: 'A001',
                timestamp: Date.now(),
                diagnosticTag: 'TAG',
                isRecovered: false,
                masteryBefore: 0.8,
                masteryAfter: 0.6, // Decreased! Invalid
                sessionId: 'sess1',
                attemptNumber: 1
            };

            const result = AdvancedValidator.validateRecord(record);
            const logicAnomalies = result.anomalies.filter(a => a.type === 'LOGIC');
            expect(logicAnomalies.length).toBeGreaterThan(0);
        });

        test('should flag recovery attempt without velocity', () => {
            const record: Partial<AnalyticsRecord> = {
                questionId: 'q1',
                studentAnswer: 'A',
                correctAnswer: 'A',
                isCorrect: true,
                timeSpent: 2000,
                speedRating: 'SPRINT',
                atomId: 'A001',
                timestamp: Date.now(),
                diagnosticTag: 'TAG',
                isRecovered: true, // Recovery
                recoveryVelocity: null, // But no velocity calculated!
                masteryBefore: 0.3,
                masteryAfter: 0.5,
                sessionId: 'sess1',
                attemptNumber: 2
            };

            const result = AdvancedValidator.validateRecord(record);
            const logicAnomalies = result.anomalies.filter(a => a.type === 'LOGIC' &&
                a.field === 'recoveryVelocity');
            expect(logicAnomalies.length).toBeGreaterThan(0);
        });
    });

    describe('Anomaly Detection', () => {
        test('should detect very fast responses (guessing)', () => {
            const record: Partial<AnalyticsRecord> = {
                questionId: 'q1',
                studentAnswer: 'A',
                correctAnswer: 'A',
                isCorrect: true,
                timeSpent: 200, // <300ms
                speedRating: 'SPRINT',
                atomId: 'A001',
                timestamp: Date.now(),
                diagnosticTag: 'TAG',
                isRecovered: false,
                masteryBefore: 0.5,
                masteryAfter: 0.6,
                sessionId: 'sess1',
                attemptNumber: 1
            };

            const result = AdvancedValidator.validateRecord(record);
            const outliers = result.anomalies.filter(a => a.type === 'OUTLIER' &&
                a.field === 'timeSpent');
            expect(outliers.length).toBeGreaterThan(0);
            expect(outliers.description).toContain('guessing');
        });

        test('should detect extreme percentiles', () => {
            const record: Partial<AnalyticsRecord> = {
                questionId: 'q1',
                studentAnswer: 'A',
                correctAnswer: 'A',
                isCorrect: true,
                timeSpent: 3000,
                speedRating: 'STEADY',
                atomId: 'A001',
                timestamp: Date.now(),
                diagnosticTag: 'TAG',
                isRecovered: false,
                masteryBefore: 0.5,
                masteryAfter: 0.6,
                sessionId: 'sess1',
                attemptNumber: 1,
                peerPercentile: 2 // Very low
            };

            const result = AdvancedValidator.validateRecord(record);
            const outliers = result.anomalies.filter(a => a.type === 'OUTLIER' &&
                a.field === 'peerPercentile');
            expect(outliers.length).toBeGreaterThan(0);
            expect(outliers.description).toContain('behind');
        });
    });

    describe('Report Generation', () => {
        test('should generate human-readable report', () => {
            const record: Partial<AnalyticsRecord> = {
                questionId: 'q1',
                studentAnswer: 'A',
                correctAnswer: 'B', // Wrong!
                isCorrect: false,
                timeSpent: 5000,
                speedRating: 'DEEP',
                atomId: 'A001',
                timestamp: Date.now(),
                diagnosticTag: 'TAG',
                isRecovered: false,
                masteryBefore: 0.7,
                masteryAfter: 0.65, // Decreased due to wrong answer - expected
                sessionId: 'sess1',
                attemptNumber: 1
            };

            const result = AdvancedValidator.validateRecord(record);
            const report = AdvancedValidator.generateReport(result);

            expect(report).toContain('VALIDATION REPORT');
            expect(report).toContain(`Score: ${result.score}/100`);
            expect(report).toMatch(/✅|❌/);
        });
    });

    describe('Scoring Algorithm', () => {
        test('should score 100 for perfectly valid record', () => {
            const validRecord: Partial<AnalyticsRecord> = {
                questionId: 'q1',
                studentAnswer: 'A',
                correctAnswer: 'A',
                isCorrect: true,
                timeSpent: 3000,
                speedRating: 'STEADY',
                atomId: 'A001',
                timestamp: Date.now(),
                diagnosticTag: 'TAG',
                isRecovered: false,
                masteryBefore: 0.5,
                masteryAfter: 0.7,
                sessionId: 'sess1',
                attemptNumber: 1,
                cognitiveLoad: 'MEDIUM',
                focusConsistency: 0.95,
                correctnessPattern: 'IMPROVING',
                distractionScore: 5,
                confidenceGap: 0.2,
                conceptualCohesion: ['A001', 'A002'],
                spaceRepetitionDue: Date.now() + 2 * 24 * 60 * 60 * 1000,
                peerPercentile: 75,
                suggestedIntervention: 'NONE',
                dataQuality: 'VALID'
            };

            const result = AdvancedValidator.validateRecord(validRecord);
            expect(result.score).toBe(100);
        });

        test('should reduce score for errors and anomalies', () => {
            const poorRecord: Partial<AnalyticsRecord> = {
                questionId: 'q1',
                studentAnswer: 'A',
                correctAnswer: 'B',
                isCorrect: false,
                timeSpent: 100, // Very fast - anomaly
                speedRating: 'DEEP',
                atomId: 'A001',
                timestamp: Date.now() + 1000000000, // Future timestamp - error
                diagnosticTag: 'TAG',
                isRecovered: false,
                masteryBefore: 1.5, // Invalid - error
                masteryAfter: 0.6,
                sessionId: null, // Missing critical - error
                attemptNumber: 1,
                peerPercentile: 1 // Extreme outlier - anomaly
            };

            const result = AdvancedValidator.validateRecord(poorRecord);
            expect(result.score).toBeLessThan(60);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.anomalies.length).toBeGreaterThan(0);
        });
    });
});
