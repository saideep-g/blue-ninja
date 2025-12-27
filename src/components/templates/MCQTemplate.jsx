import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

/**
 * MCQ_CONCEPT Template
 * Multiple choice with visual feedback
 * Best for: concept discrimination, vocabulary, quick checks
 */
export function MCQTemplate({ question, onAnswer, isSubmitting }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const options = question.interaction?.config?.options || [];
  const correctIndex = question.answerKey?.correctOptionIndex;

  const handleSelect = (index) => {
    if (!submitted) setSelectedIndex(index);
  };

  const handleSubmit = async () => {
    if (selectedIndex === null) return;

    const isCorrect = selectedIndex === correctIndex;
    const result = {
      isCorrect,
      selectedIndex,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ Correct! Well done!'
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
        {question.content?.instruction && (
          <p className="text-sm text-gray-600">{question.content.instruction}</p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <div
            key={index}
            onClick={() => handleSelect(index)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
              selectedIndex === index
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-gray-300'
            } ${submitted && index === correctIndex ? 'border-green-500 bg-green-50' : ''}
            ${submitted && selectedIndex === index && index !== correctIndex ? 'border-red-500 bg-red-50' : ''}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full border-2 mt-1 flex items-center justify-center ${
                  selectedIndex === index
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                } ${submitted && index === correctIndex ? 'border-green-500 bg-green-500' : ''}
                ${submitted && selectedIndex === index && index !== correctIndex ? 'border-red-500 bg-red-500' : ''}`}
              >
                {selectedIndex === index && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-800">{option.text}</p>
              </div>
              {submitted && index === correctIndex && (
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              )}
              {submitted && selectedIndex === index && index !== correctIndex && (
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selectedIndex === null || isSubmitting}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Check Answer
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
          </div>
        </details>
      )}
    </div>
  );
}
