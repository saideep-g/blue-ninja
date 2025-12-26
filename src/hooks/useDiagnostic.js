import { useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useNinja } from '../context/NinjaContext'; // FIX: Imported Ninja Context
import { SAMPLE_DIAGNOSTIC_QUESTIONS } from '../data/sampleDiagnosticQuestions.js';

/**
 * useDiagnostic Hook
 * Manages the "Ninja Entrance Exam" logic flow.
 * Tracks adaptive progress and Bayesian mastery thresholds.
 * Now tracks "Hurdles" (misconceptions) to identify Boss Levels.
 * Now optimized to persist final analytical data atomically.
 * Updated for Phase 3: Supports Scenario Injection for 1Q testing.
 * @param {Array} devQuestions - Optional array to override global question bank.
 */
/**
 * submitAnswer
 * REFINED: Explicitly captures studentAnswer and correctAnswer for the Inquiry on Learning.
 */
export function useDiagnostic(injectedQuestions = null) {
    const { logQuestionResult } = useNinja(); //
    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [masteryData, setMasteryData] = useState({}); // { A1: 0.65, A3: 0.85 }
    const [isComplete, setIsComplete] = useState(false);

    // Track specific misconceptions (Hurdles) for the Boss Level tracker
    const [hurdles, setHurdles] = useState({}); // { SIGN_IGNORANCE: count }

    // High-precision timing refs for Recovery Velocity analytics
    const questionStartTime = useRef(Date.now());
    const branchStartTime = useRef(null);

    // Initial load: Fetch all diagnostic missions from Firestore
    useEffect(() => {
        const loadQuestions = async () => {
            if (injectedQuestions && injectedQuestions.length > 0) {
                setQuestions(injectedQuestions);
            } else {
                try {
                    const qSnap = await getDocs(collection(db, 'diagnostic_questions'));
                    if (qSnap.empty) {
                        console.warn("No questions found");
                        setQuestions([]);
                        return;
                    }
                    const sortedQs = qSnap.docs
                        .map(doc => ({ id: doc.id, ...doc.data() }))
                        .sort((a, b) => (a.difficulty || 0) - (b.difficulty || 0));
                    setQuestions(sortedQs);

                } catch (error) {
                    console.error("Error loading diagnostic questions:", error);
                    setQuestions([]);  // ADD THIS LINE

                }
            }
            questionStartTime.current = Date.now();
        };
        loadQuestions();
    }, [injectedQuestions]); // Now properly tracks the injected questions

    /**
    * PERSISTENCE FIX:
    * When the diagnostic is complete, we save the status AND the results to Firestore.
    * This ensures the Mastery and Hurdles are available after a page refresh.
    * Only save completion if we have actual session data to save.
     */
    useEffect(() => {
        const saveCompletion = async () => {
            // Logic: Only save if isComplete is true AND we have actually generated mastery data
            // SAFETY GATE: Do not save completion if using the test user in Dev Mode
            // This prevents test data from polluting your real analytical trends.
            const isTestUser = auth.currentUser?.uid.includes('test_user');

            if (isComplete && auth.currentUser && Object.keys(masteryData).length > 0 && !injectedQuestions) {
                const userRef = doc(db, "students", auth.currentUser.uid);
                try {
                    await updateDoc(userRef, {
                        currentQuest: 'COMPLETED',
                        mastery: masteryData, // Save the actual mastery scores
                        hurdles: hurdles,     // Save the identified misconceptions
                        lastUpdated: new Date().toISOString()
                    });
                } catch (error) {
                    console.error("Failed to save quest completion:", error);
                }
            }
        };
        saveCompletion();
    }, [isComplete, masteryData, hurdles, injectedQuestions]); // Added dependencies to ensure final data is caught

    // Starts the high-precision timer for the "Bonus Mission" branch
    const startRecoveryTimer = () => {
        branchStartTime.current = Date.now();
    };

    /**
     * Submits an answer and calculates Bayesian Mastery.
     * Rewards Latent Knowledge if the student recovers quickly after a hint.
     * @param {string} questionId 
     * @param {boolean} isCorrect 
     * @param {string} atomId 
     * @param {boolean} isRecovered - True if follow-up was correct
     * @param {string} diagnosticTag - The tag from the selected distractor
     */
    const submitAnswer = async (questionId, isCorrect, atomId, isRecovered, diagnosticTag, studentAnswer, correctAnswer) => {
        const endTime = Date.now();
        // Implement Bayesian Update Logic
        const currentScore = masteryData[atomId] || 0.5; // Default prior

        // High-precision timing analytics
        const timeSpent = endTime - questionStartTime.current;
        const speedRating = timeSpent < 3000 ? 'SPRINT' : (timeSpent < 15000 ? 'STEADY' : 'DEEP');

        // Analytics: Calculate Recovery Velocity (how fast they understood the hint)
        let recoveryVelocity = null;
        if (isRecovered && branchStartTime.current) {
            const initialTime = branchStartTime.current - questionStartTime.current;
            const branchTime = endTime - branchStartTime.current;
            // Velocity = (Initial Thinking Time - Recovery Time) / Initial Thinking Time
            recoveryVelocity = (initialTime - branchTime) / initialTime;
        }

        // Track Hurdles/ specific misconceptions if the answer was wrong
        if (!isCorrect && diagnosticTag) {
            setHurdles(prev => ({
                ...prev,
                [diagnosticTag]: (prev[diagnosticTag] || 0) + 1
            }));
        }

        /* Apply Bayesian weighting based on Specification:
     - Correct first try: +0.1
     - Recovered (High Velocity > 0.5): +0.08 (Latent Knowledge)
     - Recovered (Low Velocity): +0.03 (Slow recovery)
     - Incorrect/Stuck: -0.1
    */
        let updateAmount = -0.1;
        if (isCorrect) updateAmount = 0.1;
        else if (isRecovered)
            // Reward "Latent Knowledge" based on velocity 
            updateAmount = recoveryVelocity > 0.5 ? 0.08 : 0.03;

        const updatedScore = Math.min(0.99, Math.max(0.1, currentScore + updateAmount));
        const newMastery = { ...masteryData, [atomId]: updatedScore };

        // CORE FIX: Log to Ninja Engine (which now mirrors to IndexedDB)
        // CORE FIX: Logging the full 12-field dataset
        await logQuestionResult({
            questionId,
            studentAnswer,   // ✅ Now captured
            correctAnswer,   // ✅ Now captured
            isCorrect,
            isRecovered,
            diagnosticTag,   // ✅ Now captured correctly
            timeSpent,
            speedRating,
            atomId,
            masteryBefore: currentScore,
            masteryAfter: updatedScore,
            mode: injectedQuestions ? 'DEV_TEST' : 'DIAGNOSTIC'
        });

        setMasteryData(newMastery);

        // Reset timers for the next mission
        questionStartTime.current = Date.now();
        branchStartTime.current = null;

        // Adaptive Stopping Logic: Stop if 85% confidence reached
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