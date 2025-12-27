import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

/**
 * WORKED_EXAMPLE_COMPLETE Template
 * Complete worked example by filling blanks
 * Best for: scaffolded learning, procedures
 */
export function WorkedExampleTemplate({ question, onAnswer, isSubmitting }) {
  const [blanks, setBlanks] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const steps = question.interaction?.config?.steps || [];
  const correctAnswers = question.answerKey?.blankAnswers || {};

  const handleBlankChange = (blankId, value) => {
    setBlanks({ ...blanks, [blankId]: value });
  };

  const handleSubmit = () => {
    const isCorrect = validateBlanks(blanks, correctAnswers);

    const result = {
      isCorrect,
      blanks,
      feedback: isCorrect
        ? question.feedbackMap?.onCorrect || '✓ Perfect completion!'
        : question.feedbackMap?.onIncorrectAttempt1 || '✗ Check your answers.',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  function validateBlanks(filled, correct) {
    return Object.entries(correct).every(([id, val]) =>
      filled[id]?.toLowerCase() === val.toLowerCase()
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg">
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-cyan-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        <p className="text-sm text-gray-600 mt-3">Fill in the blanks to complete the solution:</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="border-l-4 border-cyan-300 pl-4">
            <p className="text-sm text-gray-700 font-mono leading-relaxed">
              {step.text.split('___').map((part, i) => (
                <React.Fragment key={i}>
                  {part}
                  {i < step.text.split('___').length - 1 && (
                    <input
                      type="text"
                      value={blanks[`step${idx}_blank${i}`] || ''}
                      onChange={(e) => handleBlankChange(`step${idx}_blank${i}`, e.target.value)}
                      disabled={submitted}
                      className="inline-block w-12 px-1 border-b-2 border-cyan-400 focus:border-cyan-600 outline-none bg-cyan-50 text-center"
                      placeholder="___"
                    />
                  )}
                </React.Fragment>
              ))}
            </p>
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(blanks).length === 0 || isSubmitting}
          className="w-full py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 disabled:opacity-50 transition-all"
        >
          Check Solution
        </button>
      )}

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
