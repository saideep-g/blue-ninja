/**
 * src/components/admin/ValidationReportPanel.jsx
 * Displays validation results with comprehensive statistics and insights
 */

import React, { useState } from 'react';
import {
  BarChart3,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const ValidationReportPanel = ({ results }) => {
  const [expandedIssue, setExpandedIssue] = useState(null);

  if (!results) {
    return null;
  }

  /**
   * FIX: Destructuring mismatch
   * The validator service returns 'coverage' and 'summary' (which contains quality distribution).
   * 'statistics' was undefined in the original code, causing the crash.
   */
  const { summary, coverage, globalIssues, performanceMetrics } = results;

  const validPercentage = results.totalItems > 0
    ? Math.round((summary.validItems / results.totalItems) * 100)
    : 0;

  const getGradeColor = (grade) => {
    const colors = {
      A: 'bg-green-100 text-green-800 border-green-300',
      B: 'bg-blue-100 text-blue-800 border-blue-300',
      C: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      D: 'bg-orange-100 text-orange-800 border-orange-300',
      F: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[grade] || colors.F;
  };

  /**
   * FIX: Calculate Quality Score
   * Since the service doesn't provide a pre-calculated average, we compute it 
   * here based on the grade distribution (A=4, B=3, C=2, D=1, F=0).
   */
  const calculateAverageQuality = () => {
    const dist = summary.qualityGradeDistribution || {};
    const total = results.totalItems || 1;
    const score = (dist.A || 0) * 4 + (dist.B || 0) * 3 + (dist.C || 0) * 2 + (dist.D || 0) * 1;
    return (score / total).toFixed(2);
  };

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Validation Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm text-slate-300 mb-1">Total Questions</p>
            <p className="text-3xl font-bold">{results.totalItems}</p>
          </div>

          <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
            <p className="text-sm text-slate-300 mb-1">Valid</p>
            <p className="text-3xl font-bold">
              {summary.validItems}
              <span className="text-lg ml-2">({validPercentage}%)</span>
            </p>
          </div>

          <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30">
            <p className="text-sm text-slate-300 mb-1">Needs Review</p>
            <p className="text-3xl font-bold">
              {summary.invalidItems}
              <span className="text-lg ml-2">({summary.invalidItems} critical)</span>
            </p>
          </div>

          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
            <p className="text-sm text-slate-300 mb-1">Warnings</p>
            <p className="text-3xl font-bold">{summary.withWarnings || 0}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Validation Progress</p>
            <p className="text-sm text-slate-300">{validPercentage}% Complete</p>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
              style={{ width: `${validPercentage}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Quality Grades
          </h3>
          <div className="space-y-2">
            {/* FIX: Properly map qualityGradeDistribution object */}
            {Object.entries(summary.qualityGradeDistribution || {}).map(([grade, count]) => (
              <div key={grade} className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded font-semibold text-sm border ${getGradeColor(grade)}`}>
                  {grade}
                </span>
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${(count / results.totalItems) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-slate-600 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Average Quality Score:</span> {calculateAverageQuality()}
            </p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-purple-600" />
            Coverage Statistics
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 mb-1">Templates Covered</p>
              <p className="text-2xl font-bold text-slate-900">
                {/* FIX: Safely count templates */}
                {Object.keys(coverage?.templates || {}).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Top Templates by Questions</p>
              <div className="space-y-1">
                {/* FIX: Properly map and sort templates */}
                {Object.entries(coverage?.templates || {})
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([template, count]) => (
                    <div key={template} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700 truncate">{template}</span>
                      <span className="font-semibold text-slate-900 ml-2">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Question Types Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {/* FIX: Properly map templateDistribution object */}
          {Object.entries(summary.templateDistribution || {}).map(([type, count]) => (
            <div key={type} className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600 mb-1">{count}</p>
              <p className="text-xs text-slate-600 break-words" title={type}>
                {type.length > 12 ? type.substring(0, 12) + '...' : type}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Module and Atom Coverage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Module Coverage</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(coverage?.modules || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([module, count]) => (
                <div key={module} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 truncate">{module}</span>
                  <span className="font-semibold text-slate-900 ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {count}
                  </span>
                </div>
              ))}
          </div>
          {Object.keys(coverage?.modules || {}).length > 10 && (
            <p className="text-xs text-slate-500 mt-2">
              +{Object.keys(coverage?.modules || {}).length - 10} more modules
            </p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Atom Coverage</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(coverage?.atoms || {})
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([atom, count]) => (
                <div key={atom} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 truncate">{atom}</span>
                  <span className="font-semibold text-slate-900 ml-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                    {count}
                  </span>
                </div>
              ))}
          </div>
          {Object.keys(coverage?.atoms || {}).length > 10 && (
            <p className="text-xs text-slate-500 mt-2">
              +{Object.keys(coverage?.atoms || {}).length - 10} more atoms
            </p>
          )}
        </div>
      </div>

      {globalIssues && globalIssues.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Issues & Warnings ({globalIssues.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-200">
            {globalIssues.map((issue, idx) => (
              <div key={idx} className="p-4">
                <button
                  onClick={() => setExpandedIssue(expandedIssue === idx ? null : idx)}
                  className="w-full flex items-start justify-between gap-3 hover:bg-slate-50 p-2 -m-2"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {issue.severity === 'CRITICAL' ? (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    ) : issue.severity === 'WARNING' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="text-left">
                      <p className="font-medium text-slate-900">{issue.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{issue.code}</p>
                    </div>
                  </div>
                  {expandedIssue === idx ? (
                    <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {expandedIssue === idx && (
                  <div className="mt-4 ml-8 p-4 bg-slate-50 rounded text-sm text-slate-700">
                    {issue.impact && (
                      <p className="mb-2">
                        <span className="font-semibold">Impact:</span> {issue.impact}
                      </p>
                    )}
                    {issue.duplicateIds && issue.duplicateIds.length > 0 && (
                      <p className="mb-2">
                        <span className="font-semibold">Duplicates:</span> {issue.duplicateIds.slice(0, 5).join(', ')}
                        {issue.duplicateIds.length > 5 && ` (+${issue.duplicateIds.length - 5} more)`}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-3 text-sm">Performance Metrics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-600">Total Duration</p>
            <p className="font-mono text-slate-900">
              {Math.round(performanceMetrics?.totalTimeMs || 0)}ms
            </p>
          </div>
          <div>
            <p className="text-slate-600">Avg per Question</p>
            <p className="font-mono text-slate-900">
              {Math.round(performanceMetrics?.averageTimePerItemMs || 0)}ms
            </p>
          </div>
          <div>
            <p className="text-slate-600">Validated At</p>
            <p className="font-mono text-slate-900 text-xs">
              {new Date(results.validatedAt).toLocaleTimeString()}
            </p>
          </div>
          <div>
            <p className="text-slate-600">Status</p>
            <p className={`font-semibold ${
              validPercentage === 100 ? 'text-green-600' :
              validPercentage >= 80 ? 'text-blue-600' :
              'text-amber-600'
            }`}>
              {validPercentage === 100 ? 'Ready' : 'Review Needed'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValidationReportPanel;
