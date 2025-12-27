/**
 * MissionCard.jsx
 * 
 * Enhanced mission question card for 14+ template daily missions.
 * Integrates TemplateRouter for dynamic template rendering.
 * Displays phase info, difficulty, and template metadata.
 * 
 * Replaces original MissionCard.jsx
 */

import React, { useState, useEffect } from 'react';
import { Clock, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import { TemplateRouter } from '../templates/TemplateRouter';

const MissionCard = ({
  question,
  currentIndex,
  totalQuestions,
  onSubmit,
  isSubmitting = false
}) => {
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [speedRating, setSpeedRating] = useState(null);

  // Track time spent on question
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeSpent((Date.now() - startTime) / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, [question?.questionId]);

  // Calculate speed rating based on time
  useEffect(() => {
    if (hasAnswered) return;
    
    const expectedTime = (question?.difficulty || 2) * 8; // difficulty * 8 seconds
    if (timeSpent < expectedTime * 0.6) {
      setSpeedRating('SPRINT');
    } else if (timeSpent < expectedTime * 1.2) {
      setSpeedRating('STEADY');
    } else {
      setSpeedRating('DEEP');
    }
  }, [timeSpent, question?.difficulty, hasAnswered]);

  if (!question) {
    return (
      <div className="bg-gray-100 rounded-lg p-8 text-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">No question available</p>
      </div>
    );
  }

  const handleSubmit = async (answer) => {
    setHasAnswered(true);
    const result = await onSubmit(answer, timeSpent, speedRating);
    return result;
  };

  const difficultyColor = question.difficulty === 1 ? 'green' : question.difficulty === 2 ? 'yellow' : 'red';
  const difficultyLabel = question.difficulty === 1 ? 'Easy' : question.difficulty === 2 ? 'Medium' : 'Hard';

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with phase and metadata */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold mb-1">Question {currentIndex + 1} of {totalQuestions}</h2>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full text-sm font-medium">
                <Zap className="w-4 h-4" />
                {question.phase || 'UNKNOWN'}
              </span>
              {question.templateId && (
                <span className="inline-flex items-center gap-1 bg-blue-500 bg-opacity-50 px-3 py-1 rounded-full text-sm font-medium">
                  {question.templateId.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">{Math.floor(timeSpent)}s</div>
            <div className={`text-sm font-semibold px-2 py-1 rounded bg-${difficultyColor}-100 text-${difficultyColor}-700`}>
              {difficultyLabel}
            </div>
          </div>
        </div>

        {/* Metadata row */}
        <div className="grid grid-cols-2 gap-2 text-xs opacity-90">
          <div>
            <div className="opacity-75">Atom</div>
            <div className="font-semibold truncate">{question.atomName || question.atomId}</div>
          </div>
          <div>
            <div className="opacity-75">Module</div>
            <div className="font-semibold truncate">{question.moduleName || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <div
          className="h-full bg-blue-600 transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question content */}
      <div className="p-8">
        <TemplateRouter
          question={question}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Footer with analytics */}
      <div className="bg-gray-50 px-8 py-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-xs">
          <div>
            <div className="text-gray-500 mb-1">Speed</div>
            <div className="font-bold text-gray-700">{speedRating || '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Mastery</div>
            <div className="font-bold text-gray-700">
              {Math.round((question.masteryBefore || 0) * 100)}%
            </div>
          </div>
          <div>
            <div className="text-gray-500 mb-1">Outcomes</div>
            <div className="font-bold text-gray-700">
              {(question.outcomes || []).length} linked
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MissionCard;
