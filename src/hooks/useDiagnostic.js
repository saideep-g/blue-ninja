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
    const { logQuestionResult, setNinjaStats } = useNinja(); //
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
    * PERSISTENCE FIX (UPDATED):
    * When the diagnostic is complete, we save the status AND the results to Firestore.
    * This ensures the Mastery and Hurdles are available after a page refresh.
    * Only save completion if we have actual session data to save.
    * 
    * ✅ FIXED: Removed the !injectedQuestions check that was preventing saves
    * Now it always persists completion when isComplete=true
    * 
    * ✅ NEW: Also updates localStorage so it doesn't have stale data on refresh
    * This is the critical fix for the "diagnostic restarts after refresh" bug
     */
    useEffect(() => {
        const saveCompletion = async () => {
            console.log('[useDiagnostic] Checking save completion:', {
                isComplete,
                hasAuth: !!auth.currentUser,
                masteryCount: Object.keys(masteryData).length,
                uid: auth.currentUser?.uid,
                masteryData
            });

            // Logic: Only save if isComplete is true AND we have actually generated mastery data
            // Failsafe: If masteryData is somehow empty, use default mastery for all atoms
            if (isComplete && auth.currentUser) {
                const userRef = doc(db, "students", auth.currentUser.uid);

                // Prepare mastery data - use defaults if empty
                let finalMastery = masteryData;
                if (Object.keys(masteryData).length === 0) {
                    console.warn('[useDiagnostic] ⚠️ masteryData is empty, using default values');
                    // Initialize with neutral mastery (0.5) for all possible atoms
                    // This is a failsafe in case the diagnostic completed without proper mastery tracking
                    finalMastery = {
                        'A1': 0.5,
                        'A2': 0.5,
                        'A3': 0.5,
                        'A4': 0.5,
                        'A5': 0.5
                    };
                }

                try {
                    console.log('[useDiagnostic] Saving completion to Firestore...', {
                        masteryData: finalMastery,
                        hurdles
                    });

                    await updateDoc(userRef, {
                        currentQuest: 'COMPLETED',
                        mastery: finalMastery, // Save the actual mastery scores
                        hurdles: hurdles,     // Save the identified misconceptions
                        lastUpdated: new Date().toISOString()
                    });

                    console.log('[useDiagnostic] ✅ Completion saved successfully!');

                    // Also update local state immediately so App.jsx reacts
                    setNinjaStats(prev => ({
                        ...prev,
                        currentQuest: 'COMPLETED',
                        mastery: finalMastery,
                        hurdles: hurdles
                    }));

                    // 🎯 CRITICAL FIX: Also update localStorage so it doesn't have stale data on refresh
                    // This prevents the "diagnostic restarts after refresh" bug
                    console.log('[useDiagnostic] 📝 Updating localStorage with completion data...');
                    localStorage.setItem(`ninja_session_${auth.currentUser.uid}`, JSON.stringify({
                        stats: {
                            powerPoints: 0,
                            heroLevel: 1,
                            mastery: finalMastery,
                            hurdles: hurdles,
                            consecutiveBossSuccesses: {},
                            completedMissions: 0,
                            currentQuest: 'COMPLETED',  // ✅ KEY: Set to COMPLETED
                            streakCount: 0,
                            lastMissionDate: null
                        },
                        buffer: { logs: [], pointsGained: 0 },
                        role: 'STUDENT'
                    }));
                    console.log('[useDiagnostic] ✅ localStorage updated with completion status!');

                } catch (error) {
                    console.error("[useDiagnostic] 🔴 Failed to save quest completion:", error);
                }
            }
        };
        saveCompletion();
    }, [isComplete, masteryData, hurdles]); // Removed injectedQuestions dependency

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
     * @param {string} studentAnswer - What the student selected
     * @param {string} correctAnswer - The correct answer
     * @param {number} timeSpentSeconds - Time spent in seconds (from MissionCard)
     */
    // FIX: Match the MissionCard signature (isCorrect, choice, isRecovered, tag, timeSpent)

    const submitAnswer = async (questionId, isCorrect, atomId, isRecovered, diagnosticTag, studentAnswer, correctAnswer, timeSpentSeconds) => {
        // Retrieve current question data internally instead of expecting it from params
        const currentQuestion = questions[currentIndex];
        const questionId = currentQuestion.id;
        const atomId = currentQuestion.atom;
        console.log('[useDiagnostic] submitAnswer called:', {
            questionId,
            isCorrect,
            atomId,
            currentIndex,
            totalQuestions: questions.length
        });

        // ✅ FIXED: Use timeSpentSeconds from MissionCard if provided
        // Otherwise calculate from our internal timer
        let timeSpent;
        if (timeSpentSeconds !== undefined) {
            // Use the precise timing from MissionCard (already in seconds)
            timeSpent = timeSpentSeconds;
        } else {
            // Fallback: Calculate from our refs (for backward compatibility)
            const timeSpentMs = Date.now() - questionStartTime.current;
            timeSpent = Math.round(timeSpentMs / 1000);
        }

        // Implement Bayesian Update Logic
        const currentScore = masteryData[atomId] || 0.5; // Default prior

        // Calculate speed rating based on thinking time (in seconds)
        const speedRating = timeSpent < 3 ? 'SPRINT' : (timeSpent < 15 ? 'STEADY' : 'DEEP');

        // Analytics: Calculate Recovery Velocity (how fast they understood the hint)
        // ✅ FIXED: Make sure this is properly calculated and passed
        let recoveryVelocity = 0; // Default to 0
        if (isRecovered && branchStartTime.current) {
            const initialTimeMs = branchStartTime.current - questionStartTime.current;
            const branchTimeMs = Date.now() - branchStartTime.current;
            // Velocity = (Initial Thinking Time - Recovery Time) / Initial Thinking Time
            if (initialTimeMs > 0) {
                recoveryVelocity = (initialTimeMs - branchTimeMs) / initialTimeMs;
                // Clamp between 0 and 1
                recoveryVelocity = Math.max(0, Math.min(1, recoveryVelocity));
            }
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

        // ✅ FIXED: PASS ALL REQUIRED FIELDS to logQuestionResult
        // The context will ensure they're all properly saved
        await logQuestionResult({
            questionId,
            studentAnswer,        // ✅ Captured
            isCorrect,
            isRecovered,
            recoveryVelocity,     // ✅ FIXED: Now explicitly passed
            diagnosticTag,        // ✅ Captured
            timeSpent,            // ✅ FIXED: Now in SECONDS
            speedRating,
            atomId,
            masteryBefore: currentScore,
            masteryAfter: updatedScore,
            mode: injectedQuestions ? 'DEV_TEST' : 'DIAGNOSTIC'
            // Note: timestamp will be added by Firestore
        });

        setMasteryData(newMastery);

        // Reset timers for the next mission
        questionStartTime.current = Date.now();
        branchStartTime.current = null;

        // Adaptive Stopping Logic: Stop if 85% confidence reached
        const avgMastery = Object.values(newMastery).reduce((a, b) => a + b, 0) / (Object.keys(newMastery).length || 1);

        console.log('[useDiagnostic] After answer:', {
            currentIndex: currentIndex + 1,
            totalQuestions: questions.length,
            avgMastery,
            shouldComplete: avgMastery > 0.85 || currentIndex >= questions.length - 1
        });

        if (avgMastery > 0.85 || currentIndex >= questions.length - 1) {
            console.log('[useDiagnostic] 🎉 DIAGNOSTIC COMPLETE!');
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