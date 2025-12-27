/**
 * analyticsSchemaV2.js
 * 
 * ENHANCED ANALYTICS SCHEMA for v2 Curriculum
 * Extends v5.0 schema to support:
 * - New atom_id format (CBSE7.CH01.INT.01 instead of A1-A13)
 * - Template tracking (MCQ_CONCEPT, NUMERIC_INPUT, etc.)
 * - Module and domain references
 * - Mastery profile alignment
 * - Recovery mechanics with template-specific strategies
 * 
 * BACKWARD COMPATIBILITY:
 * - Old atom references (A1-A13) still work
 * - All existing validation rules preserved
 * - New fields added as OPTIONAL extensions
 * - Migration path transparent to existing code
 */

import { ANALYTICS_SCHEMA, FIELD_GROUPS, VALIDATION_CODES } from './analyticsSchema';

/**
 * EXTENDED SCHEMA: Adds v2 curriculum fields
 * All original fields from ANALYTICS_SCHEMA are preserved
 */
export const ANALYTICS_SCHEMA_V2 = {
  ...ANALYTICS_SCHEMA,

  // ────────────────────────────────────────────────────────────────────────
  // NEW: Extended Curriculum Reference Fields
  // ────────────────────────────────────────────────────────────────────────

  atomIdV2: {
    type: 'string',
    required: false, // Optional - for backward compatibility
    pattern: /^[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.\d{2}$/,
    description: 'New format atom identifier (e.g., CBSE7.CH01.INT.01)',
    validationError: 'atomIdV2 must match pattern MODULE.CHAPTER.CONCEPT.## (e.g., CBSE7.CH01.INT.01)',
    example: 'CBSE7.CH01.INT.01',
    notes: 'Coexists with original atomId (A1-A13) for gradual migration'
  },

  moduleId: {
    type: 'string',
    required: false,
    pattern: /^[A-Z0-9]+-[A-Z0-9]+$/,
    description: 'Module identifier for grouping atoms',
    validationError: 'moduleId must match pattern (e.g., CBSE7-CH01-INTEGERS)',
    example: 'CBSE7-CH01-INTEGERS'
  },

  templateId: {
    type: 'string',
    required: false,
    enum: [
      'BALANCE_OPS',
      'BALANCE_SLIDER',
      'CLASSIFY_SORT',
      'DRAG_DROP_MATCH',
      'ERROR_ANALYSIS',
      'EXPRESSION_INPUT',
      'GEOMETRY_TAP',
      'GRAPH_PLOT',
      'MATCHING',
      'MCQ_CONCEPT',
      'MULTI_STEP_WORD',
      'NUMBER_LINE_PLACE',
      'NUMERIC_INPUT',
      'SHORT_EXPLAIN',
      'SIMULATION',
      'SORT_ORDER',
      'SPINNER_PROB',
      'STEP_BUILDER',
      'STEP_ORDER',
      'WORKED_EXAMPLE_COMPLETE',
      'TWO_TIER',
      'TRANSFER_MINI',
      'BALANCE_SLIDER'
    ],
    description: 'Question template type for structured learning',
    validationError: 'templateId must be one of the 14+ template types',
    example: 'MCQ_CONCEPT',
    notes: 'Enables template-specific feedback and recovery strategies'
  },

  masteryProfileId: {
    type: 'string',
    required: false,
    enum: [
      'MP_CORE_CONCEPT',
      'MP_CORE_FLUENCY',
      'MP_REASONING',
      'MP_OLYMPIAD',
      'MP_EAPCET_FOUND'
    ],
    description: 'Mastery profile target for this atom',
    validationError: 'masteryProfileId must be one of the 5 profiles',
    example: 'MP_CORE_FLUENCY',
    notes: 'Links to learning progression pathway'
  },

  domain: {
    type: 'string',
    required: false,
    enum: [
      'Number System',
      'Algebra',
      'Geometry',
      'Data Handling',
      'Mensuration',
      'Probability',
      'Habits of Mind',
      'Constructions',
      'Rational Numbers',
      'Equations',
      'Symmetry',
      'Lines & Angles'
    ],
    description: 'Curriculum domain (chapter category)',
    validationError: 'domain must be a valid CBSE domain',
    example: 'Algebra'
  },

  // ────────────────────────────────────────────────────────────────────────
  // NEW: Enhanced Recovery & Repair Tracking
  // ────────────────────────────────────────────────────────────────────────

  repairItemId: {
    type: 'string',
    required: false,
    pattern: /^Q\d{3,}|REPAIR_[A-Z0-9]+$/,
    description: 'If wrong, which repair/misconception-clearing item was served?',
    validationError: 'repairItemId must match pattern (e.g., Q999 or REPAIR_SIG_001)',
    example: 'REPAIR_SIG_001',
    notes: 'Tracks the pedagogical intervention path'
  },

  repairMisconceptionId: {
    type: 'string',
    required: false,
    pattern: /^MIS_[A-Z0-9]{8,}$/,
    description: 'Which misconception did the repair address?',
    validationError: 'repairMisconceptionId must match pattern MIS_########',
    example: 'MIS_INT_ABS_COMPARE',
    notes: 'Cross-reference to curriculum misconceptions'
  },

  recoveryTemplate: {
    type: 'string',
    required: false,
    enum: [
      'HINT_LADDER',
      'WORKED_EXAMPLE',
      'NUMBER_LINE_SCAFFOLD',
      'STEP_BUILDER',
      'ERROR_ANALYSIS',
      'TRANSFER_MINI',
      'BONUS_MISSION'
    ],
    description: 'Which recovery strategy was used?',
    validationError: 'recoveryTemplate must be one of 7 recovery types',
    example: 'HINT_LADDER',
    notes: 'Enables analysis of recovery effectiveness by strategy'
  },

  // ────────────────────────────────────────────────────────────────────────
  // NEW: Transfer & Application Tracking
  // ────────────────────────────────────────────────────────────────────────

  isTransferItem: {
    type: 'boolean',
    required: false,
    description: 'Is this a novel-context (transfer) question for the atom?',
    validationError: 'isTransferItem must be true or false',
    example: true,
    notes: 'Transfer items measure deep understanding, not rote recall'
  },

  transferSuccess: {
    type: 'boolean',
    required: false,
    description: 'If transfer item: did student apply concept to novel context?',
    validationError: 'transferSuccess must be true or false',
    example: true,
    conditionalRequired: (log) => log.isTransferItem === true,
    notes: 'Critical indicator of true mastery'
  },

  // ────────────────────────────────────────────────────────────────────────
  // NEW: Learning Behavior Categorization
  // ────────────────────────────────────────────────────────────────────────

  learningBehavior: {
    type: 'string',
    required: false,
    enum: [
      'FLUENCY',        // Fast and accurate (SPRINT + correct)
      'BUILDING',       // Steady, correct with some thinking (STEADY + correct)
      'STRUGGLING',     // Slow, incorrect, needs repair (DEEP + incorrect)
      'OVERCONFIDENT',  // Fast but incorrect (SPRINT + incorrect)
      'UNCERTAIN',      // Slow thinking, finally correct (DEEP + correct)
      'LUCKY',          // Very fast, accidentally correct
      'FRUSTRATED'      // Multiple retries needed
    ],
    description: 'Student\'s learning behavior pattern on this question',
    validationError: 'learningBehavior must be one of 7 patterns',
    example: 'FLUENCY',
    logicalValidation: (log) => {
      // Infer from speed + correctness
      if (log.speedRating === 'SPRINT' && log.isCorrect) {
        if (log.learningBehavior && log.learningBehavior !== 'FLUENCY') {
          return {
            valid: false,
            error: 'Behavior mismatch: SPRINT + correct should be FLUENCY',
            severity: 'WARNING',
            suggestion: 'FLUENCY'
          };
        }
      }
      return { valid: true };
    }
  },

  // ────────────────────────────────────────────────────────────────────────
  // NEW: Conceptual Outcome Tracking
  // ────────────────────────────────────────────────────────────────────────

  outcomeIds: {
    type: 'array',
    itemType: 'string',
    required: false,
    description: 'Which learning outcomes (from atom definition) does this question assess?',
    validationError: 'outcomeIds must be array of outcome IDs',
    example: ['CBSE7.CH01.INT.01.LO01', 'CBSE7.CH01.INT.01.LO02'],
    notes: 'Maps to atom.outcomes in curriculum'
  },

  conceptType: {
    type: 'string',
    required: false,
    enum: ['CONCEPTUAL', 'PROCEDURAL', 'LOGICAL', 'TRANSFER'],
    description: 'Type of thinking required',
    validationError: 'conceptType must be one of 4 types',
    example: 'CONCEPTUAL',
    notes: 'Aligns with Bloom\'s taxonomy in outcome design'
  },

  // ────────────────────────────────────────────────────────────────────────
  // NEW: Interleaving & Spaced Review Signals
  // ────────────────────────────────────────────────────────────────────────

  isInterleaved: {
    type: 'boolean',
    required: false,
    description: 'Is this question part of an interleaving block (mix of atoms)?',
    validationError: 'isInterleaved must be true or false',
    example: false,
    notes: 'Tracks spaced review strategy effectiveness'
  },

  spacedReviewDaysSinceLastSeen: {
    type: 'number',
    required: false,
    minimum: 0,
    maximum: 365,
    description: 'How many days since student last saw this atom?',
    validationError: 'Must be 0-365 days',
    example: 7,
    notes: 'Key for SM2-lite scheduling analysis'
  },

  // ────────────────────────────────────────────────────────────────────────
  // NEW: Hint & Scaffold Usage (Extended)
  // ────────────────────────────────────────────────────────────────────────

  hintsUsed: {
    type: 'number',
    required: false,
    minimum: 0,
    maximum: 5,
    description: 'How many hints did student request?',
    validationError: 'hintsUsed must be 0-5',
    example: 1,
    notes: 'Helps identify when scaffold level was insufficient'
  },

  scaffoldLevel: {
    type: 'number',
    required: false,
    minimum: 0,
    maximum: 3,
    description: 'Scaffold intensity: 0=none, 1=light, 2=medium, 3=heavy',
    validationError: 'scaffoldLevel must be 0-3',
    example: 1
  },

  // ────────────────────────────────────────────────────────────────────────
  // NEW: Session & Streak Metadata
  // ────────────────────────────────────────────────────────────────────────

  sessionId: {
    type: 'string',
    required: false,
    pattern: /^[A-Z0-9]{8,}$/,
    description: 'Daily mission or diagnostic session identifier',
    validationError: 'sessionId must be alphanumeric, 8+ chars',
    example: 'SESS_ABC123XYZ'
  },

  questType: {
    type: 'string',
    required: false,
    enum: ['DIAGNOSTIC', 'DAILY_MISSION', 'BONUS_REPAIR', 'SPACED_REVIEW', 'HERO_QUEST'],
    description: 'What mode was this question served in?',
    validationError: 'questType must be one of 5 types',
    example: 'DAILY_MISSION'
  }
};

/**
 * EXTENDED FIELD GROUPS for v2 organization
 */
export const FIELD_GROUPS_V2 = {
  ...FIELD_GROUPS,
  curriculum: ['atomIdV2', 'moduleId', 'templateId', 'masteryProfileId', 'domain'],
  recovery: ['repairItemId', 'repairMisconceptionId', 'recoveryTemplate', 'isRecovered', 'recoveryVelocity'],
  transfer: ['isTransferItem', 'transferSuccess'],
  behavior: ['learningBehavior', 'conceptType'],
  outcomes: ['outcomeIds', 'conceptType'],
  interleaving: ['isInterleaved', 'spacedReviewDaysSinceLastSeen'],
  scaffolding: ['hintsUsed', 'scaffoldLevel'],
  session: ['sessionId', 'questType']
};

/**
 * HELPER: Get v2 schema field specs
 */
export const getV2FieldsByGroup = (group) => {
  const fieldNames = FIELD_GROUPS_V2[group] || [];
  return fieldNames.map(name => ({
    name,
    spec: ANALYTICS_SCHEMA_V2[name]
  }));
};

/**
 * HELPER: Validate a log entry against v2 schema
 * Preserves all v1 validation while adding v2 rules
 */
export const validateAnalyticsLogV2 = (log) => {
  const errors = [];
  const warnings = [];
  const info = [];

  // Check all v1 required fields first (backward compat)
  const v1RequiredFields = ['questionId', 'atomId', 'studentAnswer', 'correctAnswer', 'isCorrect', 'timeSpent', 'speedRating', 'masteryBefore', 'masteryAfter', 'timestamp'];
  v1RequiredFields.forEach(field => {
    if (!log[field]) {
      errors.push({
        field,
        error: `Required field missing: ${field}`,
        severity: 'ERROR'
      });
    }
  });

  // Check v2 optional fields if provided
  if (log.atomIdV2 && !log.atomIdV2.match(/^[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.\d{2}$/)) {
    errors.push({
      field: 'atomIdV2',
      error: 'Invalid v2 atom format',
      severity: 'WARNING'
    });
  }

  if (log.templateId && !ANALYTICS_SCHEMA_V2.templateId.enum.includes(log.templateId)) {
    warnings.push({
      field: 'templateId',
      warning: `Unknown template: ${log.templateId}`,
      severity: 'WARNING'
    });
  }

  // Transfer item consistency check (new)
  if (log.isTransferItem && !log.transferSuccess) {
    warnings.push({
      field: 'transferSuccess',
      warning: 'Transfer item missing transferSuccess field',
      severity: 'WARNING'
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    info
  };
};

export default {
  ANALYTICS_SCHEMA_V2,
  FIELD_GROUPS_V2,
  getV2FieldsByGroup,
  validateAnalyticsLogV2
};
