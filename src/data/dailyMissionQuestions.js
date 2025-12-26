/**
 * Daily Mission Questions
 * 10 questions per day, carefully selected for practice
 */

export const DAILY_MISSION_QUESTIONS = {
    day1: [
        {
            id: 'D1Q1',
            atom: 'A1',
            type: 'MULTIPLE_CHOICE',
            difficulty: 'EASY',
            content: {
                question: 'What is 1/2 + 1/4?',
            },
            options: [
                { label: 'A', text: '1/6', isCorrect: false },
                { label: 'B', text: '2/6', isCorrect: false },
                { label: 'C', text: '3/4', isCorrect: true },
                { label: 'D', text: '2/4', isCorrect: false },
            ],
            correct_answer: 'C',
            diagnosticTags: ['FRACTION_OPERATIONS'],
            timeLimit: 30000,
            bloomLevel: 'APPLY',
        },
        // ... Add 9 more questions for day 1
    ],
    day2: [
        // Day 2 questions
    ],
    // ... Add up to day 21 or 30
};

export function getDailyMissionQuestions(dayNumber) {
    const key = `day${dayNumber}`;
    return DAILY_MISSION_QUESTIONS[key] || [];
}
