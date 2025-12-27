/**
 * DailyMissionRunner.jsx
 * 
 * Main mission interface component.
 * Uses useDailyMissionV2 hook to run 14+ template daily missions.
 * Orchestrates mission flow, question progression, and completion.
 */

import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Trophy } from 'lucide-react';
import useDailyMissionV2 from '../../hooks/useDailyMissionV2';
import MissionCard from './MissionCard';
import MissionSummary from './MissionSummary';

const DailyMissionRunner = () => {
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    isLoading,
    isComplete,
    sessionResults,
    missionMetadata,
    submitDailyAnswer
  } = useDailyMissionV2();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleAnswer = async (answer, timeSpent, speedRating) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Extract answer data
      const isCorrect = answer.isCorrect;
      const choice = answer.choice;
      const isRecovered = answer.isRecovered || false;
      const tag = answer.diagnosticTag || null;

      // Submit answer
      await submitDailyAnswer(isCorrect, choice, isRecovered, tag, timeSpent, speedRating);
    } catch (err) {
      console.error('[DailyMissionRunner] Error submitting answer:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Generating Your Mission</h2>
          <p className="text-gray-500">Selecting 14+ diverse questions just for you...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Mission Error</h2>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  // No questions state
  if (!isLoading && totalQuestions === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-yellow-900 mb-2">No Questions Available</h2>
          <p className="text-yellow-700">Please check back later or contact support.</p>
        </div>
      </div>
    );
  }

  // Completion state
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Completion header */}
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Mission Complete!</h1>
            <p className="text-lg text-gray-600">Excellent work, ninja warrior! 🥋</p>
          </div>

          {/* Summary card */}
          {missionMetadata && (
            <MissionSummary
              metadata={missionMetadata}
              results={sessionResults}
            />
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Next Mission
            </button>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active mission state
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Daily Mission</h1>
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Progress</div>
              <div className="text-2xl font-bold text-blue-600">
                {currentIndex + 1}/{totalQuestions}
              </div>
            </div>
          </div>
          
          {/* Phase indicator */}
          {currentQuestion?.phase && (
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              Phase: {currentQuestion.phase.replace(/_/g, ' ')}
            </div>
          )}
        </div>

        {/* Mission card */}
        {currentQuestion && (
          <MissionCard
            question={currentQuestion}
            currentIndex={currentIndex}
            totalQuestions={totalQuestions}
            onSubmit={handleAnswer}
            isSubmitting={isSubmitting}
          />
        )}

        {/* Debug info (dev only) */}
        {process.env.REACT_APP_DEBUG && (
          <div className="mt-8 bg-gray-800 text-green-400 p-4 rounded font-mono text-xs overflow-auto max-h-32">
            <div>Template: {currentQuestion?.templateId}</div>
            <div>Atom: {currentQuestion?.atomId}</div>
            <div>Difficulty: {currentQuestion?.difficulty}</div>
            <div>Mastery: {Math.round((currentQuestion?.masteryBefore || 0) * 100)}%</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyMissionRunner;
