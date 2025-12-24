import React from 'react';

/**
 * BossTracker: Step 12 Implementation
 * Visualizes student hurdles as "Storm Clouds" to be cleared.
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

    // Convert hurdle counts to "Active Bosses"
    const activeBosses = Object.entries(hurdles)
        .filter(([_, count]) => count > 0)
        .map(([tag, count]) => ({
            name: bossMap[tag] || `The ${tag.split('_')[0]} Spectre`,
            health: Math.max(10, 100 - (count * 20)), // Health drops as they see more questions
            intensity: count > 1 ? 'CRITICAL' : 'HIGH'
        }));

    if (activeBosses.length === 0) return null;

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
                            <span className="text-xs font-bold text-slate-400">Health: {boss.health}%</span>
                        </div>

                        {/* Boss Health Bar */}
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