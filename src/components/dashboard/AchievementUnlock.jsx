// src/components/dashboard/AchievementUnlock.jsx
import React from 'react';

/**
 * AchievementUnlock: Step 13 Visual Implementation
 * Displays a celebratory popup when a milestone is reached.
 * Framed as an "Unlock" rather than a score report.
 */
function AchievementUnlock({ achievement }) {
    if (!achievement) return null;

    return (
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <div className="bg-white border-4 border-yellow-400 rounded-3xl p-6 shadow-2xl flex items-center gap-6 animate-in slide-in-from-top-20 duration-500 pointer-events-auto max-w-sm">
                <div className="text-5xl animate-bounce">{achievement.icon}</div>
                <div>
                    <h3 className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-1">
                        Achievement Unlocked!
                    </h3>
                    <h2 className="text-xl font-black text-blue-800 uppercase italic leading-none mb-2">
                        {achievement.name}
                    </h2>
                    <p className="text-sm text-slate-500 font-medium leading-tight">
                        {achievement.description}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default AchievementUnlock;