import React, { useState, useEffect, useContext } from 'react';
import { NinjaProvider, useNinja } from './context/NinjaContext';
import { useDiagnostic } from './hooks/useDiagnostic';
import { useDailyMission } from './hooks/useDailyMission';
import Login from './components/auth/Login';
import MissionCard from './components/diagnostic/MissionCard';
import PowerMap from './components/dashboard/PowerMap';
import BossTracker from './components/dashboard/BossTracker';
import Achievements from './components/dashboard/Achievements';
import AchievementUnlock from './components/dashboard/AchievementUnlock';
import ConceptPowerMap from './components/dashboard/ConceptPowerMap';
import MissionHistory from './components/dashboard/MissionHistory'; // Phase 2.2 New Component
import { auth } from './firebase/config';
import { BlueNinjaTheme } from './theme/themeConfig';

/**
 * Blue Ninja Content Component
 * Updated in to support Dashboard, Daily Mission loop, Quest views and Victory Screens.
 * Optimized Dashboard UX and Hero Quest placement.
 */
function BlueNinjaContent() {
  const { user, ninjaStats, sessionHistory, updatePower, loading, activeAchievement } = useNinja();

  /// Standard views: QUEST (Diagnostic), DASHBOARD, or DAILY_MISSION
  const [currentView, setCurrentView] = useState('QUEST');


  const {
    currentQuestion: diagQ,
    currentIndex: diagIdx,
    totalQuestions: diagTotal,
    submitAnswer: submitDiag,
    startRecoveryTimer,
    isComplete: diagComplete,
    masteryData: sessionMastery,
    hurdles: sessionHurdles
  } = useDiagnostic();

  const {
    currentQuestion: dailyQ,
    currentIndex: dailyIdx,
    totalQuestions: dailyTotal,
    submitDailyAnswer,
    isComplete: dailyComplete,
    sessionResults,
    isLoading: dailyLoading
  } = useDailyMission();

  // Determine Source of Truth: Use DB data if quest is complete, otherwise use session data
  /**
   * DATA SOURCE LOGIC:
   * Favors persisted ninjaStats (Cloud) once the quest is COMPLETED.
   * This prevents the dashboard from appearing empty on page refresh.
   */
  const activeMastery = ninjaStats?.currentQuest === 'COMPLETED' ? (ninjaStats.mastery || {}) : sessionMastery;
  const activeHurdles = ninjaStats?.currentQuest === 'COMPLETED' ? (ninjaStats.hurdles || {}) : sessionHurdles;

  // Sync view state based on database profile
  useEffect(() => {
    if (ninjaStats?.currentQuest === 'COMPLETED' && currentView === 'QUEST') {
      setCurrentView('DASHBOARD');
    }
  }, [ninjaStats?.currentQuest, currentView]);

  // Global Theme Setup
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', BlueNinjaTheme.colors.primary);
    root.style.setProperty('--color-accent', BlueNinjaTheme.colors.accent);
    root.style.setProperty('--color-surface', BlueNinjaTheme.colors.surface);
    root.style.setProperty('--color-text', BlueNinjaTheme.colors.text);
    root.style.setProperty('--color-card', BlueNinjaTheme.colors.card);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="animate-pulse text-4xl">🌊</div>
    </div>
  );

  if (!user) return <Login />;

  // --- DAILY MISSION VICTORY SCREEN ---
  if (dailyComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-surface)]">
        <div className="ninja-card max-w-md w-full text-center space-y-8 animate-in zoom-in duration-500">
          <h1 className="text-4xl font-black italic text-blue-800 uppercase tracking-tighter">Mission Accomplished</h1>
          <div className="text-7xl py-4">🏆</div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Accuracy</span>
              <span className="text-3xl font-bold text-blue-800">{sessionResults.correctCount}/10</span>
            </div>
            <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-100">
              <span className="block text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">Flow Gained</span>
              <span className="text-3xl font-bold text-yellow-700">+{sessionResults.flowGained}</span>
            </div>
          </div>

          {sessionResults.sprintCount > 0 && (
            <div className="p-4 bg-blue-600 rounded-2xl text-white font-bold flex items-center justify-center gap-2">
              <span>⚡</span> {sessionResults.sprintCount} Ninja Sprints Detected!
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full py-5 bg-[var(--color-primary)] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            Return to Dashboard ➤
          </button>
        </div>
      </div>
    );
  }

  // --- DAILY MISSION VIEW ---
  if (currentView === 'DAILY_MISSION') {
    return (
      <div className="min-h-screen pb-20 bg-[var(--color-surface)]">
        <header className="max-w-4xl mx-auto p-6 flex justify-between items-center">
          <h1 className="text-2xl font-black italic text-blue-800 tracking-tighter">DAILY FLIGHT</h1>
          <div className="flex flex-col items-end">
            <span className="font-bold text-blue-900">{dailyIdx + 1} / {dailyTotal}</span>
            <div className="w-32 h-1 bg-blue-100 rounded-full mt-1 overflow-hidden">
              <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${((dailyIdx + 1) / dailyTotal) * 100}%` }}></div>
            </div>
          </div>
        </header>
        <main className="max-w-2xl mx-auto mt-8 px-4">
          {dailyQ ? (
            <MissionCard
              question={dailyQ}
              onAnswer={submitDailyAnswer}
            />
          ) : (
            <div className="ninja-card flex flex-col items-center justify-center py-20">
              <div className="animate-spin text-4xl mb-4">🌊</div>
              <p className="font-bold text-blue-800">Preparing your flight path...</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- DASHBOARD VIEW ---
  if (currentView === 'DASHBOARD' || diagComplete) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
        <AchievementUnlock achievement={activeAchievement} />

        {/* Dashboard Header */}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black italic text-blue-800 uppercase tracking-tighter">
              Blue Ninja Dashboard
            </h1>
            <div className="flex gap-4 mt-2">
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                🔥 {ninjaStats.streakCount || 0} Day Streak
              </span>
              <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                Level {ninjaStats.heroLevel}
              </span>
            </div>
          </div>
          <button onClick={() => auth.signOut()} className="text-xs font-black text-blue-400 uppercase tracking-widest hover:text-blue-800 transition-colors">
            Sign Out 🚪
          </button>
        </header>

        {/* Phase 2.4 UX Update: Prominent Hero Quest Action at the Top */}
        <div className="ninja-card bg-blue-600 text-white border-none flex flex-col md:flex-row items-center justify-between p-8 md:p-12 mb-8 gap-6 shadow-2xl">
          <div className="text-center md:text-left z-10">
            <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tighter">The Sky Is Calling</h2>
            <p className="text-blue-100 font-medium">Ready for today's 10-mission flight? Clear the Storm Clouds.</p>
          </div>
          <button
            onClick={() => setCurrentView('DAILY_MISSION')}
            className="bg-yellow-400 text-blue-900 px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-lg whitespace-nowrap"
          >
            Start Daily Flight ➤
          </button>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Hero Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Now using activeMastery (Persisted or Session) */}
            <PowerMap masteryData={activeMastery} />
            <ConceptPowerMap masteryData={activeMastery} />


          </div>
        </div>

        {/* Intel Column */}
        <div className="space-y-8">
          <BossTracker hurdles={activeHurdles} />
          <Achievements ninjaStats={ninjaStats} />
          {/* Phase 2.2: Detailed Mission History added to primary column */}
          <MissionHistory logs={sessionHistory} />

        </div>
      </div>

    );
  }

  // --- DIAGNOSTIC QUEST VIEW ---
  return (
    <div className="min-h-screen pb-20 bg-[var(--color-surface)]">
      {/* Global Achievement Overlay */}
      <AchievementUnlock achievement={activeAchievement} />

      {/* Header with Power Points and Level */}
      <header className="max-w-4xl mx-auto p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black italic text-blue-800 tracking-tighter uppercase">Entrance Quest</h1>
          <div className="w-full h-1 bg-blue-100 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-[var(--color-accent)] transition-all duration-700" style={{ width: `${(diagIdx / diagTotal) * 100}%` }}></div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-bold text-blue-900 leading-none">
            {ninjaStats.powerPoints} ⚡ FLOW
          </span>
          <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-1">
            Mission {diagIdx + 1} / {diagTotal}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto mt-8 px-4">
        {diagQ ? (
          <MissionCard
            question={diagQ}
            onStartRecovery={startRecoveryTimer} // Step 10 integration
            onAnswer={(isCorrect, choice, isRecovered = false, timeSpent = 0) => {
              // Find the diagnostic tag of the chosen distractor to track hurdles
              const chosenDistractor = diagQ.distractors.find(d => d.option === choice);
              const tag = chosenDistractor?.diagnostic_tag || null;

              submitDiag(diagQ.id, isCorrect, diagQ.atom, isRecovered, tag, timeSpent);

              if (isCorrect) updatePower(10);
              else if (isRecovered) updatePower(5); // Partial power for recovery
            }}
          />
        ) : (
          <div className="ninja-card flex flex-col items-center justify-center py-20">
            <div className="animate-spin text-4xl mb-4">🌊</div>
            <p className="font-bold text-blue-800">Setting up the next mission...</p>
          </div>
        )}
      </main>

      <div className="flex justify-center mt-10">
        <button
          onClick={() => setCurrentView('DASHBOARD')}
          className="text-[10px] font-black text-blue-400 hover:text-blue-800 uppercase tracking-widest border-b border-blue-100 pb-1 transition-all"
        >
          Check Mission Intel Dashboard
        </button>
      </div>

      {/* Footer Branding */}
      <p className="text-center mt-10 text-[10px] font-black text-blue-300 uppercase tracking-widest">
        "When I fly towards you, the whole world turns blue."
      </p>

      {/* Floating Sign Out */}
      <button
        onClick={() => auth.signOut()}
        className="fixed bottom-6 right-6 p-3 bg-white/80 backdrop-blur-sm rounded-full text-[10px] font-black text-blue-400 hover:text-blue-600 shadow-sm border border-blue-50 uppercase tracking-tighter"
      >
        Sign Out 🚪
      </button>
    </div>
  );
}

export default function App() {
  return (
    <NinjaProvider>
      <BlueNinjaContent />
    </NinjaProvider>
  );
}