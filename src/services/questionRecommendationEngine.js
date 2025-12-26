/**
 * Quest Recommendation Engine
 * AI-driven selection of next questions based on student progress
 */

import { SAMPLE_DIAGNOSTIC_QUESTIONS } from '../data/sampleDiagnosticQuestions.js';
import { getPrerequisites, getDependents } from '../data/mathAtoms.js';

export function recommendNextQuestion(studentProfile, previousQuestions) {
    const { mastery, hurdles, successRate } = studentProfile;

    // Rule 1: If success rate low, recommend easier questions
    if (successRate < 0.6) {
        return findEasierQuestions(previousQuestions);
    }

    // Rule 2: If hurdles exist, drill those
    if (hurdles && hurdles.length > 0) {
        return findQuestionsForHurdle(hurdles.tag);
    }

    // Rule 3: Otherwise, move to next difficulty
    return findProgressionQuestion(mastery);
}

function findEasierQuestions(previousQuestions) {
    const attempted = new Set(previousQuestions.map(q => q.atom));

    return SAMPLE_DIAGNOSTIC_QUESTIONS.find(q =>
        q.difficulty === 'EASY' && !attempted.has(q.atom)
    );
}

function findQuestionsForHurdle(tag) {
    return SAMPLE_DIAGNOSTIC_QUESTIONS.find(q =>
        q.diagnosticTags.includes(tag)
    );
}

function findProgressionQuestion(mastery) {
    // Recommend related topics student hasn't mastered
    return SAMPLE_DIAGNOSTIC_QUESTIONS.find(q =>
        !mastery[q.atom] || mastery[q.atom] < 0.8
    );
}

export default {
    recommendNextQuestion,
};
