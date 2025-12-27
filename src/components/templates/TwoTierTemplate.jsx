import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * TWO_TIER Template
 * First answer a question, then explain reasoning
 * Best for: concept-checking, reasoning, transfer
 */
export function TwoTierTemplate({ question, onAnswer, isSubmitting }) {
  const [tier1Answer, setTier1Answer] = useState(null);
  const [tier2Answer, setTier2Answer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const tier1Options = question.interaction?.config?.tier1Options || [];
  const tier2Prompt = question.interaction?.config?.tier2Prompt || 'Explain your reasoning:';
  const correctTier1 = question.answerKey?.tier1CorrectIndex;

  const handleSubmit = async () => {
    if (tier1Answer === null || tier2Answer === '') return;

    const isCorrect = tier1Answer === correctTier1;

    const result = {
      isCorrect,
      tier1Answer,
      tier2Explanation: tier2Answer,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ Correct reasoning!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Think about this more carefully.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
      {/* Question Prompt */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-indigo-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        {question.content?.instruction && (
          <p className="text-sm text-gray-600 mt-3">{question.content.instruction}</p>
        )}
      </div>

      {/* Tier 1: Answer Selection */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Tier 1: Select your answer</h3>
        <div className="space-y-3">
          {tier1Options.map((option, index) => (
            <label
              key={index}
              className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all"
            >
              <input
                type="radio"
                name="tier1"
                checked={tier1Answer === index}
                onChange={() => setTier1Answer(index)}
                disabled={submitted}
                className="w-4 h-4"
              />
              <span className="text-gray-900">{option.text}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tier 2: Explanation */}
      {tier1Answer !== null && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Tier 2: Explain your thinking</h3>
          <textarea
            value={tier2Answer}
            onChange={(e) => setTier2Answer(e.target.value)}
            disabled={submitted}
            placeholder={tier2Prompt}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed min-h-24 resize-none"
          />
        </div>
      )}

      {/* Submit Button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={tier1Answer === null || tier2Answer === '' || isSubmitting}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p>{feedback.feedback}</p>
        </div>
      )}
    </div>
  );
}
