import React from 'react';
import { NinjaProvider, useNinja } from './context/NinjaContext';
import { useDiagnostic } from './hooks/useDiagnostic';
import Login from './components/auth/Login';
import MissionCard from './components/diagnostic/MissionCard'; // Import Step 6 component
import DataSeeder from './components/admin/DataSeeder';

function BlueNinjaContent() {
  const { user, ninjaStats, updatePower, loading } = useNinja();
  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    submitAnswer,
    isComplete
  } = useDiagnostic();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="animate-pulse text-4xl">🌊</div>
    </div>
  );

  if (!user) return <Login />;

  // Test End Screen (Dashboard preview)
  if (isComplete) return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="ninja-card text-center max-w-md">
        <span className="text-6xl mb-6 block">🏆</span>
        <h2 className="text-3xl font-black text-blue-800 uppercase italic">Quest Complete!</h2>
        <p className="text-slate-500 mt-4 font-medium">
          You've navigated the Blue Sky. Your power levels are being synchronized.
        </p>
        <div className="mt-8 p-6 bg-blue-50 rounded-3xl border-2 border-blue-100">
          <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Total Flow Gained</div>
          <div className="text-4xl font-black text-blue-800">{ninjaStats.powerPoints} ⚡</div>
        </div>
        <button
          className="btn-primary w-full mt-8"
          onClick={() => window.location.reload()}
        >
          View My Journey ➤
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20">
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
              submitAnswer(currentQuestion.id, isCorrect, currentQuestion.atom, isRecovered);
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