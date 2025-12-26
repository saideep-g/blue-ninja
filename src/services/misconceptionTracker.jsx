/**
 * Misconception Tracker
 * Tracks how misconceptions persist and recover over time
 */

export class MisconceptionTracker {
    constructor(firebaseDB) {
        this.db = firebaseDB;
    }

    /**
     * Track a misconception occurrence
     */
    async trackMisconception(studentId, tag, metadata) {
        const timestamp = new Date().toISOString();

        return {
            studentId,
            tag,
            timestamp,
            ...metadata,
        };
    }

    /**
     * Get misconception history for student
     */
    async getHistory(studentId, tag) {
        // In production: query Firestore
        // For now: return empty
        return [];
    }

    /**
     * Calculate persistence score (0-1)
     * Higher = more persistent
     */
    calculatePersistence(occurrences) {
        if (occurrences.length < 2) return 0;

        // Count how many times student made same mistake
        const mistakes = occurrences.filter(o => o.isRecovered === false).length;
        return Math.min(1, mistakes / occurrences.length);
    }
}
