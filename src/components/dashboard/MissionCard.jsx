/**
 * MissionCard.jsx
 * 
 * REDESIGNED: World-class mission experience optimized for young learners
 * - Content-first layout (question is the hero)
 * - Minimal metadata (remove cognitive overload)
 * - Clean, spacious design
 * - Encouraging, anxiety-free experience
 * - Perfect for 13-year-old students
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
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

  // Track time spent on question
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeSpent(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [question?.questionId]);

  if (!question) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 text-lg">Loading your next question...</p>
      </div>
    );
  }

  const handleSubmit = async (answer) => {
    setHasAnswered(true);
    const result = await onSubmit(answer, timeSpent, null);
    return result;
  };

  // Progress percentage
  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 flex flex-col">
      {/* ========== ULTRA-MINIMAL TOP BAR ========== */}
      <div className="bg-white border-b border-blue-100 sticky top-0 z-10 py-3 px-6 flex justify-between items-center">
        {/* Left: Question number */}
        <div className="flex items-center gap-2">
          <div className="text-sm font-semibold text-blue-600">
            Question {currentIndex + 1}
          </div>
          <div className="text-xs text-gray-400">of {totalQuestions}</div>
        </div>

        {/* Right: Time counter (subtle) */}
        <div className="text-sm text-gray-500 font-mono">
          {timeSpent}s
        </div>
      </div>

      {/* ========== PROGRESS BAR (THIN, ELEGANT) ========== */}
      <div className="h-1 bg-blue-100">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* ========== MAIN CONTENT AREA ========== */}
      <div className="flex-1 flex flex-col px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto w-full flex-1 flex flex-col">
          {/* ========== QUESTION AREA (HERO) ========== */}
          <div className="bg-white rounded-2xl shadow-md p-8 md:p-12 flex-1">
            {/* Template content rendered by TemplateRouter */}
            <TemplateRouter
              question={question}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* ========== BOTTOM INFO BAR (OPTIONAL) ========== */}
      {!hasAnswered && (
        <div className="bg-blue-50 border-t border-blue-200 px-6 py-4">
          <div className="max-w-3xl mx-auto flex justify-between items-center text-xs text-gray-600">
            <div>
              <span className="font-semibold text-gray-700">Take your time</span>
              <span className="text-gray-500"> — there's no rush</span>
            </div>
            <div className="flex items-center gap-2 text-blue-600 font-semibold">
              <span>Keep going</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MissionCard;