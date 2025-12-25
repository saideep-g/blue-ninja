import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase/config';
// Added doc and updateDoc to support real-time mastery and hurdle persistence
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { useNinja } from '../context/NinjaContext';

/**
 * useDailyMission Hook
 * Implements the Phase 2.0 "3-4-3" Selection Algorithm.
 * Manages the personalized 10-question Daily Mission loop and handles session-level persistence.
 * Implements the 3-4-3 selection logic: 3 Warm-ups, 4 Hurdle-Killers, 3 Cool-downs.
 */
export function useDailyMission() {
    const { ninjaStats, logQuestionResult, updatePower, updateStreak } = useNinja();
    const [missionQuestions, setMissionQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isComplete, setIsComplete] = useState(false);

    // Tracks current session performance for the Victory Screen
    const [sessionResults, setSessionResults] = useState({
        correctCount: 0,
        flowGained: 0,
        hurdlesTargeted: [],
        sprintCount: 0 // Tracks how many 'SPRINT' ratings were achieved
    });

    /**
     * generateMission
     * The Selection Algorithm:
     * - 3 Warm-ups (Mastery > 0.7)
     * - 4 Hurdle-Killers (Matches active hurdles)
     * - 3 Cool-downs (New or Mastery < 0.4)
     */
    const generateMission = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetching from the unified mission bank
            const qSnap = await getDocs(collection(db, 'diagnostic_questions'));
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
            setIsLoading(false);
        } catch (error) {
            console.error("Failed to generate Daily 10:", error);
            setIsLoading(false);
        }
    }, [ninjaStats.mastery, ninjaStats.hurdles]);

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

        // Phase 2.1: Logging the 6 critical data points
        await logQuestionResult({
            questionId: currentQuestion.id,
            studentAnswer: choice,
            isCorrect,
            isRecovered,
            diagnosticTag: tag,
            timeSpent,
            speedRating,
            atomId: currentQuestion.atom,
            mode: 'DAILY'
        });

        // Bayesian Mastery Update Logic (Phase 2.3)
        // Daily practice moves mastery by 0.05 per success to ensure steady growth
        const currentAtomMastery = ninjaStats.mastery[currentQuestion.atom] || 0.5;
        let masteryChange = isCorrect ? 0.05 : (isRecovered ? 0.02 : -0.05);
        const newAtomMastery = Math.min(0.99, Math.max(0.1, currentAtomMastery + masteryChange));

        // Boss Clearing (Hurdle Reduction) Logic
        // If correct, we reduce the "intensity" of the specific misconception (Hurdle)
        const updatedHurdles = { ...ninjaStats.hurdles };
        if (isCorrect && tag && updatedHurdles[tag] > 0) {
            updatedHurdles[tag] = Math.max(0, updatedHurdles[tag] - 1);
        }

        // Calculate gains (Daily mode has higher stakes than diagnostic) and Update Performance Stats
        const gain = isCorrect ? 15 : (isRecovered ? 7 : 0); // Higher stakes for Daily mode
        updatePower(gain);

        // Sync Mastery and Hurdle health updates back to the Cloud
        await updateDoc(studentRef, {
            [`mastery.${currentQuestion.atom}`]: newAtomMastery,
            hurdles: updatedHurdles
        });

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
            updateStreak(); // Reward the daily habit
        } else {
            setCurrentIndex(prev => prev + 1);
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