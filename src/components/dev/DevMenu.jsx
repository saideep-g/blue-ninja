import React from 'react';
import { useDevMode } from '../../context/DevModeContext';
import { pushQuestionsToCloud } from '../../services/nexusSync';

/**
 * DevMenu: The Nexus Terminal.
 * Updated with High-Velocity Testing Scenarios.
 */
function DevMenu() {
    const { devConfig, setDevConfig, runInitialSync, startTestScenario, TEST_USER_ID } = useDevMode();

    const handleCloudSync = async () => {
        if (window.confirm("Push all local corrections to Firestore? This updates the Production bank.")) {
            await pushQuestionsToCloud();
            alert("✅ Cloud Updated Successfully!");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
            <div className="max-w-4xl mx-auto">

                {/* Header & Sync Status */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <h1 className="text-5xl font-black italic tracking-tighter text-blue-400 uppercase">Nexus Terminal</h1>
                        <p className="text-slate-400 font-mono mt-2">USER: {TEST_USER_ID}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Local Database</div>
                        <div className="text-2xl font-bold">{devConfig.localQuestionCount} Questions</div>
                        <button
                            onClick={runInitialSync}
                            className="text-[10px] bg-blue-500/10 text-blue-400 px-3 py-1 rounded border border-blue-500/20 mt-2 hover:bg-blue-500 hover:text-white transition-all"
                        >
                            {devConfig.syncStatus === 'SYNCING' ? '⏳ Pulling...' : '🔄 Pull from Cloud'}
                        </button>
                    </div>
                </div>

                {/* Primary Tools */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <button
                        onClick={() => setDevConfig(prev => ({ ...prev, currentView: 'AUDITOR' }))}
                        className="group p-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl text-left transition-transform hover:scale-[1.02]"
                    >
                        <span className="text-4xl">🔍</span>
                        <h3 className="text-2xl font-black text-slate-900 mt-4 uppercase">AI Auditor</h3>
                        <p className="text-slate-900/70 text-sm font-medium">Scan for duplicates and fix AI errors locally.</p>
                    </button>

                    <button
                        onClick={handleCloudSync}
                        className="group p-8 bg-slate-800 rounded-2xl text-left border border-slate-700 hover:border-blue-500 transition-all"
                    >
                        <span className="text-4xl">🚀</span>
                        <h3 className="text-2xl font-black text-blue-400 mt-4 uppercase">Cloud Deploy</h3>
                        <p className="text-slate-400 text-sm">Batch sync all local fixes to Firestore.</p>
                    </button>
                </div>

                {/* High-Velocity Scenarios */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-6">Test Scenarios</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <button
                            onClick={() => startTestScenario('DIAGNOSTIC_TEST', 1)}
                            className="p-4 bg-blue-600/20 border border-blue-500/30 rounded-xl text-xs font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                        >
                            📋 Diagnostic (1Q)
                        </button>
                        <button
                            onClick={() => startTestScenario('DAILY_TEST', 1)}
                            className="p-4 bg-green-600/20 border border-green-500/30 rounded-xl text-xs font-bold text-green-400 hover:bg-green-600 hover:text-white transition-all"
                        >
                            ⚔️ Daily Mission (1Q)
                        </button>
                        <button
                            onClick={() => startTestScenario('DAILY_TEST', 2)}
                            className="p-4 bg-purple-600/20 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-400 hover:bg-purple-600 hover:text-white transition-all"
                        >
                            ⚔️ Daily Mission (2Q)
                        </button>
                        <button
                            onClick={() => setDevConfig(prev => ({ ...prev, currentView: 'DASHBOARD' }))}
                            className="p-4 bg-slate-700 border border-slate-600 rounded-xl text-xs font-bold text-slate-300 hover:bg-slate-600 transition-all"
                        >
                            📊 Victory/Dashboard
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default DevMenu;