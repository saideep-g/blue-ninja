/**
 * MissionSummary.jsx
 * 
 * Displays completion summary with:
 * - Questions answered
 * - Accuracy score
 * - Templates used (diversity)
 * - Phases completed
 * - Flow gained
 */

import React from 'react';
import { CheckCircle, Target, BookOpen, Zap } from 'lucide-react';

const MissionSummary = ({ metadata, results }) => {
  if (!metadata) return null;

  const accuracy = metadata.questions.length > 0
    ? Math.round((results.correctCount / metadata.questions.length) * 100)
    : 0;

  const templatesUsed = results.templatesUsed || [];
  const phasesCompleted = results.phasesCompleted || [];

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Accuracy Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Accuracy</h3>
        </div>
        <div className="text-4xl font-bold text-blue-600 mb-2">{accuracy}%</div>
        <div className="text-sm text-gray-600">
          {results.correctCount} out of {metadata.questions.length} correct
        </div>
        {/* Accuracy bar */}
        <div className="mt-4 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-500"
            style={{ width: `${accuracy}%` }}
          />
        </div>
      </div>

      {/* Flow Gained Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <Zap className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-bold text-gray-900">Flow Gained</h3>
        </div>
        <div className="text-4xl font-bold text-yellow-500 mb-2">+{results.flowGained || 0}</div>
        <div className="text-sm text-gray-600">Energy points earned</div>
      </div>

      {/* Templates Diversity Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-900">Templates Used</h3>
        </div>
        <div className="text-4xl font-bold text-purple-600 mb-2">{templatesUsed.length}</div>
        <div className="text-sm text-gray-600">Diverse question types</div>
        {/* Template tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {templatesUsed.slice(0, 5).map((template) => (
            <span
              key={template}
              className="inline-block bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium truncate"
              title={template}
            >
              {template.replace(/_/g, ' ')}
            </span>
          ))}
          {templatesUsed.length > 5 && (
            <span className="inline-block bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
              +{templatesUsed.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Phases Completed Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle className="w-6 h-6 text-green-600" />
          <h3 className="text-lg font-bold text-gray-900">Phases Completed</h3>
        </div>
        <div className="text-4xl font-bold text-green-600 mb-2">{phasesCompleted.length}/{metadata.phases.length}</div>
        <div className="text-sm text-gray-600">Mission phases</div>
        {/* Phase tags */}
        <div className="mt-4 flex flex-wrap gap-2">
          {phasesCompleted.map((phase) => (
            <span
              key={phase}
              className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium"
            >
              {phase.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      </div>

      {/* Mission Stats Card */}
      <div className="bg-white rounded-lg shadow-md p-6 md:col-span-2">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Mission Statistics</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">{metadata.questions.length}</div>
            <div className="text-sm text-gray-500 mt-1">Total Questions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{metadata.metadata.diversityScore.uniqueTemplates}</div>
            <div className="text-sm text-gray-500 mt-1">Unique Templates</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900">{metadata.phases.length}</div>
            <div className="text-sm text-gray-500 mt-1">Learning Phases</div>
          </div>
        </div>
      </div>

      {/* Insights Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6 md:col-span-2">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Key Insights</h3>
        <ul className="space-y-2">
          <li className="text-sm text-gray-700">
            <span className="font-semibold">📊 Diversity:</span> You practiced with {metadata.metadata.diversityScore.uniqueTemplates} different question types
          </li>
          <li className="text-sm text-gray-700">
            <span className="font-semibold">🎯 Coverage:</span> You completed {phasesCompleted.length} learning phases
          </li>
          <li className="text-sm text-gray-700">
            <span className="font-semibold">⚡ Performance:</span> Your accuracy of {accuracy}% shows great understanding
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MissionSummary;
