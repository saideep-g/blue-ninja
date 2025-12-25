import React, { useState, useEffect } from 'react';
import { useDevMode } from '../../context/DevModeContext';
import { nexusDB } from '../../services/nexusSync';

/**
 * QuestionAuditor: The "Inquiry" tool for Question Integrity.
 * Automatically identifies AI errors (duplicate answers) and provides 
 * a high-speed editing interface.
 */
function QuestionAuditor() {
    const { setDevConfig } = useDevMode();
    const [flaggedQuestions, setFlaggedQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Scan for integrity issues on mount
    useEffect(() => {
        const scanForIssues = async () => {
            setLoading(true);
            const allQuestions = await nexusDB.questions.toArray();

            // LOGIC: Find questions where text is repeated across options or correct_answer
            const issues = allQuestions.filter(q => {
                const options = q.distractors.map(d => d.option.toLowerCase().trim());
                options.push(q.correct_answer.toLowerCase().trim());
                const uniqueCount = new Set(options).size;
                return uniqueCount !== options.length;
            });

            setFlaggedQuestions(issues);
            setLoading(false);
        };
        scanForIssues();
    }, []);

    /**
     * handleUpdate: Updates the local IndexedDB (NexusDB) instantly.
     * This follows the "Local-First" approach to avoid Firestore costs during bulk edits.
     */
    const handleUpdate = async (qId, updates) => {
        await nexusDB.questions.update(qId, updates);
        // Refresh local state to clear the "Flag" if the issue is fixed
        setFlaggedQuestions(prev => prev.map(q => q.id === qId ? { ...q, ...updates } : q));
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
            <div className="text-blue-400 font-black animate-pulse uppercase tracking-widest">Scanning Question Bank...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
            <header className="max-w-5xl mx-auto flex justify-between items-center mb-10">
                <div>
                    <button
                        onClick={() => setDevConfig(prev => ({ ...prev, currentView: 'DEV_MENU' }))}
                        className="text-xs font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                    >
                        ← Back to Terminal
                    </button>
                    <h2 className="text-3xl font-black italic text-yellow-400 uppercase tracking-tighter mt-2">AI Integrity Auditor</h2>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl">
                    <span className="text-red-400 font-bold">{flaggedQuestions.length} Issues Detected</span>
                </div>
            </header>

            <main className="max-w-5xl mx-auto space-y-6">
                {flaggedQuestions.length === 0 ? (
                    <div className="bg-slate-800/50 p-20 rounded-3xl text-center border border-dashed border-slate-700">
                        <span className="text-5xl block mb-4">💎</span>
                        <h3 className="text-xl font-bold">No Integrity Issues Found</h3>
                        <p className="text-slate-500 mt-2">All questions in your local cache have unique answer options.</p>
                    </div>
                ) : (
                    flaggedQuestions.map((q) => (
                        <div key={q.id} className="bg-slate-800 rounded-2xl p-6 border border-slate-700 hover:border-red-500/50 transition-colors">
                            <div className="flex justify-between mb-4">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{q.id} • {q.atom}</span>
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest bg-red-400/10 px-2 py-1 rounded">Duplicate Answer Detected</span>
                            </div>

                            <p className="text-lg font-medium mb-6 text-slate-300">{q.text}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Correct Answer Field */}
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-green-500 uppercase ml-2">Correct Answer</label>
                                    <input
                                        type="text"
                                        defaultValue={q.correct_answer}
                                        onBlur={(e) => handleUpdate(q.id, { correct_answer: e.target.value })}
                                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:border-green-500 outline-none transition-colors"
                                    />
                                </div>

                                {/* Distractors Mapping */}
                                {q.distractors.map((d, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Option {idx + 1}</label>
                                        <input
                                            type="text"
                                            defaultValue={d.option}
                                            onBlur={(e) => {
                                                const newDistractors = [...q.distractors];
                                                newDistractors[idx].option = e.target.value;
                                                handleUpdate(q.id, { distractors: newDistractors });
                                            }}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </main>
        </div>
    );
}

export default QuestionAuditor;