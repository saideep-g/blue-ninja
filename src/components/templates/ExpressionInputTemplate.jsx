import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * EXPRESSION_INPUT Template
 * Mathematical expression input with equivalence checking
 * Best for: algebra, simplification, generalization
 */
export function ExpressionInputTemplate({ question, onAnswer, isSubmitting }) {
  const [expression, setExpression] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const expectedExpression = question.answerKey?.expression;
  const format = question.interaction?.config?.format || 'algebraic';

  const handleSubmit = async () => {
    if (expression === '') return;

    const isCorrect = checkExpressionEquivalence(expression, expectedExpression);

    const result = {
      isCorrect,
      expression,
      expectedExpression,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ Correct simplification!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Check your expression.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  function checkExpressionEquivalence(expr1, expr2) {
    // Simplified check - in production, use a proper math parser like Math.js
    const normalize = (e) => e.replace(/\s/g, '').toLowerCase();
    return normalize(expr1) === normalize(expr2);
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
      {/* Question Prompt */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
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
          Enter your expression:
        </label>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          disabled={submitted}
          placeholder="e.g., 2x + 3y"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-lg font-mono"
        />
        {question.interaction?.config?.format && (
          <p className="text-xs text-gray-500 mt-2">
            Format hint: {question.interaction.config.format}
          </p>
        )}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={expression === '' || isSubmitting}
          className="w-full py-3 bg-orange-600 text-white rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Check
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
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <p className="font-semibold">{feedback.feedback}</p>
            {!feedback.isCorrect && (
              <p className="text-sm mt-1 font-mono">Expected: {feedback.expectedExpression}</p>
            )}
          </div>
        </div>
      )}

      {/* Keyboard Helper */}
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-sm text-blue-900">
        <p className="font-semibold mb-2">⌨️ Keyboard tips:</p>
        <p>Use ^ for powers, * for multiply, / for divide, + and - for add/subtract</p>
      </div>
    </div>
  );
}
