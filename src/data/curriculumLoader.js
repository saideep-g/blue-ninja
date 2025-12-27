/**
 * curriculumLoader.js - v2.0
 * 
 * Unified curriculum loader that bridges:
 * - Old curriculum (legacy support)
 * - New MathQuest v2 curriculum with full atoms, modules, templates, misconceptions
 * - Schema validation and normalization
 * 
 * CRITICAL: All analytics, logging, and validation continue to work seamlessly.
 * This loader acts as a transparent bridge.
 */

import curriculumV2 from './cbse7_mathquest_core_curriculum_v2.json';
import goldQuestionsV2 from './cbse7_mathquest_gold_questions_v2.json';

/**
 * CURRICULUM VERSION STRATEGY
 * - v1.x: Legacy atoms (A1-A13)
 * - v2.x: Full MathQuest curriculum with modules, atoms, templates, misconceptions
 */

export const CURRICULUM_VERSION = '2.0';
export const CURRICULUM_ID = curriculumV2.curriculum_id || 'mathquest-cbse7-olympiad-eapcet-foundation';

/**
 * Cached curriculum data - loaded once, reused everywhere
 */
let cachedCurriculum = null;
let cachedGoldQuestions = null;

/**
 * Load and normalize the full v2 curriculum
 * Ensures backward compatibility with atom references while supporting new structure
 */
export const loadCurriculum = async () => {
  if (cachedCurriculum) return cachedCurriculum;

  try {
    // Use imported JSON directly (no need to fetch)
    const curriculum = curriculumV2;

    // Normalize and flatten for quick lookup
    const normalized = normalizeCurriculum(curriculum);
    cachedCurriculum = normalized;

    console.log('[curriculumLoader] Curriculum loaded:', {
      version: curriculum.schema_version,
      id: curriculum.curriculum_id,
      modules: curriculum.modules?.length || 0,
      totalAtoms: Object.keys(normalized.atomsById).length,
      tracks: curriculum.tracks?.length || 0
    });

    return normalized;
  } catch (error) {
    console.error('[curriculumLoader] Error loading curriculum:', error);
    // Fallback to minimal structure
    return createMinimalCurriculum();
  }
};

/**
 * Load gold standard questions (template examples)
 */
export const loadGoldQuestions = async () => {
  if (cachedGoldQuestions) return cachedGoldQuestions;

  try {
    const questions = goldQuestionsV2;
    cachedGoldQuestions = questions;

    console.log('[curriculumLoader] Gold questions loaded:', {
      version: questions.schema_version,
      bank_id: questions.bank_id,
      items: questions.items?.length || 0,
      templates: Object.keys(questions.counts_by_template || {}).length
    });

    return questions;
  } catch (error) {
    console.error('[curriculumLoader] Error loading gold questions:', error);
    return { items: [], templates_included: [] };
  }
};

/**
 * CRITICAL: Get atom metadata by atom_id
 * Used extensively by analytics schema validation
 * Example: getAtomById('CBSE7.CH01.INT.01')
 */
export const getAtomById = async (atomId) => {
  const curriculum = await loadCurriculum();
  return curriculum.atomsById[atomId] || null;
};

/**
 * Get all atoms (for curriculum browser, analytics dashboards)
 */
export const getAllAtoms = async () => {
  const curriculum = await loadCurriculum();
  return Object.values(curriculum.atomsById);
};

/**
 * Get module by module_id
 * Example: getModuleById('CBSE7-CH01-INTEGERS')
 */
export const getModuleById = async (moduleId) => {
  const curriculum = await loadCurriculum();
  return curriculum.modulesById[moduleId] || null;
};

/**
 * Get atoms by module
 * Useful for analytics grouped by chapter/domain
 */
export const getAtomsByModule = async (moduleId) => {
  const curriculum = await loadCurriculum();
  return curriculum.atomsByModule[moduleId] || [];
};

/**
 * Get atoms by template type
 * Example: getAtomsByTemplate('MCQ_CONCEPT')
 * Useful for template-specific analytics
 */
export const getAtomsByTemplate = async (templateId) => {
  const curriculum = await loadCurriculum();
  return curriculum.atomsByTemplate[templateId] || [];
};

/**
 * Get misconceptions for an atom
 * Critical for diagnostic tracking
 */
export const getMisconceptionsForAtom = async (atomId) => {
  const atom = await getAtomById(atomId);
  if (!atom || !atom.misconception_ids) return [];

  const curriculum = await loadCurriculum();
  return atom.misconception_ids
    .map(id => curriculum.misconceptionsById[id])
    .filter(Boolean);
};

/**
 * Get templates supported by an atom
 * Ensures question generation uses correct templates
 */
export const getTemplatesForAtom = async (atomId) => {
  const atom = await getAtomById(atomId);
  return atom?.template_ids || [];
};

/**
 * HELPER: Normalize raw curriculum into optimized lookups
 * This is done once at load time for O(1) lookups later
 */
function normalizeCurriculum(raw) {
  const atomsById = {};
  const modulesById = {};
  const misconceptionsById = {};
  const atomsByModule = {};
  const atomsByTemplate = {};
  const atomsByTrack = {};
  const tracks = raw.tracks || [];
  const modules = raw.modules || [];

  // Index all modules
  modules.forEach(module => {
    modulesById[module.module_id] = module;
    atomsByModule[module.module_id] = [];

    // Index all atoms within module
    (module.atoms || []).forEach(atom => {
      atomsById[atom.atom_id] = {
        ...atom,
        module_id: module.module_id,
        domain: module.domain,
        module_title: module.title
      };

      // Track by module
      atomsByModule[module.module_id].push(atom.atom_id);

      // Track by template
      (atom.template_ids || []).forEach(templateId => {
        if (!atomsByTemplate[templateId]) atomsByTemplate[templateId] = [];
        atomsByTemplate[templateId].push(atom.atom_id);
      });

      // Track by mastery profile
      const masteryId = atom.mastery_profile_id;
      if (masteryId) {
        if (!atomsByTrack[masteryId]) atomsByTrack[masteryId] = [];
        atomsByTrack[masteryId].push(atom.atom_id);
      }
    });
  });

  // Index all misconceptions (if provided in curriculum)
  (raw.misconceptions || []).forEach(misconception => {
    misconceptionsById[misconception.misconception_id] = misconception;
  });

  return {
    version: raw.schema_version,
    id: raw.curriculum_id,
    title: raw.title,
    tracks,
    modules,
    atomsById,
    modulesById,
    misconceptionsById,
    atomsByModule,
    atomsByTemplate,
    atomsByTrack,
    totalAtoms: Object.keys(atomsById).length,
    totalModules: modules.length
  };
}

/**
 * FALLBACK: Minimal curriculum for graceful degradation
 * If curriculum JSON fails to load, still work with basic structure
 */
function createMinimalCurriculum() {
  console.warn('[curriculumLoader] Using minimal fallback curriculum');
  return {
    version: '2.0',
    id: 'fallback',
    title: 'Fallback Curriculum',
    tracks: [],
    modules: [],
    atomsById: {},
    modulesById: {},
    misconceptionsById: {},
    atomsByModule: {},
    atomsByTemplate: {},
    atomsByTrack: {},
    totalAtoms: 0,
    totalModules: 0
  };
}

/**
 * Export full curriculum for admin/curriculum browser
 */
export const getFullCurriculum = async () => {
  return loadCurriculum();
};

/**
 * Export schemas for validation
 */
export const getCurriculumSchema = () => {
  return {
    version: CURRICULUM_VERSION,
    curriculum_id: CURRICULUM_ID,
    schema_version: curriculumV2.schema_version,
    document_type: curriculumV2.document_type
  };
};

export default {
  loadCurriculum,
  loadGoldQuestions,
  getAtomById,
  getAllAtoms,
  getModuleById,
  getAtomsByModule,
  getAtomsByTemplate,
  getMisconceptionsForAtom,
  getTemplatesForAtom,
  getFullCurriculum,
  getCurriculumSchema,
  CURRICULUM_VERSION,
  CURRICULUM_ID
};
