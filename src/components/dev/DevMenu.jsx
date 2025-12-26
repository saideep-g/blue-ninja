import React, { useState } from 'react';
import { useDevMode } from '../../context/DevModeContext';
import { pushQuestionsToCloud } from '../../services/nexusSync';
import { validateNexusLogs } from '../../services/nexusValidator';


/**
 * DevMenu: The Nexus Terminal
 * Style: Dark, High-Contrast Terminal for developer focus.
 */
function DevMenu() {
    const { devConfig, setDevConfig, runInitialSync, startTestScenario, TEST_USER_ID } = useDevMode();
    const [report, setReport] = useState(null);

    const runIntegrityCheck = async () => {
        const result = await validateNexusLogs();
        setReport(result);
    };

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-slate-300 p-8 font-mono">
            <div className="max-w-4xl mx-auto">

                {/* Connection Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-6 mb-12">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                        <div>
                            <h1 className="text-xl font-black text-white uppercase tracking-widest">Nexus_Terminal_v4.0</h1>
                            <p className="text-[10px] text-slate-500">SECURE_CONNECTION: {TEST_USER_ID}</p>
                        </div>
                    </div>
                    <button
                        onClick={runInitialSync}
                        className="px-4 py-2 bg-blue-600/10 border border-blue-500/30 text-blue-400 text-xs font-bold rounded hover:bg-blue-600 hover:text-white transition-all"
                    >
                        {devConfig.syncStatus === 'SYNCING' ? 'PULLING_DATA...' : 'PULL_LATEST_FROM_CLOUD'}
                    </button>
                </div>

                {/* Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">

                    {/* Auditor Tool */}
                    <button
                        onClick={() => setDevConfig(prev => ({ ...prev, currentView: 'AUDITOR' }))}
                        className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-left hover:border-yellow-500/50 transition-all group"
                    >
                        <div className="text-yellow-500 text-xs font-black uppercase mb-2">Stability Tool</div>
                        <h3 className="text-2xl font-bold text-white mb-2">Question Auditor</h3>
                        <p className="text-sm text-slate-500">Scan {devConfig.localQuestionCount} questions for AI errors & duplicates locally.</p>
                    </button>

                    {/* Sync Tool */}
                    <button
                        onClick={async () => {
                            if (window.confirm("SYNC: Deploy local edits to Firestore?")) {
                                await pushQuestionsToCloud();
                                alert("DEPLOY_SUCCESSFUL");
                            }
                        }}
                        className="p-8 bg-slate-900 border border-slate-800 rounded-xl text-left hover:border-blue-500/50 transition-all"
                    >
                        <div className="text-blue-500 text-xs font-black uppercase mb-2">Persistence Tool</div>
                        <h3 className="text-2xl font-bold text-white mb-2">Cloud Deploy</h3>
                        <p className="text-sm text-slate-500">Push your local IndexedDB fixes to the production database.</p>
                    </button>
                </div>

                {/* NEW: Integrity Validation Section */}
                <div className="mb-12 p-8 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Post-Test_Integrity_Report</h3>
                        <button
                            onClick={runIntegrityCheck}
                            className="px-4 py-2 bg-yellow-500 text-black text-[10px] font-black uppercase rounded hover:bg-yellow-400 transition-all"
                        >
                            Run Validation Script ↵
                        </button>
                    </div>

                    {report ? (
                        <div className={`p-6 rounded-lg border ${report.status === 'PASS' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">{report.status === 'PASS' ? '✅' : '🚨'}</span>
                                <div>
                                    <div className="text-sm font-black uppercase">{report.status === 'PASS' ? 'Validation Passed' : 'Validation Failed'}</div>
                                    <div className="text-[10px] text-slate-500">Log ID: {report.latestLog?.id || 'N/A'}</div>
                                </div>
                            </div>

                            {report.status === 'FAIL' && report.missingFields && report.missingFields.length > 0 && (
                                <div className="mt-4">
                                    <div className="text-[10px] font-bold text-red-400 uppercase mb-2">Missing Fields:</div>
                                    <div className="flex flex-wrap gap-2">
                                        {report.missingFields.map(f => (
                                            <span key={f} className="px-2 py-1 bg-red-900/50 text-red-200 text-[9px] font-mono rounded">{f}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {report.status === 'PASS' && (
                                <p className="text-xs text-green-400">All 12 analytical fields are correctly populated in NexusDB.</p>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-6 text-slate-600 text-xs italic">
                            Finish a test scenario, then run the script to verify data integrity.
                        </div>
                    )}
                </div>



                {/* 1Q/2Q Scenario Selector (The Menu You Need) */}
                <div className="p-8 bg-slate-900/50 border border-slate-800 rounded-xl">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-8 text-center">Inquiry_Testing_Scenarios</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => startTestScenario('DIAGNOSTIC_TEST', 1)}
                            className="p-4 bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:bg-blue-600 hover:text-white transition-all border border-slate-700"
                        >
                            Diagnostic (1 Question)
                        </button>
                        <button
                            onClick={() => startTestScenario('DAILY_TEST', 1)}
                            className="p-4 bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:bg-green-600 hover:text-white transition-all border border-slate-700"
                        >
                            Daily Mission (1 Question)
                        </button>
                        <button
                            onClick={() => startTestScenario('DAILY_TEST', 2)}
                            className="p-4 bg-slate-800 rounded-lg text-xs font-bold text-slate-300 hover:bg-purple-600 hover:text-white transition-all border border-slate-700"
                        >
                            Daily Mission (2 Questions)
                        </button>
                    </div>
                    <p className="mt-8 text-[9px] text-center text-slate-600 italic">
                        Note: Testing uses local IndexedDB questions only. No Firestore reads will be incurred.
                    </p>
                </div>

            </div>
        </div>
    );
}

export default DevMenu;