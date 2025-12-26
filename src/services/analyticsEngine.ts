/**
 * Analytics Engine
 * Aggregates raw question logs into meaningful insights
 * Supports Student, Parent, Teacher, and Admin views
 */

import { db } from '../firebase-config';
import {
    collection,
    query,
    where,
    getDocs,
    limit,
    orderBy,
    startAt,
    endAt,
    Query
} from 'firebase/firestore';
import { AdvancedValidator, AnalyticsRecord } from './advancedValidator';

export interface AtomMastery {
    atomId: string;
    concept: string;
    masteryScore: number; // 0-1
    trend: 'IMPROVING' | 'STABLE' | 'DECLINING' | 'UNKNOWN';
    attemptCount: number;
    successRate: number;
    averageTimeSpent: number;
    recoveryVelocity: number | null;
    lastAttemptDate: number;
    nextReviewDate: number;
    suggestedIntervention: 'NONE' | 'HINT' | 'SCAFFOLDING' | 'COACHING';
}

export interface SessionMetrics {
    sessionId: string;
    date: number;
    duration: number; // ms
    questionCount: number;
    correctCount: number;
    accuracy: number; // 0-1
    averageTimePerQuestion: number;
    recoveryAttempts: number;
    recoverySuccessRate: number;
    cognitiveLoadDistribution: {
        SPRINT: number;
        STEADY: number;
        DEEP: number;
    };
    focusScore: number; // 0-100
    estimatedLearning: number; // 0-1 (confidence of learning)
}

export interface StudentAnalytics {
    studentId: string;
    totalSessionCount: number;
    totalQuestionCount: number;
    overallAccuracy: number;
    overallMastery: number;
    learningVelocity: number; // Session gain per week
    conceptMasteries: AtomMastery[];
    recentSessions: SessionMetrics[];
    strengths: string[]; // Top 3 concepts
    weaknesses: string[]; // Bottom 3 concepts
    recoveryMetrics: {
        totalRecoveryAttempts: number;
        successfulRecoveries: number;
        averageRecoveryVelocity: number;
    };
    consistencyScore: number; // 0-100 (how consistent is learning)
    engagementScore: number; // 0-100 (based on session frequency/duration)
    recommendations: string[];
}

export interface ClassAnalytics {
    classId: string;
    studentCount: number;
    averageAccuracy: number;
    averageMastery: number;
    conceptTrends: Record<string, AtomMastery>;
    studentPerformanceDistribution: {
        excellent: number;
        good: number;
        average: number;
        needsSupport: number;
    };
    recommendedFocusAreas: string[];
    teacherInsights: string[];
}

export class AnalyticsEngine {
    /**
     * Calculate student's overall analytics
     */
    static async getStudentAnalytics(studentId: string): Promise<StudentAnalytics> {
        try {
            // Fetch all question logs for student
            const logsRef = collection(db, 'students', studentId, 'questionLogs');
            const logsSnapshot = await getDocs(logsRef);

            const logs = logsSnapshot.docs
                .map(doc => doc.data() as AnalyticsRecord)
                .sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));

            // Validate all records
            const validLogs = logs.filter(log => {
                const validation = AdvancedValidator.validateRecord(log);
                return validation.isValid;
            });

            if (validLogs.length === 0) {
                return this.getEmptyStudentAnalytics(studentId);
            }

            // Aggregate by atom
            const atomMastery = this.aggregateAtomMastery(validLogs);

            // Calculate session metrics
            const sessions = this.groupLogsIntoSessions(validLogs);
            const sessionMetrics = sessions.map(session =>
                this.calculateSessionMetrics(session)
            );

            // Calculate overall metrics
            const overallAccuracy = validLogs.filter(l => l.isCorrect).length / validLogs.length;
            const overallMastery = validLogs.reduce((sum, l) => sum + (l.masteryAfter || 0), 0) / validLogs.length;
            const learningVelocity = this.calculateLearningVelocity(sessionMetrics);

            const strengths = atomMastery
                .filter(a => a.masteryScore > 0.8)
                .sort((a, b) => b.masteryScore - a.masteryScore)
                .slice(0, 3)
                .map(a => a.atomId);

            const weaknesses = atomMastery
                .filter(a => a.masteryScore < 0.4)
                .sort((a, b) => a.masteryScore - b.masteryScore)
                .slice(0, 3)
                .map(a => a.atomId);

            const recoveryMetrics = this.aggregateRecoveryMetrics(validLogs);
            const consistencyScore = this.calculateConsistencyScore(validLogs, atomMastery);
            const engagementScore = this.calculateEngagementScore(sessionMetrics);
            const recommendations = this.generateRecommendations(
                atomMastery,
                overallMastery,
                recoveryMetrics,
                consistencyScore
            );

            return {
                studentId,
                totalSessionCount: sessions.length,
                totalQuestionCount: validLogs.length,
                overallAccuracy,
                overallMastery,
                learningVelocity,
                conceptMasteries: atomMastery,
                recentSessions: sessionMetrics.slice(-5),
                strengths,
                weaknesses,
                recoveryMetrics,
                consistencyScore,
                engagementScore,
                recommendations
            };
        } catch (error) {
            console.error('Error calculating student analytics:', error);
            return this.getEmptyStudentAnalytics(studentId);
        }
    }

    /**
     * Calculate class-wide analytics
     */
    static async getClassAnalytics(classId: string): Promise<ClassAnalytics> {
        try {
            // Get all students in class
            const studentsRef = query(
                collection(db, 'students'),
                where('classId', '==', classId)
            );
            const studentsSnapshot = await getDocs(studentsRef);
            const studentIds = studentsSnapshot.docs.map(d => d.id);

            // Get analytics for each student
            const studentAnalytics = await Promise.all(
                studentIds.map(id => this.getStudentAnalytics(id))
            );

            // Aggregate
            const averageAccuracy = studentAnalytics.reduce((sum, a) => sum + a.overallAccuracy, 0) / studentAnalytics.length;
            const averageMastery = studentAnalytics.reduce((sum, a) => sum + a.overallMastery, 0) / studentAnalytics.length;

            // Aggregate concept trends
            const conceptMap = new Map<string, AtomMastery>();
            studentAnalytics.forEach(a => {
                a.conceptMasteries.forEach(mastery => {
                    if (!conceptMap.has(mastery.atomId)) {
                        conceptMap.set(mastery.atomId, { ...mastery, attemptCount: 0, masteryScore: 0 });
                    }
                    const existing = conceptMap.get(mastery.atomId)!;
                    existing.masteryScore = (existing.masteryScore + mastery.masteryScore) / 2;
                    existing.attemptCount += mastery.attemptCount;
                });
            });

            const conceptTrends = Object.fromEntries(conceptMap);

            // Performance distribution
            const distribution = {
                excellent: studentAnalytics.filter(a => a.overallMastery > 0.85).length,
                good: studentAnalytics.filter(a => a.overallMastery > 0.7 && a.overallMastery <= 0.85).length,
                average: studentAnalytics.filter(a => a.overallMastery > 0.5 && a.overallMastery <= 0.7).length,
                needsSupport: studentAnalytics.filter(a => a.overallMastery <= 0.5).length
            };

            const recommendedFocusAreas = Object.entries(conceptTrends)
                .filter(([_, m]) => m.masteryScore < 0.6)
                .sort((a, b) => a.masteryScore - b.masteryScore)
                .slice(0, 5)
                .map(([atomId]) => atomId);

            const teacherInsights = this.generateTeacherInsights(
                studentAnalytics,
                distribution,
                averageMastery
            );

            return {
                classId,
                studentCount: studentIds.length,
                averageAccuracy,
                averageMastery,
                conceptTrends,
                studentPerformanceDistribution: distribution,
                recommendedFocusAreas,
                teacherInsights
            };
        } catch (error) {
            console.error('Error calculating class analytics:', error);
            return this.getEmptyClassAnalytics(classId);
        }
    }

    private static aggregateAtomMastery(logs: AnalyticsRecord[]): AtomMastery[] {
        const atomMap = new Map<string, AnalyticsRecord[]>();

        logs.forEach(log => {
            const atomId = log.atomId || 'UNKNOWN';
            if (!atomMap.has(atomId)) {
                atomMap.set(atomId, []);
            }
            atomMap.get(atomId)!.push(log);
        });

        return Array.from(atomMap.entries()).map(([atomId, atomLogs]) => ({
            atomId,
            concept: atomId.replace(/_/g, ' '),
            masteryScore: atomLogs.reduce((sum, l) => sum + (l.masteryAfter || 0), 0) / atomLogs.length,
            trend: this.calculateTrend(atomLogs),
            attemptCount: atomLogs.length,
            successRate: atomLogs.filter(l => l.isCorrect).length / atomLogs.length,
            averageTimeSpent: atomLogs.reduce((sum, l) => sum + (l.timeSpent || 0), 0) / atomLogs.length,
            recoveryVelocity: this.calculateAverageRecoveryVelocity(atomLogs),
            lastAttemptDate: Math.max(...atomLogs.map(l => l.timestamp || 0)),
            nextReviewDate: this.calculateSpaceRepetitionDate(atomLogs),
            suggestedIntervention: this.determinIntervention(
                atomLogs.reduce((sum, l) => sum + (l.masteryAfter || 0), 0) / atomLogs.length,
                atomLogs.filter(l => l.isCorrect).length / atomLogs.length
            )
        }));
    }

    private static groupLogsIntoSessions(logs: AnalyticsRecord[]): AnalyticsRecord[][] {
        const sessionMap = new Map<string, AnalyticsRecord[]>();
        logs.forEach(log => {
            const sessionId = log.sessionId || `session-${log.timestamp}`;
            if (!sessionMap.has(sessionId)) {
                sessionMap.set(sessionId, []);
            }
            sessionMap.get(sessionId)!.push(log);
        });
        return Array.from(sessionMap.values());
    }

    private static calculateSessionMetrics(sessionLogs: AnalyticsRecord[]): SessionMetrics {
        const sortedLogs = sessionLogs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        const duration = (sortedLogs[sortedLogs.length - 1]?.timestamp || 0) -
            (sortedLogs?.timestamp || 0);
        const correctCount = sessionLogs.filter(l => l.isCorrect).length;

        const cognitiveLoads = {
            SPRINT: sessionLogs.filter(l => l.speedRating === 'SPRINT').length,
            STEADY: sessionLogs.filter(l => l.speedRating === 'STEADY').length,
            DEEP: sessionLogs.filter(l => l.speedRating === 'DEEP').length
        };

        return {
            sessionId: sessionLogs?.sessionId || 'unknown',
            date: sortedLogs?.timestamp || Date.now(),
            duration,
            questionCount: sessionLogs.length,
            correctCount,
            accuracy: correctCount / sessionLogs.length,
            averageTimePerQuestion: sessionLogs.reduce((sum, l) => sum + (l.timeSpent || 0), 0) / sessionLogs.length,
            recoveryAttempts: sessionLogs.filter(l => l.isRecovered).length,
            recoverySuccessRate: sessionLogs.filter(l => l.isRecovered && l.isCorrect).length /
                Math.max(1, sessionLogs.filter(l => l.isRecovered).length),
            cognitiveLoadDistribution: cognitiveLoads,
            focusScore: Math.min(100, Math.round(
                (1 - sessionLogs.reduce((sum, l) => sum + (l.distractionScore || 0), 0) / sessionLogs.length / 100) * 100
            )),
            estimatedLearning: (correctCount / sessionLogs.length) * (1 - sessionLogs.reduce((sum, l) => sum + (l.confidenceGap || 0), 0) / sessionLogs.length)
        };
    }

    private static calculateTrend(atomLogs: AnalyticsRecord[]): 'IMPROVING' | 'STABLE' | 'DECLINING' | 'UNKNOWN' {
        if (atomLogs.length < 2) return 'UNKNOWN';

        const first5 = atomLogs.slice(0, Math.min(5, atomLogs.length));
        const last5 = atomLogs.slice(Math.max(0, atomLogs.length - 5));

        const firstAvg = first5.reduce((sum, l) => sum + (l.masteryAfter || 0), 0) / first5.length;
        const lastAvg = last5.reduce((sum, l) => sum + (l.masteryAfter || 0), 0) / last5.length;

        const diff = lastAvg - firstAvg;
        if (diff > 0.15) return 'IMPROVING';
        if (diff < -0.15) return 'DECLINING';
        return 'STABLE';
    }

    private static calculateLearningVelocity(sessions: SessionMetrics[]): number {
        if (sessions.length < 2) return 0;

        const weekInMs = 7 * 24 * 60 * 60 * 1000;
        const timespanWeeks = (sessions[sessions.length - 1].date - sessions.date) / weekInMs;

        if (timespanWeeks === 0) return 0;

        const masteryGain = sessions.reduce((sum, s) => sum + s.estimatedLearning, 0) / sessions.length;
        return masteryGain / timespanWeeks;
    }

    private static calculateConsistencyScore(logs: AnalyticsRecord[], masteries: AtomMastery[]): number {
        // Consistency = low variance in accuracy + steady improvement
        const accuracyVariance = this.calculateVariance(
            logs.map(l => l.isCorrect ? 1 : 0)
        );

        const improvementTrend = masteries.filter(m => m.trend === 'IMPROVING').length / masteries.length;
        const declineTrend = masteries.filter(m => m.trend === 'DECLINING').length / masteries.length;

        const score = ((1 - accuracyVariance) * 50) + (improvementTrend * 40) - (declineTrend * 20);
        return Math.max(0, Math.min(100, score));
    }

    private static calculateEngagementScore(sessions: SessionMetrics[]): number {
        if (sessions.length === 0) return 0;

        const avgSessionFrequency = sessions.length / ((sessions[sessions.length - 1].date - sessions.date) / (24 * 60 * 60 * 1000));
        const avgSessionDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
        const avgAccuracy = sessions.reduce((sum, s) => sum + s.accuracy, 0) / sessions.length;

        // Engagement = frequency (40%) + duration (30%) + accuracy (30%)
        const frequencyScore = Math.min(40, avgSessionFrequency * 40);
        const durationScore = Math.min(30, (avgSessionDuration / 30000) * 30); // 30 min max
        const accuracyScore = avgAccuracy * 30;

        return frequencyScore + durationScore + accuracyScore;
    }

    private static calculateAverageRecoveryVelocity(logs: AnalyticsRecord[]): number | null {
        const recoveryLogs = logs.filter(l => l.isRecovered && l.recoveryVelocity);
        if (recoveryLogs.length === 0) return null;
        return recoveryLogs.reduce((sum, l) => sum + (l.recoveryVelocity || 0), 0) / recoveryLogs.length;
    }

    private static calculateSpaceRepetitionDate(logs: AnalyticsRecord[]): number {
        // Simple spacing: review in 2 days if low mastery, 1 week if medium, 2 weeks if high
        const avgMastery = logs.reduce((sum, l) => sum + (l.masteryAfter || 0), 0) / logs.length;
        const daysUntilReview = avgMastery > 0.8 ? 14 : avgMastery > 0.6 ? 7 : 2;
        return Date.now() + (daysUntilReview * 24 * 60 * 60 * 1000);
    }

    private static determinIntervention(mastery: number, successRate: number): 'NONE' | 'HINT' | 'SCAFFOLDING' | 'COACHING' {
        if (mastery > 0.8 && successRate > 0.85) return 'NONE';
        if (mastery > 0.6 && successRate > 0.70) return 'HINT';
        if (mastery > 0.4 && successRate > 0.50) return 'SCAFFOLDING';
        return 'COACHING';
    }

    private static aggregateRecoveryMetrics(logs: AnalyticsRecord[]): any {
        const recoveryLogs = logs.filter(l => l.isRecovered);
        return {
            totalRecoveryAttempts: recoveryLogs.length,
            successfulRecoveries: recoveryLogs.filter(l => l.isCorrect).length,
            averageRecoveryVelocity: this.calculateAverageRecoveryVelocity(logs) || 0
        };
    }

    private static generateRecommendations(
        masteries: AtomMastery[],
        overallMastery: number,
        recoveryMetrics: any,
        consistencyScore: number
    ): string[] {
        const recommendations: string[] = [];

        const weakConcepts = masteries.filter(m => m.masteryScore < 0.4);
        if (weakConcepts.length > 0) {
            recommendations.push(
                `Focus on ${weakConcepts.atomId.replace(/_/g, ' ')} with ${weakConcepts.suggestedIntervention === 'COACHING' ? 'AI-guided practice' : 'guided exercises'}`
            );
        }

        if (overallMastery < 0.6) {
            recommendations.push('Increase practice frequency - aim for daily 20-30 min sessions');
        }

        if (recoveryMetrics.successfulRecoveries > 0 && recoveryMetrics.averageRecoveryVelocity > 0.6) {
            recommendations.push('Excellent recovery skills! You\'re learning fast from mistakes');
        }

        if (consistencyScore < 50) {
            recommendations.push('Try to maintain consistent performance across concepts - identify patterns in errors');
        }

        return recommendations;
    }

    private static generateTeacherInsights(
        studentAnalytics: StudentAnalytics[],
        distribution: any,
        averageMastery: number
    ): string[] {
        const insights: string[] = [];

        if (distribution.needsSupport > studentAnalytics.length * 0.3) {
            insights.push(`${distribution.needsSupport} students need additional support. Consider forming a study group.`);
        }

        if (averageMastery < 0.6) {
            insights.push('Class-wide mastery is below target. Consider reviewing core concepts.');
        }

        const highPerformers = studentAnalytics.filter(a => a.overallMastery > 0.85);
        if (highPerformers.length > 0) {
            insights.push(`${highPerformers.length} high-performing students ready for advanced content.`);
        }

        return insights;
    }

    private static calculateVariance(values: number[]): number {
        if (values.length === 0) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
        return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
    }

    private static getEmptyStudentAnalytics(studentId: string): StudentAnalytics {
        return {
            studentId,
            totalSessionCount: 0,
            totalQuestionCount: 0,
            overallAccuracy: 0,
            overallMastery: 0,
            learningVelocity: 0,
            conceptMasteries: [],
            recentSessions: [],
            strengths: [],
            weaknesses: [],
            recoveryMetrics: { totalRecoveryAttempts: 0, successfulRecoveries: 0, averageRecoveryVelocity: 0 },
            consistencyScore: 0,
            engagementScore: 0,
            recommendations: ['Complete more questions to get personalized recommendations']
        };
    }

    private static getEmptyClassAnalytics(classId: string): ClassAnalytics {
        return {
            classId,
            studentCount: 0,
            averageAccuracy: 0,
            averageMastery: 0,
            conceptTrends: {},
            studentPerformanceDistribution: { excellent: 0, good: 0, average: 0, needsSupport: 0 },
            recommendedFocusAreas: [],
            teacherInsights: []
        };
    }
}

export default AnalyticsEngine;
