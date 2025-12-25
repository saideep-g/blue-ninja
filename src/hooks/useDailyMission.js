import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { useNinja } from '../context/NinjaContext';

/**
 * useDailyMission Hook
 * Implements the Phase 2.0 "3-4-3" Selection Algorithm.
 * Manages the daily 10-question loop and handles session-level persistence.
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
        hurdlesTargeted: []
    });

    /**
     * The 3-4-3 Selection Algorithm
     * Scans the mission bank and filters questions based on student mastery and hurdles.
     */
    const generateMission = useCallback(async () => {
        setIsLoading(true);
        try {
            // Fetch the unified Mission Bank
            const qSnap = await getDocs(collection(db, 'mission_bank'));
            const allQuestions = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            const mastery = ninjaStats.mastery || {};
            const hurdles = ninjaStats.hurdles || {};

            // Category 1: Warm-ups (3 Questions) - Mastery > 0.7
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
                .filter(q => (mastery[q.atom] || 0) < 0.4)
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
        if (!isComplete && missionQuestions.length === 0) {
            generateMission();
        }
    }, [generateMission, isComplete, missionQuestions.length]);

    /**
     * submitDailyAnswer
     * Handles result processing and transactional logging for the Daily Mission.
     */
    const submitDailyAnswer = async (isCorrect, choice, isRecovered, tag, timeSpent) => {
        const currentQuestion = missionQuestions[currentIndex];

        // 1. Log the result for deep analytics (Phase 2.0 Critical Requirement)
        await logQuestionResult({
            questionId: currentQuestion.id,
            studentAnswer: choice,
            isCorrect,
            isRecovered,
            diagnosticTag: tag,
            timeSpent,
            atomId: currentQuestion.atom,
            mode: 'DAILY'
        });

        // 2. Update Performance Stats
        const gain = isCorrect ? 15 : (isRecovered ? 7 : 0); // Higher stakes for Daily mode
        updatePower(gain);

        setSessionResults(prev => ({
            ...prev,
            correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
            flowGained: prev.flowGained + gain,
            hurdlesTargeted: tag ? [...new Set([...prev.hurdlesTargeted, tag])] : prev.hurdlesTargeted
        }));

        // 3. Handle Progression
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