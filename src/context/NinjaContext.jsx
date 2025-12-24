import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const NinjaContext = createContext();

export function NinjaProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [ninjaStats, setNinjaStats] = useState({
        powerPoints: 0,
        heroLevel: 1,
        mastery: {}, // Tracked by Atom ID (A1, A13, etc.)
        completedMissions: 0
    });

    // Handle Authentication State
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            setUser(user);
            if (user) {
                // Fetch or Initialize Ninja Profile in Firestore
                const userDoc = await getDoc(doc(db, "students", user.uid));
                if (userDoc.exists()) {
                    setNinjaStats(userDoc.data());
                } else {
                    // New Ninja! Initialize their profile
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
    const updatePower = async (gain) => {
        setNinjaStats(prev => {
            const newPoints = prev.powerPoints + gain;
            const newLevel = calculateHeroLevel(newPoints);

            // In a real scenario, you'd also sync this to Firestore here
            return {
                ...prev,
                powerPoints: newPoints,
                heroLevel: newLevel
            };
        });
    };

    return (
        <NinjaContext.Provider value={{ user, ninjaStats, updatePower, loading }}>
            {!loading && children}
        </NinjaContext.Provider>
    );
}

export const useNinja = () => useContext(NinjaContext);