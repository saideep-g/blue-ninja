import React from 'react';
import { motion } from 'framer-motion';

/**
 * MissionHistory: Phase 2.2 Foundation
 * Displays a detailed log of recent questions, timing, and speed ratings.
 */
function MissionHistory({ logs }) {
    if (!logs || logs.length === 0) return null;

    return (
        <div className="ninja-card overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black italic text-blue-800 uppercase tracking-tighter">Recent Intelligence</h3>
                <span className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Last 50 Missions</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-blue-50">
                            <th className="pb-4 text-[10px] font-black text-blue-400 uppercase tracking-widest">Atom</th>
                            <th className="pb-4 text-[10px] font-black text-blue-400 uppercase tracking-widest">Outcome</th>
                            <th className="pb-4 text-[10px] font-black text-blue-400 uppercase tracking-widest">Thinking Time</th>
                            <th className="pb-4 text-[10px] font-black text-blue-400 uppercase tracking-widest">Pace</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50">
                        {logs.map((log) => (
                            <motion.tr
                                key={log.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hover:bg-blue-50/50 transition-colors"
                            >
                                <td className="py-4 font-bold text-slate-700">{log.atomId}</td>
                                <td className="py-4">
                                    {log.isCorrect ? (
                                        <span className="text-green-500 font-bold">✓ Success</span>
                                    ) : log.isRecovered ? (
                                        <span className="text-yellow-600 font-bold">↻ Recovered</span>
                                    ) : (
                                        <span className="text-red-400 font-bold">✗ Stormy</span>
                                    )}
                                </td>
                                <td className="py-4 font-medium text-slate-500">
                                    {(log.timeSpent / 1000).toFixed(1)}s
                                </td>
                                <td className="py-4">
                                    <span className={`text-[9px] font-black uppercase px-2 py-1 rounded ${log.speedRating === 'SPRINT' ? 'bg-yellow-400 text-blue-900' : 'bg-blue-100 text-blue-600'
                                        }`}>
                                        {log.speedRating || 'STEADY'}
                                    </span>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default MissionHistory;