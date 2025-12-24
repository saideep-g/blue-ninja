import React, { useState, useEffect } from 'react';
import { NinjaProvider, useNinja } from './context/NinjaContext';

/**
 * Blue Ninja Theme Configuration
 * Inspired by the airy, youthful aesthetic of "When I Fly Towards You".
 * This object manages the "Skin" of the application.
 */
const BlueNinjaTheme = {
  id: 'blue-ninja',
  displayName: 'Blue Ninja',
  colors: {
    primary: '#1e40af',    // Deep Sky Blue
    secondary: '#60a5fa',  // Light Sky Blue
    accent: '#facc15',     // Sun Gold
    surface: '#f8fafc',    // Light slate background
    card: 'rgba(255, 255, 255, 0.9)',
    text: '#0f172a'        // Slate 900
  },
  labels: {
    testTitle: "The Blue Ninja Entrance Quest",
    powerUnit: "Flow",
    levelPrefix: "Cloud Level",
    bossLabel: "Storm Cloud",
    cta: "Unlock Flow ➤"
  }
};

/**
 * Main App Component
 * Implements a dynamic theme engine using CSS variables.
 * Fixed the 'm is not defined' error by ensuring all text is properly string-wrapped.
 */
function BlueNinjaApp() {
  const { ninjaStats, updatePower } = useNinja();
  const [gameState, setGameState] = useState('DIAGNOSTIC');
  const [powerPoints, setPowerPoints] = useState(245);

  // Phase 1: Inject Theme Variables
  // This allows us to swap the theme object later without changing component logic.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', BlueNinjaTheme.colors.primary);
    root.style.setProperty('--color-secondary', BlueNinjaTheme.colors.secondary);
    root.style.setProperty('--color-accent', BlueNinjaTheme.colors.accent);
    root.style.setProperty('--color-surface', BlueNinjaTheme.colors.surface);
    root.style.setProperty('--color-text', BlueNinjaTheme.colors.text);
    root.style.setProperty('--color-card', BlueNinjaTheme.colors.card);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-surface)] text-[var(--color-text)] transition-colors duration-500 font-sans selection:bg-blue-200">
      {/* Test Header: Represents the "Blue Ninja" progress bar and Power levels */}
      <header className="w-full max-w-4xl mx-auto p-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--color-primary)] uppercase italic">
            Blue Ninja
          </h1>
          <p className="text-sm font-medium opacity-60">
            {BlueNinjaTheme.labels.testTitle}
          </p>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <span className="text-2xl font-mono font-bold text-[var(--color-primary)]">
              {powerPoints} <span className="text-sm uppercase">{BlueNinjaTheme.labels.powerUnit}</span>
            </span>
          </div>
          {/* Progress bar towards next level */}
          <div className="w-32 h-1.5 bg-blue-200 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full bg-[var(--color-accent)] transition-all duration-1000 shadow-[0_0_8px_var(--color-accent)]"
              style={{ width: '35%' }}
            ></div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-2xl mx-auto px-4 mt-8">
        {gameState === 'DIAGNOSTIC' && (
          <div className="space-y-6">
            {/* Question Card: Styled to feel like a floating summer cloud */}
            <div className="bg-[var(--color-card)] backdrop-blur-sm border-4 border-white rounded-[2.5rem] p-8 shadow-2xl shadow-blue-100 relative overflow-hidden">
              {/* Badge for Atomic Concept */}
              <div className="inline-block px-4 py-1 rounded-full bg-blue-50 text-[var(--color-primary)] text-xs font-bold tracking-widest uppercase mb-6 border border-blue-100">
                {BlueNinjaTheme.labels.levelPrefix} 1 • Integers
              </div>

              {/* Question Text with placeholder for MathJax rendering */}
              <div className="space-y-4">
                <h2 className="text-3xl font-bold leading-tight">
                  A submarine is 300m below sea level. It ascends 100m.
                </h2>
                <p className="text-lg text-slate-500 italic">
                  "Fly towards the new position... where is the submarine now?"
                </p>
              </div>

              {/* Answer Interaction Area */}
              <div className="mt-10 space-y-4">
                <input
                  type="text"
                  placeholder="Enter your answer (e.g. -200m)"
                  className="w-full p-5 rounded-2xl bg-slate-50 border-2 border-slate-100 focus:border-[var(--color-secondary)] focus:ring-0 outline-none text-xl font-medium transition-all"
                />

                <button
                  className="w-full bg-[var(--color-primary)] text-white py-5 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-blue-200 active:scale-95 transition-all flex justify-center items-center gap-2"
                  onClick={() => setPowerPoints(prev => prev + 5)}
                >
                  {BlueNinjaTheme.labels.cta}
                </button>
              </div>

              {/* Decorative "Blue Ninja" Element */}
              <div className="absolute -bottom-4 -right-4 text-8xl opacity-5 grayscale">
                🌊
              </div>
            </div>

            {/* Engagement Framing: Hidden until an answer is submitted */}
            <div className="text-center p-4">
              <p className="text-sm font-medium text-slate-400">
                Missions are adaptive. The Blue Ninja flies faster when you're focused!
              </p>
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-6 w-full text-center text-[var(--color-primary)] opacity-30 text-xs font-bold tracking-widest uppercase">
        Blue Ninja v4.0 • Inspired by Youth & Flow
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <NinjaProvider>
      <BlueNinjaApp />
    </NinjaProvider>
  );
}