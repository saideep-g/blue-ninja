import React, { useState } from 'react';
import { ChevronLeft, Grid } from 'lucide-react';
import { MCQTemplate } from '../components/templates/MCQTemplate';
import { NumericInputTemplate } from '../components/templates/NumericInputTemplate';
import { BalanceOpsTemplate } from '../components/templates/BalanceOpsTemplate';
import { NumberLineTemplate } from '../components/templates/NumberLineTemplate';
import { TwoTierTemplate } from '../components/templates/TwoTierTemplate';
import { ExpressionInputTemplate } from '../components/templates/ExpressionInputTemplate';
import { WorkedExampleTemplate } from '../components/templates/WorkedExampleTemplate';
import { ErrorAnalysisTemplate } from '../components/templates/ErrorAnalysisTemplate';
import { ClassifySortTemplate } from '../components/templates/ClassifySortTemplate';
import { MatchingTemplate } from '../components/templates/MatchingTemplate';
import { GeometryTapTemplate } from '../components/templates/GeometryTapTemplate';
import { StepOrderTemplate } from '../components/templates/StepOrderTemplate';
import { MultiStepWordTemplate } from '../components/templates/MultiStepWordTemplate';
import { SimulationTemplate } from '../components/templates/SimulationTemplate';
import { ShortExplainTemplate } from '../components/templates/ShortExplainTemplate';

// Sample questions for each template
const SAMPLE_QUESTIONS = {
  MCQ_CONCEPT: {
    content: {
      prompt: { text: 'What is the value of 7 + 5?' },
      instruction: 'Choose the correct answer from the options below.'
    },
    interaction: {
      config: {
        options: [
          { text: '10', id: 1 },
          { text: '12', id: 2 },
          { text: '14', id: 3 },
          { text: '16', id: 4 }
        ]
      }
    },
    answerKey: { correctOptionIndex: 1 },
    feedbackMap: { onCorrect: '✓ Correct! 7 + 5 = 12' },
    workedSolution: {
      steps: ['Count 7', 'Add 5 more', 'Result is 12'],
      finalAnswer: '12'
    }
  },
  NUMERIC_INPUT: {
    content: {
      prompt: { text: 'Solve: 2x = 10. What is x?', latex: '2x = 10' },
      instruction: 'Enter the value of x'
    },
    interaction: {},
    answerKey: { value: 5, tolerance: 0.01 },
    feedbackMap: { onCorrect: '✓ Correct! x = 5' },
    workedSolution: {
      steps: ['2x = 10', 'Divide both sides by 2', 'x = 5'],
      finalAnswer: '5'
    }
  },
  BALANCE_OPS: {
    content: {
      prompt: { text: 'Solve for x using balance moves: 3x + 5 = 20' },
      instruction: 'Tap operations to do the SAME thing to both sides until x is alone.'
    },
    interaction: {
      config: {
        equation: {
          left: { format: 'axplusb', a: 3, b: 5, variable: 'x' },
          right: { format: 'const', value: 20 }
        },
        operations: [
          { opId: 'ADD', label: '+5', value: 5, applyBothSides: true },
          { opId: 'SUBTRACT', label: '-5', value: 5, applyBothSides: true },
          { opId: 'MULTIPLY', label: '×3', value: 3, applyBothSides: true },
          { opId: 'DIVIDE', label: '÷3', value: 3, applyBothSides: true }
        ],
        maxSteps: 3,
        showStepLog: true
      }
    },
    answerKey: { xValue: 5 },
    misconceptions: [
      { category: 'UNDOORDER', tag: 'DIVIDEBEFORESUBTRACT', hint: 'Undo the 5 first.' }
    ],
    feedbackMap: { onCorrect: '✓ Perfect! You solved it correctly!' }
  },
  NUMBER_LINE_PLACE: {
    content: {
      prompt: { text: 'Place the numbers on the number line' },
      instruction: 'Drag each number to its correct position.'
    },
    interaction: {
      config: {
        items: [
          { id: 'a', label: '25', value: 25 },
          { id: 'b', label: '75', value: 75 }
        ],
        minValue: 0,
        maxValue: 100
      }
    },
    answerKey: { positions: { a: 25, b: 75 } },
    feedbackMap: { onCorrect: '✓ Perfect placement!' }
  },
  TWO_TIER: {
    content: {
      prompt: { text: 'What is the product of 8 and 7?' },
      instruction: 'Answer and explain your reasoning.'
    },
    interaction: {
      config: {
        tier1Options: [
          { text: '54', id: 1 },
          { text: '56', id: 2 },
          { text: '58', id: 3 }
        ],
        tier2Prompt: 'How did you calculate this?'
      }
    },
    answerKey: { tier1CorrectIndex: 1 },
    feedbackMap: { onCorrect: '✓ Correct reasoning!' }
  },
  EXPRESSION_INPUT: {
    content: {
      prompt: { text: 'Simplify: 2x + 3x', latex: '2x + 3x' },
      instruction: 'Enter the simplified expression.'
    },
    interaction: { config: { format: 'algebraic' } },
    answerKey: { expression: '5x' },
    feedbackMap: { onCorrect: '✓ Correct simplification!' }
  },
  WORKED_EXAMPLE_COMPLETE: {
    content: {
      prompt: { text: 'Complete the worked solution' }
    },
    interaction: {
      config: {
        steps: [
          { text: 'Start with: 2x + 3 = ___ ' },
          { text: 'Subtract 3: 2x = ___' },
          { text: 'Divide by 2: x = ___' }
        ]
      }
    },
    answerKey: { blankAnswers: { 'step0_blank0': '11', 'step1_blank0': '8', 'step2_blank0': '4' } },
    feedbackMap: { onCorrect: '✓ Perfect completion!' }
  },
  ERROR_ANALYSIS: {
    content: {
      prompt: { text: 'Find the error in this solution.' }
    },
    interaction: {
      config: {
        errors: [
          { text: 'x + 5 = 10, so x = 5', id: 1 },
          { text: 'x + 5 = 10, so x = 15', id: 2 },
          { text: '2x + 3 = 7, so x = 3', id: 3 }
        ]
      }
    },
    answerKey: { errorId: 1 },
    feedbackMap: { onCorrect: '✓ Error detected correctly!' }
  },
  CLASSIFY_SORT: {
    content: {
      prompt: { text: 'Classify numbers by type' }
    },
    interaction: {
      config: {
        items: [
          { id: 'a', label: '3', type: 'odd' },
          { id: 'b', label: '4', type: 'even' },
          { id: 'c', label: '5', type: 'odd' }
        ],
        categories: [
          { id: 'odd', label: 'Odd' },
          { id: 'even', label: 'Even' }
        ]
      }
    },
    answerKey: { classification: { a: 'odd', b: 'even', c: 'odd' } },
    feedbackMap: { onCorrect: '✓ All classified correctly!' }
  },
  MATCHING: {
    content: {
      prompt: { text: 'Match equivalent expressions' }
    },
    interaction: {
      config: {
        leftItems: [
          { id: 'l1', label: '2 + 2' },
          { id: 'l2', label: '3 + 3' }
        ],
        rightItems: [
          { id: 'r1', label: '4' },
          { id: 'r2', label: '6' }
        ]
      }
    },
    answerKey: { matches: { l1: 'r1', l2: 'r2' } },
    feedbackMap: { onCorrect: '✓ All matches correct!' }
  },
  GEOMETRY_TAP: {
    content: {
      prompt: { text: 'Identify the right angles in the figure' },
      instruction: 'Tap on the right angles.'
    },
    interaction: {
      config: {
        tapElements: [
          { id: 'a', label: 'Angle A' },
          { id: 'b', label: 'Angle B' },
          { id: 'c', label: 'Angle C' }
        ]
      }
    },
    answerKey: { correctElementIds: ['a', 'c'] },
    feedbackMap: { onCorrect: '✓ Correct identification!' }
  },
  STEP_ORDER: {
    content: {
      prompt: { text: 'Order the steps to solve the problem' }
    },
    interaction: {
      config: {
        steps: [
          { text: 'Subtract 3 from both sides', id: 1 },
          { text: 'Divide both sides by 2', id: 2 },
          { text: 'Check your answer', id: 3 }
        ]
      }
    },
    answerKey: { correctOrder: [0, 1, 2] },
    feedbackMap: { onCorrect: '✓ Perfect order!' }
  },
  MULTI_STEP_WORD: {
    content: {
      prompt: { text: 'Solve the word problem step by step' },
      stimulus: { text: 'Maria has 10 apples. She buys 5 more. How many does she have now?' }
    },
    interaction: {
      config: {
        steps: [
          { id: 'step1', question: 'How many apples does Maria have initially?' },
          { id: 'step2', question: 'How many apples does she buy?' },
          { id: 'step3', question: 'Total apples?' }
        ]
      }
    },
    answerKey: { stepAnswers: { step1: 10, step2: 5, step3: 15 } },
    feedbackMap: { onCorrect: '✓ Excellent problem solving!' }
  },
  SIMULATION: {
    content: {
      prompt: { text: 'Simulate coin tosses' },
      instruction: 'Run trials to understand probability.'
    },
    interaction: {},
    answerKey: {},
    feedbackMap: { onCorrect: '✓ Great observation!' }
  },
  SHORT_EXPLAIN: {
    content: {
      prompt: { text: 'Explain your solution' },
      instruction: 'Write a brief explanation of how you solved this problem.'
    },
    interaction: {},
    answerKey: {},
    feedbackMap: { onCorrect: '✓ Thanks for your explanation!' }
  }
};

const TEMPLATES = [
  { id: 'MCQ_CONCEPT', name: 'Multiple Choice', component: MCQTemplate, color: 'from-blue-400 to-blue-600' },
  { id: 'NUMERIC_INPUT', name: 'Numeric Input', component: NumericInputTemplate, color: 'from-purple-400 to-purple-600' },
  { id: 'BALANCE_OPS', name: 'Balance Ops', component: BalanceOpsTemplate, color: 'from-pink-400 to-pink-600' },
  { id: 'NUMBER_LINE_PLACE', name: 'Number Line', component: NumberLineTemplate, color: 'from-green-400 to-green-600' },
  { id: 'TWO_TIER', name: 'Two-Tier', component: TwoTierTemplate, color: 'from-violet-400 to-violet-600' },
  { id: 'EXPRESSION_INPUT', name: 'Expression', component: ExpressionInputTemplate, color: 'from-orange-400 to-orange-600' },
  { id: 'WORKED_EXAMPLE_COMPLETE', name: 'Worked Example', component: WorkedExampleTemplate, color: 'from-cyan-400 to-cyan-600' },
  { id: 'ERROR_ANALYSIS', name: 'Error Analysis', component: ErrorAnalysisTemplate, color: 'from-red-400 to-red-600' },
  { id: 'CLASSIFY_SORT', name: 'Classify', component: ClassifySortTemplate, color: 'from-lime-400 to-lime-600' },
  { id: 'MATCHING', name: 'Matching', component: MatchingTemplate, color: 'from-rose-400 to-rose-600' },
  { id: 'GEOMETRY_TAP', name: 'Geometry Tap', component: GeometryTapTemplate, color: 'from-teal-400 to-teal-600' },
  { id: 'STEP_ORDER', name: 'Step Order', component: StepOrderTemplate, color: 'from-amber-400 to-amber-600' },
  { id: 'MULTI_STEP_WORD', name: 'Multi-Step', component: MultiStepWordTemplate, color: 'from-indigo-400 to-indigo-600' },
  { id: 'SIMULATION', name: 'Simulation', component: SimulationTemplate, color: 'from-fuchsia-400 to-fuchsia-600' },
  { id: 'SHORT_EXPLAIN', name: 'Short Explain', component: ShortExplainTemplate, color: 'from-slate-400 to-slate-600' }
];

export function TemplateShowcase() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const currentTemplate = selectedTemplate
    ? TEMPLATES.find(t => t.id === selectedTemplate)
    : null;
  const currentQuestion = selectedTemplate ? SAMPLE_QUESTIONS[selectedTemplate] : null;

  if (currentTemplate && currentQuestion) {
    const TemplateComponent = currentTemplate.component;
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm p-4 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{currentTemplate.name}</h1>
                <p className="text-sm text-gray-600">Template Showcase</p>
              </div>
            </div>
          </div>
        </div>

        {/* Template Display */}
        <div className="max-w-5xl mx-auto p-6">
          <TemplateComponent
            question={currentQuestion}
            onAnswer={(result) => console.log('Answer:', result)}
            isSubmitting={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm p-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
            <Grid className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Template Showcase</h1>
            <p className="text-gray-600 mt-1">Interactive preview of all 14 question templates</p>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template.id)}
              className="group bg-white rounded-lg shadow-sm hover:shadow-md border border-gray-200 hover:border-gray-300 transition-all p-6 text-left overflow-hidden"
            >
              {/* Color gradient header */}
              <div className={`h-1 w-full -mx-6 -mt-6 mb-4 bg-gradient-to-r ${template.color}`} />

              <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {template.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1 font-mono">{template.id}</p>

              {/* Description */}
              <div className="mt-4 text-sm text-gray-600">
                {{
                  MCQ_CONCEPT: 'Multiple choice with visual feedback',
                  NUMERIC_INPUT: 'Number entry with tolerance-based scoring',
                  BALANCE_OPS: 'Equation balancing with step tracking',
                  NUMBER_LINE_PLACE: 'Drag numbers to number line positions',
                  TWO_TIER: 'Answer + explanation required',
                  EXPRESSION_INPUT: 'Algebraic expression simplification',
                  WORKED_EXAMPLE_COMPLETE: 'Fill-in-the-blanks for worked solutions',
                  ERROR_ANALYSIS: 'Identify and explain errors',
                  CLASSIFY_SORT: 'Categorize items by properties',
                  MATCHING: 'Match pairs from left to right',
                  GEOMETRY_TAP: 'Tap geometric diagram elements',
                  STEP_ORDER: 'Reorder procedure steps',
                  MULTI_STEP_WORD: 'Structured word problem solving',
                  SIMULATION: 'Interactive probability simulation',
                  SHORT_EXPLAIN: 'Brief text-based explanation'
                }[template.id]}
              </div>

              {/* CTA */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Try it</span>
                <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all transform rotate-180" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
