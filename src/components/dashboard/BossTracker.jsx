import React from 'react';
import { motion } from 'framer-motion';

/**
 * BossTracker: Phase 2.3 Polish
 * Visualizes hurdles as "Storm Clouds" with active health bars.
 * Maps raw diagnostic_tags to student-friendly Boss names.
 */
function BossTracker({ hurdles }) {
    // Map internal tags to Blue Ninja themed Bosses
    const bossMap = {
        SIGN_IGNORANCE: "The Minus Mirage",
        SEMANTIC_ORDER_ERROR: "The Reverse Cyclone",
        BODMAS_TRANSPOSE_ERROR: "The Order Overlord",
        DIAMETER_RADIUS_CONFUSION: "The Circle Phantom",
        PERCENT_BASE_ERROR: "The Ratio Wraith"
    };

    // Only display active hurdles that still have an intensity count > 0
    const activeBosses = Object.entries(hurdles || {})
        .filter(([_, count]) => count > 0)
        .map(([tag, count]) => ({
            tag,
            name: bossMap[tag] || `The ${tag.split('_')[0]} Spectre`,
            // Normalize health based on intensity (Assume max intensity of 5 for 100% health bar)
            health: Math.min(100, (count / 5) * 100),
            intensity: count > 3 ? 'CRITICAL' : 'HIGH'
        }));

    if (activeBosses.length === 0) {
        return (
            <div className="ninja-card bg-blue-50/50 border-dashed border-blue-200 flex flex-col items-center justify-center py-10 text-center">
                <span className="text-4xl mb-2">☀️</span>
                <p className="text-blue-400 font-black uppercase text-[10px] tracking-widest">Sky is Clear</p>
                <p className="text-slate-400 text-xs px-6 mt-1">No Storm Clouds detected. Your Ninja spirit has cleared the horizon!</p>
            </div>
        );
    }

    return (
        <div className="ninja-card bg-white border-2 border-blue-50">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-6 flex items-center gap-2">
                <span className="text-lg">☁️</span> Active Storm Clouds
            </h3>

            <div className="space-y-6">
                {activeBosses.slice(0, 3).map((boss, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex justify-between items-end">
                            <div>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${boss.intensity === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
                                    }`}>
                                    {boss.intensity} BOSS
                                </span>
                                <h4 className="text-lg font-bold text-slate-800 mt-1">{boss.name}</h4>
                            </div>
                            <span className="text-[10px] font-bold text-blue-400 uppercase">
                                Intensity: {hurdles[boss.tag]}
                            </span>
                        </div>

                        {/* Boss Health Bar: Visualizes misconception intensity */}
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-1000 ${boss.intensity === 'CRITICAL' ? 'bg-red-400' : 'bg-orange-400'
                                    }`}
                                style={{ width: `${boss.health}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">
                Challenge these in your Daily Quest to clear the sky!
            </p>
        </div>
    );
}

export default BossTracker;