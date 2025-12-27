import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * NUMERIC_INPUT Template
 * Number input with tolerance-based scoring
 * Best for: fluency, retrieval, computation
 */
export function NumericInputTemplate({ question, onAnswer, isSubmitting }) {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const correctValue = question.answerKey?.value;
  const tolerance = question.answerKey?.tolerance || 0.01;

  const handleSubmit = async () => {
    if (value === '') return;

    const numValue = parseFloat(value);
    const isCorrect = Math.abs(numValue - correctValue) <= tolerance;

    const result = {
      isCorrect,
      value: numValue,
      expectedValue: correctValue,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ Correct!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Not quite right. Try again!',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
      {/* Question Prompt */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        {question.content?.prompt?.latex && (
          <div className="text-lg text-gray-700 font-mono bg-gray-50 p-3 rounded mt-2">
            {question.content.prompt.latex}
          </div>
        )}
        {question.content?.instruction && (
          <p className="text-sm text-gray-600 mt-3">{question.content.instruction}</p>
        )}
      </div>

      {/* Input Field */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          Your Answer:
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={submitted}
            placeholder="Enter your answer"
            step="any"
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-lg"
          />
          {!submitted && (
            <button
              onClick={handleSubmit}
              disabled={value === '' || isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              Check
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {submitted && feedback && (
        <div
          className={`p-4 rounded-lg border-l-4 flex gap-3 ${
            feedback.isCorrect
              ? 'bg-green-50 border-green-500 text-green-800'
              : 'bg-red-50 border-red-500 text-red-800'
          }`}
        >
          {feedback.isCorrect ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">{feedback.feedback}</p>
            {!feedback.isCorrect && (
              <p className="text-sm mt-1">Expected: {feedback.expectedValue}</p>
            )}
          </div>
        </div>
      )}

      {/* Worked Solution */}
      {submitted && question.workedSolution && (
        <details className="bg-white p-4 rounded-lg border border-gray-200">
          <summary className="cursor-pointer font-semibold text-gray-900 hover:text-blue-600">
            📖 View Solution
          </summary>
          <div className="mt-4 space-y-2 text-gray-700">
            {question.workedSolution.steps?.map((step, idx) => (
              <p key={idx} className="text-sm">
                {idx + 1}. {step}
              </p>
            ))}
            {question.workedSolution.finalAnswer && (
              <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                <p className="font-semibold text-blue-900">Answer: {question.workedSolution.finalAnswer}</p>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
