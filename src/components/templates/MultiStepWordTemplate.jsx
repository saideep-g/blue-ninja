import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * MULTI_STEP_WORD Template
 * Multi-step word problems with structured input
 * Best for: transfer, modeling
 */
export function MultiStepWordTemplate({ question, onAnswer, isSubmitting }) {
  const [responses, setResponses] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const steps = question.interaction?.config?.steps || [];
  const correctAnswers = question.answerKey?.stepAnswers || {};

  const handleChange = (stepId, value) => {
    setResponses({ ...responses, [stepId]: value });
  };

  const handleSubmit = () => {
    const allCorrect = Object.entries(correctAnswers).every(
      ([stepId, correct]) =>
        parseFloat(responses[stepId]) === parseFloat(correct)
    );

    const result = {
      isCorrect: allCorrect,
      responses,
      feedback: allCorrect
        ? question.feedbackMap?.onCorrect || '✓ Excellent problem solving!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Check your work.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg">
      {/* Question */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-teal-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        <p className="text-sm text-gray-600 mt-3 whitespace-pre-line">
          {question.content?.stimulus?.text}
        </p>
      </div>

      {/* Steps */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        {steps.map((step, idx) => (
          <div key={step.id} className="border-l-4 border-teal-300 pl-4 space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Step {idx + 1}: {step.question}
            </label>
            <input
              type="number"
              value={responses[step.id] || ''}
              onChange={(e) => handleChange(step.id, e.target.value)}
              disabled={submitted}
              placeholder="Your answer"
              step="any"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-teal-500 outline-none"
            />
          </div>
        ))}
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(responses).length !== steps.length || isSubmitting}
          className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 disabled:opacity-50 transition-all"
        >
          Submit Solution
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
