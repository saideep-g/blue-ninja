/**
 * src/components/admin/PublishSummary.jsx
 * Displays completion status and summary after publishing questions
 */

import React from 'react';
import { CheckCircle, DownloadCloud, RotateCcw } from 'lucide-react';

const PublishSummary = ({ sessionId, publishResults, onStartOver }) => {
  const { totalPublished, totalRequested, failedCount } = publishResults;
  const successPercentage = totalRequested > 0
    ? Math.round((totalPublished / totalRequested) * 100)
    : 0;

  return (
    <div className="p-12 text-center space-y-8">
      {/* Success Icon */}
      <div className="flex justify-center">
        <div className="bg-green-100 rounded-full p-6">
          <CheckCircle className="w-16 h-16 text-green-600" />
        </div>
      </div>

      {/* Title */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Upload Complete!</h2>
        <p className="text-slate-600 text-lg">
          Your questions have been successfully validated and published
        </p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <div className="text-4xl font-bold text-green-600 mb-2">{totalPublished}</div>
          <p className="text-slate-700 font-medium">Questions Published</p>
          <p className="text-sm text-slate-600 mt-1">Out of {totalRequested}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <div className="text-4xl font-bold text-blue-600 mb-2">{successPercentage}%</div>
          <p className="text-slate-700 font-medium">Success Rate</p>
          <p className="text-sm text-slate-600 mt-1">All systems go</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <div className="text-4xl font-bold text-purple-600 mb-2">{sessionId.slice(0, 8)}...</div>
          <p className="text-slate-700 font-medium">Session ID</p>
          <p className="text-sm text-slate-600 mt-1">For reference</p>
        </div>
      </div>

      {/* Status Details */}
      <div className="max-w-2xl mx-auto space-y-4">
        {failedCount > 0 && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-900 font-semibold">
              {failedCount} question{failedCount !== 1 ? 's' : ''} could not be published
            </p>
            <p className="text-yellow-800 text-sm mt-1">
              Please review and retry
            </p>
          </div>
        )}

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-900 text-sm">
            <span className="font-semibold">Published at:</span> {new Date().toLocaleString()}
          </p>
          <p className="text-blue-900 text-sm mt-1">
            <span className="font-semibold">Session:</span> {sessionId}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-2xl mx-auto">
        <button
          onClick={onStartOver}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          <RotateCcw className="w-5 h-5" />
          Upload More Questions
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition"
          disabled
        >
          <DownloadCloud className="w-5 h-5" />
          Download Report
        </button>
      </div>

      {/* Next Steps */}
      <div className="max-w-2xl mx-auto p-6 bg-slate-50 rounded-lg border border-slate-200">
        <h3 className="font-semibold text-slate-900 mb-3">Next Steps</h3>
        <ol className="text-left space-y-2 text-slate-700 text-sm">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">1</span>
            <span>Questions are now available in the curriculum database</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">2</span>
            <span>They will appear in student assessments within 5 minutes</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">3</span>
            <span>You can view analytics and performance metrics in the dashboard</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-xs">4</span>
            <span>Edit or update questions anytime from the question management page</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default PublishSummary;
