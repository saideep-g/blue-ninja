/**
 * useDailyMissionV2.js
 * 
 * Enhanced daily mission hook with 14+ templates and curriculum v2 integration.
 * Replaces useDailyMission.js for new implementations.
 * 
 * Features:
 * - 14+ diverse question templates
 * - 5-phase mission structure (14-17 questions)
 * - Curriculum v2 atom selection
 * - Template metadata enrichment
 * - Full analytics support
 */

import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../firebase/config';
import { doc, updateDoc } from 'firebase/firestore';
import { useNinja } from '../context/NinjaContext';
import dailyMissionService from '../services/dailyMissionService';
import curriculumV2Service from '../services/curriculumV2Service';

export function useDailyMissionV2(devQuestions = null) {
  const { ninjaStats, setNinjaStats, logQuestionResultLocal, updatePower, updateStreak, syncToCloud, refreshSessionLogs } = useNinja();
  const [missionQuestions, setMissionQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [missionMetadata, setMissionMetadata] = useState(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [sessionResults, setSessionResults] = useState({
    correctCount: 0,
    flowGained: 0,
    templatesUsed: new Set(),
    phasesCompleted: new Set()
  });

  /**
   * Generate 14+ slot mission with diverse templates
   */
  const generateMission = useCallback(async () => {
    // SCENARIO INJECTION: Allow dev mode with specific questions
    if (devQuestions && devQuestions.length > 0) {
      setMissionQuestions(devQuestions);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const studentId = auth.currentUser?.uid;
      
      // Generate 14+ mission using curriculum v2
      const mission = await dailyMissionService.generateDailyMissionV2(studentId);
      
      setMissionQuestions(mission.questions);
      setMissionMetadata(mission);
      setQuestionStartTime(Date.now());
      setIsLoading(false);

      console.log('[useDailyMissionV2] Mission generated:', {
        totalQuestions: mission.questions.length,
        templates: new Set(mission.questions.map(q => q.templateId)),
        diversityScore: mission.metadata.diversityScore
      });
    } catch (error) {
      console.error('[useDailyMissionV2] Error generating mission:', error);
      setMissionQuestions([]);
      setIsLoading(false);
    }
  }, [devQuestions]);

  // Generate mission on mount
  useEffect(() => {
    if (ninjaStats.currentQuest === 'COMPLETED' && missionQuestions.length === 0) {
      generateMission();
    }
  }, [generateMission, ninjaStats.currentQuest, missionQuestions.length]);

  /**
   * Submit answer with curriculum v2 enrichment
   */
  const submitDailyAnswer = async (isCorrect, choice, isRecovered, tag, timeSpent, speedRating) => {
    if (!auth.currentUser) return;
    
    const currentQuestion = missionQuestions[currentIndex];
    const studentRef = doc(db, 'students', auth.currentUser.uid);
    const isTestUser = auth.currentUser?.uid.includes('test_user');

    // Calculate mastery delta
    const masteryBefore = ninjaStats.mastery?.[currentQuestion.atomId] || 0.5;
    let masteryChange = isCorrect ? 0.05 : (isRecovered ? 0.02 : -0.05);
    const masteryAfter = Math.min(0.99, Math.max(0.1, masteryBefore + masteryChange));

    // Recovery velocity
    let recoveryVelocity = 0;
    if (isRecovered) {
      const totalMissionTime = (Date.now() - questionStartTime) / 1000;
      const recoveryTime = totalMissionTime - timeSpent;
      recoveryVelocity = Math.max(0, (timeSpent - recoveryTime) / timeSpent);
    }

    // Update hurdles (boss clearing logic)
    const updatedHurdles = { ...ninjaStats.hurdles };
    const updatedConsecutive = { ...ninjaStats.consecutiveBossSuccesses };

    if (tag) {
      if (isCorrect) {
        const newStreak = (updatedConsecutive[tag] || 0) + 1;
        updatedConsecutive[tag] = newStreak;
        if (newStreak >= 3) {
          updatedHurdles[tag] = 0;
          updatedConsecutive[tag] = 0;
        }
      } else {
        updatedConsecutive[tag] = 0;
      }
    }

    // Update local state
    setNinjaStats(prev => ({
      ...prev,
      mastery: { ...prev.mastery, [currentQuestion.atomId]: masteryAfter },
      hurdles: updatedHurdles,
      consecutiveBossSuccesses: updatedConsecutive
    }));

    // Enrich log with curriculum v2 metadata
    const enrichedLog = {
      questionId: currentQuestion.questionId,
      studentAnswer: choice,
      isCorrect,
      isRecovered,
      recoveryVelocity,
      diagnosticTag: tag,
      timeSpent,
      speedRating,
      masteryBefore,
      masteryAfter,
      atomId: currentQuestion.atomId,
      atom_id: currentQuestion.atom_id,
      mode: 'DAILY_V2',
      
      // Curriculum v2 enrichment
      curriculumData: {
        moduleId: currentQuestion.moduleId,
        moduleName: currentQuestion.moduleName,
        templateId: currentQuestion.templateId,
        phase: currentQuestion.phase,
        outcomes: currentQuestion.outcomes,
        analyticsMetadata: currentQuestion.analytics
      }
    };

    logQuestionResultLocal(enrichedLog, currentIndex);

    // Update power and session results
    const gain = isCorrect ? 15 : (isRecovered ? 7 : 0);
    updatePower(gain);

    setSessionResults(prev => ({
      ...prev,
      correctCount: isCorrect ? prev.correctCount + 1 : prev.correctCount,
      flowGained: prev.flowGained + gain,
      templatesUsed: new Set([...prev.templatesUsed, currentQuestion.templateId]),
      phasesCompleted: new Set([...prev.phasesCompleted, currentQuestion.phase])
    }));

    // Persist to Firestore
    if (!isTestUser) {
      await updateDoc(studentRef, {
        [`mastery.${currentQuestion.atomId}`]: masteryAfter,
        hurdles: updatedHurdles,
        consecutiveBossSuccesses: updatedConsecutive,
        [`lastQuestionDates.${currentQuestion.atomId}`]: Date.now()
      });
    }

    // Handle completion
    if (currentIndex >= missionQuestions.length - 1) {
      setIsComplete(true);

      if (!isTestUser) {
        try {
          const streakUpdateSuccess = await updateStreak();
          if (streakUpdateSuccess) {
            console.log('[useDailyMissionV2] ✅ Streak updated');
            await syncToCloud(true);
          } else {
            console.warn('[useDailyMissionV2] ⚠️ Streak update failed');
            await syncToCloud(true);
          }
          await refreshSessionLogs();
        } catch (error) {
          console.error('[useDailyMissionV2] Error during completion:', error);
          try {
            await refreshSessionLogs();
          } catch (refreshError) {
            console.error('[useDailyMissionV2] Failed to refresh logs:', refreshError);
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
    sessionResults: {
      ...sessionResults,
      templatesUsed: Array.from(sessionResults.templatesUsed),
      phasesCompleted: Array.from(sessionResults.phasesCompleted)
    },
    missionMetadata,
    submitDailyAnswer
  };
}

export default useDailyMissionV2;
