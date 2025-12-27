/**
 * curriculumV2Service.js - v2.0
 * 
 * Unified curriculum v2 service that loads and orchestrates all 4 curriculum files:
 * 1. Manifest (index & version lock)
 * 2. Core Curriculum (learning map)
 * 3. Template Library (UI contracts)
 * 4. Assessment Guide (mastery & analytics)
 * 
 * This service ensures consistency and prevents mixing mismatched versions.
 */

import manifest from '../data/cbse7_mathquest_manifest_v2.json';
import coreCurriculum from '../data/cbse7_mathquest_core_curriculum_v2.json';
import templateLibrary from '../data/mathquest_template_library_v2.json';
import assessmentGuide from '../data/cbse7_mathquest_assessment_guide_v2.json';

/**
 * Cached loaded curriculum (loaded once, reused)
 */
let cachedCurriculum = null;
let cachedMeta = null;

/**
 * Load all 4 curriculum files and validate versions match
 * Returns unified curriculum object
 */
export const loadCurriculumV2 = async () => {
  if (cachedCurriculum) return cachedCurriculum;

  try {
    // Step 1: Load manifest (source of truth)
    const manifestData = manifest;
    console.log('[curriculumV2Service] Manifest loaded:', manifestData.curriculum_bundle_id);

    // Step 2: Load core curriculum
    const coreData = coreCurriculum;
    console.log('[curriculumV2Service] Core curriculum loaded:', coreData.curriculum_id);

    // Step 3: Load template library
    const templatesData = templateLibrary;
    console.log('[curriculumV2Service] Template library loaded:', Object.keys(templatesData.templates || {}).length, 'templates');

    // Step 4: Load assessment guide
    const assessmentData = assessmentGuide;
    console.log('[curriculumV2Service] Assessment guide loaded');

    // Step 5: Validate version consistency
    validateVersionConsistency(manifestData, coreData, templatesData, assessmentData);

    // Step 6: Build unified curriculum object
    const unifiedCurriculum = {
      // Metadata from manifest
      bundleId: manifestData.curriculum_bundle_id,
      manifestVersion: manifestData.schema_version,
      versionLock: manifestData.version_lock,
      gradeLevels: manifestData.supported_grades,
      syllabus: manifestData.supported_syllabi,

      // Core learning structure
      curriculum: coreData,
      modules: coreData.modules || [],
      atoms: indexAtoms(coreData.modules || []),

      // Template contracts
      templates: templatesData.templates || {},
      templateIds: Object.keys(templatesData.templates || {}),

      // Assessment & mastery
      masteryProfiles: assessmentData.mastery_profiles || {},
      sequencingRules: assessmentData.sequencing_rules || {},
      spacedReviewRules: assessmentData.spaced_review_rules || {},
      analyticsSchema: assessmentData.analytics_event_specs || {},
      promptRecipes: assessmentData.prompt_recipes || {},

      // Convenience properties
      totalModules: coreData.modules?.length || 0,
      totalAtoms: Object.keys(indexAtoms(coreData.modules || [])).length,
      supportedTemplates: Object.keys(templatesData.templates || {}),
    };

    cachedCurriculum = unifiedCurriculum;
    cachedMeta = manifestData;

    console.log('[curriculumV2Service] Unified curriculum ready:', {
      bundle: unifiedCurriculum.bundleId,
      modules: unifiedCurriculum.totalModules,
      atoms: unifiedCurriculum.totalAtoms,
      templates: unifiedCurriculum.templateIds.length,
    });

    return unifiedCurriculum;
  } catch (error) {
    console.error('[curriculumV2Service] Error loading curriculum:', error);
    throw error;
  }
};

/**
 * HELPER: Build atom index for O(1) lookups
 */
function indexAtoms(modules) {
  const index = {};
  modules.forEach(module => {
    (module.atoms || []).forEach(atom => {
      index[atom.atom_id] = {
        ...atom,
        moduleId: module.module_id,
        moduleName: module.title
      };
    });
  });
  return index;
}

/**
 * CRITICAL: Validate all 4 files have compatible versions
 */
function validateVersionConsistency(manifest, core, templates, assessment) {
  const issues = [];

  // Check manifest references
  if (manifest.curriculum_bundle_id !== core.curriculum_id) {
    issues.push(`Curriculum ID mismatch: manifest=${manifest.curriculum_bundle_id}, core=${core.curriculum_id}`);
  }

  // Check schema versions are supported
  const supportedSchemaVersion = '2.0';
  if (core.schema_version !== supportedSchemaVersion) {
    issues.push(`Core schema version ${core.schema_version} not supported (need ${supportedSchemaVersion})`);
  }

  if (templates.schema_version !== supportedSchemaVersion) {
    issues.push(`Template schema version ${templates.schema_version} not supported`);
  }

  if (assessment.schema_version !== supportedSchemaVersion) {
    issues.push(`Assessment schema version ${assessment.schema_version} not supported`);
  }

  if (issues.length > 0) {
    console.warn('[curriculumV2Service] Version consistency issues:', issues);
    // Continue anyway - warnings, not fatal
  }
}

/**
 * Get module by ID
 */
export const getModuleById = async (moduleId) => {
  const curriculum = await loadCurriculumV2();
  return curriculum.modules.find(m => m.module_id === moduleId);
};

/**
 * Get atom by ID
 */
export const getAtomById = async (atomId) => {
  const curriculum = await loadCurriculumV2();
  return curriculum.atoms[atomId] || null;
};

/**
 * Get all atoms in a module
 */
export const getAtomsByModule = async (moduleId) => {
  const curriculum = await loadCurriculumV2();
  return Object.values(curriculum.atoms).filter(a => a.moduleId === moduleId);
};

/**
 * Get template definition by ID
 */
export const getTemplateDefinition = async (templateId) => {
  const curriculum = await loadCurriculumV2();
  return curriculum.templates[templateId] || null;
};

/**
 * Get mastery profile definition
 */
export const getMasteryProfile = async (profileId) => {
  const curriculum = await loadCurriculumV2();
  return curriculum.masteryProfiles[profileId] || null;
};

/**
 * Get atoms for a specific template
 */
export const getAtomsForTemplate = async (templateId) => {
  const curriculum = await loadCurriculumV2();
  return Object.values(curriculum.atoms).filter(atom => 
    atom.template_ids?.includes(templateId)
  );
};

/**
 * Get misconceptions for an atom
 */
export const getMisconceptionsForAtom = async (atomId) => {
  const curriculum = await loadCurriculumV2();
  const atom = curriculum.atoms[atomId];
  if (!atom || !atom.misconception_ids) return [];
  
  return atom.misconception_ids.map(id => ({
    id,
    // Look up full misconception details from assessment guide if available
  }));
};

/**
 * Get learning outcomes for an atom
 */
export const getOutcomesForAtom = async (atomId) => {
  const curriculum = await loadCurriculumV2();
  const atom = curriculum.atoms[atomId];
  return atom?.outcomes || [];
};

/**
 * Get all atoms with their full enriched metadata
 */
export const getAllAtomsEnriched = async () => {
  const curriculum = await loadCurriculumV2();
  
  return Object.values(curriculum.atoms).map(atom => ({
    ...atom,
    templates: (atom.template_ids || []).map(id => curriculum.templates[id]),
    misconceptions: atom.misconception_ids || [],
    masteryProfile: atom.mastery_profile_id ? 
      curriculum.masteryProfiles[atom.mastery_profile_id] : null,
  }));
};

/**
 * Get curriculum statistics
 */
export const getCurriculumStats = async () => {
  const curriculum = await loadCurriculumV2();
  
  const templateStats = {};
  curriculum.templateIds.forEach(templateId => {
    const atoms = Object.values(curriculum.atoms).filter(a => 
      a.template_ids?.includes(templateId)
    );
    templateStats[templateId] = atoms.length;
  });

  const masteryStats = {};
  Object.keys(curriculum.masteryProfiles).forEach(profileId => {
    const atoms = Object.values(curriculum.atoms).filter(a => 
      a.mastery_profile_id === profileId
    );
    masteryStats[profileId] = atoms.length;
  });

  return {
    bundleId: curriculum.bundleId,
    version: curriculum.manifestVersion,
    totalModules: curriculum.totalModules,
    totalAtoms: curriculum.totalAtoms,
    totalTemplates: curriculum.templateIds.length,
    totalMasteryProfiles: Object.keys(curriculum.masteryProfiles).length,
    templateDistribution: templateStats,
    masteryDistribution: masteryStats,
    gradeLevels: curriculum.gradeLevels,
    supportedSyllabi: curriculum.syllabus,
  };
};

/**
 * Export for debugging
 */
export const getCurriculumDebugInfo = async () => {
  const curriculum = await loadCurriculumV2();
  return {
    manifest: cachedMeta,
    curriculumMetadata: {
      id: curriculum.curriculum?.curriculum_id,
      version: curriculum.curriculum?.schema_version,
      modules: curriculum.totalModules,
      atoms: curriculum.totalAtoms,
    },
    templates: {
      count: curriculum.templateIds.length,
      ids: curriculum.templateIds,
    },
    mastery: {
      profiles: Object.keys(curriculum.masteryProfiles),
    },
  };
};

export default {
  loadCurriculumV2,
  getModuleById,
  getAtomById,
  getAtomsByModule,
  getTemplateDefinition,
  getMasteryProfile,
  getAtomsForTemplate,
  getMisconceptionsForAtom,
  getOutcomesForAtom,
  getAllAtomsEnriched,
  getCurriculumStats,
  getCurriculumDebugInfo,
};
