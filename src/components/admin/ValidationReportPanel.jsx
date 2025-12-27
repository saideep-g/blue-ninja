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

  const { summary, statistics, globalIssues, performanceMetrics } = results;
  const validPercentage = results.totalQuestions > 0
    ? Math.round((summary.totalValid / results.totalQuestions) * 100)
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

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6">
        <h2 className="text-2xl font-bold mb-6">Validation Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Total Questions */}
          <div className="bg-white/10 rounded-lg p-4">
            <p className="text-sm text-slate-300 mb-1">Total Questions</p>
            <p className="text-3xl font-bold">{results.totalQuestions}</p>
          </div>

          {/* Valid Questions */}
          <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/30">
            <p className="text-sm text-slate-300 mb-1">Valid</p>
            <p className="text-3xl font-bold">
              {summary.totalValid}
              <span className="text-lg ml-2">({validPercentage}%)</span>
            </p>
          </div>

          {/* Needs Review */}
          <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/30">
            <p className="text-sm text-slate-300 mb-1">Needs Review</p>
            <p className="text-3xl font-bold">
              {summary.totalWithErrors}
              <span className="text-lg ml-2">({summary.totalWithCriticalErrors} critical)</span>
            </p>
          </div>

          {/* Warnings */}
          <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/30">
            <p className="text-sm text-slate-300 mb-1">Warnings</p>
            <p className="text-3xl font-bold">{summary.totalWithWarnings}</p>
          </div>
        </div>

        {/* Progress Bar */}
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

      {/* Quality Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quality Grade Distribution */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Quality Grades
          </h3>
          <div className="space-y-2">
            {Object.entries(statistics.qualityGradeBreakdown || {}).map(([grade, count]) => (
              <div key={grade} className="flex items-center gap-3">
                <span className={`inline-block px-3 py-1 rounded font-semibold text-sm border ${
                  getGradeColor(grade)
                }`}>
                  {grade}
                </span>
                <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600"
                    style={{ width: `${(count / results.totalQuestions) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-slate-600 w-12 text-right">{count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">Average Quality Score:</span> {statistics.averageQualityScore}
            </p>
          </div>
        </div>

        {/* Coverage Stats */}
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-purple-600" />
            Coverage Statistics
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-600 mb-1">Atoms Covered</p>
              <p className="text-2xl font-bold text-slate-900">
                {Object.keys(statistics.atomCoverage || {}).length}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-2">Top Atoms by Questions</p>
              <div className="space-y-1">
                {(Object.entries(statistics.atomCoverage || {}))
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([atom, count]) => (
                    <div key={atom} className="flex items-center justify-between text-sm">
                      <span className="text-slate-700">{atom}</span>
                      <span className="font-semibold text-slate-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Type Distribution */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Question Types</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {Object.entries(statistics.typeDistribution || {}).map(([type, count]) => (
            <div key={type} className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-blue-600 mb-1">{count}</p>
              <p className="text-xs text-slate-600 break-words">{type}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Global Issues */}
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
                    {issue.duplicateIds && (
                      <div>
                        <p className="font-semibold mb-2">Duplicate IDs:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {issue.duplicateIds.map((dup, i) => (
                            <li key={i}>
                              <code className="bg-white px-1 rounded">{dup.id}</code> ({dup.count}x)
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-3 text-sm">Performance Metrics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-600">Total Duration</p>
            <p className="font-mono text-slate-900">{performanceMetrics.totalDuration}ms</p>
          </div>
          <div>
            <p className="text-slate-600">Avg per Question</p>
            <p className="font-mono text-slate-900">{performanceMetrics.averagePerQuestion}ms</p>
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
