import React, { useState } from 'react';
import { CheckCircle, XCircle, RotateCcw } from 'lucide-react';

/**
 * BALANCE_OPS Template
 * Equation balancing with step-by-step operations
 * Best for: equations, inverse operations, procedures
 */
export function BalanceOpsTemplate({ question, onAnswer, isSubmitting }) {
  const [steps, setSteps] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [currentLeft, setCurrentLeft] = useState(question.interaction?.config?.equation?.left);
  const [currentRight, setCurrentRight] = useState(question.interaction?.config?.equation?.right);

  const operations = question.interaction?.config?.operations || [];
  const maxSteps = question.interaction?.config?.maxSteps || 5;
  const answerKey = question.answerKey;

  const applyOperation = (op) => {
    if (steps.length >= maxSteps) return;

    const newSteps = [...steps, op];
    setSteps(newSteps);

    // Simple equation evaluation (this would be more complex in production)
    // For now, just simulate the balance
  };

  const handleReset = () => {
    setSteps([]);
    setCurrentLeft(question.interaction?.config?.equation?.left);
    setCurrentRight(question.interaction?.config?.equation?.right);
    setFeedback(null);
    setSubmitted(false);
  };

  const handleSubmit = () => {
    const isCorrect = validateSteps(steps, answerKey);

    const result = {
      isCorrect,
      steps,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ Perfect! You solved it!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Try a different approach.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  function validateSteps(steps, answerKey) {
    // In production, this would validate the step sequence
    return steps.length > 0 && steps.length <= maxSteps;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg">
      {/* Question Prompt */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        {question.content?.instruction && (
          <p className="text-sm text-gray-600 mt-3">{question.content.instruction}</p>
        )}
      </div>

      {/* Equation Display */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-2 border-purple-200">
        <div className="flex items-center justify-between text-2xl font-mono font-bold text-gray-900">
          <div>3x + 5</div>
          <div className="text-3xl">=</div>
          <div>20</div>
        </div>
      </div>

      {/* Step Log */}
      {steps.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-3">Steps taken:</h3>
          <div className="space-y-2">
            {steps.map((step, idx) => (
              <div key={idx} className="text-sm text-blue-800 bg-white p-2 rounded border-l-4 border-blue-400">
                Step {idx + 1}: {step.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Operations Panel */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-3">Available Operations:</h3>
        <div className="grid grid-cols-2 gap-3">
          {operations.map((op, idx) => (
            <button
              key={idx}
              onClick={() => applyOperation(op)}
              disabled={steps.length >= maxSteps || submitted}
              className="p-3 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-900 rounded-lg font-semibold hover:from-purple-200 hover:to-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-purple-300"
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleReset}
          className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={steps.length === 0 || isSubmitting}
            className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Check Solution
          </button>
        )}
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
          <p>{feedback.feedback}</p>
        </div>
      )}

      {/* Misconceptions Hint */}
      {question.misconceptions?.length > 0 && (
        <details className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <summary className="cursor-pointer font-semibold text-amber-900">
            📡 Common mistakes to avoid
          </summary>
          <div className="mt-3 space-y-2 text-amber-800 text-sm">
            {question.misconceptions.map((misc, idx) => (
              <p key={idx}>
                <span className="font-semibold">• {misc.tag}:</span> {misc.hint}
              </p>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
