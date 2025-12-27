import React, { useState } from 'react';
import { CheckCircle, Zap, RotateCcw } from 'lucide-react';

/**
 * SIMULATION Template
 * Interactive simulation for exploration
 * Best for: probability, intuition building
 */
export function SimulationTemplate({ question, onAnswer, isSubmitting }) {
  const [simCount, setSimCount] = useState(0);
  const [results, setResults] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const runSimulation = () => {
    const outcome = Math.random() > 0.5 ? 'success' : 'failure';
    setResults([...results, outcome]);
    setSimCount(simCount + 1);
  };

  const handleSubmit = () => {
    const successRate = results.filter(r => r === 'success').length / results.length;

    const result = {
      isCorrect: Math.abs(successRate - 0.5) < 0.1,
      simCount,
      successRate,
      feedback: question.feedbackMap?.onCorrect || '✓ Great observation!',
    };

    setFeedback(result);
    setSubmitted(true);
    onAnswer(result);
  };

  const successCount = results.filter(r => r === 'success').length;
  const failureCount = results.length - successCount;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-lg">
      {/* Question */}
      <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-fuchsia-500">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {question.content?.prompt?.text}
        </h2>
        <p className="text-sm text-gray-600 mt-3">{question.content?.instruction}</p>
      </div>

      {/* Simulation Display */}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{successCount}</div>
            <p className="text-xs text-green-700">Successes</p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{failureCount}</div>
            <p className="text-xs text-red-700">Failures</p>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{simCount}</div>
            <p className="text-xs text-blue-700">Total</p>
          </div>
        </div>

        {/* Results Visualization */}
        {results.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`w-6 h-6 rounded-full ${
                  result === 'success' ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={runSimulation}
          disabled={submitted}
          className="flex-1 py-3 bg-fuchsia-600 text-white rounded-lg font-semibold hover:bg-fuchsia-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Run Trial
        </button>
        <button
          onClick={() => {
            setSimCount(0);
            setResults([]);
            setSubmitted(false);
          }}
          className="flex-1 py-3 border-2 border-fuchsia-300 text-fuchsia-700 rounded-lg font-semibold hover:bg-fuchsia-50 transition-all flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {simCount >= 10 && !submitted && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
        >
          Analyze Results
        </button>
      )}

      {/* Feedback */}
      {submitted && feedback && (
        <div className="p-4 rounded-lg border-l-4 bg-green-50 border-green-500 text-green-800 flex gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{feedback.feedback}</p>
            <p className="text-sm mt-1">Success rate: {(feedback.successRate * 100).toFixed(1)}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
