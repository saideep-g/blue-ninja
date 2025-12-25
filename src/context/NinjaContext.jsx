import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const NinjaContext = createContext();

/**
 * NinjaProvider: Central state for Blue Ninja Platform.
 * Manages Auth, Ninja Stats, and Real-time Power Persistence.
 */
export function NinjaProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeAchievement, setActiveAchievement] = useState(null);

    const [ninjaStats, setNinjaStats] = useState({
        powerPoints: 0,
        heroLevel: 1,
        mastery: {}, // Tracked by Atom ID (A1, A13, etc.)
        completedMissions: 0,
        currentQuest: 'DIAGNOSTIC'
    });

    // Handle Authentication & Firestore Sync
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            if (user) {
                // Fetch or Initialize Ninja Profile in Firestore
                const userDoc = await getDoc(doc(db, "students", user.uid));
                if (userDoc.exists()) {
                    // Sync database status (including COMPLETED status) to local state
                    setNinjaStats(userDoc.data());

                } else {
                    // Initialize a new student profile if it doesn't exist
                    const initialStats = {
                        powerPoints: 0,
                        heroLevel: 1,
                        mastery: {},
                        currentQuest: 'DIAGNOSTIC'
                    };
                    await setDoc(doc(db, "students", user.uid), initialStats);
                    setNinjaStats(initialStats);
                }
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    /**
     * Triggers an achievement notification overlay.
     */
    const triggerAchievement = (achievement) => {
        setActiveAchievement(achievement);
        setTimeout(() => setActiveAchievement(null), 5000);
    };


    /**
    * Calculates Hero Level based on total Power Points (Flow)
    * Threshold: 500 points per level
    */
    const calculateHeroLevel = (points) => {
        return Math.floor(points / 500) + 1;
    };

    /**
     * Maps Mastery Score (0.0 - 1.0) to Atom Power Points
     * Max Power per Atom: 75
     */
    const masteryToPower = (score) => {
        return Math.round((score || 0) * 75);
    };

    // Update the setNinjaStats logic to automatically recalculate Level
    /**
     * Enhanced updatePower to check for specific Blue Ninja milestones.
     * Triggers achievements based on v4.0 engagement criteria.
    * PERSISTENCE FIX: 
    * updatePower now syncs with Firestore immediately.
    * This ensures Power Points (Flow) are never lost on refresh.
     */
    /**
    * PERSISTENCE UPDATE (Tiered Strategy):
    * Converted to an async function to persist Flow points and Hero Level to Firestore in real-time.
    * This ensures student momentum is saved question-by-question.
    */
    const updatePower = async (gain) => {
        if (!auth.currentUser) return;

        // Calculate new values based on current state
        const currentPoints = ninjaStats.powerPoints || 0;
        const currentLevel = ninjaStats.heroLevel || 1;
        const newPoints = currentPoints + gain;
        const newLevel = calculateHeroLevel(newPoints);

        // Update local state for immediate UI feedback (Agility)
        setNinjaStats(prevStats => ({
            ...prevStats,
            powerPoints: newPoints,
            heroLevel: newLevel
        }));

        // Persist to Firestore (Persistence)
        const userRef = doc(db, "students", auth.currentUser.uid);
        try {
            await updateDoc(userRef, {
                powerPoints: newPoints,
                heroLevel: newLevel
            });

            // Trigger achievement logic if the ninja leveled up
            if (newLevel > ninjaStats.heroLevel) {
                triggerAchievement({
                    id: 'level_up',
                    name: `Level ${newLevel} Reached!`,
                    icon: '🚀',
                    description: "Your Blue Ninja spirit is soaring higher!"
                });
            }
        } catch (error) {
            console.error("Error persisting power points:", error);
        }
    };


    // Add activeAchievement to the context provider value
    return (
        <NinjaContext.Provider value={{ user, ninjaStats, updatePower, loading, activeAchievement }}>
            {!loading && children}
        </NinjaContext.Provider>
    );
};

export const useNinja = () => useContext(NinjaContext);