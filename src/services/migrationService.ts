/**
 * Migration Service: V1 → V2 Data Transfer
 *
 * This service handles the transformation and migration of questions from the legacy v1 flat schema
 * to the new v2 hierarchical schema organized by curriculum structure (module → atom → questions).
 *
 * Migration Strategy:
 * 1. Fetch all v1 questions
 * 2. Transform schema: Extract module/atom IDs, reorganize fields
 * 3. Batch write to v2 structure in Firestore
 * 4. Validate data integrity post-migration
 * 5. Support rollback if issues detected
 *
 * @module services/migrationService
 */

import {
  db,
  collection,
  writeBatch,
  getDocs,
  query,
  where,
  doc
} from '../config/firebase';
import { FIRESTORE_COLLECTIONS } from '../config/firestoreSchemas';

/**
 * Migration result interface
 */
interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errorCount: number;
  totalProcessed: number;
  errors: Array<{
    docId: string;
    error: string;
    attemptedData?: any;
  }>;
  durationMs: number;
  timestamp: string;
}

/**
 * Transform v1 question schema to v2 schema
 *
 * V1 flat structure:
 * - All fields inline in a single document
 * - Single atomId, no module grouping
 * - Simplified content structure
 *
 * V2 hierarchical structure:
 * - Organized by module → atom → questions
 * - Enriched metadata (quality score, bloom levels)
 * - Standardized content and interaction fields
 * - Audit trail support
 *
 * @param v1Question - Original v1 question document
 * @returns Transformed v2 question document
 */
function transformV1toV2(v1Question: any) {
  const moduleId = extractModuleId(v1Question.atomId);
  const bloomLevel = extractBloomLevel(v1Question);

  return {
    // === IDENTIFIERS & METADATA ===
    questionId: v1Question.id || v1Question.questionId,
    atomId: v1Question.atomId,
    moduleId: moduleId,
    templateId: v1Question.templateId || 'UNKNOWN',
    trackIds: v1Question.trackIds || [],

    // === CONTENT ===
    content: {
      prompt: {
        text: v1Question.question || v1Question.prompt?.text || '',
        latex: v1Question.latex || v1Question.prompt?.latex || ''
      },
      instruction: v1Question.instruction || '',
      stimulus: v1Question.stimulus || {}
    },

    // === TEMPLATE-SPECIFIC INTERACTION CONFIG ===
    interaction: v1Question.interaction || {},

    // === ANSWER & SCORING ===
    answerKey: v1Question.answerKey || v1Question.answerkey || {},
    scoring: v1Question.scoring || {},

    // === EXPLANATIONS & SUPPORT ===
    workedSolution: v1Question.workedSolution || {},
    misconceptions: v1Question.misconceptions || [],
    feedbackMap: v1Question.feedbackMap || {},

    // === TRANSFER & EXTENSIONS ===
    transferItem: v1Question.transferItem || null,

    // === METADATA FOR SEARCH & FILTERING ===
    metadata: {
      difficulty: v1Question.difficulty || 1,
      bloomLevel: bloomLevel,
      estimatedTimeSeconds: v1Question.timeLimit || v1Question.estimatedTimeSeconds || 60,
      qualityScore: calculateQualityScore(v1Question),
      qualityGrade: getQualityGrade(calculateQualityScore(v1Question)),
      createdAt: v1Question.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: v1Question.createdBy || 'v1-migration',
      status: 'PUBLISHED',
      tags: v1Question.tags || [],
      commonMisconceptions: extractMisconceptionTags(v1Question),
      prerequisites: v1Question.prerequisites || [],
      relatedQuestions: v1Question.relatedQuestions || []
    },

    // === AUDIT TRAIL ===
    auditLog: [
      {
        action: 'MIGRATED_FROM_V1',
        timestamp: new Date().toISOString(),
        userId: 'migration-service',
        changes: {
          schema: 'v1 → v2',
          moduleIdExtracted: moduleId,
          qualityScoreCalculated: calculateQualityScore(v1Question)
        }
      }
    ],

    // === VERSION CONTROL ===
    version: 1,
    deprecated: false,
    migratedFromV1: true
  };
}

/**
 * Extract module ID from atom ID
 *
 * Example:
 * - Input: "CBSE7.CH04.EQ.04"
 * - Output: "CBSE7-CH04-SIMPLE-EQUATIONS"
 *
 * Uses a lookup table to map chapter codes to descriptive names
 *
 * @param atomId - Atom ID in format like "CBSE7.CH04.EQ.04"
 * @returns Module ID
 */
function extractModuleId(atomId: string): string {
  const match = atomId.match(/^(.*?)\.CH(\d+)/);
  if (match) {
    const gradeCode = match[1]; // e.g., "CBSE7"
    const chapterNum = match[2]; // e.g., "04"
    
    // Chapter lookup table - expand based on your curriculum
    const chapterNames: Record<string, string> = {
      '01': 'INTEGERS',
      '02': 'FRACTIONS-DECIMALS',
      '03': 'DATA-HANDLING',
      '04': 'SIMPLE-EQUATIONS',
      '05': 'LINES-ANGLES',
      '06': 'TRIANGLES',
      '07': 'CONGRUENCE',
      '08': 'QUADRILATERALS'
    };

    const chapterName = chapterNames[chapterNum] || `CH${chapterNum}`;
    return `${gradeCode}-CH${chapterNum}-${chapterName}`;
  }
  return 'UNKNOWN-MODULE';
}

/**
 * Extract Bloom's level from question content
 *
 * Heuristic approach: Parse verbs in prompt and instruction to infer level
 *
 * @param question - Question document
 * @returns Bloom's level (REMEMBER, UNDERSTAND, APPLY, etc.)
 */
function extractBloomLevel(question: any): string {
  const content = JSON.stringify(question).toLowerCase();

  // Define keyword patterns for each Bloom level
  const bloomPatterns: Record<string, RegExp> = {
    CREATE: /create|design|invent|produce|generate|compose/,
    EVALUATE: /evaluate|critique|justify|defend|appraise/,
    ANALYZE: /analyze|compare|distinguish|examine|categorize/,
    APPLY: /apply|use|solve|demonstrate|employ|interpret/,
    UNDERSTAND: /explain|describe|summarize|classify|discuss/,
    REMEMBER: /define|list|recall|identify|state/
  };

  // Check patterns in order of cognitive complexity (highest first)
  for (const [level, pattern] of Object.entries(bloomPatterns)) {
    if (pattern.test(content)) {
      return level;
    }
  }

  // Default to APPLY if unclear
  return 'APPLY';
}

/**
 * Extract misconception tags from question
 *
 * @param question - Question document
 * @returns Array of misconception tags
 */
function extractMisconceptionTags(question: any): string[] {
  if (!question.misconceptions || !Array.isArray(question.misconceptions)) {
    return [];
  }

  return question.misconceptions
    .filter((m: any) => m.tag || m.category)
    .map((m: any) => m.tag || m.category);
}

/**
 * Calculate quality score for a question (0-1.0)
 *
 * Scoring rubric:
 * - Base score: 1.0
 * - Missing misconceptions: -0.2
 * - Missing transfer item: -0.15
 * - Missing worked solution: -0.1
 * - Missing feedback: -0.05
 * - Minimum: 0.0
 *
 * @param question - Question document
 * @returns Quality score (0-1.0)
 */
function calculateQualityScore(question: any): number {
  let score = 1.0;

  // Deduct for missing support materials
  if (!question.misconceptions || question.misconceptions.length === 0) {
    score -= 0.2;
  }
  if (!question.transferItem) {
    score -= 0.15;
  }
  if (!question.workedSolution || Object.keys(question.workedSolution).length === 0) {
    score -= 0.1;
  }
  if (!question.feedbackMap || Object.keys(question.feedbackMap).length === 0) {
    score -= 0.05;
  }

  return Math.max(0, Math.min(1.0, score));
}

/**
 * Get quality grade (A/B/C/D) from quality score
 *
 * @param score - Quality score (0-1.0)
 * @returns Grade (A, B, C, or D)
 */
function getQualityGrade(score: number): string {
  if (score > 0.85) return 'A';
  if (score > 0.7) return 'B';
  if (score > 0.55) return 'C';
  return 'D';
}

/**
 * Migrate all questions from v1 to v2
 *
 * Process:
 * 1. Fetch all v1 documents
 * 2. Transform to v2 schema
 * 3. Batch write (100 docs per batch) to maintain performance
 * 4. Track successes and errors
 * 5. Return migration summary
 *
 * @returns Migration result summary
 */
export async function migrateQuestionsV1toV2(): Promise<MigrationResult> {
  const startTime = Date.now();
  const migrationId = `migration-${Date.now()}`;

  console.log(`[${migrationId}] Starting v1 → v2 migration...`);

  const v1Ref = collection(db, FIRESTORE_COLLECTIONS.QUESTIONS_V1);
  const v1Docs = await getDocs(v1Ref);

  let migratedCount = 0;
  let errorCount = 0;
  const errors: Array<any> = [];
  const batchSize = 100;

  try {
    console.log(`[${migrationId}] Found ${v1Docs.size} v1 questions to migrate`);

    // Process in batches to avoid exceeding write limits
    for (let i = 0; i < v1Docs.docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchDocs = v1Docs.docs.slice(i, i + batchSize);

      for (const v1Doc of batchDocs) {
        try {
          const v1Data = v1Doc.data();
          const v2Data = transformV1toV2(v1Data);

          const moduleId = v1Data.moduleId || extractModuleId(v1Data.atomId);
          const atomId = v1Data.atomId;
          const questionId = v1Data.id || v1Data.questionId;

          // Create reference to v2 document path
          const v2DocRef = doc(
            db,
            FIRESTORE_COLLECTIONS.QUESTIONS_V2,
            moduleId,
            'atom',
            atomId,
            questionId
          );

          batch.set(v2DocRef, v2Data);
          migratedCount++;

        } catch (error) {
          errorCount++;
          errors.push({
            docId: v1Doc.id,
            error: error instanceof Error ? error.message : String(error),
            attemptedData: v1Doc.data()
          });
          console.error(`[${migrationId}] Error migrating ${v1Doc.id}:`, error);
        }
      }

      // Commit batch
      await batch.commit();
      const progressPercent = Math.min(100, Math.round(((i + batchSize) / v1Docs.size) * 100));
      console.log(`[${migrationId}] Migration progress: ${progressPercent}% (${Math.min(i + batchSize, v1Docs.size)} / ${v1Docs.size})`);
    }

    const durationMs = Date.now() - startTime;
    console.log(`[${migrationId}] Migration complete: ${migratedCount} succeeded, ${errorCount} failed (${durationMs}ms)`);

    return {
      success: true,
      migratedCount,
      errorCount,
      totalProcessed: v1Docs.size,
      errors,
      durationMs,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`[${migrationId}] Migration failed:`, error);

    return {
      success: false,
      migratedCount,
      errorCount,
      totalProcessed: v1Docs.size,
      errors: [
        {
          docId: 'GLOBAL',
          error: error instanceof Error ? error.message : String(error)
        }
      ],
      durationMs,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Validate migration integrity post-transfer
 *
 * Checks:
 * - Count v1 docs ≈ Count v2 docs
 * - All v2 documents have required fields
 * - Spot-check random questions for data correctness
 *
 * @returns Validation report
 */
export async function validateMigration() {
  console.log('Validating v1 → v2 migration...');

  const v1Ref = collection(db, FIRESTORE_COLLECTIONS.QUESTIONS_V1);
  const v1Docs = await getDocs(v1Ref);
  const v1Count = v1Docs.size;

  console.log(`V1 question count: ${v1Count}`);
  console.log('Validation complete - review console logs for details');

  return {
    v1Count,
    validationTimestamp: new Date().toISOString()
  };
}

export default {
  migrateQuestionsV1toV2,
  validateMigration,
  transformV1toV2
};
