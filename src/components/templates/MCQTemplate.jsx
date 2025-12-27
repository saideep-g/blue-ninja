import React, { useState } from 'react';

export function MCQTemplate({ question, onAnswer, disabled = false }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (index) => {
    if (!submitted) setSelectedIndex(index);
  };

  const handleSubmit = () => {
    if (selectedIndex !== null && !submitted) {
      const isCorrect = selectedIndex === question.answer_key.correctOptionIndex;
      onAnswer({
        answer: question.interaction.config.options[selectedIndex].text,
        isCorrect,
        selectedIndex
      });
      setSubmitted(true);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-6">
      {/* Prompt */}
      <div className="text-lg font-semibold text-gray-900">
        {question.prompt.text}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.interaction.config.options.map((option, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            disabled={submitted}
            className={`w-full p-4 text-left border-2 rounded-lg transition-all ${
              selectedIndex === idx
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 bg-white hover:border-blue-300'
            } ${submitted ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedIndex === idx ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                }`}
              >
                {selectedIndex === idx && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <span className="text-gray-800">{option.text}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Result Feedback */}
      {submitted && (
        <div
          className={`p-4 rounded-lg ${
            question.answer_key.correctOptionIndex === selectedIndex
              ? 'bg-green-50 border-l-4 border-green-500'
              : 'bg-red-50 border-l-4 border-red-500'
          }`}
        >
          <p
            className={`font-semibold ${
              question.answer_key.correctOptionIndex === selectedIndex
                ? 'text-green-800'
                : 'text-red-800'
            }`}
          >
            {question.answer_key.correctOptionIndex === selectedIndex ? '✓ Correct!' : '✗ Try again'}
          </p>
          {question.feedback_map && (
            <p className="text-sm mt-2 text-gray-700">
              {question.answer_key.correctOptionIndex === selectedIndex
                ? question.feedback_map.on_correct
                : question.feedback_map.on_incorrect_attempt_1}
            </p>
          )}
        </div>
      )}

      {/* Submit Button */}
      {!submitted && selectedIndex !== null && (
        <button
          onClick={handleSubmit}
          className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Check Answer
        </button>
      )}
    </div>
  );
}
