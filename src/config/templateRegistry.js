/**
 * Template Registry - Complete catalog of all 14 question templates
 * Maps template IDs to their configurations, UI components, and metadata
 */

export const TEMPLATE_REGISTRY = {
  MCQ_CONCEPT: {
    id: 'MCQ_CONCEPT',
    name: 'Multiple Choice Question',
    description: 'Choose the best answer from multiple options',
    icon: '◉',
    category: 'Concept Check',
    bestFor: ['concept discrimination', 'vocabulary', 'quick checks'],
    uiInputMode: 'choice',
    scoringModel: 'exact',
    supportsHints: true,
    supportsTimer: true,
    difficulty: 'Easy to Hard',
    timeEstimate: '2-3 min',
    example: {
      prompt: 'What is 5 + 3?',
      options: ['7', '8', '9', '10'],
      correctOptionIndex: 1
    }
  },

  TWO_TIER: {
    id: 'TWO_TIER',
    name: 'Two-Tier (Answer + Reason)',
    description: 'Choose answer AND the reasoning behind it',
    icon: '⟲',
    category: 'Reasoning',
    bestFor: ['reduce guessing', 'concept + justification'],
    uiInputMode: 'choice',
    scoringModel: 'exact',
    supportsHints: true,
    supportsTimer: false,
    difficulty: 'Medium',
    timeEstimate: '3-4 min',
    example: {
      prompt: 'Which is larger: 3/4 or 2/3?',
      tierOne: {
        options: ['3/4', '2/3', 'Equal'],
        correct: 0
      },
      tierTwo: {
        options: ['Because 3 > 2', 'Because 3/4 = 0.75 and 2/3 ≈ 0.67', 'Need a calculator'],
        correct: 1
      }
    }
  },

  NUMERIC_INPUT: {
    id: 'NUMERIC_INPUT',
    name: 'Numeric Input',
    description: 'Enter a number as your answer',
    icon: '#',
    category: 'Computation',
    bestFor: ['retrieval', 'fluency', 'reduced guessing'],
    uiInputMode: 'number',
    scoringModel: 'exact',
    supportsHints: true,
    supportsTimer: true,
    difficulty: 'Easy to Hard',
    timeEstimate: '1-2 min',
    example: {
      prompt: 'Solve: 2x + 3 = 11. What is x?',
      answer: 4,
      tolerance: 0.01
    }
  },

  EXPRESSION_INPUT: {
    id: 'EXPRESSION_INPUT',
    name: 'Expression Input',
    description: 'Simplify or write algebraic expressions (equivalence-checked)',
    icon: '∑',
    category: 'Algebra',
    bestFor: ['algebra', 'simplification', 'generalization'],
    uiInputMode: 'math_input',
    scoringModel: 'equivalence',
    supportsHints: true,
    supportsTimer: false,
    difficulty: 'Hard',
    timeEstimate: '2-3 min',
    example: {
      prompt: 'Simplify: 2x + 3x + 5',
      validAnswers: ['5x + 5', '5(x + 1)']
    }
  },

  WORKED_EXAMPLE_COMPLETE: {
    id: 'WORKED_EXAMPLE_COMPLETE',
    name: 'Worked Example Completion',
    description: 'Fill in the blanks in a step-by-step solution',
    icon: '...',
    category: 'Scaffolding',
    bestFor: ['scaffolded learning', 'procedures', 'reducing cognitive load'],
    uiInputMode: 'fill',
    scoringModel: 'exact',
    supportsHints: true,
    supportsTimer: false,
    difficulty: 'Medium',
    timeEstimate: '3-5 min',
    example: {
      prompt: 'Complete: (3/4) ÷ (2/3)',
      steps: [
        'Step 1: __ (reciprocal)',
        'Step 2: Multiply',
        'Step 3: __ (simplify)'
      ]
    }
  },

  STEP_ORDER: {
    id: 'STEP_ORDER',
    name: 'Order the Steps',
    description: 'Arrange steps in the correct sequence',
    icon: '①②③',
    category: 'Procedure',
    bestFor: ['procedural understanding', 'equations', 'multi-step'],
    uiInputMode: 'drag',
    scoringModel: 'order',
    supportsHints: true,
    supportsTimer: false,
    difficulty: 'Medium',
    timeEstimate: '3-4 min',
    example: {
      prompt: 'Order these steps to solve 2x + 5 = 13',
      steps: [
        'Write: 2x = 8',
        'Subtract 5 from both sides',
        'Write: x = 4',
        'Divide both sides by 2'
      ],
      correctOrder: [1, 3, 2, 0]
    }
  },

  ERROR_ANALYSIS: {
    id: 'ERROR_ANALYSIS',
    name: 'Error Analysis',
    description: 'Find and fix the mistake in student work',
    icon: '✗',
    category: 'Metacognition',
    bestFor: ['misconceptions', 'transfer', 'metacognition'],
    uiInputMode: 'select+explain',
    scoringModel: 'rubric_lite',
    supportsHints: true,
    supportsTimer: false,
    difficulty: 'Hard',
    timeEstimate: '4-5 min',
    example: {
      prompt: 'Find the error: Student calculated 25% of 80 as 25 × 80 = 2000',
      lines: [
        '25% of 80',
        '= 25 × 80 ✗',
        '= 2000 ✗'
      ],
      firstWrongLine: 1
    }
  },

  CLASSIFY_SORT: {
    id: 'CLASSIFY_SORT',
    name: 'Classify & Sort',
    description: 'Drag items into categories',
    icon: '⇄',
    category: 'Categorization',
    bestFor: ['properties', 'types', 'sets', 'angles'],
    uiInputMode: 'drag',
    scoringModel: 'set_membership',
    supportsHints: true,
    supportsTimer: false,
    difficulty: 'Medium',
    timeEstimate: '3-4 min',
    example: {
      prompt: 'Sort triangles by type',
      items: ['6,6,6', '5,5,8', '4,6,7'],
      bins: ['Equilateral', 'Isosceles', 'Scalene'],
      correctMapping: { 0: 0, 1: 1, 2: 2 }
    }
  },

  NUMBER_LINE_PLACE: {
    id: 'NUMBER_LINE_PLACE',
    name: 'Number Line Placement',
    description: 'Place a point on a number line',
    icon: '⬛',
    category: 'Representation',
    bestFor: ['magnitude', 'fractions', 'integers', 'inequalities'],
    uiInputMode: 'drag',
    scoringModel: 'tolerance',
    supportsHints: true,
    supportsTimer: false,
    difficulty: 'Easy to Medium',
    timeEstimate: '2-3 min',
    example: {
      prompt: 'Place -3 + 5 on the number line',
      answer: 2,
      numberLineMin: -10,
      numberLineMax: 10
    }
  },

  MATCHING: {
    id: 'MATCHING',
    name: 'Matching Pairs',
    description: 'Match left cards to right cards',
    icon: '⬌',
    category: 'Connection',
    bestFor: ['representation shifts', 'word ↔ expression', 'graph ↔ table'],
    uiInputMode: 'match',
    scoringModel: 'set_membership',
    supportsHints: true,
    supportsTimer: true,
    difficulty: 'Medium',
    timeEstimate: '3-4 min',
    example: {
      prompt: 'Match expressions to their values',
      leftCards: ['2 + 3', '5 × 2', '10 ÷ 2'],
      rightCards: ['5', '10'],
      correctMatching: [0, 1, 1]
    }
  },

  BALANCE_OPS: {
    id: 'BALANCE_OPS',
    name: 'Algebra Balance',
    description: 'Solve by applying operations to both sides',
    icon: '⚖️',
    category: 'Equations',
    bestFor: ['equations', 'inverse operations', 'equivalence'],
    uiInputMode: 'tap',
    scoringModel: 'process',
    supportsHints: true,
    supportsTimer: false,
    difficulty: 'Hard',
    timeEstimate: '4-6 min',
    example: {
      prompt: 'Solve: 3x + 5 = 20',
      equation: { left: '3x + 5', right: '20' },
      operations: ['+5', '-5', '×3', '÷3'],
      answer: 5
    }
  },

  GEOMETRY_TAP: {
    id: 'GEOMETRY_TAP',
    name: 'Tap on Diagram',
    description: 'Select parts of a geometric figure',
    icon: '◐',
    category: 'Geometry',
    bestFor: ['angles', 'symmetry', 'triangles', 'properties'],
    uiInputMode: 'tap',
    scoringModel: 'set_membership',
    supportsHints: true,
    supportsTimer: false,
    difficulty: 'Medium',
    timeEstimate: '2-3 min',
    example: {
      prompt: 'Tap on the hypotenuse',
      diagramType: 'right_triangle',
      tappableRegions: ['side1', 'side2', 'hypotenuse'],
      correctRegions: ['hypotenuse']
    }
  },

  MULTI_STEP_WORD: {
    id: 'MULTI_STEP_WORD',
    name: 'Multi-Step Word Problem',
    description: 'Solve with structured steps shown',
    icon: '📖',
    category: 'Application',
    bestFor: ['transfer', 'modeling', 'real-life math'],
    uiInputMode: 'multi_part',
    scoringModel: 'process+exact',
    supportsHints: false,
    supportsTimer: true,
    difficulty: 'Hard',
    timeEstimate: '5-8 min',
    example: {
      prompt: 'A shirt costs ₹500. After 20% discount, what is the price?',
      steps: [
        { label: 'Discount amount', type: 'number' },
        { label: 'Final price', type: 'number' }
      ]
    }
  },

  TRANSFER_MINI: {
    id: 'TRANSFER_MINI',
    name: 'Transfer Mini',
    description: 'Same concept, different wrapper',
    icon: '🔄',
    category: 'Transfer',
    bestFor: ['retention', 'generalization', 'new contexts'],
    uiInputMode: 'varies',
    scoringModel: 'exact',
    supportsHints: false,
    supportsTimer: true,
    difficulty: 'Medium to Hard',
    timeEstimate: '2-3 min',
    example: {
      prompt: 'In a new context, apply the same concept',
      type: 'NUMERIC_INPUT'
    }
  },

  SIMULATION: {
    id: 'SIMULATION',
    name: 'Simulation',
    description: 'Run experiments and interpret results',
    icon: '🎲',
    category: 'Exploration',
    bestFor: ['probability', 'data handling', 'intuition building'],
    uiInputMode: 'interact',
    scoringModel: 'set_membership',
    supportsHints: true,
    supportsTimer: false,
    difficulty: 'Medium',
    timeEstimate: '4-5 min',
    example: {
      prompt: 'Simulate 100 coin flips. How many heads?',
      simulationType: 'coin_flip',
      trials: 100
    }
  },

  SHORT_EXPLAIN: {
    id: 'SHORT_EXPLAIN',
    name: 'Short Explanation',
    description: 'Write a brief justification (1-3 sentences)',
    icon: '✍️',
    category: 'Reasoning',
    bestFor: ['justification', 'reasoning', 'transfer checks'],
    uiInputMode: 'short_text',
    scoringModel: 'rubric_lite',
    supportsHints: true,
    supportsTimer: true,
    difficulty: 'Hard',
    timeEstimate: '2-3 min',
    example: {
      prompt: 'Explain why 2/3 > 1/2',
      keyPoints: ['common denominator', 'compare numerators', 'magnitude'],
      sentenceFrames: ['Because...', 'When comparing...', 'Therefore...']
    }
  }
};

/**
 * Get all templates
 */
export function getAllTemplates() {
  return Object.values(TEMPLATE_REGISTRY);
}

/**
 * Get template by ID
 */
export function getTemplate(templateId) {
  return TEMPLATE_REGISTRY[templateId];
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category) {
  return Object.values(TEMPLATE_REGISTRY).filter(t => t.category === category);
}

/**
 * Get templates for a specific phase
 */
export function getTemplatesForPhase(phase) {
  const phaseToTemplates = {
    'hook': ['GEOMETRY_TAP', 'NUMBER_LINE_PLACE', 'BALANCE_OPS', 'MATCHING'],
    'model': ['WORKED_EXAMPLE_COMPLETE'],
    'guided': ['WORKED_EXAMPLE_COMPLETE', 'BALANCE_OPS', 'NUMBER_LINE_PLACE', 'CLASSIFY_SORT'],
    'independent': ['NUMERIC_INPUT', 'EXPRESSION_INPUT', 'TWO_TIER', 'MCQ_CONCEPT'],
    'misconception': ['ERROR_ANALYSIS', 'MCQ_CONCEPT'],
    'transfer': ['MULTI_STEP_WORD', 'TRANSFER_MINI', 'SHORT_EXPLAIN']
  };
  return (phaseToTemplates[phase] || []).map(id => TEMPLATE_REGISTRY[id]);
}

/**
 * Get all categories
 */
export function getAllCategories() {
  const categories = new Set(Object.values(TEMPLATE_REGISTRY).map(t => t.category));
  return Array.from(categories).sort();
}
