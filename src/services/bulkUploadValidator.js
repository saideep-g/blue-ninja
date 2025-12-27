/**
 * src/services/bulkUploadValidator.js
 * Orchestrates validation of multiple questions in upload session
 * Handles progress tracking, duplicate detection, coverage analysis
 * Production-ready with comprehensive reporting
 */

import { validateQuestion } from './questionValidator.js';

/**
 * Validate a batch/bulk upload of questions
 * Orchestrates validation of multiple questions and provides comprehensive report
 *
 * @param {Array} questions - Array of question objects to validate
 * @param {Object} options - Configuration options
 *   - sessionId: Session identifier
 *   - curriculum: Curriculum/atom reference data
 *   - progressCallback: Function called with progress updates
 *   - checkForDuplicates: Whether to check for duplicate IDs (default: true)
 *   - maxParallel: Max concurrent validations (default: 4)
 *
 * @returns {Object} Comprehensive validation report
 */
export async function validateBulkUpload(questions, options = {}) {
  const {
    sessionId = null,
    curriculum = null,
    progressCallback = null,
    checkForDuplicates = true,
    maxParallel = 4
  } = options;

  if (!Array.isArray(questions)) {
    throw new Error('questions must be an array');
  }

  if (questions.length === 0) {
    return createEmptyReport(sessionId);
  }

  const startTime = Date.now();

  // Results container
  const results = {
    sessionId,
    totalQuestions: questions.length,
    validatedAt: new Date().toISOString(),
    summary: {
      totalValid: 0,
      totalWithErrors: 0,
      totalWithWarnings: 0,
      totalWithCriticalErrors: 0,
      qualityGradeDistribution: {},
      validationTime: 0
    },
    questionResults: [],
    globalIssues: [],
    statistics: {
      averageQualityScore: 0,
      qualityGradeBreakdown: {},
      atomCoverage: {},
      typeDistribution: {}
    },
    performanceMetrics: {
      startTime,
      endTime: null,
      totalDuration: 0,
      averagePerQuestion: 0
    }
  };

  // Validate each question with parallel processing
  let validatedCount = 0;
  const questionValidations = [];

  for (let i = 0; i < questions.length; i += maxParallel) {
    const batch = questions.slice(i, Math.min(i + maxParallel, questions.length));
    
    const batchPromises = batch.map((question, batchIdx) => {
      return validateQuestion(question, curriculum).then(validation => {
        validatedCount++;

        // Call progress callback
        if (progressCallback) {
          progressCallback({
            current: validatedCount,
            total: questions.length,
            percentComplete: Math.round((validatedCount / questions.length) * 100),
            currentQuestion: question.id || `Unknown-${validatedCount}`
          });
        }

        return validation;
      });
    });

    questionValidations.push(...await Promise.all(batchPromises));
  }

  // Process validation results
  let totalQualityScore = 0;
  let questionsWithQualityGrade = 0;

  for (const validation of questionValidations) {
    results.questionResults.push(validation);

    // Update summary statistics
    if (validation.isValid) {
      results.summary.totalValid++;
    } else {
      results.summary.totalWithErrors++;
      
      // Count critical errors
      const criticalCount = (validation.errors || [])
        .filter(e => e.severity === 'CRITICAL').length;
      if (criticalCount > 0) {
        results.summary.totalWithCriticalErrors++;
      }
    }

    if ((validation.warnings || []).length > 0) {
      results.summary.totalWithWarnings++;
    }

    // Track quality grades
    const grade = validation.qualityGrade || 'F';
    results.summary.qualityGradeDistribution[grade] = 
      (results.summary.qualityGradeDistribution[grade] || 0) + 1;
    results.statistics.qualityGradeBreakdown[grade] = 
      (results.statistics.qualityGradeBreakdown[grade] || 0) + 1;

    // Track quality score
    if (validation.qualityScore !== undefined) {
      totalQualityScore += validation.qualityScore;
      questionsWithQualityGrade++;
    }

    // Track atom coverage
    if (validation.questionId) {
      const question = questions.find(q => q.id === validation.questionId);
      if (question && question.atom) {
        results.statistics.atomCoverage[question.atom] = 
          (results.statistics.atomCoverage[question.atom] || 0) + 1;
      }
    }

    // Track question types
    if (validation.questionId) {
      const question = questions.find(q => q.id === validation.questionId);
      if (question && question.type) {
        results.statistics.typeDistribution[question.type] = 
          (results.statistics.typeDistribution[question.type] || 0) + 1;
      }
    }
  }

  // Calculate average quality score
  if (questionsWithQualityGrade > 0) {
    results.statistics.averageQualityScore = 
      (totalQualityScore / questionsWithQualityGrade).toFixed(2);
  }

  // Check for duplicate question IDs across batch
  if (checkForDuplicates) {
    const duplicateIssues = checkForDuplicateIds(questions, results.questionResults);
    results.globalIssues.push(...duplicateIssues);
  }

  // Check for orphaned atoms (atoms not in curriculum)
  if (curriculum && curriculum.atoms) {
    const orphanedIssues = checkForOrphanedAtoms(questions, curriculum, results.questionResults);
    results.globalIssues.push(...orphanedIssues);
  }

  // Check for coverage gaps
  const coverageIssues = checkForCoverageGaps(results.statistics.atomCoverage);
  results.globalIssues.push(...coverageIssues);

  // Performance metrics
  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  results.performanceMetrics.endTime = endTime;
  results.performanceMetrics.totalDuration = totalDuration;
  results.performanceMetrics.averagePerQuestion = 
    (totalDuration / questions.length).toFixed(2);
  results.summary.validationTime = totalDuration;

  return results;
}

/**
 * Check for duplicate question IDs within the batch
 */
function checkForDuplicateIds(questions, validationResults) {
  const issues = [];
  const ids = new Map();

  questions.forEach((q, idx) => {
    if (!q.id) return;
    
    if (!ids.has(q.id)) {
      ids.set(q.id, []);
    }
    ids.get(q.id).push(idx);
  });

  // Find duplicates
  const duplicates = Array.from(ids.entries())
    .filter(([id, indices]) => indices.length > 1);

  if (duplicates.length > 0) {
    issues.push({
      severity: 'CRITICAL',
      code: 'DUPLICATE_QUESTION_IDS_IN_BATCH',
      message: `Found ${duplicates.length} duplicate question ID(s) in this batch`,
      duplicateIds: duplicates.map(([id, indices]) => ({
        id,
        count: indices.length,
        indices
      })),
      impact: 'These questions cannot be published simultaneously. Rename duplicates and retry.'
    });
  }

  return issues;
}

/**
 * Check for atoms not in curriculum
 */
function checkForOrphanedAtoms(questions, curriculum, validationResults) {
  const issues = [];
  const validAtoms = curriculum.atoms || [];
  const orphanedAtoms = new Set();

  questions.forEach(q => {
    if (q.atom && !validAtoms.includes(q.atom)) {
      orphanedAtoms.add(q.atom);
    }
  });

  if (orphanedAtoms.size > 0) {
    const affectedQuestions = questions
      .filter(q => orphanedAtoms.has(q.atom))
      .map(q => q.id);

    issues.push({
      severity: 'WARNING',
      code: 'ATOMS_NOT_IN_CURRICULUM',
      message: `Found ${orphanedAtoms.size} atom(s) not in curriculum`,
      orphanedAtoms: Array.from(orphanedAtoms),
      affectedQuestionCount: affectedQuestions.length,
      affectedQuestions: affectedQuestions.slice(0, 10), // Show first 10
      impact: 'These questions may not be properly categorized in reports.'
    });
  }

  return issues;
}

/**
 * Check for significant coverage gaps (atoms with no questions)
 */
function checkForCoverageGaps(atomCoverage) {
  const issues = [];
  const totalQuestions = Object.values(atomCoverage).reduce((a, b) => a + b, 0);
  const avgCoverage = totalQuestions / Object.keys(atomCoverage).length;
  const threshold = avgCoverage * 0.5; // Alert if atom has < 50% of average

  const lowCoverage = Object.entries(atomCoverage)
    .filter(([atom, count]) => count < threshold)
    .sort((a, b) => a[1] - b[1]);

  if (lowCoverage.length > 0) {
    issues.push({
      severity: 'INFO',
      code: 'COVERAGE_GAPS',
      message: `${lowCoverage.length} atom(s) have lower than average coverage`,
      lowCoverageAtoms: lowCoverage.map(([atom, count]) => ({
        atom,
        questionCount: count,
        averageCoverage: Math.round(avgCoverage)
      })),
      impact: 'Consider adding more questions for these topics to improve coverage.'
    });
  }

  return issues;
}

/**
 * Create empty report for no questions
 */
function createEmptyReport(sessionId) {
  return {
    sessionId,
    totalQuestions: 0,
    validatedAt: new Date().toISOString(),
    summary: {
      totalValid: 0,
      totalWithErrors: 0,
      totalWithWarnings: 0,
      totalWithCriticalErrors: 0,
      qualityGradeDistribution: {}
    },
    questionResults: [],
    globalIssues: [{
      severity: 'WARNING',
      code: 'NO_QUESTIONS_TO_VALIDATE',
      message: 'No questions provided for validation'
    }],
    statistics: {
      averageQualityScore: 0,
      qualityGradeBreakdown: {},
      atomCoverage: {},
      typeDistribution: {}
    }
  };
}

/**
 * Generate a human-readable validation report
 */
export function generateValidationReport(validationResults) {
  const { summary, statistics, globalIssues, performanceMetrics } = validationResults;

  const report = {
    title: 'Question Upload Validation Report',
    generatedAt: new Date().toISOString(),
    summary: {
      totalQuestions: validationResults.totalQuestions,
      validQuestions: summary.totalValid,
      questionsWithErrors: summary.totalWithErrors,
      questionsWithCriticalErrors: summary.totalWithCriticalErrors,
      questionsWithWarnings: summary.totalWithWarnings,
      validationPercentage: validationResults.totalQuestions > 0 
        ? Math.round((summary.totalValid / validationResults.totalQuestions) * 100)
        : 0
    },
    qualityMetrics: {
      averageQualityScore: statistics.averageQualityScore,
      gradeDistribution: statistics.qualityGradeBreakdown
    },
    coverage: {
      atomCount: Object.keys(statistics.atomCoverage).length,
      typeDistribution: statistics.typeDistribution,
      topAtoms: Object.entries(statistics.atomCoverage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([atom, count]) => ({ atom, count }))
    },
    globalIssues: globalIssues.filter(i => i.severity !== 'INFO'),
    infos: globalIssues.filter(i => i.severity === 'INFO'),
    performance: {
      totalDuration: `${performanceMetrics.totalDuration}ms`,
      averagePerQuestion: `${performanceMetrics.averagePerQuestion}ms`
    }
  };

  return report;
}

export default {
  validateBulkUpload,
  generateValidationReport
};
