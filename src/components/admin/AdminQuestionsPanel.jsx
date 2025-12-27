/**
 * src/components/admin/AdminQuestionsPanel.jsx
 * ============================================
 * Admin interface for managing bulk question uploads.
 * 
 * UPDATED FOR V2 FORMAT:
 * - Accepts V2 JSON format (items array with item_id, template_id, etc.)
 * - Validates using new questionValidatorV2.js
 * - Publishes to Firestore using firestoreQuestionService.js
 * - Supports 14 template types
 * - Handles both old and new formats (auto-detection)
 * 
 * Features: file upload, real-time validation, interactive review, batch publishing
 * Production-ready with comprehensive state management and error handling
 */

import React, { useState, useCallback, useEffect } from 'react';
import { validateBulkUploadV2 } from '../../services/bulkUploadValidatorV2.js';
import { publishQuestionsToFirestore } from '../../services/firestoreQuestionService.js';
import { useIndexedDB } from '../../hooks/useIndexedDB.js';
import FileUploadZone from './FileUploadZone.jsx';
import ValidationReportPanel from './ValidationReportPanel.jsx';
import QuestionReviewer from './QuestionReviewer.jsx';
import PublishSummary from './PublishSummary.jsx';
import {
  Upload,
  CheckCircle,
  AlertCircle,
  FileJson,
  Loader,
  Download
} from 'lucide-react';

const UPLOAD_STEPS = {
  UPLOAD: 'UPLOAD',
  VALIDATING: 'VALIDATING',
  REVIEW: 'REVIEW',
  PUBLISHING: 'PUBLISHING',
  COMPLETED: 'COMPLETED'
};

export default function AdminQuestionsPanel() {
  // Current step in workflow
  const [step, setStep] = useState(UPLOAD_STEPS.UPLOAD);
  const [sessionId, setSessionId] = useState(null);

  // Data state
  const [questions, setQuestions] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [publishResults, setPublishResults] = useState(null);

  // UI state
  const [isValidating, setIsValidating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState(new Set());
  const [validationProgress, setValidationProgress] = useState(0);
  const [publishProgress, setPublishProgress] = useState(0);
  const [formatDetected, setFormatDetected] = useState(null); // 'V2' or 'LEGACY'
  const [bankId, setBankId] = useState('cbse7_mathquest_gold_questions_v1');

  // Database hook
  const db = useIndexedDB();

  /**
   * Handle file upload and format detection
   */
  const handleFileUpload = useCallback(
    async (file) => {
      try {
        setError(null);
        setStep(UPLOAD_STEPS.VALIDATING);

        const newSessionId = window.crypto.randomUUID();
        setSessionId(newSessionId);

        // Parse JSON file
        const text = await file.text();
        let parsedData;

        try {
          parsedData = JSON.parse(text);
        } catch (parseError) {
          throw new Error(`Invalid JSON: ${parseError.message}`);
        }

        // ================================================================
        // FORMAT DETECTION
        // ================================================================

        let items = [];
        let detectedFormat = 'UNKNOWN';

        // Check for V2 format (has schema_version and items)
        if (
          parsedData.schema_version &&
          parsedData.document_type === 'mathquest_gold_standard_questions'
        ) {
          detectedFormat = 'V2';
          if (Array.isArray(parsedData.items)) {
            items = parsedData.items;
          } else {
            throw new Error(
              'V2 format detected but no items array found'
            );
          }
        }
        // Check for V2 items array directly
        else if (Array.isArray(parsedData)) {
          // Check if it looks like V2 format items
          if (
            parsedData.length > 0 &&
            parsedData[0].item_id &&
            parsedData[0].template_id
          ) {
            detectedFormat = 'V2';
            items = parsedData;
          } else {
            throw new Error(
              'Unknown format: items appear to be legacy format. Please use V2 format with item_id and template_id fields.'
            );
          }
        }
        // Check for legacy format with questions property
        else if (
          parsedData.questions &&
          Array.isArray(parsedData.questions)
        ) {
          throw new Error(
            'Legacy format detected. Please convert to V2 format with items array containing item_id, template_id, etc.'
          );
        } else {
          throw new Error(
            'Unrecognized format. Expected: V2 format with items array or V2 document with schema_version.'
          );
        }

        if (items.length === 0) {
          throw new Error('No items found in file');
        }

        setFormatDetected(detectedFormat);
        setQuestions(items);
        setSelectedQuestionIds(new Set(items.map((q, idx) => q.item_id || idx)));

        // Create session in IndexedDB
        try {
          await db.createSession(newSessionId, {
            fileName: file.name,
            fileSize: file.size,
            totalQuestions: items.length,
            format: detectedFormat,
            adminId: 'current-admin',
            adminEmail: 'admin@example.com',
            uploadedAt: Date.now()
          });
        } catch (dbError) {
          console.warn('Failed to store session in IndexedDB:', dbError);
        }

        // Store each item in IndexedDB
        for (const item of items) {
          try {
            await db.addPendingQuestion(item.item_id || item.id, {
              sessionId: newSessionId,
              originalData: item,
              editedData: null,
              status: 'VALIDATING',
              format: detectedFormat
            });
          } catch (dbError) {
            console.warn(
              `Failed to store item ${item.item_id}:`,
              dbError
            );
          }
        }

        // Move to validation step
        setStep(UPLOAD_STEPS.REVIEW);
        setSuccessMessage(
          `✅ Loaded ${items.length} items in ${detectedFormat} format. Starting validation...`
        );

        // Start validation automatically
        setTimeout(() => handleValidate(items), 500);
      } catch (err) {
        setError(err.message || 'Failed to upload file');
        setStep(UPLOAD_STEPS.UPLOAD);
      }
    },
    [db]
  );

  /**
   * Handle validation
   */
  const handleValidate = useCallback(
    async (questionsToValidate = questions) => {
      if (questionsToValidate.length === 0) {
        setError('No questions to validate');
        return;
      }

      try {
        setIsValidating(true);
        setError(null);
        setValidationProgress(0);

        // Run bulk validation V2
        const results = await validateBulkUploadV2(questionsToValidate, {
          sessionId,
          progressCallback: (progress) => {
            setValidationProgress(progress.percentComplete);
          },
          checkForDuplicates: true,
          maxParallel: 4
        });

        setValidationResults(results);

        // Update session with validation results
        if (sessionId) {
          try {
            await db.updateSession(sessionId, {
              itemsProcessed: results.itemResults.length,
              itemsWithErrors: results.summary.invalidItems,
              itemsValidated: results.summary.validItems
            });
          } catch (dbError) {
            console.warn('Failed to update session:', dbError);
          }
        }

        // Update each item's validation result
        for (const result of results.itemResults) {
          try {
            await db.updatePendingQuestion(result.itemId, {
              validationResult: result,
              status: result.isValid ? 'READY_TO_PUBLISH' : 'NEEDS_REVIEW',
              errors: result.errors,
              warnings: result.warnings,
              qualityGrade: result.qualityGrade
            });
          } catch (dbError) {
            console.warn(`Failed to update item ${result.itemId}:`, dbError);
          }
        }

        const successCount = results.summary.validItems;
        const errorCount = results.summary.invalidItems;
        setSuccessMessage(
          `Validation complete: ${successCount} valid, ${errorCount} with errors`
        );
      } catch (err) {
        setError(`Validation failed: ${err.message}`);
      } finally {
        setIsValidating(false);
        setValidationProgress(0);
      }
    },
    [questions, sessionId, db]
  );

  /**
   * Handle publishing questions to Firestore
   */
  const handlePublish = useCallback(
    async (selectedIds = null) => {
      if (!validationResults) {
        setError('No validation results. Please validate first.');
        return;
      }

      try {
        setIsPublishing(true);
        setError(null);
        setPublishProgress(0);

        // Determine which questions to publish
        const idsToPublish = selectedIds || selectedQuestionIds;
        const questionsToPublish = questions.filter((q) =>
          idsToPublish.has(q.item_id || q.id)
        );

        // Filter for only valid questions
        const validQuestions = questionsToPublish.filter((q) => {
          const result = validationResults.itemResults.find(
            (r) => r.itemId === q.item_id || r.itemId === q.id
          );
          return result && result.isValid;
        });

        if (validQuestions.length === 0) {
          setError('No valid questions to publish');
          setIsPublishing(false);
          return;
        }

        setStep(UPLOAD_STEPS.PUBLISHING);

        // Publish to Firestore
        const firebaseResults = await publishQuestionsToFirestore(validQuestions, {
          bankId,
          userId: 'admin-user',
          batchSize: 500,
          onProgress: (progress) => {
            setPublishProgress(Math.round((progress.itemsProcessed / progress.totalItems) * 100));
          },
          conflictResolution: 'SKIP'
        });

        // Combine validation and publish results
        setPublishResults({
          validationSummary: validationResults.summary,
          firebaseSummary: firebaseResults,
          totalItems: questionsToPublish.length,
          validItems: validQuestions.length,
          publishedCount: firebaseResults.totalPublished,
          failedCount: firebaseResults.totalFailed,
          skippedCount: firebaseResults.totalSkipped,
          timestamp: new Date().toISOString()
        });

        // Update session
        if (sessionId) {
          await db.closeSession(sessionId);
          await db.updateSession(sessionId, {
            itemsPublished: firebaseResults.totalPublished,
            itemsPublishFailed: firebaseResults.totalFailed,
            status: 'COMPLETED'
          });
        }

        setStep(UPLOAD_STEPS.COMPLETED);
        setSuccessMessage(
          `✅ Successfully published ${firebaseResults.totalPublished} items to Firestore!`
        );
      } catch (err) {
        setError(`Publishing failed: ${err.message}`);
        setStep(UPLOAD_STEPS.REVIEW);
      } finally {
        setIsPublishing(false);
        setPublishProgress(0);
      }
    },
    [questions, validationResults, selectedQuestionIds, sessionId, db, bankId]
  );

  /**
   * Download summary report as CSV
   */
  const downloadSummaryReport = () => {
    if (!publishResults) return;

    const csv = generateSummaryCSV(publishResults);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `question-publish-summary-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  /**
   * Reset workflow
   */
  const handleReset = useCallback(() => {
    setStep(UPLOAD_STEPS.UPLOAD);
    setSessionId(null);
    setQuestions([]);
    setValidationResults(null);
    setPublishResults(null);
    setError(null);
    setSuccessMessage(null);
    setSelectedQuestionIds(new Set());
    setValidationProgress(0);
    setPublishProgress(0);
    setFormatDetected(null);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileJson className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-slate-900">
            Admin Question Upload
          </h1>
          {formatDetected && (
            <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
              {formatDetected}
            </span>
          )}
        </div>
        <p className="text-slate-600">
          Upload, validate, review, and publish bulk questions to Firestore (V2 format)
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Error</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-green-900">Success</h3>
            <p className="text-green-700 text-sm">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Step Indicators */}
      <div className="mb-8 flex items-center gap-2 text-sm">
        <div
          className={`px-3 py-1 rounded-full ${
            [UPLOAD_STEPS.UPLOAD, UPLOAD_STEPS.VALIDATING, UPLOAD_STEPS.REVIEW, UPLOAD_STEPS.PUBLISHING, UPLOAD_STEPS.COMPLETED].indexOf(
              step
            ) >= 0
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          1. Upload
        </div>
        <div
          className={`w-8 h-0.5 ${
            [UPLOAD_STEPS.VALIDATING, UPLOAD_STEPS.REVIEW, UPLOAD_STEPS.PUBLISHING, UPLOAD_STEPS.COMPLETED].indexOf(
              step
            ) >= 0
              ? 'bg-blue-600'
              : 'bg-slate-200'
          }`}
        />
        <div
          className={`px-3 py-1 rounded-full ${
            [UPLOAD_STEPS.VALIDATING, UPLOAD_STEPS.REVIEW, UPLOAD_STEPS.PUBLISHING, UPLOAD_STEPS.COMPLETED].indexOf(
              step
            ) >= 0
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          2. Review
        </div>
        <div
          className={`w-8 h-0.5 ${
            [UPLOAD_STEPS.PUBLISHING, UPLOAD_STEPS.COMPLETED].indexOf(step) >= 0
              ? 'bg-blue-600'
              : 'bg-slate-200'
          }`}
        />
        <div
          className={`px-3 py-1 rounded-full ${
            [UPLOAD_STEPS.PUBLISHING, UPLOAD_STEPS.COMPLETED].indexOf(step) >= 0
              ? 'bg-blue-600 text-white'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          3. Publish
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lg">
        {step === UPLOAD_STEPS.UPLOAD && (
          <FileUploadZone onUpload={handleFileUpload} />
        )}

        {step === UPLOAD_STEPS.VALIDATING && (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader className="w-12 h-12 text-blue-600 animate-spin" />
              <h2 className="text-xl font-semibold text-slate-900">
                Validating V2 Questions
              </h2>
              <div className="w-full max-w-md">
                <div className="bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300"
                    style={{ width: `${validationProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-slate-600 mt-2">
                  {validationProgress}%
                </p>
              </div>
            </div>
          </div>
        )}

        {step === UPLOAD_STEPS.REVIEW && validationResults && (
          <div className="space-y-6 p-8">
            <ValidationReportPanel results={validationResults} />
            <QuestionReviewer
              questions={questions}
              validationResults={validationResults}
              selectedQuestionIds={selectedQuestionIds}
              onSelectionChange={setSelectedQuestionIds}
            />
            <div className="flex gap-3 pt-6 border-t border-slate-200">
              <button
                onClick={handleReset}
                className="px-6 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
              >
                Start Over
              </button>
              <button
                onClick={() => handleValidate()}
                className="px-6 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition"
              >
                Re-validate
              </button>
              <button
                onClick={() => handlePublish()}
                disabled={isPublishing || validationResults.summary.invalidItems > 0}
                className="ml-auto px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 rounded-lg font-medium transition"
              >
                {isPublishing ? 'Publishing...' : 'Publish to Firestore'}
              </button>
            </div>
          </div>
        )}

        {step === UPLOAD_STEPS.PUBLISHING && (
          <div className="p-8">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader className="w-12 h-12 text-green-600 animate-spin" />
              <h2 className="text-xl font-semibold text-slate-900">
                Publishing to Firestore
              </h2>
              <div className="w-full max-w-md">
                <div className="bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-green-600 h-full transition-all duration-300"
                    style={{ width: `${publishProgress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-slate-600 mt-2">
                  {publishProgress}% - Uploading to database...
                </p>
              </div>
            </div>
          </div>
        )}

        {step === UPLOAD_STEPS.COMPLETED && publishResults && (
          <div className="p-8">
            <PublishSummary
              sessionId={sessionId}
              publishResults={publishResults}
              onStartOver={handleReset}
            />

            {/* Comprehensive Summary Report */}
            <div className="mt-8 bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-4">📊 Publish Summary Report</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600">Total Attempted</p>
                  <p className="text-2xl font-bold text-slate-900">{publishResults.totalItems}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600">Valid</p>
                  <p className="text-2xl font-bold text-blue-600">{publishResults.validItems}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200 bg-green-50">
                  <p className="text-sm text-slate-600">Published ✓</p>
                  <p className="text-2xl font-bold text-green-600">{publishResults.publishedCount}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-200 bg-red-50">
                  <p className="text-sm text-slate-600">Failed ✗</p>
                  <p className="text-2xl font-bold text-red-600">{publishResults.failedCount}</p>
                </div>
              </div>

              {/* Validation Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Validation Result</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span>Valid:</span> <strong>{publishResults.validationSummary.validItems}</strong></p>
                    <p className="flex justify-between"><span>Invalid:</span> <strong>{publishResults.validationSummary.invalidItems}</strong></p>
                    <p className="flex justify-between"><span>With Warnings:</span> <strong>{publishResults.validationSummary.withWarnings || 0}</strong></p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Firestore Result</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex justify-between"><span>Published:</span> <strong className="text-green-600">{publishResults.publishedCount}</strong></p>
                    <p className="flex justify-between"><span>Failed:</span> <strong className="text-red-600">{publishResults.failedCount}</strong></p>
                    <p className="flex justify-between"><span>Skipped:</span> <strong className="text-amber-600">{publishResults.skippedCount || 0}</strong></p>
                  </div>
                </div>
              </div>

              {/* Quality Distribution */}
              {publishResults.firebaseSummary.stats && (
                <div className="mb-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Questions by Template</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-sm">
                    {Object.entries(publishResults.firebaseSummary.stats.byTemplate || {})
                      .sort((a, b) => b[1] - a[1])
                      .map(([template, count]) => (
                        <div key={template} className="bg-white rounded p-2 border border-slate-200 text-center">
                          <p className="text-xs text-slate-600">{template}</p>
                          <p className="text-lg font-bold text-blue-600">{count}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Download Report Button */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={downloadSummaryReport}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-medium transition"
                >
                  <Download className="w-4 h-4" />
                  Download Report as CSV
                </button>
                <button
                  onClick={handleReset}
                  className="ml-auto px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-lg font-medium transition"
                >
                  Upload More
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Help */}
      {step === UPLOAD_STEPS.UPLOAD && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              V2 Format Requirements
            </h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• item_id, template_id, prompt</li>
              <li>• interaction config, answer_key</li>
              <li>• 14 template types supported</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-900 mb-2">
              Supported Templates
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• MCQ_CONCEPT, NUMERIC_INPUT</li>
              <li>• TWO_TIER, ERROR_ANALYSIS</li>
              <li>• WORKED_EXAMPLE_COMPLETE, + 9 more</li>
            </ul>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-2">
              Validation Steps
            </h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>✓ Schema validation</li>
              <li>✓ Duplicate detection</li>
              <li>✓ Firestore publishing</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Generate CSV summary report
 */
function generateSummaryCSV(publishResults) {
  const lines = [
    ['Question Upload Summary Report'],
    ['Timestamp', publishResults.timestamp],
    [],
    ['OVERVIEW'],
    ['Metric', 'Count'],
    ['Total Attempted', publishResults.totalItems],
    ['Total Valid', publishResults.validItems],
    ['Successfully Published', publishResults.publishedCount],
    ['Failed to Publish', publishResults.failedCount],
    ['Skipped (Duplicates)', publishResults.skippedCount || 0],
    [],
    ['VALIDATION RESULTS'],
    ['Metric', 'Count'],
    ['Valid Items', publishResults.validationSummary.validItems],
    ['Invalid Items', publishResults.validationSummary.invalidItems],
    ['Items with Warnings', publishResults.validationSummary.withWarnings || 0],
    [],
    ['TEMPLATES PUBLISHED']
  ];

  if (publishResults.firebaseSummary?.stats?.byTemplate) {
    lines.push(['Template', 'Count']);
    Object.entries(publishResults.firebaseSummary.stats.byTemplate)
      .sort((a, b) => b[1] - a[1])
      .forEach(([template, count]) => {
        lines.push([template, count]);
      });
  }

  return lines.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
}
