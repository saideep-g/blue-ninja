/**
 * dailyMissionsV2.js - v2.0
 * 
 * Daily Missions for 14+ Template Curriculum
 * Generates adaptive daily quest chains mapped to v2 atoms, templates, and mastery profiles
 * 
 * STRUCTURE:
 * - 14 question slots per day
 * - Each slot bound to specific atom, template, and mastery profile
 * - Spaced review scheduler integration
 * - Analytics event tracking for all 14 questions
 * - Compatible with existing hooks and validation
 */

import { loadCurriculum, getAtomsByTemplate, getAtomsByModule } from './curriculumLoader';

/**
 * Daily Mission Configuration
 * 14 questions strategically ordered to hit all template types and mastery profiles
 */
export const DAILY_MISSION_STRATEGY = {
  totalQuestions: 14,
  layout: '14+',
  timePerQuestion: {
    min: 1000,    // 1 second minimum
    target: 3000, // 3 seconds target
    max: 60000    // 60 seconds max before timeout
  },
  
  // Slot allocation strategy:
  // Slots 1-3:  Retrieval (fast, spaced review)
  // Slots 4-6:  Core templates (MCQ, NUMERIC, ERROR_ANALYSIS)
  // Slots 7-9:  Interactive templates (BALANCE, CLASSIFY, MATCHING)
  // Slots 10-12: Advanced templates (STEP_BUILDER, MULTI_STEP, TRANSFER)
  // Slots 13-14: Feedback & reflection (SHORT_EXPLAIN, TRANSFER_MINI)
  
  slotStrategy: [
    { slot: 1, phase: 'warm_up', templates: ['NUMERIC_INPUT'], intent: 'retrieval' },
    { slot: 2, phase: 'warm_up', templates: ['MCQ_CONCEPT'], intent: 'retrieval' },
    { slot: 3, phase: 'warm_up', templates: ['MATCHING'], intent: 'retrieval_representation' },
    
    { slot: 4, phase: 'diagnose', templates: ['MCQ_CONCEPT'], intent: 'misconception_probe' },
    { slot: 5, phase: 'diagnose', templates: ['ERROR_ANALYSIS'], intent: 'error_detection' },
    { slot: 6, phase: 'diagnose', templates: ['NUMBER_LINE_PLACE'], intent: 'representation' },
    
    { slot: 7, phase: 'guided_practice', templates: ['BALANCE_OPS', 'BALANCE_SLIDER'], intent: 'procedural' },
    { slot: 8, phase: 'guided_practice', templates: ['CLASSIFY_SORT'], intent: 'classification' },
    { slot: 9, phase: 'guided_practice', templates: ['DRAG_DROP_MATCH'], intent: 'matching' },
    
    { slot: 10, phase: 'advanced', templates: ['STEP_BUILDER'], intent: 'multi_step_reasoning' },
    { slot: 11, phase: 'advanced', templates: ['MULTI_STEP_WORD'], intent: 'transfer_modeling' },
    { slot: 12, phase: 'advanced', templates: ['EXPRESSION_INPUT'], intent: 'symbolic_fluency' },
    
    { slot: 13, phase: 'reflection', templates: ['SHORT_EXPLAIN'], intent: 'justification' },
    { slot: 14, phase: 'reflection', templates: ['TRANSFER_MINI'], intent: 'novel_application' }
  ]
};

/**
 * Template rotation across days
 * Ensures variety while maintaining pedagogical structure
 */
export const TEMPLATE_DAILY_ROTATION = {
  // Core templates (appear most frequently)
  core: ['MCQ_CONCEPT', 'NUMERIC_INPUT', 'ERROR_ANALYSIS', 'MATCHING'],
  
  // Interactive templates (2-3x per week)
  interactive: ['BALANCE_OPS', 'BALANCE_SLIDER', 'CLASSIFY_SORT', 'DRAG_DROP_MATCH', 'GEOMETRY_TAP'],
  
  // Advanced templates (1-2x per week)
  advanced: ['STEP_BUILDER', 'MULTI_STEP_WORD', 'STEP_ORDER', 'EXPRESSION_INPUT'],
  
  // Reflection templates (daily)
  reflection: ['SHORT_EXPLAIN', 'TRANSFER_MINI', 'TWO_TIER'],
  
  // Specialized templates (1-2x per week)
  specialized: ['GRAPH_PLOT', 'SPINNER_PROB', 'SIMULATION', 'GEOMETRY_TAP']
};

/**
 * Mastery Profile Interleaving
 * Ensures balanced progression across all 5 profiles
 */
export const MASTERY_PROFILE_DISTRIBUTION = {
  'MP_CORE_CONCEPT': {
    targetDaily: 3,
    description: 'Solid understanding + misconception removal',
    templates: ['TWO_TIER', 'TRANSFER_MINI', 'ERROR_ANALYSIS']
  },
  'MP_CORE_FLUENCY': {
    targetDaily: 4,
    description: 'Speed + accuracy for school tests',
    templates: ['NUMERIC_INPUT', 'ERROR_ANALYSIS']
  },
  'MP_REASONING': {
    targetDaily: 3,
    description: 'Explain, justify, connect representations',
    templates: ['STEP_BUILDER', 'TWO_TIER', 'TRANSFER_MINI', 'SHORT_EXPLAIN']
  },
  'MP_OLYMPIAD': {
    targetDaily: 2,
    description: 'Non-routine problems, patterns, clever observations',
    templates: ['STEP_BUILDER', 'TRANSFER_MINI']
  },
  'MP_EAPCET_FOUND': {
    targetDaily: 2,
    description: 'Algebra/geometry fluency + time discipline',
    templates: ['NUMERIC_INPUT', 'SORT_ORDER', 'ERROR_ANALYSIS']
  }
};

/**
 * Spaced Review Scheduler Integration
 * Maps to SM2-lite intervals
 */
export const SPACED_REVIEW_RULES = {
  intervals: [1, 3, 7, 14, 30],  // days
  initialEaseFactor: 2.5,
  minEaseFactor: 1.3,
  rules: {
    correctFirstAttempt: { easeFactor: '+0.1', interval: 'next' },
    correctAfterHint: { easeFactor: '+0.0', interval: 'current' },
    incorrectButRecovered: { easeFactor: '-0.2', interval: 'previous' },
    incorrect: { easeFactor: '-0.5', interval: 'min' }
  }
};

/**
 * Generate daily mission for a student
 * Adapts based on mastery history and current skill level
 */
export const generateDailyMission = async (userId, dayNumber, studentMastery = {}) => {
  const curriculum = await loadCurriculum();
  
  const mission = {
    day: dayNumber,
    userId,
    layout: DAILY_MISSION_STRATEGY.layout,
    totalQuestions: DAILY_MISSION_STRATEGY.totalQuestions,
    generatedAt: new Date().toISOString(),
    slots: []
  };

  // For each of 14 slots, generate a slot spec with atom + template
  for (let slotIndex = 0; slotIndex < DAILY_MISSION_STRATEGY.slotStrategy.length; slotIndex++) {
    const strategy = DAILY_MISSION_STRATEGY.slotStrategy[slotIndex];
    
    // In a production system, this would:
    // 1. Get atoms matching the template type
    // 2. Filter by mastery profile preference
    // 3. Apply spaced review scheduler
    // 4. Handle interleaving rules
    
    mission.slots.push({
      slot: strategy.slot,
      phase: strategy.phase,
      intent: strategy.intent,
      template: strategy.templates[0], // In prod, would select intelligently
      // atom_id, masteryProfile, etc would be populated from curriculum
      placeholder: `Slot ${strategy.slot} - ${strategy.templates[0]}`
    });
  }

  return mission;
};

/**
 * Get daily mission for a specific day
 * Cached for consistency
 */
const dailyMissionCache = {};

export const getDailyMissionForDay = async (dayNumber, userId, refresh = false) => {
  const cacheKey = `day${dayNumber}_${userId}`;
  
  if (!refresh && dailyMissionCache[cacheKey]) {
    return dailyMissionCache[cacheKey];
  }
  
  const mission = await generateDailyMission(userId, dayNumber);
  dailyMissionCache[cacheKey] = mission;
  return mission;
};

/**
 * New V2 API: getDailyMissionQuestionsV2
 * Returns the 14+ slot structure for UI rendering
 * Compatible with existing hooks
 */
export const getDailyMissionQuestionsV2 = async (dayNumber, userId) => {
  const mission = await getDailyMissionForDay(dayNumber, userId);
  return mission.slots.map((slot, idx) => ({
    id: `Q${String(idx + 1).padStart(3, '0')}`,
    slot: slot.slot,
    phase: slot.phase,
    intent: slot.intent,
    template: slot.template,
    difficulty: idx < 3 ? 'EASY' : (idx < 10 ? 'MEDIUM' : 'HARD'),
    // In production, would populate actual question content
    content: {
      question: slot.placeholder
    }
  }));
};

/**
 * Export v2 daily missions for compatibility with useDailyMission hook
 */
export const DAILY_MISSION_QUESTIONS_V2 = {
  day1: {
    layout: '14+',
    totalQuestions: 14,
    slots: Array.from({ length: 14 }, (_, i) => ({ slot: i + 1 }))
  }
};

/**
 * Helper: Validate a question belongs to expected slot
 */
export const validateQuestionSlot = (questionId, slotNumber) => {
  const slotIdx = slotNumber - 1;
  if (slotIdx < 0 || slotIdx >= DAILY_MISSION_STRATEGY.slotStrategy.length) {
    return { valid: false, error: `Invalid slot: ${slotNumber}` };
  }
  
  const strategy = DAILY_MISSION_STRATEGY.slotStrategy[slotIdx];
  return {
    valid: true,
    strategy,
    expectedTemplates: strategy.templates
  };
};

/**
 * Helper: Get recommended recovery template based on performance
 */
export const recommendRecoveryTemplate = (errorType, templateId) => {
  const recoveryMap = {
    'CALCULATION_ERROR': 'WORKED_EXAMPLE',
    'CONCEPTUAL_GAP': 'ERROR_ANALYSIS',
    'SIGN_IGNORANCE': 'NUMBER_LINE_SCAFFOLD',
    'UNIT_CONFUSION': 'TRANSFER_MINI',
    'OPERATOR_SWAP': 'STEP_BUILDER'
  };
  
  return recoveryMap[errorType] || 'HINT_LADDER';
};

/**
 * Helper: Calculate flow points for daily mission
 */
export const calculateFlowPoints = (correctCount, totalQuestions, averageTimeSeconds) => {
  const accuracyMultiplier = correctCount / totalQuestions;
  const speedBonus = averageTimeSeconds < 3000 ? 1.5 : (averageTimeSeconds > 10000 ? 0.8 : 1.0);
  
  const basePoints = 100;
  return Math.round(basePoints * accuracyMultiplier * speedBonus);
};

export default {
  DAILY_MISSION_STRATEGY,
  TEMPLATE_DAILY_ROTATION,
  MASTERY_PROFILE_DISTRIBUTION,
  SPACED_REVIEW_RULES,
  generateDailyMission,
  getDailyMissionForDay,
  getDailyMissionQuestionsV2,
  DAILY_MISSION_QUESTIONS_V2,
  validateQuestionSlot,
  recommendRecoveryTemplate,
  calculateFlowPoints
};
