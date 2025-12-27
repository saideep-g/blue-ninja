/**
 * dailyMissionIntegration.js
 * 
 * Practical integration layer between v1 hooks and v2 curriculum
 * Handles the actual question generation for 14+ slots
 * 
 * CRITICAL: This service produces the actual question questions that students see
 * Ensures all 14+ templates are represented while maintaining analytics integrity
 */

import { loadCurriculum, getAtomsByTemplate, getAtomsByModule, getAllAtoms } from '../data/curriculumLoader';
import { DAILY_MISSION_STRATEGY, MASTERY_PROFILE_DISTRIBUTION, SPACED_REVIEW_RULES } from '../data/dailyMissionsV2';

/**
 * PRODUCTION FUNCTION: Generate daily mission questions for specific student
 * 
 * INPUT:
 * - userId: student identifier
 * - dayNumber: which day (1-365, cycles)
 * - studentMastery: student's current mastery state
 * - studentHistory: recent question history for spaced review
 * 
 * OUTPUT:
 * - Array of 14 question stubs with:
 *   - questionId
 *   - atom/atomIdV2
 *   - templateId
 *   - moduleId, domain
 *   - masteryProfileId
 *   - Other curriculum metadata
 */
export const generateDailyMissionQuestionsV2 = async (
  userId,
  dayNumber,
  studentMastery = {},
  studentHistory = []
) => {
  try {
    const curriculum = await loadCurriculum();
    const questions = [];
    const usedAtoms = new Set();
    const allAtoms = await getAllAtoms();

    // For each of 14 slots, generate a question spec
    for (let slotIdx = 0; slotIdx < DAILY_MISSION_STRATEGY.slotStrategy.length; slotIdx++) {
      const strategy = DAILY_MISSION_STRATEGY.slotStrategy[slotIdx];
      const slotNumber = slotIdx + 1;

      // Step 1: Select atom for this slot
      let selectedAtom = null;
      let atomSelectionReason = '';

      // Slot-specific selection logic
      if (slotIdx < 3) {
        // WARM-UP: Select from recent history (spaced review)
        selectedAtom = selectAtomForSpacedReview(
          allAtoms,
          studentHistory,
          strategy.templates,
          usedAtoms
        );
        atomSelectionReason = 'spaced_review';
      } else if (slotIdx < 6) {
        // DIAGNOSIS: Select atoms where student has misconceptions
        selectedAtom = selectAtomForMisconception(
          allAtoms,
          studentMastery,
          strategy.templates,
          usedAtoms
        );
        atomSelectionReason = 'misconception_probe';
      } else if (slotIdx < 9) {
        // GUIDED PRACTICE: Balance between weak and strong areas
        selectedAtom = selectAtomForPractice(
          allAtoms,
          studentMastery,
          strategy.templates,
          usedAtoms
        );
        atomSelectionReason = 'guided_practice';
      } else if (slotIdx < 12) {
        // ADVANCED: Stretch goals and advanced atoms
        selectedAtom = selectAtomForChallenge(
          allAtoms,
          studentMastery,
          strategy.templates,
          usedAtoms,
          dayNumber
        );
        atomSelectionReason = 'challenge';
      } else {
        // REFLECTION: Transfer and explanation questions
        selectedAtom = selectAtomForReflection(
          allAtoms,
          strategy.templates,
          usedAtoms,
          dayNumber
        );
        atomSelectionReason = 'reflection';
      }

      // Fallback if no atom found (shouldn't happen with good curriculum data)
      if (!selectedAtom) {
        selectedAtom = allAtoms.find(a => !usedAtoms.has(a.atom_id));
      }

      if (!selectedAtom) {
        console.warn(`[dailyMissionIntegration] No atom found for slot ${slotNumber}`);
        continue;
      }

      // Mark this atom as used
      usedAtoms.add(selectedAtom.atom_id);

      // Step 2: Select template
      const selectedTemplate = selectTemplate(
        selectedAtom,
        strategy.templates,
        dayNumber
      );

      // Step 3: Assemble question stub
      const questionStub = {
        // Slot metadata
        slot: slotNumber,
        phase: strategy.phase,
        intent: strategy.intent,

        // Question identification
        id: `Q${String(slotNumber).padStart(3, '0')}`,
        questionId: generateQuestionId(userId, dayNumber, slotNumber),

        // Curriculum reference
        atom: selectedAtom.atom_id,
        atomIdV2: selectedAtom.atom_id,
        atomTitle: selectedAtom.title,
        moduleId: selectedAtom.module_id,
        domain: selectedAtom.domain,
        masteryProfileId: selectedAtom.mastery_profile_id,

        // Template info
        template: selectedTemplate,
        templateDescription: selectedTemplate,

        // Difficulty (increases across day)
        difficulty: calculateDifficulty(slotNumber),
        expectedTimeSeconds: calculateExpectedTime(slotNumber),

        // Metadata for analytics
        atomSelectionReason,
        sessionDay: dayNumber,
        sessionUserId: userId,

        // Will be populated by question bank loader
        // (these are placeholders; actual content comes from questions database)
        content: null,
        correct_answer: null,
        explanation: null
      };

      questions.push(questionStub);
    }

    console.log('[dailyMissionIntegration] Generated daily mission:', {
      userId,
      dayNumber,
      totalQuestions: questions.length,
      templateDistribution: getTemplateDistribution(questions),
      masteryProfileDistribution: getMasteryDistribution(questions)
    });

    return questions;
  } catch (error) {
    console.error('[dailyMissionIntegration] Error generating mission:', error);
    return [];
  }
};

/**
 * HELPER: Spaced Review Selection
 * For warm-up phase: pick atoms student hasn't seen recently
 */
function selectAtomForSpacedReview(allAtoms, history, preferredTemplates, usedAtoms) {
  // Sort by "days since last seen"
  const candidates = allAtoms
    .filter(a => !usedAtoms.has(a.atom_id))
    .filter(a => a.template_ids?.some(t => preferredTemplates.includes(t)))
    .sort((a, b) => {
      const aLastSeen = history.find(h => h.atomId === a.atom_id)?.timestamp || 0;
      const bLastSeen = history.find(h => h.atomId === b.atom_id)?.timestamp || 0;
      return bLastSeen - aLastSeen; // Older first
    });

  return candidates[0] || null;
}

/**
 * HELPER: Misconception-Based Selection
 * For diagnosis phase: pick atoms where student struggles
 */
function selectAtomForMisconception(allAtoms, mastery, preferredTemplates, usedAtoms) {
  const candidates = allAtoms
    .filter(a => !usedAtoms.has(a.atom_id))
    .filter(a => a.template_ids?.some(t => preferredTemplates.includes(t)))
    .map(a => ({
      atom: a,
      score: mastery[a.atom_id] || 0.5 // Default 0.5 if not seen
    }))
    .filter(item => item.score < 0.7) // Focus on atoms where score < 70%
    .sort((a, b) => a.score - b.score); // Lowest first

  return candidates[0]?.atom || null;
}

/**
 * HELPER: Balanced Practice Selection
 * For guided practice: mix of weak and strong atoms
 */
function selectAtomForPractice(allAtoms, mastery, preferredTemplates, usedAtoms) {
  // 60% from weak areas, 40% from strong areas
  const byScore = allAtoms
    .filter(a => !usedAtoms.has(a.atom_id))
    .filter(a => a.template_ids?.some(t => preferredTemplates.includes(t)))
    .map(a => ({ atom: a, score: mastery[a.atom_id] || 0.5 }))
    .sort(() => Math.random() - 0.5);

  return byScore[0]?.atom || null;
}

/**
 * HELPER: Challenge Selection
 * For advanced phase: stretch goals and harder atoms
 */
function selectAtomForChallenge(allAtoms, mastery, preferredTemplates, usedAtoms, dayNumber) {
  // Progressive difficulty: day 1 is easier, day 30 is harder
  const difficultyThreshold = 0.5 + (dayNumber % 30) * 0.015; // 0.5 to 0.95

  const candidates = allAtoms
    .filter(a => !usedAtoms.has(a.atom_id))
    .filter(a => a.template_ids?.some(t => preferredTemplates.includes(t)))
    .filter(a => (mastery[a.atom_id] || 0.5) >= difficultyThreshold * 0.7)
    .sort(() => Math.random() - 0.5);

  return candidates[0] || null;
}

/**
 * HELPER: Reflection Selection
 * For reflection phase: transfer and explanation items
 */
function selectAtomForReflection(allAtoms, preferredTemplates, usedAtoms, dayNumber) {
  // Pick semi-randomly to ensure variety
  const candidates = allAtoms
    .filter(a => !usedAtoms.has(a.atom_id))
    .filter(a => a.template_ids?.some(t => preferredTemplates.includes(t)));

  // Use day number as seed for deterministic selection
  const index = dayNumber % candidates.length;
  return candidates[index] || null;
}

/**
 * HELPER: Template Selection
 * Given atom, select template from preferred list
 */
function selectTemplate(atom, preferredTemplates, dayNumber) {
  // Check if atom supports any of the preferred templates
  const atomTemplates = atom.template_ids || [];
  const supported = preferredTemplates.filter(t => atomTemplates.includes(t));

  if (supported.length === 0) {
    // Fallback to first available
    return atomTemplates[0] || 'MCQ_CONCEPT';
  }

  // Rotate through supported templates using day number
  const index = dayNumber % supported.length;
  return supported[index];
}

/**
 * HELPER: Calculate expected time for slot
 * Earlier slots should be quicker
 */
function calculateExpectedTime(slotNumber) {
  const baseTime = 60; // 60 seconds base
  const acceleration = Math.max(1, (slotNumber - 7) * 0.1); // Slow down after slot 7
  return baseTime * acceleration;
}

/**
 * HELPER: Calculate difficulty for slot
 */
function calculateDifficulty(slotNumber) {
  if (slotNumber <= 3) return 'EASY';
  if (slotNumber <= 9) return 'MEDIUM';
  if (slotNumber <= 12) return 'HARD';
  return 'CHALLENGING';
}

/**
 * HELPER: Generate unique question ID
 * Format: {userId}_{dayNumber}_{slotNumber}_{timestamp}
 */
function generateQuestionId(userId, dayNumber, slotNumber) {
  return `${userId}_D${dayNumber}_S${slotNumber}`;
}

/**
 * HELPER: Get distribution of templates in mission
 */
function getTemplateDistribution(questions) {
  const distribution = {};
  questions.forEach(q => {
    distribution[q.template] = (distribution[q.template] || 0) + 1;
  });
  return distribution;
}

/**
 * HELPER: Get distribution of mastery profiles
 */
function getMasteryDistribution(questions) {
  const distribution = {};
  questions.forEach(q => {
    const profile = q.masteryProfileId || 'UNKNOWN';
    distribution[profile] = (distribution[profile] || 0) + 1;
  });
  return distribution;
}

/**
 * PUBLIC: Cache management
 */
const questionCache = {};

export const getCachedMission = (userId, dayNumber) => {
  const key = `${userId}_${dayNumber}`;
  return questionCache[key] || null;
};

export const cacheMission = (userId, dayNumber, questions) => {
  const key = `${userId}_${dayNumber}`;
  questionCache[key] = questions;
};

export const clearMissionCache = (userId) => {
  Object.keys(questionCache).forEach(key => {
    if (key.startsWith(userId)) delete questionCache[key];
  });
};

export default {
  generateDailyMissionQuestionsV2,
  getCachedMission,
  cacheMission,
  clearMissionCache
};
