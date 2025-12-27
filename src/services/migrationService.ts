/**
 * Migration Service: v1 Questions → v2 Questions
 * 
 * Handles safe migration from the legacy flat question structure
 * to the new hierarchical curriculum-aware v2 structure.
 */

import { db } from '../firebase/firebaseConfig';
import {
  collection,
  writeBatch,
  getDocs,
  query,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS, docPaths } from '../config/firestoreSchemas';

/**
 * Interface for migration options
 */
interface MigrationOptions {
  batchSize?: number;
  onProgress?: (current: number, total: number) => void;
  startAfter?: QueryDocumentSnapshot<DocumentData>;
}

/**
 * Interface for migration results
 */
interface MigrationResult {
  success: boolean;
  migratedCount: number;
  errorCount: number;
  totalProcessed: number;
  errors: Array<{ questionId: string; error: string }>;
  durationMs: number;
}

/**
 * Main migration function: Converts all v1 questions to v2 format
 * 
 * Process:
 * 1. Fetches all documents from v1 'questions' collection
 * 2. Transforms each to v2 schema
 * 3. Writes to hierarchical v2 collection in batches
 * 4. Tracks errors and provides detailed reporting
 * 
 * @param options - Migration configuration
 * @returns Migration result with success status and detailed counts
 * 
 * @throws Will not throw, but returns errors in result.errors array
 */
export async function migrateQuestionsV1toV2(
  options: MigrationOptions = {}
): Promise<MigrationResult> {
  const startTime = Date.now();
  const batchSize = options.batchSize || 100;
  const errors: Array<{ questionId: string; error: string }> = [];
  
  let migratedCount = 0;
  let errorCount = 0;
  let totalProcessed = 0;
  
  try {
    console.log('🚀 Starting v1 → v2 migration...');
    
    // Get all v1 questions
    const v1Ref = collection(db, 'questions');
    const v1Docs = await getDocs(v1Ref);
    const totalQuestions = v1Docs.size;
    
    console.log(`📦 Found ${totalQuestions} questions to migrate`);
    
    // Process in batches to avoid memory overload
    let currentBatch = writeBatch(db);
    let batchOperationCount = 0;
    
    for (const doc of v1Docs.docs) {
      try {
        totalProcessed++;
        const v1Question = doc.data();
        
        // Extract module and atom IDs from question metadata
        const moduleId = extractModuleId(v1Question.atomId);
        const atomId = v1Question.atomId;
        const questionId = v1Question.id || v1Question.questionId;
        
        if (!moduleId || !atomId || !questionId) {
          throw new Error(
            `Missing required IDs: moduleId=${moduleId}, atomId=${atomId}, questionId=${questionId}`
          );
        }
        
        // Transform v1 to v2 schema
        const v2Question = transformV1toV2(v1Question);
        
        // Build v2 document reference path
        const v2DocPath = docPaths.questionV2(moduleId, atomId, questionId);
        const v2Ref = db.doc(v2DocPath);
        
        // Add to batch
        currentBatch.set(v2Ref, v2Question, { merge: false });
        batchOperationCount++;
        migratedCount++;
        
        // Commit batch when reaching size limit
        if (batchOperationCount >= batchSize) {
          await currentBatch.commit();
          console.log(`✅ Committed batch of ${batchOperationCount} questions`);
          currentBatch = writeBatch(db);
          batchOperationCount = 0;
        }
        
        // Call progress callback if provided
        if (options.onProgress) {
          options.onProgress(totalProcessed, totalQuestions);
        }
        
      } catch (error) {
        errorCount++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push({
          questionId: doc.id,
          error: errorMessage
        });
        console.error(`❌ Error migrating question ${doc.id}:`, error);
      }
    }
    
    // Commit remaining batch
    if (batchOperationCount > 0) {
      await currentBatch.commit();
      console.log(`✅ Committed final batch of ${batchOperationCount} questions`);
    }
    
    const duration = Date.now() - startTime;
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Successfully migrated: ${migratedCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   ⏱️ Duration: ${(duration / 1000).toFixed(2)}s`);
    
    return {
      success: errorCount === 0,
      migratedCount,
      errorCount,
      totalProcessed,
      errors,
      durationMs: duration
    };
    
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('💥 Migration failed:', errorMessage);
    
    return {
      success: false,
      migratedCount,
      errorCount,
      totalProcessed,
      errors: [...errors, { questionId: 'GLOBAL', error: errorMessage }],
      durationMs
    };
  }
}

/**
 * Transform v1 question format to v2 hierarchical format
 * 
 * Changes:
 * - Maps flat structure to nested object
 * - Normalizes answer keys
* - Calculates quality metrics
 * - Adds default metadata
 * - Preserves all content fields
 */
function transformV1toV2(v1Question: any): any {
  const qualityScore = calculateQualityScore(v1Question);
  const qualityGrade = getQualityGrade(qualityScore);
  const now = new Date().toISOString();
  
  return {
    // ===== IDENTIFIERS & METADATA =====
    questionId: v1Question.id || v1Question.questionId,
    atomId: v1Question.atomId,
    moduleId: extractModuleId(v1Question.atomId),
    templateId: v1Question.templateId,
    trackIds: v1Question.trackIds || [],
    
    // ===== CONTENT =====
    content: {
      prompt: {
        text: v1Question.question || v1Question.prompt?.text || '',
        latex: v1Question.latex || null
      },
      instruction: v1Question.instruction || '',
      stimulus: v1Question.stimulus || {
        text: null,
        diagram: null,
        data: null
      }
    },
    
    // ===== TEMPLATE-SPECIFIC CONFIG =====
    interaction: v1Question.interaction || {},
    
    // ===== ANSWER & SCORING =====
    answerKey: v1Question.answerKey || v1Question.answerkey || {},
    scoring: v1Question.scoring || {
      model: 'exact',
      params: {}
    },
    
    // ===== EXPLANATIONS & SUPPORT =====
    workedSolution: v1Question.workedSolution || {
      steps: [],
      finalAnswer: '',
      whyItWorks: ''
    },
    
    // ===== MISCONCEPTIONS & FEEDBACK =====
    misconceptions: v1Question.misconceptions || [],
    feedbackMap: v1Question.feedbackMap || {
      onCorrect: '',
      onIncorrectAttempt1: '',
      onIncorrectAttempt2: ''
    },
    
    // ===== TRANSFER & EXTENSIONS =====
    transferItem: v1Question.transferItem || null,
    
    // ===== METADATA FOR SEARCH & FILTERING =====
    metadata: {
      difficulty: v1Question.difficulty || 1,
      bloomLevel: v1Question.bloomLevel || 'UNDERSTAND',
      estimatedTimeSeconds: v1Question.timeLimit || v1Question.estimatedTimeSeconds || 60,
      qualityScore: qualityScore,
      qualityGrade: qualityGrade,
      createdAt: v1Question.createdAt || now,
      updatedAt: now,
      createdBy: v1Question.createdBy || 'migration-script@blue-ninja.app',
      status: v1Question.status || 'PUBLISHED',
      tags: v1Question.tags || [],
      commonMisconceptions: v1Question.misconceptions?.map((m: any) => m.category) || [],
      prerequisites: v1Question.prerequisites || [],
      relatedQuestions: v1Question.relatedQuestions || []
    },
    
    // ===== AUDIT TRAIL =====
    auditLog: [
      {
        action: 'MIGRATED_FROM_V1',
        timestamp: now,
        userId: 'migration-script@blue-ninja.app',
        notes: 'Migrated from legacy v1 format'
      }
    ],
    
    // ===== VERSION CONTROL =====
    version: 1,
    deprecated: false
  };
}

/**
 * Extract module ID from atom ID
 * 
 * Example:
 *   Input: 'CBSE7.CH04.EQ.04'
 *   Output: 'CBSE7-CH04-SIMPLE-EQUATIONS'
 * 
 * Uses a lookup table for chapter titles (could be expanded)
 */
function extractModuleId(atomId: string): string {
  if (!atomId) return 'UNKNOWN';
  
  // Parse atom ID format: GRADE.CH##.DOMAIN.ATOM##
  const match = atomId.match(/^(.*?)\.CH(\d+)/);
  if (!match) return 'UNKNOWN';
  
  const gradeCode = match[1]; // e.g., 'CBSE7'
  const chapterNum = match[2]; // e.g., '04'
  
  // Chapter title lookup (expand this as needed)
  const chapterTitles: { [key: string]: string } = {
    '01': 'INTEGERS',
    '02': 'FRACTIONS',
    '03': 'DECIMALS',
    '04': 'SIMPLE-EQUATIONS',
    '05': 'RATIO-PROPORTION',
    '06': 'PERCENT',
    '07': 'PLANE-FIGURES',
    '08': 'SOLIDS',
    '09': 'LINES-ANGLES',
    '10': 'TRIANGLES',
    '11': 'SYMMETRY',
    '12': 'CONSTRUCTIONS',
    '13': 'PERIMETER-AREA',
    '14': 'DATA-HANDLING',
    '15': 'PROBABILITY'
  };
  
  const chapterTitle = chapterTitles[chapterNum] || `CHAPTER-${chapterNum}`;
  
  return `${gradeCode}-CH${chapterNum}-${chapterTitle}`;
}

/**
 * Calculate quality score based on content completeness
 * 
 * Scoring:
 * - Base score: 1.0
 * - Missing misconceptions: -0.15
 * - Missing transfer item: -0.1
 * - Missing worked solution: -0.1
 * - Other gaps: -0.05 each
 */
function calculateQualityScore(question: any): number {
  let score = 1.0;
  
  // Deduct for missing key components
  if (!question.misconceptions?.length) score -= 0.15;
  if (!question.transferItem) score -= 0.1;
  if (!question.workedSolution) score -= 0.1;
  if (!question.feedbackMap?.onCorrect) score -= 0.05;
  if (!question.content?.stimulus) score -= 0.05;
  
  return Math.max(0, score);
}

/**
 * Convert quality score to letter grade
 */
function getQualityGrade(score: number): string {
  if (score > 0.9) return 'A';
  if (score > 0.75) return 'B';
  if (score > 0.6) return 'C';
  if (score > 0.4) return 'D';
  return 'F';
}

/**
 * Rollback: Delete all migrated v2 documents (in case of issues)
 * 
 * ⚠️  Use with caution - this deletes data
 * 
 * @param dryRun - If true, only logs what would be deleted without deleting
 */
export async function rollbackMigrationV2(dryRun: boolean = true): Promise<void> {
  console.warn('⚠️  Starting rollback of v2 questions...');
  console.warn('    If dryRun=false, this will DELETE all v2 questions');
  
  if (!dryRun) {
    console.error('❌ Rollback not yet implemented for safety reasons');
    console.error('   Manually delete documents or restore from backup');
    return;
  }
  
  console.log('📋 Dry run mode: Would delete all documents from questions_v2 collection');
}

export default migrateQuestionsV1toV2;