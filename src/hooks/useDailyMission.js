import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase/config';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useNinja } from '../context/NinjaContext';

/**
 * useDailyMission Hook
 * Implements the Phase 2.0 "3-4-3" Selection Algorithm.
 * Manages the personalized 10-question Daily Mission loop and handles session-level persistence.
 * Implements the 3-4-3 selection logic: 3 Warm-ups, 4 Hurdle-Killers, 3 Cool-downs.
 * Implements Phase 3 Intelligence: Velocity tracking, Mastery Deltas, and 3-day Boss rules.
 * Updated for Phase 3: Supports Scenario Injection.
 * Allows testing the Daily 10 loop with 1-2 questions.
 */
export function useDailyMission(devQuestions = null) {
    const { ninjaStats, setNinjaStats, logQuestionResultLocal, updatePower, updateStreak, syncToCloud, refreshSessionLogs } = useNinja();
    const [missionQuestions, setMissionQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isComplete, setIsComplete] = useState(false);

    // Initial Start Time for the first question
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());

    const [sessionResults, setSessionResults] = useState({
        correctCount: 0,
        flowGained: 0,
        hurdlesTargeted: [],
        sprintCount: 0 // Tracks how many 'SPRINT' ratings were achieved
    });

    /**
     * generateMission
     * The Selection Algorithm - 3-4-3 Selection Algorithm
     * - 3 Warm-ups (Mastery > 0.7)
     * - 4 Hurdle-Killers (Matches active hurdles)
     * - 3 Cool-downs (New or Mastery < 0.4)
     */
    const generateMission = useCallback(async () => {

        // SCENARIO INJECTION LOGIC
        if (devQuestions && devQuestions.length > 0) {
            setMissionQuestions(devQuestions);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // Fetching from the unified mission bank
            const qSnap = await getDocs(collection(db, 'diagnostic_questions'));
            if (qSnap.empty) {
                console.warn("No questions found");
                setMissionQuestions([]);
                setIsLoading(false);
                return;
            }
            const allQuestions = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const mastery = ninjaStats.mastery || {};
            const hurdles = ninjaStats.hurdles || {};

            // Category 1: Warm-ups (3 Questions)
            const warmUps = allQuestions
                .filter(q => (mastery[q.atom] || 0) > 0.7)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);

            // Category 2: Hurdle-Killers (4 Questions) - Match active hurdle tags
            const activeHurdleTags = Object.keys(hurdles).filter(tag => hurdles[tag] > 0);
            const hurdleKillers = allQuestions
                .filter(q => q.distractors.some(d => activeHurdleTags.includes(d.diagnostic_tag)))
                .sort(() => Math.random() - 0.5)
                .slice(0, 4);

            // Category 3: Cool-downs/Frontier (3 Questions) - Mastery < 0.4 or New
            const coolDowns = allQuestions
                .filter(q => !mastery[q.atom] || mastery[q.atom] < 0.4)
                .sort(() => Math.random() - 0.5)
                .slice(0, 3);

            // Assemble the Final 10
            const final10 = [...warmUps, ...hurdleKillers, ...coolDowns];

            // Fallback: If bank is small, fill with randoms to ensure 10 questions
            if (final10.length < 10) {
                const usedIds = new Set(final10.map(q => q.id));
                const extras = allQuestions
                    .filter(q => !usedIds.has(q.id))
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 10 - final10.length);
                final10.push(...extras);
            }

            setMissionQuestions(final10.sort(() => Math.random() - 0.5));
            setQuestionStartTime(Date.now());
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to generate Daily 10:", error);
            setMissionQuestions([]);  // ADD THIS LINE
            setIsLoading(false);
        }
    }, [ninjaStats.mastery, ninjaStats.hurdles, devQuestions]);

    // Generate mission on mount
    useEffect(() => {
        if (ninjaStats.currentQuest === 'COMPLETED' && missionQuestions.length === 0) {
            generateMission();
        }
    }, [generateMission, ninjaStats.currentQuest, missionQuestions.length]);

    /**
     * submitDailyAnswer
     * Processes results, logs transactions, and handles progression.
     * Now includes Phase 2.3 logic for Mastery updates and Hurdle reduction (Boss Clearing).
     */
    const submitDailyAnswer = async (isCorrect, choice, isRecovered, tag, timeSpent, speedRating) => {
        if (!auth.currentUser) return;
        const currentQuestion = missionQuestions[currentIndex];
        const studentRef = doc(db, "students", auth.currentUser.uid);
        const isTestUser = auth.currentUser?.uid.includes('test_user');

        // Calculate speedRating here since MissionCard no longer passes it
        const expectedTime = (currentQuestion.difficulty || 3) * 8;
        // const speedRating = timeSpent < expectedTime * 0.6 ? 'SPRINT' : (timeSpent < expectedTime * 1.2 ? 'STEADY' : 'DEEP');

        // FIX: Define cappedThinkingTime based on timeSpent (in seconds)
        // We cap it at 60s to prevent outliers from skewing analytics.
        const cappedThinkingTime = Math.min(timeSpent, 60);

        // 1. Mastery Delta Logic
        const masteryBefore = ninjaStats.mastery[currentQuestion.atom] || 0.5;
        let masteryChange = isCorrect ? 0.05 : (isRecovered ? 0.02 : -0.05);
        const masteryAfter = Math.min(0.99, Math.max(0.1, masteryBefore + masteryChange));

        // 2. Recovery Velocity Logic (Gap #1 Fix)
        // Velocity = (Primary Thinking Time - Recovery Time) / Primary Thinking Time
        let recoveryVelocity = 0;
        if (isRecovered) {
            // timeSpent is the initial thinking time before the first (wrong) click.
            // (Date.now() - questionStartTime) is the total time for the mission.
            const totalMissionTime = (Date.now() - questionStartTime) / 1000;
            const recoveryTime = totalMissionTime - timeSpent;
            // Velocity = (Initial Thinking Time - Recovery Time) / Initial Thinking Time
            recoveryVelocity = Math.max(0, (timeSpent - recoveryTime) / timeSpent);
        }

        // 3. Boss Clearing Logic: The 3-Consecutive Success Rule (Gap #7 Fix)
        const updatedHurdles = { ...ninjaStats.hurdles };
        const updatedConsecutive = { ...ninjaStats.consecutiveBossSuccesses };

        if (tag) {
            if (isCorrect) {
                // Increment streak for this specific misconception
                const newStreak = (updatedConsecutive[tag] || 0) + 1;
                updatedConsecutive[tag] = newStreak;

                // If 3 in a row achieved, the Boss is Defeated (Cloud vanishes)
                if (newStreak >= 3) {
                    updatedHurdles[tag] = 0;
                    updatedConsecutive[tag] = 0; // Reset for next time it might appear
                }
            } else {
                // Reset streak on any mistake for this hurdle
                updatedConsecutive[tag] = 0;
            }
        }

        // 4. Persistence: Update local state via NinjaContext
        setNinjaStats(prev => ({
            ...prev,
            mastery: { ...prev.mastery, [currentQuestion.atom]: masteryAfter },
            hurdles: updatedHurdles,
            consecutiveBossSuccesses: updatedConsecutive
        }));

        // 5. Transactional Log: Capture the 6 critical data points (Gap #2 Fix)
        logQuestionResultLocal({
            questionId: currentQuestion.id,
            studentAnswer: choice,
            isCorrect,
            isRecovered,
            recoveryVelocity, // Fix Gap #1
            diagnosticTag: tag,
            timeSpent,
            cappedThinkingTime,
            speedRating,
            masteryBefore, // Fix Gap #2
            masteryAfter,  // Fix Gap #2
            atomId: currentQuestion.atom,
            mode: 'DAILY'
        }, currentIndex);

        // Bayesian Mastery Update Logic (Phase 2.3)
        // Daily practice moves mastery by 0.05 per success to ensure steady growth
        const currentAtomMastery = ninjaStats.mastery[currentQuestion.atom] || 0.5;

        const newAtomMastery = Math.min(0.99, Math.max(0.1, currentAtomMastery + masteryChange));

        // Calculate gains (Daily mode has higher stakes than diagnostic) and Update Performance Stats
        const gain = isCorrect ? 15 : (isRecovered ? 7 : 0); // Higher stakes for Daily mode
        updatePower(gain);

        // SYNC STRATEGY: Only persist Mastery/Hurdles to Firestore if NOT a test user.
        // For real users, this is an immediate write to ensure state persistence across refreshes.
        if (!isTestUser) {
            await updateDoc(studentRef, {
                [`mastery.${currentQuestion.atom}`]: newAtomMastery,
                hurdles: updatedHurdles,
                consecutiveBossSuccesses: updatedConsecutive
            });
        }

        setSessionResults(prev => ({
            ...prev,
            correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
            flowGained: prev.flowGained + gain,
            hurdlesTargeted: tag ? [...new Set([...prev.hurdlesTargeted, tag])] : prev.hurdlesTargeted,
            sprintCount: speedRating === 'SPRINT' ? prev.sprintCount + 1 : prev.sprintCount
        }));

        // Handle Session Progression
        if (currentIndex >= missionQuestions.length - 1) {
            setIsComplete(true);

            if (!isTestUser) {
                try {
                    const streakUpdateSuccess = await updateStreak();

                    if (streakUpdateSuccess) {
                        console.log('[useDailyMission] ✅ Streak updated, syncing to cloud...');
                        await syncToCloud(true);
                    } else {
                        console.warn('[useDailyMission] ⚠️ Streak update failed, but syncing logs anyway...');
                        await syncToCloud(true);
                    }

                    console.log('[useDailyMission] Refreshing analytics...');
                    await refreshSessionLogs();

                } catch (error) {
                    console.error('[useDailyMission] Error during completion:', error);
                    try {
                        await refreshSessionLogs();
                    } catch (refreshError) {
                        console.error('[useDailyMission] Failed to refresh logs:', refreshError);
                    }
                }
            } else {
                await syncToCloud(true);
                await refreshSessionLogs();
            }
        } else {
            setCurrentIndex(prev => prev + 1);
            setQuestionStartTime(Date.now());
        }

    };

    return {
        currentQuestion: missionQuestions[currentIndex],
        currentIndex,
        totalQuestions: missionQuestions.length,
        isLoading,
        isComplete,
        sessionResults,
        submitDailyAnswer
    };
}