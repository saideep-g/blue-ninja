import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NinjaProvider, useNinja } from './context/NinjaContext';
import { DevModeContext } from './context/DevModeContext';
import DevMenu from './components/dev/DevMenu';
import QuestionAuditor from './components/dev/QuestionAuditor';
import { useDiagnostic } from './hooks/useDiagnostic';
import { useDailyMission } from './hooks/useDailyMission';
import Login from './components/auth/Login';
import MissionCard from './components/diagnostic/MissionCard';
import PowerMap from './components/dashboard/PowerMap';
import BossTracker from './components/dashboard/BossTracker';
import Achievements from './components/dashboard/Achievements';
import AchievementUnlock from './components/dashboard/AchievementUnlock';
import ConceptPowerMap from './components/dashboard/ConceptPowerMap';
import MissionHistory from './components/dashboard/MissionHistory';
import { auth } from './firebase/config';
import { BlueNinjaTheme } from './theme/themeConfig';
import StudentInsightsReport from './components/dashboard/StudentInsightsReport';
import TeacherAnalyticsDashboard from './components/admin/TeacherAnalyticsDashboard';
import ParentDashboard from './components/parent/ParentDashboard';
import AnalyticsLogViewer from './components/admin/AnalyticsLogViewer';
import AdminAnalyticsDashboard from './components/admin/AdminAnalyticsDashboard';

/**
 * Blue Ninja Content Component
 * Updated to support Dashboard, Daily Mission loop, Quest views and Victory Screens.
 * Optimized Dashboard UX and Hero Quest placement.
 * Refined: Fully implements Nexus Dev Mode routing using "State Hijacking" to use
 * the exact same Production JSX for high-velocity testing.
 * 
 * FIX: Diagnostic-First Flow for New Users
 * - New users ALWAYS see diagnostic quest first (currentQuest: 'DIAGNOSTIC')
 * - Only after completing diagnostic does "Start Daily Flight" become available
 * - Dashboard only shows after diagnostic is complete
 */
function BlueNinjaContent() {
  const { user, ninjaStats, sessionHistory, updatePower, loading, activeAchievement, userRole, setUserRole } = useNinja();
  const { devMode, devConfig, setDevConfig } = useContext(DevModeContext);

  /// Standard views: QUEST (Diagnostic), DASHBOARD, or DAILY_MISSION
  const [currentView, setCurrentView] = useState('QUEST');
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);


  /**
   * INJECTION LOGIC:
   * We pass the 'testQuestions' from DevModeContext into the hooks.
   * If devMode is active and we are in a TEST view, the hooks use local IndexedDB data.
   */
  const {
    currentQuestion: diagQ,
    currentIndex: diagIdx,
    totalQuestions: diagTotal,
    submitAnswer: submitDiag,
    startRecoveryTimer,
    isComplete: diagComplete,
    masteryData: sessionMastery,
    hurdles: sessionHurdles
  } = useDiagnostic(devMode && devConfig.currentView === 'DIAGNOSTIC_TEST' ? devConfig.testQuestions : null);

  const {
    currentQuestion: dailyQ,
    currentIndex: dailyIdx,
    totalQuestions: dailyTotal,
    submitDailyAnswer,
    isComplete: dailyComplete,
    sessionResults,
    isLoading: dailyLoading
  } = useDailyMission(devMode && devConfig.currentView === 'DAILY_TEST' ? devConfig.testQuestions : null);

  /**
   * handleDiagAnswer
   * Unified handler to ensure studentAnswer and correctAnswer are captured for analytics.
   * This fixes the "Missing Fields" error in the validation script.
   */
  const handleDiagAnswer = (isCorrect, choice, isRecovered, tag) => {
    // We pass the full set of analytical data to the hook
    submitDiag(
      diagQ.id,
      isCorrect,
      diagQ.atom,
      isRecovered,
      tag,
      choice, // studentAnswer
      diagQ.correct_answer // ground truth correctAnswer
    );

    // Update power points based on performance
    if (isCorrect) updatePower(10);
    else if (isRecovered) updatePower(5);
  };

  /**
   * handleDailyAnswer - FIX: Correct Function Signature
   * Now properly calculates timeSpent and speedRating BEFORE calling submitDailyAnswer
   * This ensures all required fields are logged correctly
   */
  const handleDailyAnswer = (isCorrect, choice, isRecovered, tag, timeSpentSeconds) => {
    // Calculate speedRating based on thinking time (in seconds)
    const speedRating = timeSpentSeconds < 3 ? 'SPRINT' : (timeSpentSeconds < 15 ? 'NORMAL' : 'SLOW');

    // Now pass the correctly calculated parameters
    submitDailyAnswer(
      isCorrect,
      choice,
      isRecovered,
      tag,
      timeSpentSeconds, // Time spent in seconds
      speedRating       // Calculated speed rating
    );

    // Update power points for correct/recovered answers
    if (isCorrect) updatePower(15);
    else if (isRecovered) updatePower(7);
  };

  // Determine Source of Truth: Use DB data if quest is complete, otherwise use session data
  /**
   * DATA SOURCE LOGIC:
   * Favors persisted ninjaStats (Cloud) once the quest is COMPLETED.
   * This prevents the dashboard from appearing empty on page refresh.
   */
  const activeMastery = ninjaStats?.currentQuest === 'COMPLETED' ? (ninjaStats.mastery || {}) : sessionMastery;
  const activeHurdles = ninjaStats?.currentQuest === 'COMPLETED' ? (ninjaStats.hurdles || {}) : sessionHurdles;

  // FIX: Improved View Synchronization Logic
  // Ensures proper flow: DIAGNOSTIC → DASHBOARD → DAILY_MISSION
  useEffect(() => {
    if (ninjaStats?.currentQuest === 'COMPLETED' && currentView === 'QUEST') {
      // Diagnostic is complete, move to dashboard
      setCurrentView('DASHBOARD');
    }
  }, [ninjaStats?.currentQuest]);

  // Global Theme Setup
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', BlueNinjaTheme.colors.primary);
    root.style.setProperty('--color-accent', BlueNinjaTheme.colors.accent);
    root.style.setProperty('--color-surface', BlueNinjaTheme.colors.surface);
    root.style.setProperty('--color-text', BlueNinjaTheme.colors.text);
    root.style.setProperty('--color-card', BlueNinjaTheme.colors.card);
  }, []);

  // --- NEXUS DEV MODE ROUTING (STABILITY GATE) ---
  if (import.meta.env.DEV && devMode) {
    // Terminal and Auditor always take priority in Dev Mode
    if (devConfig.currentView === 'DEV_MENU') return <DevMenu />;
    if (devConfig.currentView === 'AUDITOR') return <QuestionAuditor />;
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50">
      <div className="animate-pulse text-4xl">🌊</div>
    </div>
  );
  if (!user) return <Login setUserRole={setUserRole} />;

  // Admin role - Analytics viewer
  if (userRole === 'ADMIN') {
    return <AnalyticsLogViewer />;
  }

  // FIX: Role-based routing
  if (userRole === 'TEACHER') {
    return <TeacherAnalyticsDashboard onSwitchRole={() => setUserRole('STUDENT')} />;
  }

  if (userRole === 'PARENT') {
    return <ParentDashboard onSwitchRole={() => setUserRole('STUDENT')} />;
  }

  /**
   * UNIFIED RENDER LOGIC
   * We calculate the "effectiveView" based on whether we are in a Dev Test or Production.
   * This allows us to use the same production JSX for both modes.
   */
  const isDevTesting = devMode && (devConfig.currentView === 'DIAGNOSTIC_TEST' || devConfig.currentView === 'DAILY_TEST');
  const effectiveView = isDevTesting
    ? (devConfig.currentView === 'DIAGNOSTIC_TEST' ? 'QUEST' : 'DAILY_MISSION')
    : currentView;

  return (
    <div className={isDevTesting ? "min-h-screen bg-slate-950" : "min-h-screen bg-[var(--color-surface)]"}>

      {/* Dev Overlay: Floating indicator and exit button for test scenarios */}
      {isDevTesting && (
        <div className="fixed bottom-4 left-4 z-[9999] flex items-center gap-2">
          <div className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-full shadow-2xl animate-pulse">
            Test Mode Active
          </div>
          <button
            onClick={() => setDevConfig(prev => ({ ...prev, currentView: 'DEV_MENU' }))}
            className="px-3 py-1 bg-slate-800 text-slate-300 text-[10px] font-black uppercase rounded-full border border-slate-700 hover:text-white transition-all"
          >
            Exit Test ↵
          </button>
        </div>
      )}

      {/* --- DAILY MISSION VICTORY SCREEN --- */}
      {dailyComplete && (
        <div className="min-h-screen flex items-center justify-center p-6">
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
              onClick={() => isDevTesting ? setDevConfig(prev => ({ ...prev, currentView: 'DEV_MENU' })) : window.location.reload()}
              className="w-full py-5 bg-[var(--color-primary)] text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              {isDevTesting ? 'Return to Terminal' : 'Return to Dashboard ➤'}
            </button>
          </div>
        </div>
      )}

      {/* --- DAILY MISSION VIEW --- */}
      {effectiveView === 'DAILY_MISSION' && !dailyComplete && (
        <div className="pb-20">
          <header className="max-w-4xl mx-auto p-6 flex justify-between items-center">
            <h1 className="text-2xl font-black italic text-blue-800 tracking-tighter uppercase">Daily Flight</h1>
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
                onAnswer={handleDailyAnswer} // Uses fixed unified handler
              />
            ) : (
              <div className="ninja-card flex flex-col items-center justify-center py-20">
                <div className="animate-spin text-4xl mb-4">🌊</div>
                <p className="font-bold text-blue-800">Preparing your flight path...</p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* --- DASHBOARD VIEW --- */}
      {effectiveView === 'DASHBOARD' && (
        <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
          <AchievementUnlock achievement={activeAchievement} />

          {/* Dashboard Header with Role Switcher */}
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
            <div className="flex gap-2">
              {/* Role Switcher */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
                >
                  👤 {userRole === 'STUDENT' ? 'Student' : userRole === 'TEACHER' ? 'Teacher' : 'Parent'} ▼
                </button>
                {showRoleSwitcher && (
                  <div className="absolute right-0 mt-2 bg-white border-2 border-blue-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => { setUserRole('STUDENT'); setShowRoleSwitcher(false); }}
                      className="block w-full text-left px-4 py-2 text-blue-800 hover:bg-blue-50"
                    >
                      📚 Student View
                    </button>
                    <button
                      onClick={() => { setUserRole('TEACHER'); setShowRoleSwitcher(false); }}
                      className="block w-full text-left px-4 py-2 text-blue-800 hover:bg-blue-50"
                    >
                      👨‍🏫 Teacher View
                    </button>
                    <button
                      onClick={() => { setUserRole('PARENT'); setShowRoleSwitcher(false); }}
                      className="block w-full text-left px-4 py-2 text-blue-800 hover:bg-blue-50"
                    >
                      👨‍👩‍👧 Parent View
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={() => auth.signOut()}
                className="text-xs font-black text-blue-400 uppercase tracking-widest hover:text-blue-800 transition-colors"
              >
                Sign Out 🚪
              </button>
            </div>
          </header>

          {/* Hero Quest Action */}
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
              <StudentInsightsReport logs={sessionHistory} />
            </div>

            {/* Intel Column */}
            <div className="space-y-8">
              <BossTracker hurdles={activeHurdles} />
              <Achievements ninjaStats={ninjaStats} />
              {/*Detailed Mission History added to primary column */}
              <MissionHistory logs={sessionHistory} />
            </div>
          </div>
        </div>
      )}

      {/* --- DIAGNOSTIC QUEST VIEW --- */}
      {effectiveView === 'QUEST' && !diagComplete && (
        <div className="pb-20">
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
                onStartRecovery={startRecoveryTimer}
                onAnswer={handleDiagAnswer} // Uses fixed unified handler
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
      )}
    </div>
  );
}


export default function App() {
  return (
    <Router>
      <NinjaProvider>
        <Routes>
          {/* Main App */}
          <Route path="/" element={<BlueNinjaContent />} />

          {/* Admin Analytics Dashboard */}
          <Route path="/admin" element={<AdminAnalyticsDashboard />} />
        </Routes>
      </NinjaProvider>
    </Router>
  );
}
