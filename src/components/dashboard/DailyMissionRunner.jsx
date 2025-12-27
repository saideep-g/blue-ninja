/**
 * DailyMissionRunner.jsx
 * 
 * REDESIGNED: World-class mission interface
 * - Minimal, distraction-free header
 * - Content-first layout
 * - Encouraging, anxiety-free experience
 * - Perfect for young learners
 */

import React, { useState } from 'react';
import { AlertCircle, Trophy } from 'lucide-react';
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

  // Safe debug mode check
  const isDebugMode = typeof window !== 'undefined' && 
    localStorage?.getItem('DEBUG_MODE') === 'true';

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

  // ========== LOADING STATE ==========
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <h2 className="text-xl font-bold text-gray-900">Preparing your mission...</h2>
          <p className="text-gray-500">Finding the perfect questions for you</p>
        </div>
      </div>
    );
  }

  // ========== ERROR STATE ==========
  if (error && !isComplete) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-8 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2 text-center">Oops! Something went wrong</h2>
          <p className="text-red-700 mb-6 text-center">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ========== NO QUESTIONS STATE ==========
  if (!isLoading && totalQuestions === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-yellow-900 mb-2">No questions available</h2>
          <p className="text-yellow-700">Please check back later or contact your teacher.</p>
        </div>
      </div>
    );
  }

  // ========== COMPLETION STATE ==========
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-4">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Celebration header */}
          <div className="text-center pt-8 space-y-3">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto animate-bounce" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Mission Complete!</h1>
            <p className="text-lg text-gray-600">Amazing work, ninja warrior! 🥋</p>
          </div>

          {/* Summary card */}
          {missionMetadata && (
            <MissionSummary
              metadata={missionMetadata}
              results={sessionResults}
            />
          )}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition shadow-md hover:shadow-lg"
            >
              Next Mission
            </button>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 px-6 rounded-xl transition shadow-md hover:shadow-lg"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ========== ACTIVE MISSION STATE ==========
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Mission card component handles all UI */}
      {currentQuestion && (
        <MissionCard
          question={currentQuestion}
          currentIndex={currentIndex}
          totalQuestions={totalQuestions}
          onSubmit={handleAnswer}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Debug info (only if enabled) */}
      {isDebugMode && currentQuestion && (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-green-400 p-3 rounded font-mono text-xs max-w-xs overflow-auto max-h-40 shadow-lg border border-green-400">
          <div className="font-bold mb-2">📊 DEBUG INFO</div>
          <div>Template: {currentQuestion?.templateId}</div>
          <div>Atom: {currentQuestion?.atomId}</div>
          <div>Difficulty: {currentQuestion?.difficulty}</div>
          <div>Mastery: {Math.round((currentQuestion?.masteryBefore || 0) * 100)}%</div>
          <div>Phase: {currentQuestion?.phase}</div>
        </div>
      )}
    </div>
  );
};

export default DailyMissionRunner;