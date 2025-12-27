import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * CLASSIFY_SORT Template
 * Drag items into categories
 * Best for: categorization, properties
 */
export function ClassifySortTemplate({ question, onAnswer, isSubmitting }) {
  const [categorized, setCategorized] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const items = question.interaction?.config?.items || [];
  const categories = question.interaction?.config?.categories || [];
  const correctClassification = question.answerKey?.classification || {};

  const handleDragStart = (e, itemId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('itemId', itemId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, categoryId) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    setCategorized({
      ...categorized,
      [itemId]: categoryId,
    });
  };

  const handleSubmit = () => {
    const isCorrect = validateClassification(categorized, correctClassification);

    const result = {
      isCorrect,
      categorized,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ Perfect classification!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Try again.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  function validateClassification(user, correct) {
    return Object.entries(correct).every(([itemId, catId]) =>
      user[itemId] === catId
    );
  }

  const unclassified = items.filter(item => !categorized[item.id]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 p-6 bg-gradient-to-br from-lime-50 to-green-50 rounded-lg">
      {/* Question */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-lime-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        <p className="text-sm text-gray-600 mt-3">Drag items into their categories:</p>
      </div>

      {/* Items */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-2">
          {unclassified.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              className="px-3 py-2 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-lg cursor-move hover:shadow-lg transition-all"
            >
              {item.label}
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((category) => (
          <div
            key={category.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, category.id)}
            className="p-4 bg-white rounded-lg border-2 border-dashed border-gray-300 min-h-32 space-y-2"
          >
            <h4 className="font-semibold text-gray-900">{category.label}</h4>
            <div className="space-y-2">
              {items
                .filter((item) => categorized[item.id] === category.id)
                .map((item) => (
                  <div
                    key={item.id}
                    className="px-3 py-2 bg-green-100 text-green-900 rounded-lg text-sm"
                  >
                    {item.label}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={unclassified.length > 0 || isSubmitting}
          className="w-full py-3 bg-lime-600 text-white rounded-lg font-semibold hover:bg-lime-700 disabled:opacity-50 transition-all"
        >
          Check Classification
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
