import React from 'react';
import { useNinja } from '../../context/NinjaContext';

/**
 * PowerMap: Step 11 Implementation
 * Displays current Flow points and progress toward the next Hero Level.
 */
function PowerMap({ masteryData }) {
    const { ninjaStats } = useNinja();

    // Calculate next level progress
    const currentLevelPoints = ninjaStats.powerPoints % 500;
    const progressPercent = (currentLevelPoints / 500) * 100;

    return (
        <div className="ninja-card bg-gradient-to-br from-blue-600 to-blue-800 text-white border-none">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] opacity-70">Current Tier</h3>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter">
                        Level {ninjaStats.heroLevel} Ninja
                    </h2>
                </div>
                <div className="text-right">
                    <div className="text-4xl font-black italic">{ninjaStats.powerPoints}</div>
                    <div className="text-[10px] font-bold uppercase opacity-60 tracking-widest">Total Flow Points ⚡</div>
                </div>
            </div>

            {/* Progress to next Hero Level */}
            <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest opacity-80">
                    <span>Next Rank Progress</span>
                    <span>{currentLevelPoints} / 500</span>
                </div>
                <div className="w-full h-4 bg-black/20 rounded-full overflow-hidden p-1">
                    <div
                        className="h-full bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.6)] transition-all duration-1000"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <p className="mt-6 text-sm font-medium italic opacity-80">
                "Keep flying towards the horizon. Each mission charges your shield."
            </p>
        </div>
    );
}

export default PowerMap;