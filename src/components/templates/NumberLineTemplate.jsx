import React, { useState, useRef } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * NUMBER_LINE_PLACE Template
 * Drag numbers onto number line
 * Best for: magnitude, comparison, representation
 */
export function NumberLineTemplate({ question, onAnswer, isSubmitting }) {
  const [placed, setPlaced] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const containerRef = useRef(null);

  const items = question.interaction?.config?.items || [];
  const min = question.interaction?.config?.minValue || 0;
  const max = question.interaction?.config?.maxValue || 100;
  const correctPositions = question.answerKey?.positions || {};

  const handleDragStart = (e, itemId) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('itemId', itemId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (submitted) return;

    const itemId = e.dataTransfer.getData('itemId');
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const value = min + ((max - min) * percentage) / 100;

    setPlaced({
      ...placed,
      [itemId]: Math.round(value * 2) / 2,
    });
  };

  const handleSubmit = () => {
    const isCorrect = validatePlacement(placed, correctPositions);

    const result = {
      isCorrect,
      placed,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ Perfectly placed!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Check the positions and try again.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  function validatePlacement(placed, correct) {
    return Object.entries(placed).every(([itemId, value]) => {
      const expectedValue = correct[itemId];
      return expectedValue && Math.abs(value - expectedValue) <= 2;
    });
  }

  const getPosition = (value) => ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-green-50 to-teal-50 rounded-lg">
      {/* Question Prompt */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        {question.content?.instruction && (
          <p className="text-sm text-gray-600 mt-3">{question.content.instruction}</p>
        )}
      </div>

      {/* Draggable Items */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
        <p className="text-sm font-semibold text-gray-700">Drag items to the number line:</p>
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
              className="px-4 py-2 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-lg cursor-move hover:shadow-lg transition-all font-semibold"
            >
              {item.label || item.value}
            </div>
          ))}
        </div>
      </div>

      {/* Number Line */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        {/* Drop Zone */}
        <div
          ref={containerRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="relative h-20 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center px-4"
        >
          {/* Line */}
          <div className="absolute bottom-8 left-4 right-4 h-1 bg-gray-400" />

          {/* Tick marks */}
          {[0, 25, 50, 75, 100].map((pos) => (
            <div
              key={pos}
              className="absolute bottom-6 w-0.5 h-3 bg-gray-400"
              style={{ left: `calc(${pos}% + 1rem)` }}
            />
          ))}

          {/* Placed items */}
          {Object.entries(placed).map(([itemId, value]) => (
            <div
              key={itemId}
              className="absolute bottom-10 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold"
              style={{ left: `calc(${getPosition(value)}% + 1rem)` }}
            >
              {value}
            </div>
          ))}
        </div>

        {/* Scale Labels */}
        <div className="flex justify-between text-xs text-gray-600 font-semibold">
          <span>{min}</span>
          <span>{min + (max - min) / 2}</span>
          <span>{max}</span>
        </div>
      </div>

      {/* Submit Button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(placed).length === 0 || isSubmitting}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Check Placement
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
