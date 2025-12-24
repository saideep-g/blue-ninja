import React, { useState } from 'react';
import { NinjaProvider, useNinja } from './context/NinjaContext';
import { useDiagnostic } from './hooks/useDiagnostic';
import Login from './components/auth/Login';
import MissionCard from './components/diagnostic/MissionCard'; // Import Step 6 component
import DataSeeder from './components/admin/DataSeeder';
import PowerMap from './components/dashboard/PowerMap';
import BossTracker from './components/dashboard/BossTracker';
import Achievements from './components/dashboard/Achievements';
import AchievementUnlock from './components/dashboard/AchievementUnlock';
import ConceptPowerMap from './components/dashboard/ConceptPowerMap';
import { auth } from './firebase/config';

/**
 * Blue Ninja Content Component
 * Updated in Step 14 to support Dashboard and Quest views.
 */
function BlueNinjaContent() {
  const { user, ninjaStats, updatePower, loading, activeAchievement } = useNinja();

  // Set initial view based on database status
  const [currentView, setCurrentView] = useState(
    ninjaStats.currentQuest === 'COMPLETED' ? 'DASHBOARD' : 'QUEST'
  );


  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    submitAnswer,
    startRecoveryTimer, // Fixed: Destructured to resolve ReferenceError
    isComplete,
    masteryData,
    hurdles // Step 12 integration
  } = useDiagnostic();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="animate-pulse text-4xl">🌊</div>
    </div>
  );

  if (!user) return <Login />;

  // --- DASHBOARD VIEW ---
  if (currentView === 'DASHBOARD' || isComplete) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
        <AchievementUnlock achievement={activeAchievement} />

        {/* Dashboard Header */}
        <header className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-black italic text-blue-800 uppercase tracking-tighter">
            Blue Ninja Dashboard
          </h1>
          <button
            onClick={() => auth.signOut()}
            className="text-xs font-black text-blue-400 uppercase tracking-widest hover:text-blue-800 transition-colors"
          >
            Sign Out 🚪
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Hero Column */}
          <div className="lg:col-span-2 space-y-8">
            <PowerMap masteryData={masteryData} />
            <ConceptPowerMap masteryData={masteryData} />
          </div>
        </div>

        {/* Intel Column */}
        <div className="space-y-8">
          <BossTracker hurdles={hurdles} />
          <Achievements ninjaStats={ninjaStats} />

          {/* Action Card */}
          <div className="ninja-card bg-blue-600 text-white border-none text-center py-10">
            <h3 className="text-xl font-black uppercase italic mb-4">Sky Is Calling</h3>
            <button
              onClick={() => isComplete ? window.location.reload() : setCurrentView('QUEST')}
              className="bg-yellow-400 text-blue-900 px-8 py-3 rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              {isComplete ? 'New Quest' : 'Continue Quest'} ➤
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- QUEST VIEW (Diagnostic) ---
  return (
    <div className="min-h-screen pb-20">
      {/* Global Achievement Overlay */}
      <AchievementUnlock achievement={activeAchievement} />

      {/* Header with Power Points and Level */}
      <header className="max-w-4xl mx-auto p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black italic text-blue-800 tracking-tighter">BLUE NINJA</h1>
          <div className="w-full h-1 bg-blue-100 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-700"
              style={{ width: `${(currentIndex / totalQuestions) * 100}%` }}
            ></div>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-bold text-blue-900 leading-none">
            {ninjaStats.powerPoints} ⚡ FLOW
          </span>
          <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-1">
            Mission {currentIndex + 1} / {totalQuestions}
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto mt-8 px-4">
        {currentQuestion ? (
          <MissionCard
            question={currentQuestion}
            onStartRecovery={startRecoveryTimer} // Step 10 integration
            onAnswer={(isCorrect, choice, isRecovered = false) => {
              // Find the diagnostic tag of the chosen distractor to track hurdles
              const chosenDistractor = currentQuestion.distractors.find(d => d.option === choice);
              const tag = chosenDistractor?.diagnostic_tag || null;

              submitAnswer(currentQuestion.id, isCorrect, currentQuestion.atom, isRecovered, tag);

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