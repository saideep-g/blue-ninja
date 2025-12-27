/**
 * src/services/bulkUploadValidator.js
 * ===================================
 * 
 * Orchestrates validation of multiple questions in a bulk upload.
 * Handles parallel processing, duplicate detection, and report generation.
 * 
 * Features:
 * - Parallel validation with configurable concurrency
 * - Duplicate question ID detection
 * - Curriculum coverage analysis
 * - Performance metrics
 * - Detailed reports
 * 
 * Usage:
 * ------
 * const results = await validateBulkUpload(questions, {
 *   sessionId: 'session-123',
 *   maxParallel: 4,
 *   progressCallback: (progress) => console.log(progress.percentComplete)
 * });
 */

import { validateQuestion } from './questionValidator';

// ============================================================================
// PARALLEL PROCESSING UTILITIES
// ============================================================================

/**
 * Execute async functions with limited concurrency
 * @private
 * @param {Array} tasks - Array of async tasks/functions
 * @param {number} maxParallel - Maximum concurrent tasks
 * @param {Function} onProgress - Progress callback
 * @returns {Array} Results array
 */
async function executeWithConcurrency(tasks, maxParallel = 4, onProgress = null) {
  const results = [];
  const executing = new Set();
  let completed = 0;
  let inProgress = 0;

  const executeNext = async () => {
    if (tasks.length === 0 && executing.size === 0) {
      return;
    }

    if (inProgress >= maxParallel || tasks.length === 0) {
      return;
    }

    inProgress++;
    const taskIndex = tasks.length - 1;
    const task = tasks.pop();
    const promise = Promise.resolve(task()).then(
      (result) => {
        results[taskIndex] = result;
        completed++;

        if (onProgress) {
          onProgress({
            completed,
            total: results.length + tasks.length,
            percentComplete: Math.round((completed / (results.length + tasks.length)) * 100)
          });
        }

        inProgress--;
        return executeNext();
      },
      (error) => {
        results[taskIndex] = { error };
        completed++;
        inProgress--;
        return executeNext();
      }
    );

    executing.add(promise);
    promise.finally(() => executing.delete(promise));

    return executeNext();
  };

  const allTasks = Array.from({ length: Math.min(maxParallel, tasks.length) }, executeNext);
  await Promise.all(allTasks);

  return results;
}

// ============================================================================
// BULK VALIDATION ORCHESTRATION
// ============================================================================

/**
 * Validate multiple questions in bulk
 * @param {Array} questions - Array of question objects
 * @param {Object} options - Configuration options
 * @returns {Object} Validation results with statistics
 */
export async function validateBulkUpload(questions, options = {}) {
  const {
    sessionId = null,
    curriculum = null,
    progressCallback = null,
    checkForDuplicates = true,
    maxParallel = 4,
    performanceMetrics = true
  } = options;

  const startTime = performance.now();
  const totalQuestions = questions.length;

  console.log(`[BulkValidator] Starting validation of ${totalQuestions} questions`);
  console.log(`[BulkValidator] Max parallel: ${maxParallel}, Check duplicates: ${checkForDuplicates}`);

  const results = {
    sessionId,
    validatedAt: new Date().toISOString(),
    totalQuestions,
    summary: {
      totalValid: 0,
      totalWithErrors: 0,
      totalWithWarnings: 0,
      totalSkipped: 0,
      qualityGradeDistribution: {
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        F: 0
      },
      errorCodeFrequency: {}
    },
    questionResults: [],
    globalIssues: [],
    coverage: {},
    performanceMetrics: performanceMetrics ? {
      totalTimeMs: 0,
      averageTimePerQuestionMs: 0,
      questionsPerSecond: 0,
      startTime,
      endTime: null
    } : null
  };

  if (!questions || questions.length === 0) {
    console.warn('[BulkValidator] No questions to validate');
    if (performanceMetrics) {
      results.performanceMetrics.endTime = performance.now();
      results.performanceMetrics.totalTimeMs = results.performanceMetrics.endTime - startTime;
    }
    return results;
  }

  try {
    // Create validation tasks
    const validationTasks = questions.map((question, index) => {
      return async () => {
        try {
          const validation = await validateQuestion(question, curriculum);
          return {
            index,
            question,
            validation
          };
        } catch (error) {
          return {
            index,
            question,
            validation: {
              questionId: question?.id || `UNKNOWN_${index}`,
              isValid: false,
              errors: [{
                severity: 'CRITICAL',
                code: 'VALIDATION_ERROR',
                message: error.message
              }],
              warnings: []
            },
            validationError: error
          };
        }
      };
    });

    // Execute with concurrency control
    const validationResults = await executeWithConcurrency(
      validationTasks,
      maxParallel,
      (progress) => {
        if (progressCallback) {
          progressCallback({
            current: progress.completed,
            total: totalQuestions,
            percentComplete: progress.percentComplete
          });
        }
      }
    );

    // Process results
    for (const result of validationResults) {
      if (!result || result.validationError) {
        results.summary.totalSkipped++;
        continue;
      }

      const { validation, question } = result;
      results.questionResults.push(validation);

      // Update summary
      if (validation.isValid) {
        results.summary.totalValid++;
      } else {
        results.summary.totalWithErrors++;
      }

      if (validation.warnings && validation.warnings.length > 0) {
        results.summary.totalWithWarnings++;
      }

      // Track quality grades
      const grade = validation.qualityGrade || 'F';
      if (results.summary.qualityGradeDistribution[grade] !== undefined) {
        results.summary.qualityGradeDistribution[grade]++;
      }

      // Track error codes
      if (validation.errors) {
        for (const error of validation.errors) {
          if (error.code) {
            results.summary.errorCodeFrequency[error.code] =
              (results.summary.errorCodeFrequency[error.code] || 0) + 1;
          }
        }
      }

      // Coverage analysis
      const atom = question?.atom || 'UNKNOWN';
      results.coverage[atom] = (results.coverage[atom] || 0) + 1;
    }

    // Check for duplicate question IDs
    if (checkForDuplicates) {
      const questionIds = results.questionResults
        .map(r => r.questionId)
        .filter(id => id !== undefined && id !== null);

      const duplicateIds = questionIds.filter((id, idx) => questionIds.indexOf(id) !== idx);
      const uniqueDuplicates = [...new Set(duplicateIds)];

      if (uniqueDuplicates.length > 0) {
        results.globalIssues.push({
          severity: 'CRITICAL',
          code: 'DUPLICATE_QUESTION_IDS',
          message: `Found ${uniqueDuplicates.length} unique question ID(s) appearing multiple times in this batch`,
          duplicateIds: uniqueDuplicates,
          totalDuplicates: duplicateIds.length
        });
      }
    }

    // Check for missing atoms
    const missingAtoms = results.questionResults.filter(
      r => !r.questionId || !results.coverage[r.questionId]
    );
    if (missingAtoms.length > 0) {
      results.globalIssues.push({
        severity: 'WARNING',
        code: 'MISSING_ATOM_MAPPING',
        message: `${missingAtoms.length} question(s) have no atom mapping`,
        count: missingAtoms.length
      });
    }

    // Performance metrics
    if (performanceMetrics) {
      results.performanceMetrics.endTime = performance.now();
      results.performanceMetrics.totalTimeMs = results.performanceMetrics.endTime - startTime;
      results.performanceMetrics.averageTimePerQuestionMs =
        results.performanceMetrics.totalTimeMs / Math.max(1, totalQuestions);
      results.performanceMetrics.questionsPerSecond = 
        (totalQuestions / results.performanceMetrics.totalTimeMs) * 1000;
    }

    console.log(`[BulkValidator] Validation complete:`, {
      total: totalQuestions,
      valid: results.summary.totalValid,
      errors: results.summary.totalWithErrors,
      warnings: results.summary.totalWithWarnings,
      timeMs: results.performanceMetrics?.totalTimeMs || 'N/A'
    });
  } catch (error) {
    console.error('[BulkValidator] Bulk validation failed:', error);
    results.globalIssues.push({
      severity: 'ERROR',
      code: 'BULK_VALIDATION_ERROR',
      message: `Unexpected error during bulk validation: ${error.message}`,
      error: error.toString()
    });
  }

  return results;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate human-readable validation report
 * @param {Object} validationResults - Results from validateBulkUpload
 * @returns {Object} Formatted report
 */
export function generateValidationReport(validationResults) {
  const { summary, globalIssues, coverage, questionResults, performanceMetrics } = validationResults;

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalQuestions: validationResults.totalQuestions,
      passedValidation: summary.totalValid,
      failedValidation: summary.totalWithErrors,
      skipped: summary.totalSkipped,
      withWarnings: summary.totalWithWarnings,
      successRate: ((summary.totalValid / validationResults.totalQuestions) * 100).toFixed(1) + '%'
    },
    qualityDistribution: summary.qualityGradeDistribution,
    commonErrors: Object.entries(summary.errorCodeFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, count]) => ({ code, count })),
    coverage: {
      uniqueAtoms: Object.keys(coverage).length,
      distribution: coverage
    },
    globalIssues: globalIssues.length > 0 ? globalIssues : null,
    performance: performanceMetrics || null,
    failedQuestions: questionResults
      .filter(r => !r.isValid)
      .map(r => ({
        id: r.questionId,
        errorCount: r.errors?.length || 0,
        errors: r.errors?.slice(0, 3).map(e => `${e.code}: ${e.message}`) || []
      }))
      .slice(0, 20)
  };

  return report;
}

/**
 * Generate CSV export of validation results
 * @param {Object} validationResults - Results from validateBulkUpload
 * @returns {String} CSV formatted data
 */
export function generateCSVReport(validationResults) {
  const { questionResults } = validationResults;

  // CSV header
  const headers = [
    'Question ID',
    'Status',
    'Quality Grade',
    'Error Count',
    'Warning Count',
    'Primary Error',
    'Suggestions'
  ];

  // CSV rows
  const rows = questionResults.map(result => [
    result.questionId || 'UNKNOWN',
    result.isValid ? 'VALID' : 'INVALID',
    result.qualityGrade || 'N/A',
    result.errors?.length || 0,
    result.warnings?.length || 0,
    result.errors?.[0]?.code || '',
    (result.suggestions?.map(s => s.message).join('; ') || '').substring(0, 100)
  ]);

  // Combine and escape
  const allRows = [headers, ...rows];
  const csv = allRows
    .map(row =>
      row
        .map(cell => {
          const str = String(cell || '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');

  return csv;
}

// ============================================================================
// AUTO-FIX SUGGESTIONS
// ============================================================================

/**
 * Generate auto-fix suggestions for common errors
 * @param {Object} validationResult - Single question validation result
 * @param {Object} question - Original question object
 * @returns {Array} Array of suggested fixes
 */
export function getAutoFixSuggestions(validationResult, question) {
  const suggestions = [];

  const errorCodes = validationResult.errors?.map(e => e.code) || [];

  // Duplicate options fix
  if (errorCodes.includes('DUPLICATE_OPTIONS')) {
    suggestions.push({
      code: 'REMOVE_DUPLICATES',
      description: 'Remove duplicate options',
      action: () => {
        const unique = [...new Map(
          question.options.map(o => [
            (typeof o === 'string' ? o : o.text).toLowerCase(),
            o
          ])
        ).values()];
        return { ...question, options: unique };
      }
    });
  }

  // Empty options fix
  if (errorCodes.includes('EMPTY_OPTION')) {
    suggestions.push({
      code: 'REMOVE_EMPTY_OPTIONS',
      description: 'Remove empty options',
      action: () => ({
        ...question,
        options: question.options.filter(
          o => (typeof o === 'string' ? o : o?.text || '').trim().length > 0
        )
      })
    });
  }

  // Missing diagnostic tags fix
  if (errorCodes.includes('MISSING_DIAGNOSTIC_TAGS')) {
    suggestions.push({
      code: 'ADD_DEFAULT_TAG',
      description: 'Add default diagnostic tag',
      action: () => ({
        ...question,
        diagnosticTags: question.diagnosticTags || ['GENERAL_KNOWLEDGE']
      })
    });
  }

  // Missing difficulty fix
  if (validationResult.suggestions?.some(s => s.code === 'MISSING_DIFFICULTY')) {
    suggestions.push({
      code: 'SET_DIFFICULTY_MEDIUM',
      description: 'Set difficulty to MEDIUM',
      action: () => ({ ...question, difficulty: 'MEDIUM' })
    });
  }

  return suggestions;
}

export default {
  validateBulkUpload,
  generateValidationReport,
  generateCSVReport,
  getAutoFixSuggestions
};
