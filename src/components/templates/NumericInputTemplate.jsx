import React, { useState } from 'react';
import { CheckCircle2, XCircle, Lightbulb } from 'lucide-react';

/**
 * REDESIGNED NumericInputTemplate
 * World-class experience for number input problems
 * - Clear question focus
 * - Large, easy-to-tap input field
 * - Encouraging feedback
 */
export function NumericInputTemplate({ question, onAnswer, isSubmitting }) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const correctValue = question.answerKey?.value;
  const tolerance = question.answerKey?.tolerance || 0.01;
  const prompt = question.content?.prompt?.text || 'What is your answer?';
  const instruction = question.content?.instruction;
  const latexExpression = question.content?.prompt?.latex;

  const handleSubmit = async () => {
    if (value.trim() === '') return;

    const numValue = parseFloat(value);
    const isCorrect = !isNaN(numValue) && Math.abs(numValue - correctValue) <= tolerance;

    const result = {
      isCorrect,
      value: numValue,
      expectedValue: correctValue,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || 'Perfect! That\'s the correct answer!'
        : question.feedbackMap?.onIncorrectAttempt1 || 'Not quite. Check your work and try again.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !submitted && value.trim() !== '') {
      handleSubmit();
    }
  };

  return (
    <div className="w-full space-y-8 flex flex-col">
      {/* ========== QUESTION PROMPT (HERO) ========== */}
      <div className="space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
          {prompt}
        </h2>

        {/* LaTeX expression if available */}
        {latexExpression && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-5 md:p-6 rounded-xl border-2 border-purple-200">
            <p className="text-lg md:text-xl font-mono text-gray-800 text-center">
              {latexExpression}
            </p>
          </div>
        )}

        {instruction && (
          <p className="text-base text-gray-600 leading-relaxed">
            {instruction}
          </p>
        )}
      </div>

      {/* ========== INPUT SECTION (SPACIOUS) ========== */}
      <div className="space-y-3 flex-1">
        <label className="block text-base font-semibold text-gray-700">
          Enter your answer:
        </label>
        <div className="flex gap-3">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={submitted || isSubmitting}
            placeholder="Type your answer here"
            step="any"
            autoFocus
            className={`flex-1 px-5 py-4 md:py-5 border-2 rounded-xl text-lg md:text-xl font-semibold transition-all ${
              submitted
                ? feedback?.isCorrect
                  ? 'border-green-400 bg-green-50 text-green-900'
                  : 'border-red-400 bg-red-50 text-red-900'
                : 'border-blue-300 bg-white text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none'
            } disabled:cursor-not-allowed`}
          />
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={value.trim() === '' || isSubmitting}
              className="px-6 md:px-8 py-4 md:py-5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold text-base md:text-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isSubmitting ? 'Checking...' : 'Submit'}
            </button>
          )}
        </div>
      </div>

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
          <div className="flex-1">
            <p
              className={`text-base md:text-lg font-semibold ${
                feedback.isCorrect ? 'text-green-900' : 'text-blue-900'
              }`}
            >
              {feedback.feedback}
            </p>
            {!feedback.isCorrect && (
              <div className="mt-3 space-y-2">
                <p className="text-sm md:text-base text-blue-700">
                  Your answer: <span className="font-mono font-bold">{value}</span>
                </p>
                <p className="text-sm md:text-base text-blue-700">
                  Correct answer: <span className="font-mono font-bold">{feedback.expectedValue}</span>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== WORKED SOLUTION (COLLAPSIBLE) ========== */}
      {submitted && question.workedSolution?.steps && question.workedSolution.steps.length > 0 && (
        <details className="bg-gradient-to-br from-purple-50 to-indigo-50 p-5 md:p-6 rounded-xl border-2 border-purple-200 group">
          <summary className="cursor-pointer font-bold text-gray-900 text-base md:text-lg flex items-center gap-2 hover:text-purple-600 transition-colors">
            <span>📖 Step-by-step solution</span>
            <span className="ml-auto text-gray-400 group-open:rotate-180 transition-transform">▼</span>
          </summary>
          <div className="mt-4 space-y-3">
            {question.workedSolution.steps.map((step, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <p className="text-gray-700 text-sm md:text-base leading-relaxed flex-1 pt-0.5">
                  {step}
                </p>
              </div>
            ))}
            {question.workedSolution.finalAnswer && (
              <div className="mt-4 p-4 bg-blue-100 border-2 border-blue-400 rounded-lg">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Final Answer</p>
                <p className="text-xl md:text-2xl font-bold text-blue-900 font-mono">
                  {question.workedSolution.finalAnswer}
                </p>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}