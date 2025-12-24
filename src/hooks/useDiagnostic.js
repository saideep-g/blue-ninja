import { useState, useEffect, useRef } from 'react';
import { db } from '../firebase/config';
import { collection, query, getDocs } from 'firebase/firestore';

/**
 * useDiagnostic Hook
 * Manages the "Ninja Entrance Exam" logic flow.
 * Tracks adaptive progress and Bayesian mastery thresholds.
 * Now tracks "Hurdles" (misconceptions) to identify Boss Levels.
 */
export function useDiagnostic() {
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [masteryData, setMasteryData] = useState({}); // { A1: 0.65, A3: 0.85 }
    const [isComplete, setIsComplete] = useState(false);

    // NEW: Track specific misconceptions (Hurdles)
    const [hurdles, setHurdles] = useState({}); // { SIGN_IGNORANCE: count }

    // High-precision timing refs for Recovery Velocity
    const questionStartTime = useRef(Date.now());
    const branchStartTime = useRef(null);

    useEffect(() => {
        const loadQuestions = async () => {
            const qSnap = await getDocs(collection(db, 'diagnostic_questions'));
            const sortedQs = qSnap.docs.map(doc => doc.data())
                .sort((a, b) => a.difficulty - b.difficulty);
            setQuestions(sortedQs);
            questionStartTime.current = Date.now();
        };
        loadQuestions();
    }, []);

    // Starts the timer for the recovery branch
    const startRecoveryTimer = () => {
        branchStartTime.current = Date.now();
    };

    /**
     * Submits an answer and updates analytics.
     * @param {string} questionId 
     * @param {boolean} isCorrect 
     * @param {string} atomId 
     * @param {boolean} isRecovered - True if follow-up was correct
     * @param {string} diagnosticTag - The tag from the selected distractor
     */
    const submitAnswer = (questionId, isCorrect, atomId, isRecovered = false, diagnosticTag = null) => {
        const endTime = Date.now();
        // Implement Bayesian Update Logic
        const currentScore = masteryData[atomId] || 0.5; // Default prior
        // Analytics: Calculate Recovery Velocity
        let recoveryVelocity = null;
        if (isRecovered && branchStartTime.current) {
            const initialTime = branchStartTime.current - questionStartTime.current;
            const branchTime = endTime - branchStartTime.current;
            // Velocity = (Initial Thinking Time - Recovery Time) / Initial Thinking Time
            recoveryVelocity = (initialTime - branchTime) / initialTime;
        }

        // Step 12: Track Hurdles if incorrect
        if (!isCorrect && diagnosticTag) {
            setHurdles(prev => ({
                ...prev,
                [diagnosticTag]: (prev[diagnosticTag] || 0) + 1
            }));
        }

        /* Bayesian weighting based on Specification:
     - Correct first try: +0.1
     - Recovered (High Velocity > 0.5): +0.08 (Latent Knowledge)
     - Recovered (Low Velocity): +0.03 (Slow recovery)
     - Incorrect/Stuck: -0.1
    */
        let updateAmount = -0.1;
        if (isCorrect) updateAmount = 0.1;
        else if (isRecovered) updateAmount = recoveryVelocity > 0.5 ? 0.08 : 0.03;

        const updatedScore = Math.min(0.99, Math.max(0.1, currentScore + updateAmount));
        const newMastery = { ...masteryData, [atomId]: updatedScore };

        setMasteryData(newMastery);

        // Reset timers for next question
        questionStartTime.current = Date.now();
        branchStartTime.current = null;

        // Adaptive Stopping Logic (v4.0 Spec)
        const avgMastery = Object.values(newMastery).reduce((a, b) => a + b, 0) / (Object.keys(newMastery).length || 1);

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
        startRecoveryTimer,
        isComplete,
        masteryData,
        hurdles // Exposed for the Boss Tracker
    };
}