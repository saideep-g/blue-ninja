import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * GEOMETRY_TAP Template
 * Tap elements in a geometry diagram
 * Best for: geometric properties, spatial reasoning
 */
export function GeometryTapTemplate({ question, onAnswer, isSubmitting }) {
  const [selected, setSelected] = useState(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const tapElements = question.interaction?.config?.tapElements || [];
  const correctElements = new Set(question.answerKey?.correctElementIds || []);

  const handleTap = (elementId) => {
    if (submitted) return;
    const newSelected = new Set(selected);
    if (newSelected.has(elementId)) {
      newSelected.delete(elementId);
    } else {
      newSelected.add(elementId);
    }
    setSelected(newSelected);
  };

  const handleSubmit = () => {
    const isCorrect = validateSelection(selected, correctElements);

    const result = {
      isCorrect,
      selected: Array.from(selected),
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ Great observation!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Look again.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  function validateSelection(userSet, correctSet) {
    if (userSet.size !== correctSet.size) return false;
    return Array.from(userSet).every(id => correctSet.has(id));
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg">
      {/* Question */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-violet-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        <p className="text-sm text-gray-600 mt-3">Tap to select the correct elements:</p>
      </div>

      {/* Diagram */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="relative w-full h-64 bg-gray-100 rounded-lg border-2 border-gray-300 overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Placeholder geometry diagram */}
            <circle cx="100" cy="150" r="40" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
            <rect x="200" y="100" width="100" height="100" fill="#e5e7eb" stroke="#6b7280" strokeWidth="2" />
            <line x1="100" y1="150" x2="250" y2="150" stroke="#6b7280" strokeWidth="2" />
          </svg>
        </div>

        {/* Tap Options */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {tapElements.map((element) => (
            <button
              key={element.id}
              onClick={() => handleTap(element.id)}
              disabled={submitted}
              className={`p-3 rounded-lg font-semibold transition-all ${
                selected.has(element.id)
                  ? 'bg-violet-600 text-white'
                  : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
              } disabled:opacity-50`}
            >
              {element.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected.size === 0 || isSubmitting}
          className="w-full py-3 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 disabled:opacity-50 transition-all"
        >
          Check Selection
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
