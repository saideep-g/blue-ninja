import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * MATCHING Template
 * Match pairs (left to right)
 * Best for: representation shifts, connections
 */
export function MatchingTemplate({ question, onAnswer, isSubmitting }) {
  const [matches, setMatches] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const leftItems = question.interaction?.config?.leftItems || [];
  const rightItems = question.interaction?.config?.rightItems || [];
  const correctMatches = question.answerKey?.matches || {};

  const handleMatch = (leftId, rightId) => {
    setMatches({
      ...matches,
      [leftId]: rightId,
    });
  };

  const handleSubmit = () => {
    const isCorrect = validateMatches(matches, correctMatches);

    const result = {
      isCorrect,
      matches,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ All matches correct!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Check your matches.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  function validateMatches(user, correct) {
    return Object.entries(correct).every(([leftId, rightId]) =>
      user[leftId] === rightId
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg">
      {/* Question */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-pink-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        <p className="text-sm text-gray-600 mt-3">Match the items on the left with the right:</p>
      </div>

      {/* Matching Interface */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="space-y-2">
          {leftItems.map((left) => (
            <div key={left.id} className="flex items-center gap-4">
              <div className="flex-1 p-3 bg-pink-100 text-pink-900 rounded-lg font-semibold">
                {left.label}
              </div>
              <select
                value={matches[left.id] || ''}
                onChange={(e) => handleMatch(left.id, e.target.value)}
                disabled={submitted}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 outline-none"
              >
                <option value="">Select...</option>
                {rightItems.map((right) => (
                  <option key={right.id} value={right.id}>
                    {right.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(matches).length !== leftItems.length || isSubmitting}
          className="w-full py-3 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-700 disabled:opacity-50 transition-all"
        >
          Check Matches
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
