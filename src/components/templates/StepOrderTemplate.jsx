import React, { useState } from 'react';
import { CheckCircle, XCircle, GripVertical } from 'lucide-react';

/**
 * STEP_ORDER Template
 * Reorder steps in correct sequence
 * Best for: procedure understanding
 */
export function StepOrderTemplate({ question, onAnswer, isSubmitting }) {
  const [steps, setSteps] = useState(
    question.interaction?.config?.steps?.map((s, i) => ({ ...s, originalIndex: i })) || []
  );
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [dragging, setDragging] = useState(null);

  const correctOrder = question.answerKey?.correctOrder || [];

  const handleDragStart = (e, index) => {
    setDragging(index);
  };

  const handleDragOver = (e, index) => {
    if (dragging === null || dragging === index) return;
    const newSteps = [...steps];
    const draggedStep = newSteps[dragging];
    newSteps.splice(dragging, 1);
    newSteps.splice(index, 0, draggedStep);
    setDragging(index);
    setSteps(newSteps);
  };

  const handleDragEnd = () => {
    setDragging(null);
  };

  const handleSubmit = () => {
    const userOrder = steps.map(s => s.originalIndex);
    const isCorrect = JSON.stringify(userOrder) === JSON.stringify(correctOrder);

    const result = {
      isCorrect,
      userOrder,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ Perfect sequence!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Try a different order.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg">
      {/* Question Prompt */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-amber-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        <p className="text-sm text-gray-600 mt-3">Drag to reorder the steps:</p>
      </div>

      {/* Steps */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => {
              e.preventDefault();
              handleDragOver(e, index);
            }}
            onDragEnd={handleDragEnd}
            className={`p-4 bg-white border-2 border-gray-200 rounded-lg cursor-move hover:bg-amber-50 transition-all flex items-start gap-3 ${
              dragging === index ? 'opacity-50 bg-amber-100' : ''
            }`}
          >
            <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold text-gray-700">Step {index + 1}</div>
              <p className="text-gray-900">{step.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 transition-all"
        >
          Check Order
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
