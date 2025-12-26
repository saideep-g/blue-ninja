import React from 'react';

/**
 * Achievements
 * Visualizes unlocked milestones to drive motivation.
 */
function Achievements({ ninjaStats }) {
    // Pre-defined milestones based on v4.0 engagement layer
    const milestones = [
        {
            id: 'rising_star',
            name: "Rising Star",
            icon: "⭐",
            description: "Reach Level 2",
            unlocked: ninjaStats.heroLevel >= 2
        },
        {
            id: 'flow_master',
            name: "Flow Master",
            icon: "⚡",
            description: "Gain 1000 Flow Points",
            unlocked: ninjaStats.powerPoints >= 1000
        }
    ];

    return (
        <div className="ninja-card bg-white">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-6">🏆 Unlocked Badges</h3>
            <div className="grid grid-cols-2 gap-4">
                {milestones.map((m) => (
                    <div
                        key={m.id}
                        className={`p-4 rounded-2xl flex flex-col items-center text-center transition-all ${m.unlocked ? 'bg-yellow-50 border-2 border-yellow-200' : 'bg-slate-50 opacity-40 grayscale'
                            }`}
                    >
                        <span className="text-3xl mb-2">{m.icon}</span>
                        <span className="text-xs font-black text-slate-800">{m.name}</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-tight">{m.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Achievements;