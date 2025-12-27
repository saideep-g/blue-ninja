/**
 * analyticsEnricher.js - v2.0
 * 
 * CRITICAL SERVICE: Enriches all analytics logs with v2 curriculum metadata
 * while preserving 100% backward compatibility with existing logs.
 * 
 * FUNCTION:
 * - Takes raw question response (v1 format)
 * - Looks up atom in v2 curriculum
 * - Enriches with: module, template, mastery profile, domain, outcomes
 * - Validates v2 fields
 * - Logs to Firestore with both v1 + v2 data
 * - NO existing logs are lost or corrupted
 * 
 * CRITICAL GUARANTEE:
 * All existing analytics continue to work.
 * All validation rules are preserved.
 * All logging is enhanced, never replaced.
 */

import { ANALYTICS_SCHEMA, VALIDATION_CODES } from './analyticsSchema';
import { ANALYTICS_SCHEMA_V2, validateAnalyticsLogV2 } from './analyticsSchemaV2';
import { getAtomById, getMisconceptionsForAtom, getTemplatesForAtom } from '../data/curriculumLoader';
import { db } from '../firebase/config';
import { doc, setDoc, updateDoc, increment } from 'firebase/firestore';

/**
 * MAIN FUNCTION: Enrich a log entry with v2 curriculum data
 * 
 * INPUT:
 * - baseLog: existing v1 analytics log { questionId, atomId, studentAnswer, ...}
 * - questionMetadata: { atomIdV2, templateId, sessionId, ... }
 * 
 * OUTPUT:
 * - enrichedLog: v1 fields + v2 enrichment (module, domain, outcomes, etc.)
 * - validation: v1 + v2 validation results
 */
export const enrichAnalyticsLog = async (baseLog, questionMetadata = {}) => {
  try {
    const enrichedLog = { ...baseLog };
    const enrichmentInfo = {};

    // Step 1: Look up atom in v2 curriculum (if not already provided)
    if (questionMetadata.atomIdV2 || baseLog.atomId) {
      const atomId = questionMetadata.atomIdV2 || baseLog.atomId;
      const atom = await getAtomById(atomId);

      if (atom) {
        // Enrich with curriculum data
        enrichedLog.atomIdV2 = atom.atom_id;
        enrichedLog.moduleId = atom.module_id;
        enrichedLog.domain = atom.domain || 'Unknown';
        enrichedLog.masteryProfileId = atom.mastery_profile_id;

        // Get template info if available
        if (atom.template_ids && atom.template_ids.length > 0) {
          enrichedLog.templateId = questionMetadata.templateId || atom.template_ids[0];
        }

        // Get misconceptions for diagnostics
        if (!baseLog.isCorrect && atom.misconception_ids) {
          const misconceptions = await getMisconceptionsForAtom(atomId);
          enrichedLog.relevantMisconceptions = misconceptions.map(m => ({
            id: m.misconception_id,
            name: m.name,
            type: m.type
          }));
        }

        // Store learning outcomes for assessment tracking
        if (atom.outcomes) {
          enrichedLog.outcomeIds = atom.outcomes.map(o => o.outcome_id);
        }

        enrichmentInfo.atomFound = true;
        enrichmentInfo.atomTitle = atom.title;
      } else {
        enrichmentInfo.atomFound = false;
        enrichmentInfo.warning = `Atom not found in v2 curriculum: ${atomId}`;
      }
    }

    // Step 2: Add provided v2 metadata
    if (questionMetadata.templateId) enrichedLog.templateId = questionMetadata.templateId;
    if (questionMetadata.sessionId) enrichedLog.sessionId = questionMetadata.sessionId;
    if (questionMetadata.questType) enrichedLog.questType = questionMetadata.questType;
    if (questionMetadata.recoveryTemplate) enrichedLog.recoveryTemplate = questionMetadata.recoveryTemplate;

    // Step 3: Infer learning behavior (new v2 field)
    enrichedLog.learningBehavior = inferLearningBehavior(
      baseLog.speedRating,
      baseLog.isCorrect,
      baseLog.masteryBefore,
      baseLog.masteryAfter
    );

    // Step 4: Mark if interleaved (if multiple atoms in recent window)
    // This would be set by the daily mission generator
    if (questionMetadata.isInterleaved !== undefined) {
      enrichedLog.isInterleaved = questionMetadata.isInterleaved;
    }

    // Step 5: Preserve timestamp metadata
    enrichedLog.enrichedAt = new Date().toISOString();
    enrichedLog.schemaVersion = 'v2.0';

    return {
      enrichedLog,
      enrichmentInfo,
      success: true
    };
  } catch (error) {
    console.error('[analyticsEnricher] Error enriching log:', error);
    return {
      enrichedLog: baseLog,
      enrichmentInfo: { error: error.message },
      success: false
    };
  }
};

/**
 * HELPER: Infer learning behavior pattern from speed + correctness
 */
function inferLearningBehavior(speedRating, isCorrect, masteryBefore, masteryAfter) {
  if (speedRating === 'SPRINT') {
    if (isCorrect) return 'FLUENCY';       // Fast + correct = mastery
    else return 'OVERCONFIDENT';           // Fast + wrong = overconfidence
  }

  if (speedRating === 'STEADY') {
    if (isCorrect) return 'BUILDING';      // Steady + correct = progress
    else return 'STRUGGLING';              // Steady + wrong = needs work
  }

  if (speedRating === 'DEEP') {
    if (isCorrect) return 'UNCERTAIN';     // Slow + correct = careful thinking
    else return 'STRUGGLING';              // Slow + wrong = difficulty
  }

  return 'UNCERTAIN';
}

/**
 * CRITICAL VALIDATION: Validate enriched log preserves v1 integrity
 * while checking new v2 fields
 */
export const validateEnrichedLog = async (enrichedLog) => {
  const validation = {
    v1: validateV1Fields(enrichedLog),
    v2: await validateV2Fields(enrichedLog),
    isValid: true
  };

  // V1 validation MUST pass
  if (!validation.v1.valid) {
    validation.isValid = false;
    validation.severity = 'CRITICAL';
    return validation;
  }

  // V2 validation can have warnings but not errors
  if (validation.v2.errors && validation.v2.errors.length > 0) {
    validation.warnings = validation.v2.errors;
  }

  return validation;
};

/**
 * Validate v1 fields (must succeed)
 */
function validateV1Fields(log) {
  const required = ['questionId', 'atomId', 'studentAnswer', 'correctAnswer', 'isCorrect', 'timeSpent', 'speedRating', 'masteryBefore', 'masteryAfter'];
  const missing = required.filter(f => !log[f] && log[f] !== 0 && log[f] !== false);

  return {
    valid: missing.length === 0,
    missingFields: missing,
    code: missing.length === 0 ? VALIDATION_CODES.PASS : VALIDATION_CODES.FAIL_MISSING_REQUIRED
  };
}

/**
 * Validate v2 fields (can warn but not fail)
 */
async function validateV2Fields(log) {
  const v2Result = validateAnalyticsLogV2(log);
  return {
    valid: true, // V2 is never blocking
    errors: v2Result.errors,
    warnings: v2Result.warnings,
    code: VALIDATION_CODES.PASS
  };
}

/**
 * LOG TO FIRESTORE: Save enriched log with both v1 + v2 data
 * Structure in Firestore:
 * /users/{userId}/analytics/{sessionId}/{logId}
 */
export const logEnrichedAnalytics = async (userId, enrichedLog, sessionId = 'default') => {
  try {
    // Validate first
    const validation = await validateEnrichedLog(enrichedLog);
    if (!validation.v1.valid) {
      console.error('[analyticsEnricher] V1 validation failed:', validation.v1);
      return { success: false, error: 'V1 validation failed', validation };
    }

    // Create document ID from question + timestamp
    const logId = `${enrichedLog.questionId}_${enrichedLog.timestamp}`;
    const docRef = doc(db, `users/${userId}/analytics`, logId);

    // Save the enriched log
    await setDoc(docRef, {
      // V1 fields (preserve exactly)
      questionId: enrichedLog.questionId,
      atomId: enrichedLog.atomId,
      studentAnswer: enrichedLog.studentAnswer,
      correctAnswer: enrichedLog.correctAnswer,
      isCorrect: enrichedLog.isCorrect,
      timeSpent: enrichedLog.timeSpent,
      speedRating: enrichedLog.speedRating,
      masteryBefore: enrichedLog.masteryBefore,
      masteryAfter: enrichedLog.masteryAfter,
      diagnosticTag: enrichedLog.diagnosticTag,
      isRecovered: enrichedLog.isRecovered,
      recoveryVelocity: enrichedLog.recoveryVelocity,
      timestamp: enrichedLog.timestamp,

      // V2 enrichment fields
      ...(enrichedLog.atomIdV2 && { atomIdV2: enrichedLog.atomIdV2 }),
      ...(enrichedLog.moduleId && { moduleId: enrichedLog.moduleId }),
      ...(enrichedLog.templateId && { templateId: enrichedLog.templateId }),
      ...(enrichedLog.domain && { domain: enrichedLog.domain }),
      ...(enrichedLog.masteryProfileId && { masteryProfileId: enrichedLog.masteryProfileId }),
      ...(enrichedLog.learningBehavior && { learningBehavior: enrichedLog.learningBehavior }),
      ...(enrichedLog.sessionId && { sessionId: enrichedLog.sessionId }),
      ...(enrichedLog.questType && { questType: enrichedLog.questType }),
      ...(enrichedLog.isInterleaved && { isInterleaved: enrichedLog.isInterleaved }),

      // Metadata
      schemaVersion: 'v2.0',
      enrichedAt: new Date().toISOString(),
      validation: {
        v1Valid: validation.v1.valid,
        v2Warnings: validation.v2.warnings || [],
        validationCode: validation.v1.code
      }
    });

    // Update user's analytics summary
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastAnalyticsUpdate: new Date().toISOString(),
      analyticsLogsCount: increment(1),
      ...(enrichedLog.isCorrect && { correctAnswersCount: increment(1) })
    });

    console.log('[analyticsEnricher] Log saved:', {
      userId,
      logId,
      atom: enrichedLog.atomIdV2 || enrichedLog.atomId,
      correct: enrichedLog.isCorrect
    });

    return {
      success: true,
      logId,
      validation
    };
  } catch (error) {
    console.error('[analyticsEnricher] Error logging to Firestore:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * AGGREGATE ANALYTICS: Get enriched statistics for a student
 * Useful for dashboards, reports, parent notifications
 */
export const getEnrichedAnalyticsSummary = async (userId, dateRange = {}) => {
  try {
    // In production, this would query Firestore with date filtering
    // For now, return the structure
    return {
      userId,
      totalLogsEnriched: 0,
      byTemplate: {},
      byModule: {},
      byMasteryProfile: {},
      recoverySuccessRate: 0,
      learningBehaviorBreakdown: {},
      spacedReviewProgress: {}
    };
  } catch (error) {
    console.error('[analyticsEnricher] Error getting summary:', error);
    return { error: error.message };
  }
};

/**
 * CRITICAL: Export for monitoring and debugging
 */
export const getEnricherDiagnostics = () => {
  return {
    schemaVersion: 'v2.0',
    enrichmentCapabilities: [
      'atom_lookup',
      'curriculum_enrichment',
      'template_mapping',
      'misconception_tracking',
      'learning_behavior_inference',
      'mastery_profile_alignment'
    ],
    backwardCompatibility: 'GUARANTEED',
    validation: {
      v1Required: true,
      v2Optional: true,
      failOnV1Error: true,
      failOnV2Error: false
    }
  };
};

export default {
  enrichAnalyticsLog,
  validateEnrichedLog,
  logEnrichedAnalytics,
  getEnrichedAnalyticsSummary,
  getEnricherDiagnostics
};
