import { nexusDB } from './nexusSync';

/**
 * The 12 Required Fields for Blue Ninja Analytics
 * Based on the "Inquiry on Learning" Specification.
 */
const REQUIRED_FIELDS = [
    'questionId',
    'studentAnswer',
    'correctAnswer',
    'isCorrect',
    'timeSpent',
    'speedRating',
    'atomId',
    'timestamp',
    'diagnosticTag',
    'isRecovered',
    'masteryBefore',
    'masteryAfter',
];

/**
 * validateNexusLogs
 * Logic: Queries the local 'logs' store in IndexedDB and audits the most recent entry.
 * Benefit: 0ms latency validation without touching Firestore.
 */
export const validateNexusLogs = async () => {
    try {
        // This line was failing because 'logs' was not in the schema
        const logs = await nexusDB.logs.orderBy('timestamp').reverse().toArray();

        if (logs.length === 0) return { status: 'EMPTY', message: 'No local logs found.' };

        const latestLog = logs[0];

        // REFINED LOGIC: Only require diagnosticTag if the answer was WRONG.
        const missingFields = REQUIRED_FIELDS.filter(field => {
            const value = latestLog[field];
            if (field === 'diagnosticTag' && latestLog.isCorrect === true) return false;
            return value === undefined || value === null;
        });

        return {
            status: missingFields.length === 0 ? 'PASS' : 'FAIL',
            missingFields,
            logCount: logs.length,
            latestLog
        };
    } catch (error) {
        console.error("Validation Script Error:", error);
        return { status: 'ERROR', message: error.message };
    }
};