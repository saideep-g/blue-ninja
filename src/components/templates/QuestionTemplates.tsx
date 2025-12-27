import React, { useState, useMemo } from 'react';
import { Question, QuestionResponse } from '../../types/question';
import KaTeX from 'katex';
import 'katex/dist/katex.min.css';

// Utility to render LaTeX
const renderLaTeX = (latex: string) => {
  if (!latex) return null;
  try {
    return (
      <div 
        className="math-content"
        dangerouslySetInnerHTML={{
          __html: KaTeX.renderToString(latex, { throwOnError: false })
        }}
      />
    );
  } catch (e) {
    return <span>{latex}</span>;
  }
};

interface TemplateProps {
  question: Question;
  onAnswer: (response: QuestionResponse) => void;
  showFeedback?: boolean;
  feedbackText?: string;
  isCorrect?: boolean;
}

// 1. MCQ_CONCEPT - Multiple Choice Concept
export const MCQConcept: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText,
  isCorrect
}) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const correctIndex = question.answer_key.correctOptionIndex;
    onAnswer({
      item_id: question.item_id,
      answer: selected,
      isCorrect: selected === correctIndex,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  const options = question.interaction.config.options || [];

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>
      {question.prompt.latex && renderLaTeX(question.prompt.latex)}
      
      <div className="space-y-3">
        {options.map((option: any, idx: number) => (
          <button
            key={idx}
            onClick={() => !submitted && setSelected(idx)}
            disabled={submitted}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
              selected === idx
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            } ${
              submitted && idx === question.answer_key.correctOptionIndex
                ? 'bg-green-100 border-green-500'
                : submitted && selected === idx && !isCorrect
                ? 'bg-red-100 border-red-500'
                : ''
            }`}
          >
            <div className="font-medium text-gray-900">{option.text}</div>
          </button>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Check Answer
        </button>
      )}

      {showFeedback && feedbackText && (
        <div className={`p-4 rounded-lg ${
          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {feedbackText}
        </div>
      )}
    </div>
  );
};

// 2. TWO_TIER - Answer + Reason
export const TwoTier: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedAnswer === null || selectedReason === null) return;
    setSubmitted(true);
    const isCorrect =
      selectedAnswer === question.answer_key.correctAnswerIndex &&
      selectedReason === question.answer_key.correctReasonIndex;
    onAnswer({
      item_id: question.item_id,
      answer: { answer: selectedAnswer, reason: selectedReason },
      isCorrect,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Which answer?</h3>
          <div className="space-y-2">
            {question.interaction.config.answers?.map((opt: any, idx: number) => (
              <button
                key={idx}
                onClick={() => !submitted && setSelectedAnswer(idx)}
                disabled={submitted}
                className={`w-full p-3 text-left rounded-lg border-2 ${
                  selectedAnswer === idx
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Why?</h3>
          <div className="space-y-2">
            {question.interaction.config.reasons?.map((opt: any, idx: number) => (
              <button
                key={idx}
                onClick={() => !submitted && setSelectedReason(idx)}
                disabled={submitted}
                className={`w-full p-3 text-left rounded-lg border-2 ${
                  selectedReason === idx
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300'
                }`}
              >
                {opt.text}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={selectedAnswer === null || selectedReason === null}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Check
        </button>
      )}

      {showFeedback && feedbackText && (
        <div className="p-4 rounded-lg bg-blue-100 text-blue-800">
          {feedbackText}
        </div>
      )}
    </div>
  );
};

// 3. NUMERIC_INPUT - Number Input
export const NumericInput: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText,
  isCorrect
}) => {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!value) return;
    setSubmitted(true);
    const numValue = parseFloat(value);
    const tolerance = question.scoring.params?.tolerance || 0.01;
    const correctValue = question.answer_key.value;
    const isCorrectAnswer = Math.abs(numValue - correctValue) < tolerance;

    onAnswer({
      item_id: question.item_id,
      answer: numValue,
      isCorrect: isCorrectAnswer,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>
      {question.prompt.latex && renderLaTeX(question.prompt.latex)}

      <div className="flex gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => !submitted && setValue(e.target.value)}
          disabled={submitted}
          placeholder="Enter your answer"
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
        />
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={!value}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Check
          </button>
        )}
      </div>

      {submitted && (
        <div className={`p-4 rounded-lg ${
          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isCorrect ? '✓ Correct!' : `✗ Incorrect. The answer is ${question.answer_key.value}`}
        </div>
      )}

      {showFeedback && feedbackText && (
        <div className="p-4 rounded-lg bg-blue-100 text-blue-800">
          {feedbackText}
        </div>
      )}
    </div>
  );
};

// 4. EXPRESSION_INPUT - Math Expression (Simplified)
export const ExpressionInput: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText,
  isCorrect
}) => {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!value) return;
    setSubmitted(true);
    // Simplified equivalence check
    const isCorrectAnswer = value.toLowerCase().includes(question.answer_key.equivalentForms?.[0]?.toLowerCase() || '');

    onAnswer({
      item_id: question.item_id,
      answer: value,
      isCorrect: isCorrectAnswer,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>
      {question.prompt.latex && renderLaTeX(question.prompt.latex)}

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => !submitted && setValue(e.target.value)}
          disabled={submitted}
          placeholder="e.g., 2x+3 or 3/2"
          className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none font-mono"
        />
        {!submitted && (
          <button
            onClick={handleSubmit}
            disabled={!value}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Check
          </button>
        )}
      </div>

      {submitted && (
        <div className={`p-4 rounded-lg ${
          isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {isCorrect ? '✓ Correct!' : `✗ Incorrect. Try: ${question.answer_key.equivalentForms?.[0]}`}
        </div>
      )}
    </div>
  );
};

// 5. WORKED_EXAMPLE_COMPLETE - Fill in Blanks
export const WorkedExampleComplete: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText,
  isCorrect
}) => {
  const steps = question.interaction.config.steps || [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    const allCorrect = Object.keys(question.answer_key.blanks || {}).every(
      (blankId) => {
        const userAnswer = answers[blankId]?.toLowerCase().trim();
        const correctAnswers = (question.answer_key.blanks?.[blankId] || []).map((a: string) => a.toLowerCase());
        return correctAnswers.includes(userAnswer);
      }
    );

    onAnswer({
      item_id: question.item_id,
      answer: answers,
      isCorrect: allCorrect,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>
      <p className="text-gray-700 italic">{question.instruction}</p>

      <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
        {steps.map((step: any, idx: number) => (
          <div key={idx}>
            <div className="text-gray-800 mb-2">
              {step.line.split('__blank__').map((part: string, i: number) => (
                <span key={i}>
                  {renderLaTeX(part) || part}
                  {i < step.line.split('__blank__').length - 1 && (
                    <input
                      type="text"
                      value={answers[step.blank_id] || ''}
                      onChange={(e) => !submitted && setAnswers({ ...answers, [step.blank_id]: e.target.value })}
                      disabled={submitted}
                      placeholder="?"
                      className="inline-block w-24 px-2 py-1 border-2 border-blue-300 rounded mx-2 text-center"
                    />
                  )}
                </span>
              ))}
            </div>
            {step.blank_prompts && (
              <p className="text-sm text-gray-600 ml-4">→ {step.blank_prompts}</p>
            )}
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Check All
        </button>
      )}

      {submitted && isCorrect && (
        <div className="p-4 rounded-lg bg-green-100 text-green-800">
          ✓ Perfect! All blanks filled correctly.
        </div>
      )}
    </div>
  );
};

// 6. STEP_ORDER - Reorder Steps
export const StepOrder: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText,
  isCorrect
}) => {
  const [steps, setSteps] = useState(
    question.interaction.config.steps?.map((s: any, i: number) => ({ ...s, id: i })) || []
  );
  const [submitted, setSubmitted] = useState(false);
  const [draggedId, setDraggedId] = useState<number | null>(null);

  const handleDragStart = (id: number) => {
    setDraggedId(id);
  };

  const handleDrop = (targetId: number) => {
    if (draggedId === null) return;
    const newSteps = [...steps];
    const draggedIdx = newSteps.findIndex((s) => s.id === draggedId);
    const targetIdx = newSteps.findIndex((s) => s.id === targetId);
    [newSteps[draggedIdx], newSteps[targetIdx]] = [newSteps[targetIdx], newSteps[draggedIdx]];
    setSteps(newSteps);
    setDraggedId(null);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const userOrder = steps.map((s) => s.id);
    const correctOrder = question.answer_key.correctOrder;
    const isCorrectOrder = JSON.stringify(userOrder) === JSON.stringify(correctOrder);

    onAnswer({
      item_id: question.item_id,
      answer: userOrder,
      isCorrect: isCorrectOrder,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>
      <p className="text-gray-700 italic">{question.instruction}</p>

      <div className="space-y-3">
        {steps.map((step: any, idx: number) => (
          <div
            key={step.id}
            draggable={!submitted}
            onDragStart={() => handleDragStart(step.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(step.id)}
            className={`p-4 border-2 rounded-lg cursor-move transition-all ${
              draggedId === step.id
                ? 'border-blue-500 bg-blue-50 opacity-50'
                : 'border-gray-300 bg-gray-50'
            }`}
          >
            <span className="font-bold text-blue-600 mr-3">{idx + 1}.</span>
            {step.text}
          </div>
        ))}
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Check Order
        </button>
      )}

      {submitted && isCorrect && (
        <div className="p-4 rounded-lg bg-green-100 text-green-800">
          ✓ Perfect order!
        </div>
      )}
    </div>
  );
};

// 7. ERROR_ANALYSIS - Find & Fix Errors
export const ErrorAnalysis: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText,
  isCorrect
}) => {
  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [explanation, setExplanation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedLine === null) return;
    setSubmitted(true);
    const correctLine = question.answer_key.first_wrong_line_index;
    const isCorrectLine = selectedLine === correctLine;

    onAnswer({
      item_id: question.item_id,
      answer: { line: selectedLine, explanation },
      isCorrect: isCorrectLine,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  const lines = question.interaction.config.student_work?.lines || [];

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>
      <p className="text-gray-700 italic">{question.instruction}</p>

      <div className="bg-gray-50 p-6 rounded-lg space-y-3">
        {lines.map((line: string, idx: number) => (
          <button
            key={idx}
            onClick={() => !submitted && setSelectedLine(idx)}
            disabled={submitted}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
              selectedLine === idx
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <span className="font-mono text-gray-800">{line}</span>
          </button>
        ))}
      </div>

      {selectedLine !== null && !submitted && (
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Explain why this line is wrong (optional)"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
          rows={3}
        />
      )}

      {!submitted && selectedLine !== null && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Check
        </button>
      )}

      {submitted && isCorrect && (
        <div className="p-4 rounded-lg bg-green-100 text-green-800">
          ✓ You found the error!
        </div>
      )}
    </div>
  );
};

// 8. CLASSIFY_SORT - Drag into Bins
export const ClassifySort: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText,
  isCorrect
}) => {
  const bins = question.interaction.config.bins || [];
  const items = question.interaction.config.items || [];
  const [binAssignments, setBinAssignments] = useState<Record<string, string[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleDragStart = (itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDropOnBin = (binId: string) => {
    if (!draggedItem) return;
    const newAssignments = { ...binAssignments };
    if (!newAssignments[binId]) newAssignments[binId] = [];
    if (!newAssignments[binId].includes(draggedItem)) {
      newAssignments[binId].push(draggedItem);
    }
    // Remove from other bins
    Object.keys(newAssignments).forEach((b) => {
      if (b !== binId) {
        newAssignments[b] = newAssignments[b].filter((id) => id !== draggedItem);
      }
    });
    setBinAssignments(newAssignments);
    setDraggedItem(null);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    let allCorrect = true;
    items.forEach((item: any) => {
      const assignedBin = Object.keys(binAssignments).find((b) =>
        binAssignments[b]?.includes(item.item_id)
      );
      const correctBin = question.answer_key.mapping[item.item_id];
      if (assignedBin !== correctBin) allCorrect = false;
    });

    onAnswer({
      item_id: question.item_id,
      answer: binAssignments,
      isCorrect: allCorrect,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Items to sort */}
        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
          {items.map((item: any) => {
            const isAssigned = Object.values(binAssignments).some((b) =>
              b?.includes(item.item_id)
            );
            return (
              <div
                key={item.item_id}
                draggable={!submitted && !isAssigned}
                onDragStart={() => handleDragStart(item.item_id)}
                className={`p-3 bg-white border-2 rounded-lg cursor-move transition-all ${
                  isAssigned ? 'opacity-30 cursor-not-allowed' : 'border-gray-300 hover:border-blue-300'
                }`}
              >
                {item.label}
              </div>
            );
          })}
        </div>

        {/* Bins */}
        <div className="space-y-3">
          {bins.map((bin: any) => (
            <div
              key={bin.bin_id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => !submitted && handleDropOnBin(bin.bin_id)}
              className="p-4 border-2 border-dashed border-gray-300 rounded-lg bg-blue-50 min-h-24"
            >
              <h4 className="font-semibold text-gray-900 mb-2">{bin.label}</h4>
              {binAssignments[bin.bin_id]?.map((itemId) => {
                const item = items.find((i) => i.item_id === itemId);
                return (
                  <div
                    key={itemId}
                    className="p-2 bg-blue-100 border border-blue-300 rounded text-sm mb-1"
                  >
                    {item?.label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Check Classification
        </button>
      )}

      {submitted && isCorrect && (
        <div className="p-4 rounded-lg bg-green-100 text-green-800">
          ✓ Perfect classification!
        </div>
      )}
    </div>
  );
};

// 9. NUMBER_LINE_PLACE - Drag on Number Line
export const NumberLinePlace: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText,
  isCorrect
}) => {
  const { min, max, snap } = question.interaction.config.number_line;
  const [value, setValue] = useState(question.interaction.config.start_marker);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!submitted) {
      const newValue = Math.round(parseFloat(e.target.value) / snap) * snap;
      setValue(Math.max(min, Math.min(max, newValue)));
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const correctValue = question.answer_key.value;
    const isCorrect = Math.abs(value - correctValue) < 0.5;

    onAnswer({
      item_id: question.item_id,
      answer: value,
      isCorrect,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>

      <div className="space-y-6 bg-gray-50 p-8 rounded-lg">
        {/* Number Line */}
        <svg width="100%" height="100" viewBox="0 0 500 60">
          {/* Line */}
          <line x1="30" y1="30" x2="470" y2="30" stroke="#333" strokeWidth="2" />
          {/* Ticks */}
          {Array.from({ length: max - min + 1 }).map((_, i) => {
            const x = 30 + ((i / (max - min)) * 440);
            return (
              <g key={i}>
                <line x1={x} y1="20" x2={x} y2="40" stroke="#333" strokeWidth="1" />
                <text x={x} y="55" textAnchor="middle" fontSize="12">
                  {min + i}
                </text>
              </g>
            );
          })}
          {/* Marker */}
          <circle
            cx={30 + (((value - min) / (max - min)) * 440)}
            cy="30"
            r="8"
            fill="#3B82F6"
          />
        </svg>

        {/* Slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={snap}
          value={value}
          onChange={handleChange}
          disabled={submitted}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />

        <div className="text-center text-xl font-semibold text-gray-900">
          Current position: {value}
        </div>
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Check
        </button>
      )}

      {submitted && isCorrect && (
        <div className="p-4 rounded-lg bg-green-100 text-green-800">
          ✓ Correct position!
        </div>
      )}
    </div>
  );
};

// 10. MATCHING - Match Pairs
export const Matching: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText,
  isCorrect
}) => {
  const leftItems = question.interaction.config.left_items || [];
  const rightItems = question.interaction.config.right_items || [];
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);

  const handleLeftClick = (id: string) => {
    setSelectedLeft(selectedLeft === id ? null : id);
  };

  const handleRightClick = (id: string) => {
    if (!selectedLeft) return;
    const newMatches = { ...matches };
    newMatches[selectedLeft] = id;
    setMatches(newMatches);
    setSelectedLeft(null);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    let allCorrect = true;
    Object.keys(matches).forEach((leftId) => {
      if (matches[leftId] !== question.answer_key.mapping[leftId]) allCorrect = false;
    });

    onAnswer({
      item_id: question.item_id,
      answer: matches,
      isCorrect: allCorrect,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Left items */}
        <div className="space-y-3">
          {leftItems.map((item: any) => (
            <button
              key={item.id}
              onClick={() => !submitted && handleLeftClick(item.id)}
              disabled={submitted}
              className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                selectedLeft === item.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {item.text}
              {matches[item.id] && (
                <span className="float-right text-green-600 font-semibold">✓</span>
              )}
            </button>
          ))}
        </div>

        {/* Right items */}
        <div className="space-y-3">
          {rightItems.map((item: any) => (
            <button
              key={item.id}
              onClick={() => !submitted && handleRightClick(item.id)}
              disabled={submitted}
              className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                Object.values(matches).includes(item.id)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {item.text}
            </button>
          ))}
        </div>
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={Object.keys(matches).length < leftItems.length}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Check Matches
        </button>
      )}
    </div>
  );
};

// 11. BALANCE_OPS - Algebra Balance
export const BalanceOps: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText
}) => {
  const [stepLog, setStepLog] = useState<string[]>([]);
  const [leftValue, setLeftValue] = useState(3 * 5 + 5); // 3x + 5 where x=5
  const [rightValue, setRightValue] = useState(20);
  const [submitted, setSubmitted] = useState(false);

  const operations = question.interaction.config.operations || [];

  const applyOperation = (opId: string, value: number) => {
    const op = operations.find((o: any) => o.op_id === opId);
    if (!op) return;

    let newLeft = leftValue;
    let newRight = rightValue;

    if (op.apply === 'both_sides') {
      if (opId === 'ADD') {
        newLeft += value;
        newRight += value;
      } else if (opId === 'SUBTRACT') {
        newLeft -= value;
        newRight -= value;
      } else if (opId === 'MULTIPLY') {
        newLeft *= value;
        newRight *= value;
      } else if (opId === 'DIVIDE') {
        newLeft /= value;
        newRight /= value;
      }
    }

    setLeftValue(newLeft);
    setRightValue(newRight);
    setStepLog([...stepLog, `${opId}: ${op.label}`]);
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>

      {/* Balance Visual */}
      <div className="bg-gradient-to-b from-blue-50 to-blue-100 p-8 rounded-lg">
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{leftValue}</div>
            <div className="text-sm text-gray-600">Left side</div>
          </div>
          <div className="text-3xl text-gray-600">=</div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{rightValue}</div>
            <div className="text-sm text-gray-600">Right side</div>
          </div>
        </div>
      </div>

      {/* Operations */}
      <div className="grid grid-cols-2 gap-3">
        {operations.map((op: any) => (
          <button
            key={op.op_id}
            onClick={() => applyOperation(op.op_id, op.value)}
            disabled={submitted}
            className="py-3 px-4 bg-blue-100 hover:bg-blue-200 text-blue-900 font-semibold rounded-lg transition-all"
          >
            {op.label}
          </button>
        ))}
      </div>

      {/* Step Log */}
      {stepLog.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2">Steps taken:</h4>
          <div className="space-y-1">
            {stepLog.map((step, idx) => (
              <div key={idx} className="text-sm text-gray-700">
                {idx + 1}. {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {!submitted && (
        <button
          onClick={() => setSubmitted(true)}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Check Balance
        </button>
      )}
    </div>
  );
};

// 12. GEOMETRY_TAP - Tap on Diagram
export const GeometryTap: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText
}) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const regions = question.interaction.config.regions || [];

  const handleSubmit = () => {
    setSubmitted(true);
    const correctRegion = question.answer_key.correct_region_id;
    onAnswer({
      item_id: question.item_id,
      answer: selected,
      isCorrect: selected === correctRegion,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>

      <div className="bg-gray-100 p-6 rounded-lg">
        <svg width="100%" viewBox="0 0 400 300" className="border-2 border-gray-300 rounded">
          {/* Diagram (simplified - could be more complex) */}
          <circle cx="100" cy="100" r="50" fill="rgba(59, 130, 246, 0.1)" stroke="#3B82F6" strokeWidth="2" />
          <circle cx="200" cy="100" r="50" fill="rgba(239, 68, 68, 0.1)" stroke="#EF4444" strokeWidth="2" />
          <circle cx="150" cy="180" r="50" fill="rgba(16, 185, 129, 0.1)" stroke="#10B981" strokeWidth="2" />
          <text x="100" y="105" textAnchor="middle" fontSize="12" fill="#3B82F6">Region A</text>
          <text x="200" y="105" textAnchor="middle" fontSize="12" fill="#EF4444">Region B</text>
          <text x="150" y="185" textAnchor="middle" fontSize="12" fill="#10B981">Region C</text>
        </svg>
      </div>

      <p className="text-gray-700">Tap the region that {question.instruction}</p>

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Check
        </button>
      )}
    </div>
  );
};

// 13. MULTI_STEP_WORD - Multi-step Word Problem
export const MultiStepWord: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText,
  isCorrect
}) => {
  const [step1, setStep1] = useState('');
  const [step2, setStep2] = useState('');
  const [finalAnswer, setFinalAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    const correct = finalAnswer === String(question.answer_key.final_answer);
    onAnswer({
      item_id: question.item_id,
      answer: { step1, step2, finalAnswer },
      isCorrect: correct,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>

      <div className="space-y-4 bg-gray-50 p-6 rounded-lg">
        <div>
          <label className="block font-semibold text-gray-900 mb-2">Step 1: {question.interaction.config.step_labels?.[0]}</label>
          <input
            type="text"
            value={step1}
            onChange={(e) => !submitted && setStep1(e.target.value)}
            disabled={submitted}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-900 mb-2">Step 2: {question.interaction.config.step_labels?.[1]}</label>
          <input
            type="text"
            value={step2}
            onChange={(e) => !submitted && setStep2(e.target.value)}
            disabled={submitted}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-900 mb-2">Final Answer:</label>
          <input
            type="text"
            value={finalAnswer}
            onChange={(e) => !submitted && setFinalAnswer(e.target.value)}
            disabled={submitted}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {!submitted && (
        <button
          onClick={handleSubmit}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
        >
          Check All Steps
        </button>
      )}

      {submitted && isCorrect && (
        <div className="p-4 rounded-lg bg-green-100 text-green-800">
          ✓ Correct! All steps and final answer are right.
        </div>
      )}
    </div>
  );
};

// 14. SHORT_EXPLAIN - Short Explanation
export const ShortExplain: React.FC<TemplateProps> = ({
  question,
  onAnswer,
  showFeedback,
  feedbackText
}) => {
  const [explanation, setExplanation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    // Simplified check: look for key words
    const keyWords = question.answer_key.key_words || [];
    const userText = explanation.toLowerCase();
    const hasKeyWords = keyWords.some((kw: string) =>
      userText.includes(kw.toLowerCase())
    );

    onAnswer({
      item_id: question.item_id,
      answer: explanation,
      isCorrect: hasKeyWords,
      feedback: feedbackText || '',
      attempt: 1,
      time_taken_seconds: 0
    });
  };

  return (
    <div className="bg-white p-8 rounded-lg space-y-6">
      <div className="text-2xl font-semibold text-gray-900">
        {question.prompt.text}
      </div>
      <p className="text-gray-700 italic">{question.instruction}</p>

      <textarea
        value={explanation}
        onChange={(e) => !submitted && setExplanation(e.target.value)}
        disabled={submitted}
        placeholder="Write your explanation here..."
        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
        rows={4}
      />

      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!explanation.trim()}
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Submit Explanation
        </button>
      )}

      {submitted && (
        <div className="p-4 rounded-lg bg-blue-100 text-blue-800">
          <p className="font-semibold mb-2">Your explanation:</p>
          <p className="mb-3">"{explanation}"</p>
          <p className="text-sm">Teacher will review this response.</p>
        </div>
      )}
    </div>
  );
};

// Question Renderer - Automatically routes to correct template
export const QuestionRenderer: React.FC<TemplateProps> = (props) => {
  const { question } = props;
  const template = question.template_id;

  const components: Record<string, React.FC<TemplateProps>> = {
    MCQ_CONCEPT: MCQConcept,
    TWO_TIER: TwoTier,
    NUMERIC_INPUT: NumericInput,
    EXPRESSION_INPUT: ExpressionInput,
    WORKED_EXAMPLE_COMPLETE: WorkedExampleComplete,
    STEP_ORDER: StepOrder,
    ERROR_ANALYSIS: ErrorAnalysis,
    CLASSIFY_SORT: ClassifySort,
    NUMBER_LINE_PLACE: NumberLinePlace,
    MATCHING: Matching,
    BALANCE_OPS: BalanceOps,
    GEOMETRY_TAP: GeometryTap,
    MULTI_STEP_WORD: MultiStepWord,
    SHORT_EXPLAIN: ShortExplain,
    SIMULATION: ShortExplain // Placeholder
  };

  const Component = components[template];
  if (!Component) {
    return <div className="text-red-600">Unknown template: {template}</div>;
  }

  return <Component {...props} />;
};

export default QuestionRenderer;
