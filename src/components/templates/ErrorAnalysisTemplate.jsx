import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * ERROR_ANALYSIS Template
 * Identify and explain errors in solutions
 * Best for: misconceptions, debugging
 */
export function ErrorAnalysisTemplate({ question, onAnswer, isSubmitting }) {
  const [selectedError, setSelectedError] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const errors = question.interaction?.config?.errors || [];
  const correctErrorId = question.answerKey?.errorId;

  const handleSubmit = () => {
    if (selectedError === null || explanation === '') return;

    const isCorrect = selectedError === correctErrorId;

    const result = {
      isCorrect,
      selectedError,
      explanation,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ Good error detection!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Look more carefully.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg">
      {/* Question */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-red-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        <p className="text-sm text-gray-600 mt-3">Find and explain the error:</p>
      </div>

      {/* Error Options */}
      <div className="space-y-3">
        {errors.map((error, idx) => (
          <label
            key={idx}
            className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:bg-red-50 transition-all"
          >
            <input
              type="radio"
              name="error"
              checked={selectedError === idx}
              onChange={() => setSelectedError(idx)}
              disabled={submitted}
              className="w-4 h-4 mt-1"
            />
            <div className="flex-1">
              <p className="font-mono text-sm text-gray-900 bg-gray-100 p-2 rounded">
                {error.text}
              </p>
              {selectedError === idx && (
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  disabled={submitted}
                  placeholder="Explain why this is wrong..."
                  className="w-full mt-2 px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                  rows="3"
                />
              )}
            </div>
          </label>
        ))}
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selectedError === null || explanation === '' || isSubmitting}
          className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 transition-all"
        >
          Submit
        </button>
      )}

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
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p>{feedback.feedback}</p>
        </div>
      )}
    </div>
  );
}
