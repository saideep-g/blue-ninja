/**
 * Sample Diagnostic Questions
 * These questions are used for the diagnostic quest and testing
 * Format: Each question captures all 13 analytics fields
 */

export const SAMPLE_DIAGNOSTIC_QUESTIONS = [
    {
        id: 'Q1',
        atom: 'A1', // Fractions Basics
        type: 'MULTIPLE_CHOICE',
        difficulty: 'EASY',
        content: {
            question: 'What fraction of the circle is shaded?',
            context: '(Shows a circle with 3 out of 4 parts shaded)',
        },
        options: [
            { label: 'A', text: '1/4', isCorrect: false },
            { label: 'B', text: '3/4', isCorrect: true },
            { label: 'C', text: '1/2', isCorrect: false },
            { label: 'D', text: '4/4', isCorrect: false },
        ],
        correct_answer: 'B',
        diagnosticTags: [
            'FRACTION_READING',
            'NUMERATOR_DENOMINATOR',
            'VISUAL_FRACTION',
        ],
        commonMisconceptions: [
            {
                tag: 'INVERTED_FRACTION',
                description: 'Student reverses numerator and denominator',
                recovery: 'Explain: numerator is shaded parts, denominator is total parts',
            },
            {
                tag: 'IGNORES_SHADED',
                description: 'Student counts unshaded instead of shaded',
                recovery: 'Highlight which parts are shaded',
            },
        ],
        timeLimit: 30000, // 30 seconds
        bloomLevel: 'UNDERSTAND',
        _metadata: {
            createdAt: new Date().toISOString(),
            version: 1,
        },
    },

    {
        id: 'Q2',
        atom: 'A2', // Adding Fractions
        type: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
        content: {
            question: 'What is 1/4 + 2/4?',
        },
        options: [
            { label: 'A', text: '3/8', isCorrect: false },
            { label: 'B', text: '3/4', isCorrect: true },
            { label: 'C', text: '2/8', isCorrect: false },
            { label: 'D', text: '3/2', isCorrect: false },
        ],
        correct_answer: 'B',
        diagnosticTags: ['FRACTION_ADDITION', 'SAME_DENOMINATOR'],
        commonMisconceptions: [
            {
                tag: 'ADDS_DENOMINATORS',
                description: 'Student adds denominators: 1/4 + 2/4 = 3/8',
                recovery: 'Denominator stays same, only add numerators',
            },
        ],
        timeLimit: 30000,
        bloomLevel: 'APPLY',
    },

    {
        id: 'Q3',
        atom: 'ALG1', // Integer Operations
        type: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
        content: {
            question: 'What is -3 + 5?',
        },
        options: [
            { label: 'A', text: '-8', isCorrect: false },
            { label: 'B', text: '-2', isCorrect: false },
            { label: 'C', text: '2', isCorrect: true },
            { label: 'D', text: '8', isCorrect: false },
        ],
        correct_answer: 'C',
        diagnosticTags: ['NEGATIVE_NUMBERS', 'SIGN_OPERATIONS'],
        commonMisconceptions: [
            {
                tag: 'SIGN_IGNORANCE',
                description: 'Student ignores negative sign and adds: 3 + 5 = 8',
                recovery: 'Use number line visualization',
            },
        ],
        timeLimit: 30000,
        bloomLevel: 'APPLY',
    },

    {
        id: 'Q4',
        atom: 'ALG2', // Variables
        type: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
        content: {
            question: 'Simplify: 2x + 3x',
        },
        options: [
            { label: 'A', text: '5x', isCorrect: true },
            { label: 'B', text: '5x²', isCorrect: false },
            { label: 'C', text: 'x + 5', isCorrect: false },
            { label: 'D', text: '6x', isCorrect: false },
        ],
        correct_answer: 'A',
        diagnosticTags: ['LIKE_TERMS', 'COMBINING_TERMS'],
        commonMisconceptions: [
            {
                tag: 'MULTIPLIES_EXPONENTS',
                description: 'Student thinks 2x + 3x = 5x²',
                recovery: 'Explain: we combine coefficients, not multiply powers',
            },
        ],
        timeLimit: 30000,
        bloomLevel: 'APPLY',
    },

    {
        id: 'Q5',
        atom: 'GEO1', // Angles
        type: 'MULTIPLE_CHOICE',
        difficulty: 'MEDIUM',
        content: {
            question: 'What is the sum of angles in a triangle?',
        },
        options: [
            { label: 'A', text: '90°', isCorrect: false },
            { label: 'B', text: '180°', isCorrect: true },
            { label: 'C', text: '270°', isCorrect: false },
            { label: 'D', text: '360°', isCorrect: false },
        ],
        correct_answer: 'B',
        diagnosticTags: ['TRIANGLE_ANGLES', 'ANGLE_SUM'],
        commonMisconceptions: [
            {
                tag: 'CONFUSES_WITH_QUADRILATERAL',
                description: 'Student thinks triangle angles sum to 360°',
                recovery: 'Quadrilateral has 4 angles, triangle has 3',
            },
        ],
        timeLimit: 30000,
        bloomLevel: 'REMEMBER',
    },
];

/**
 * Get a sample question by ID
 */
export function getSampleQuestion(questionId) {
    return SAMPLE_DIAGNOSTIC_QUESTIONS.find(q => q.id === questionId);
}

/**
 * Get all sample questions for an atom
 */
export function getSampleQuestionsByAtom(atomId) {
    return SAMPLE_DIAGNOSTIC_QUESTIONS.filter(q => q.atom === atomId);
}

/**
 * Get random sample questions (for testing)
 */
export function getRandomSampleQuestions(count = 5) {
    const shuffled = [...SAMPLE_DIAGNOSTIC_QUESTIONS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, SAMPLE_DIAGNOSTIC_QUESTIONS.length));
}