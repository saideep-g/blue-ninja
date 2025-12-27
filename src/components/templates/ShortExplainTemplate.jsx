import React, { useState } from 'react';
import { CheckCircle, MessageCircle } from 'lucide-react';

/**
 * SHORT_EXPLAIN Template
 * Short text explanation
 * Best for: reasoning, justification
 */
export function ShortExplainTemplate({ question, onAnswer, isSubmitting }) {
  const [explanation, setExplanation] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = () => {
    if (explanation.trim() === '') return;

    const result = {
      isCorrect: true,
      explanation,
      feedback: question.feedbackMap?.onCorrect || '✓ Thanks for your explanation!',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg">
      {/* Question */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-slate-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        <p className="text-sm text-gray-600 mt-3 flex items-start gap-2">
          <MessageCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {question.content?.instruction || 'Explain your thinking in a few sentences.'}
        </p>
      </div>

      {/* Input */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          disabled={submitted}
          placeholder="Type your explanation here..."
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-slate-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed min-h-24 resize-none"
        />
        <p className="text-xs text-gray-500 mt-2">
          {explanation.length} characters
        </p>
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={explanation.trim() === '' || isSubmitting}
          className="w-full py-3 bg-slate-600 text-white rounded-lg font-semibold hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Submit
        </button>
      )}

      {/* Feedback */}
      {submitted && feedback && (
        <div className="p-4 rounded-lg border-l-4 bg-green-50 border-green-500 text-green-800 flex gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>{feedback.feedback}</p>
        </div>
      )}
    </div>
  );
}
