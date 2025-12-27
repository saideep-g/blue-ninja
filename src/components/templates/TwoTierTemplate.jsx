import React, { useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

/**
 * REDESIGNED TwoTierTemplate
 * Two-stage problem: answer + explain reasoning
 * World-class experience for young learners
 * - Clear stage progression
 * - Focus on one thing at a time
 * - Encouraging feedback
 */
export function TwoTierTemplate({ question, onAnswer, isSubmitting }) {
  const [tier1Answer, setTier1Answer] = useState(null);
  const [tier2Answer, setTier2Answer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const tier1Options = question.interaction?.config?.tier1Options || [];
  const tier2Prompt = question.interaction?.config?.tier2Prompt || 'Why did you choose that answer?';
  const correctTier1 = question.answerKey?.tier1CorrectIndex;
  const mainPrompt = question.content?.prompt?.text || 'Answer the question below';
  const instruction = question.content?.instruction;

  const handleSubmit = async () => {
    if (tier1Answer === null || tier2Answer.trim() === '') return;

    const isCorrect = tier1Answer === correctTier1;

    const result = {
      isCorrect,
      tier1Answer,
      tier2Explanation: tier2Answer,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || 'Excellent! Your reasoning is spot on!'
        : question.feedbackMap?.onIncorrectAttempt1 || 'Great thinking! Let\'s explore this more.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  return (
    <div className="w-full space-y-8 flex flex-col">
      {/* ========== MAIN QUESTION (HERO) ========== */}
      <div className="space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
          {mainPrompt}
        </h2>
        {instruction && (
          <p className="text-base text-gray-600 leading-relaxed">
            {instruction}
          </p>
        )}
      </div>

      {/* ========== STAGE 1: CHOOSE ANSWER ========== */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-lg font-bold text-gray-900">Pick your answer</h3>
        </div>

        <div className="space-y-2">
          {tier1Options.map((option, index) => (
            <button
              key={index}
              onClick={() => !submitted && setTier1Answer(index)}
              disabled={submitted || isSubmitting}
              className={`w-full p-4 md:p-5 rounded-xl border-2 text-left transition-all font-medium text-base md:text-lg ${
                tier1Answer === index
                  ? 'border-blue-500 bg-blue-50 text-gray-900 shadow-md'
                  : 'border-gray-200 bg-white text-gray-900 hover:border-blue-300 hover:bg-blue-50'
              } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    tier1Answer === index
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {tier1Answer === index && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <span>{option.text}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ========== STAGE 2: EXPLAIN REASONING ========== */}
      {tier1Answer !== null && (
        <div className="space-y-4 pt-4 border-t-2 border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="text-lg font-bold text-gray-900">Explain your thinking</h3>
          </div>

          <p className="text-sm text-gray-600">
            {tier2Prompt}
          </p>

          <textarea
            value={tier2Answer}
            onChange={(e) => setTier2Answer(e.target.value)}
            disabled={submitted || isSubmitting}
            placeholder="Write your explanation here... (at least a few words)"
            className={`w-full px-5 py-4 border-2 rounded-xl text-base focus:outline-none resize-none font-medium transition-all ${
              submitted
                ? feedback?.isCorrect
                  ? 'border-green-400 bg-green-50 text-green-900'
                  : 'border-red-400 bg-red-50 text-red-900'
                : 'border-purple-300 bg-white text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
            } disabled:cursor-not-allowed min-h-32`}
          />
        </div>
      )}

      {/* ========== ACTION BUTTON ========== */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={tier1Answer === null || tier2Answer.trim() === '' || isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Checking...' : 'Submit Your Answer'}
        </button>
      ) : null}

      {/* ========== FEEDBACK (ENCOURAGING) ========== */}
      {submitted && feedback && (
        <div
          className={`p-5 md:p-6 rounded-xl flex gap-4 items-start ${
            feedback.isCorrect
              ? 'bg-green-50 border-2 border-green-200'
              : 'bg-blue-50 border-2 border-blue-200'
          }`}
        >
          {feedback.isCorrect ? (
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
          ) : (
            <Lightbulb className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p
              className={`text-base md:text-lg font-semibold ${
                feedback.isCorrect ? 'text-green-900' : 'text-blue-900'
              }`}
            >
              {feedback.feedback}
            </p>
            {!feedback.isCorrect && (
              <p className="text-sm text-blue-700 mt-2">
                The correct answer is: <strong>{tier1Options[correctTier1]?.text}</strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========== YOUR RESPONSE (REVIEW) ========== */}
      {submitted && (
        <div className="bg-gray-50 p-5 md:p-6 rounded-xl border-2 border-gray-200 space-y-3">
          <h4 className="font-bold text-gray-900">Your Response:</h4>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Answer</p>
            <p className="text-gray-700 font-semibold">{tier1Options[tier1Answer]?.text}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Explanation</p>
            <p className="text-gray-700 leading-relaxed">{tier2Answer}</p>
          </div>
        </div>
      )}
    </div>
  );
}