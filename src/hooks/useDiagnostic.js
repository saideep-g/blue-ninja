import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, getDocs } from 'firebase/firestore';

/**
 * useDiagnostic Hook
 * Manages the "Ninja Entrance Exam" logic flow.
 * Tracks adaptive progress and Bayesian mastery thresholds.
 */
export function useDiagnostic() {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [masteryData, setMasteryData] = useState({}); // { A1: 0.65, A3: 0.85 }
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        const loadQuestions = async () => {
            const qSnap = await getDocs(collection(db, 'diagnostic_questions'));
            const sortedQs = qSnap.docs.map(doc => doc.data())
                .sort((a, b) => a.difficulty - b.difficulty);
            setQuestions(sortedQs);
        };
        loadQuestions();
    }, []);

    const submitAnswer = (questionId, isCorrect, atomId) => {
        // Implement Bayesian Update Logic
        const currentScore = masteryData[atomId] || 0.5; // Default prior
        const updatedScore = isCorrect ? Math.min(0.99, currentScore + 0.1) : Math.max(0.1, currentScore - 0.1);

        const newMastery = { ...masteryData, [atomId]: updatedScore };
        setMasteryData(newMastery);

        // Adaptive Stopping Logic (v4.0 Spec)
        const avgMastery = Object.values(newMastery).reduce((a, b) => a + b, 0) / Object.keys(newMastery).length;

        if (avgMastery > 0.85 || currentIndex >= questions.length - 1) {
            setIsComplete(true);
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    return {
        currentQuestion: questions[currentIndex],
        currentIndex,
        totalQuestions: questions.length,
        submitAnswer,
        isComplete,
        masteryData
    };
}