/**
 * src/services/bulkUploadValidatorV2.js
 * =======================================
 * 
 * Validates multiple V2 format questions in bulk.
 * Orchestrates validation of questions from V2 JSON format (items array).
 * 
 * Features:
 * - Validates V2 items (item_id, template_id, etc.)
 * - Handles both items array and document format
 * - Parallel processing with configurable concurrency
 * - Duplicate item_id detection
 * - Template distribution analysis
 * - Performance metrics
 * - Detailed error reporting
 * 
 * Usage:
 * ------
 * const results = await validateBulkUploadV2(items, options);
 * if (results.summary.invalidItems > 0) {
 *   console.log('Issues found:', results.itemResults);
 * }
 */

import { validateQuestionV2 } from './questionValidatorV2.js';

// ============================================================================
// PARALLEL EXECUTION UTILITY
// ============================================================================

/**
 * Execute async tasks with limited concurrency
 */
async function executeWithConcurrency(tasks, maxParallel = 4, onProgress = null) {
  const results = [];
  const executing = new Set();
  let completed = 0;
  let inProgress = 0;
  const total = tasks.length;

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

    const promise = Promise.resolve(task())
      .then((result) => {
        results[taskIndex] = result;
        completed++;

        if (onProgress) {
          onProgress({
            completed,
            total,
            percentComplete: Math.round((completed / total) * 100)
          });
        }

        inProgress--;
        return executeNext();
      })
      .catch((error) => {
        results[taskIndex] = { error, failed: true };
        completed++;
        inProgress--;
        return executeNext();
      });

    executing.add(promise);
    promise.finally(() => executing.delete(promise));

    return executeNext();
  };

  const allTasks = Array.from(
    { length: Math.min(maxParallel, tasks.length) },
    () => executeNext()
  );
  await Promise.all(allTasks);

  return results;
}

// ============================================================================
// MAIN VALIDATION FUNCTION
// ============================================================================

/**
 * Validate multiple V2 format questions in bulk
 * @param {Array|Object} data - Array of items OR full V2 document
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Validation results
 */
export async function validateBulkUploadV2(data, options = {}) {
  const {
    sessionId = null,
    progressCallback = null,
    checkForDuplicates = true,
    maxParallel = 4,
    performanceMetrics = true
  } = options;

  const startTime = performance.now();

  // Extract items array
  let items = [];
  let documentMetadata = {};

  if (Array.isArray(data)) {
    items = data;
  } else if (data && typeof data === 'object' && data.items) {
    items = data.items;
    documentMetadata = {
      schemaVersion: data.schema_version,
      bankId: data.bank_id,
      documentType: data.document_type,
      generatedAt: data.generated_at,
      grade: data.grade,
      goal: data.goal,
      templatesIncluded: data.templates_included,
      countsByTemplate: data.counts_by_template
    };
  } else {
    return {
      sessionId,
      validatedAt: new Date().toISOString(),
      totalItems: 0,
      summary: {
        validItems: 0,
        invalidItems: 0,
        warnings: 0,
        skipped: 0
      },
      itemResults: [],
      globalIssues: [
        {
          severity: 'CRITICAL',
          code: 'INVALID_FORMAT',
          message: 'Data must be an array of items or an object with an items array'
        }
      ],
      documentMetadata,
      performanceMetrics: performanceMetrics ? { totalTimeMs: 0 } : null
    };
  }

  console.log(
    `[BulkValidatorV2] Starting validation of ${items.length} items`
  );

  const results = {
    sessionId,
    validatedAt: new Date().toISOString(),
    totalItems: items.length,
    summary: {
      validItems: 0,
      invalidItems: 0,
      withWarnings: 0,
      skipped: 0,
      qualityGradeDistribution: {
        A: 0,
        B: 0,
        C: 0,
        D: 0,
        F: 0
      },
      templateDistribution: {},
      errorCodeFrequency: {}
    },
    itemResults: [],
    globalIssues: [],
    coverage: {
      templates: {},
      modules: {},
      atoms: {}
    },
    documentMetadata,
    performanceMetrics: performanceMetrics
      ? {
          startTime,
          endTime: null,
          totalTimeMs: 0,
          averageTimePerItemMs: 0,
          itemsPerSecond: 0
        }
      : null
  };

  if (items.length === 0) {
    console.warn('[BulkValidatorV2] No items to validate');
    return results;
  }

  try {
    // Create validation tasks
    const validationTasks = items.map((item, index) => {
      return async () => {
        try {
          const validation = await validateQuestionV2(item);
          return {
            index,
            item,
            validation,
            failed: false
          };
        } catch (error) {
          console.error(`[BulkValidatorV2] Error validating item ${index}:`, error);
          return {
            index,
            item,
            validation: {
              itemId: item?.item_id || `UNKNOWN_${index}`,
              templateId: item?.template_id || 'UNKNOWN',
              isValid: false,
              errors: [
                {
                  severity: 'CRITICAL',
                  code: 'VALIDATION_ERROR',
                  message: error.message
                }
              ],
              warnings: [],
              qualityGrade: 'F'
            },
            failed: true,
            error
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
            total: progress.total,
            percentComplete: progress.percentComplete
          });
        }
      }
    );

    // Process results
    const itemIds = new Set();
    const duplicateIds = new Set();

    for (const result of validationResults) {
      if (!result || result.failed) {
        results.summary.skipped++;
        if (result?.error) {
          results.itemResults.push({
            itemId: result.item?.item_id || 'UNKNOWN',
            templateId: result.item?.template_id || 'UNKNOWN',
            isValid: false,
            errors: [
              {
                severity: 'CRITICAL',
                code: 'VALIDATION_ERROR',
                message: result.error.message
              }
            ],
            qualityGrade: 'F'
          });
        }
        continue;
      }

      const { validation, item } = result;
      results.itemResults.push(validation);

      // Check for duplicate item IDs
      if (item.item_id) {
        if (itemIds.has(item.item_id)) {
          duplicateIds.add(item.item_id);
        }
        itemIds.add(item.item_id);
      }

      // Update summary
      if (validation.isValid) {
        results.summary.validItems++;
      } else {
        results.summary.invalidItems++;
      }

      if (validation.warnings && validation.warnings.length > 0) {
        results.summary.withWarnings++;
      }

      // Track quality grades
      const grade = validation.qualityGrade || 'F';
      if (results.summary.qualityGradeDistribution[grade] !== undefined) {
        results.summary.qualityGradeDistribution[grade]++;
      }

      // Track template distribution
      const templateId = validation.templateId || 'UNKNOWN';
      results.summary.templateDistribution[templateId] =
        (results.summary.templateDistribution[templateId] || 0) + 1;
      results.coverage.templates[templateId] =
        (results.coverage.templates[templateId] || 0) + 1;

      // Track module and atom coverage
      if (item.module_id) {
        results.coverage.modules[item.module_id] =
          (results.coverage.modules[item.module_id] || 0) + 1;
      }
      if (item.atom_id) {
        results.coverage.atoms[item.atom_id] =
          (results.coverage.atoms[item.atom_id] || 0) + 1;
      }

      // Track error codes
      if (validation.errors) {
        for (const error of validation.errors) {
          const code = error.code || 'UNKNOWN';
          results.summary.errorCodeFrequency[code] =
            (results.summary.errorCodeFrequency[code] || 0) + 1;
        }
      }
    }

    // Report duplicate IDs
    if (checkForDuplicates && duplicateIds.size > 0) {
      results.globalIssues.push({
        severity: 'CRITICAL',
        code: 'DUPLICATE_ITEM_IDS',
        message: `Found ${duplicateIds.size} duplicate item IDs in this batch`,
        duplicateIds: Array.from(duplicateIds),
        totalDuplicates: itemIds.size - duplicateIds.size
      });
    }

    // Validate document metadata if present
    if (documentMetadata.templatesIncluded && documentMetadata.countsByTemplate) {
      const expectedCount = Object.values(documentMetadata.countsByTemplate).reduce(
        (sum, count) => sum + count,
        0
      );
      if (expectedCount !== items.length) {
        results.globalIssues.push({
          severity: 'WARNING',
          code: 'COUNT_MISMATCH',
          message: `Document specifies ${expectedCount} items but ${items.length} provided`,
          expected: expectedCount,
          actual: items.length
        });
      }
    }

    // Performance metrics
    if (performanceMetrics) {
      results.performanceMetrics.endTime = performance.now();
      results.performanceMetrics.totalTimeMs =
        results.performanceMetrics.endTime - startTime;
      results.performanceMetrics.averageTimePerItemMs =
        results.performanceMetrics.totalTimeMs / Math.max(1, items.length);
      results.performanceMetrics.itemsPerSecond =
        (items.length / results.performanceMetrics.totalTimeMs) * 1000;
    }

    console.log('[BulkValidatorV2] Validation complete:', {
      total: items.length,
      valid: results.summary.validItems,
      invalid: results.summary.invalidItems,
      withWarnings: results.summary.withWarnings,
      timeMs: results.performanceMetrics?.totalTimeMs || 'N/A'
    });
  } catch (error) {
    console.error('[BulkValidatorV2] Unexpected error:', error);
    results.globalIssues.push({
      severity: 'CRITICAL',
      code: 'BULK_VALIDATION_ERROR',
      message: `Unexpected error during bulk validation: ${error.message}`
    });
  }

  return results;
}

// ============================================================================
// REPORT GENERATION
// ============================================================================

/**
 * Generate human-readable validation report
 */
export function generateValidationReportV2(validationResults) {
  const {
    summary,
    globalIssues,
    coverage,
    itemResults,
    performanceMetrics,
    totalItems
  } = validationResults;

  const failedItems = itemResults
    .filter((r) => !r.isValid)
    .map((r) => ({
      itemId: r.itemId,
      templateId: r.templateId,
      errorCount: r.errors?.length || 0,
      errors: r.errors?.slice(0, 2).map((e) => `${e.code}: ${e.message}`) || []
    }))
    .slice(0, 20);

  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalItems,
      validItems: summary.validItems,
      invalidItems: summary.invalidItems,
      withWarnings: summary.withWarnings,
      skipped: summary.skipped,
      successRate: (
        (summary.validItems / Math.max(1, totalItems)) *
        100
      ).toFixed(1) + '%'
    },
    qualityDistribution: summary.qualityGradeDistribution,
    templateDistribution: summary.templateDistribution,
    coverage: {
      uniqueTemplates: Object.keys(coverage.templates).length,
      uniqueModules: Object.keys(coverage.modules).length,
      uniqueAtoms: Object.keys(coverage.atoms).length,
      distribution: {
        templates: coverage.templates,
        modules: coverage.modules,
        atoms: coverage.atoms
      }
    },
    commonErrors: Object.entries(summary.errorCodeFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([code, count]) => ({ code, count })),
    globalIssues: globalIssues.length > 0 ? globalIssues : null,
    failedItems: failedItems.length > 0 ? failedItems : null,
    performance: performanceMetrics || null
  };

  return report;
}

/**
 * Generate CSV export
 */
export function generateCSVReportV2(validationResults) {
  const { itemResults } = validationResults;

  const headers = [
    'Item ID',
    'Template ID',
    'Status',
    'Quality Grade',
    'Error Count',
    'Warning Count',
    'Primary Error',
    'Notes'
  ];

  const rows = itemResults.map((result) => [
    result.itemId || 'UNKNOWN',
    result.templateId || 'UNKNOWN',
    result.isValid ? 'VALID' : 'INVALID',
    result.qualityGrade || 'N/A',
    result.errors?.length || 0,
    result.warnings?.length || 0,
    result.errors?.[0]?.code || '',
    (result.warnings?.slice(0, 1).join('; ') || '').substring(0, 100)
  ]);

  const allRows = [headers, ...rows];
  const csv = allRows
    .map((row) =>
      row
        .map((cell) => {
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

export default {
  validateBulkUploadV2,
  generateValidationReportV2,
  generateCSVReportV2
};
