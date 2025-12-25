import { db } from '../firebase/config'; // Fixed: Only import 'db' as defined in config.js
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import Dexie from 'dexie';

/**
 * NexusDB: The Local-First database for Blue Ninja.
 * Stores the entire question bank locally to allow for instant, offline auditing.
 * This minimizes Firestore read/write costs during development.
 */
export const nexusDB = new Dexie('NexusDB');
nexusDB.version(1).stores({
    questions: 'id, atom, module, difficulty, [module+atom]',
    // This MUST be named 'logs' to match nexusValidator.js and NinjaContext.jsx
    logs: '++id, questionId, timestamp, type'
});

/**
 * pullQuestionsFromCloud
 * Logic: Fetches all questions from Firestore and populates IndexedDB.
 * Why: This allows the Developer to work at 0ms latency without Cloud dependency.
 */
export const pullQuestionsFromCloud = async () => {
    console.log("🌀 Nexus: Pulling questions from Firestore...");
    try {
        // Corrected: Using 'db' instead of 'firestore'
        const qSnap = await getDocs(collection(db, 'diagnostic_questions'));
        const questions = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Clear local and bulk add
        await nexusDB.questions.clear();
        await nexusDB.questions.bulkAdd(questions);

        console.log(`✅ Nexus: ${questions.length} questions cached locally.`);
        return questions.length;
    } catch (error) {
        console.error("❌ Nexus Pull Failed:", error);
        throw error;
    }
};

/**
 * pushQuestionsToCloud
 * Logic: Takes all local changes and performs a batched write to Firestore.
 * Why: This follows your "Sync only when ready" rule to minimize Firestore writes.
 */
export const pushQuestionsToCloud = async () => {
    const localQuestions = await nexusDB.questions.toArray();
    const batch = writeBatch(db); // Corrected: Using 'db'

    console.log(`🚀 Nexus: Pushing ${localQuestions.length} questions to Cloud...`);

    localQuestions.forEach(q => {
        const qRef = doc(db, 'diagnostic_questions', q.id); // Corrected: Using 'db'
        batch.set(qRef, q);
    });

    try {
        await batch.commit();
        console.log("✅ Nexus: Cloud Sync Complete.");
    } catch (error) {
        console.error("❌ Nexus Push Failed:", error);
        throw error;
    }
};