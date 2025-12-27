import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, auth } from '../firebase/config';
import { doc, getDoc, getDocs, setDoc, updateDoc, collection, writeBatch, serverTimestamp, query, orderBy, limit, addDoc, onSnapshot } from 'firebase/firestore';
import { nexusDB } from '../services/nexusSync'; //;

const NinjaContext = createContext();

/**
 * NinjaProvider: Central state for Blue Ninja Platform.
 * Manages Auth, Ninja Stats, Daily Streaks, and Transactional Logging.
 * Adds historical data hydration to support the Analytics Foundation.
 * NinjaProvider: Phase 3 Stability Upgrade
 * Implements the Hybrid Sync Engine: Local-First with Batched Firestore Writes.
 * Protects quotas while ensuring data integrity for high-precision analytics.
 * * DEBUG UPGRADE: Persistence Lifecycle Tracing
 * This version includes detailed console grouping and path validation to 
 * troubleshoot why the 'session_logs' sub-collection might be failing to initialize.
 */
export function NinjaProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeAchievement, setActiveAchievement] = useState(null);
    const [sessionHistory, setSessionHistory] = useState([]); // Phase 2.2: Store recent logs
    const [userRole, setUserRole] = useState('STUDENT'); // ADD THIS LINE


    // Main stats state, hydrated from LocalStorage or Firestore
    const [ninjaStats, setNinjaStats] = useState({
        powerPoints: 0,
        heroLevel: 1,
        mastery: {}, // Tracked by Atom ID (A1, A13, etc.)
        hurdles: {}, // Tracks misconception counts { SIGN_IGNORANCE: count }
        consecutiveBossSuccesses: {}, // NEW: Tracks the 3-day rule for boss clearing
        completedMissions: 0,
        currentQuest: 'DIAGNOSTIC',
        streakCount: 0, // Phase 2: Track consecutive daily missions
        lastMissionDate: null // Phase 2: For daily reset logic
    });

    /**
     * statsRef (Persistence Guard)
     * WHY: React state updates are asynchronous. Batch syncs often trigger before 
     * setNinjaStats finishes. This ref provides a synchronous "source of truth" 
     * for the Firestore batch engine.
     */
    const statsRef = useRef(ninjaStats);
    useEffect(() => {
        statsRef.current = ninjaStats;
    }, [ninjaStats]);

    // Local Buffer for Question Logs and Mastery Deltas to minimize DB writes
    const [localBuffer, setLocalBuffer] = useState({ logs: [], pointsGained: 0 });

    // Handle Authentication & Initial Hydration
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            console.group('🔐 Ninja Auth Lifecycle');
            setUser(user);
            if (user) {
                console.log('👤 User Authenticated:', user.uid);
                // Priority 1: Check Local Storage for interrupted session (Zero Cost Read)
                const localSession = localStorage.getItem(`ninja_session_${user.uid}`);

                if (localSession) {
                    console.log('📦 Hydrating from LocalStorage');
                    const data = JSON.parse(localSession);
                    setNinjaStats(data.stats);
                    setLocalBuffer(data.buffer);
                    setUserRole(data.role || 'STUDENT'); // Restore role
                } else {
                    // Priority 2: Fetch from Firestore only if no local scratchpad exists
                    console.log('☁️ Fetching from Firestore (students collection)');
                    const userDoc = await getDoc(doc(db, "students", user.uid));
                    if (userDoc.exists()) {
                        console.log('✅ Student document found');
                        // Sync database status (including COMPLETED status) to local state
                        setNinjaStats(userDoc.data());
                        setUserRole(userDoc.data().role || 'STUDENT'); // Get role from DB
                        // Phase 2.2: Fetch the latest 50 logs for analytics
                        fetchSessionLogs(user.uid);
                    } else {
                        // Initialize a new student profile if it doesn't exist
                        console.log('🆕 Creating new student profile');
                        const initialStats = {
                            powerPoints: 0,
                            heroLevel: 1,
                            mastery: {},
                            hurdles: {},
                            consecutiveBossSuccesses: {},
                            completedMissions: 0,
                            currentQuest: 'DIAGNOSTIC',
                            streakCount: 0,
                            lastMissionDate: null
                        };
                        await setDoc(doc(db, "students", user.uid), initialStats);
                        setNinjaStats(initialStats);
                    }
                }
            } else {
                console.log('🚪 No user authenticated');
            }
            console.groupEnd();
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    /**
     * syncToCloud (The Batch Engine)
     * Consolidates all buffered local changes into a single Firestore write transaction.
     * @param {boolean} isFinal - If true, clears the local storage buffer after sync.
     * @param {Array} overrideLogs - Optional. If provided, uses these logs instead of the buffer
     * to prevent race conditions during rapid state updates.
     */
    const syncToCloud = async (isFinal = false, overrideLogs = null) => {
        // Use overrideLogs if provided, otherwise fallback to the buffered state
        const logsToSync = overrideLogs || localBuffer.logs;

        console.group('🚀 [syncToCloud] Firestore Batch Start');
        console.log('Target UID:', auth.currentUser?.uid);
        console.log('Logs in Batch:', logsToSync.length);

        if (!auth.currentUser || logsToSync.length === 0) {
            console.warn('🛑 Sync aborted: No logs to sync or user not authenticated');
            console.groupEnd();
            return;
        }

        const batch = writeBatch(db);
        const userRef = doc(db, "students", auth.currentUser.uid);
        const logsPath = `students/${auth.currentUser.uid}/session_logs`;
        const logsRef = collection(db, "students", auth.currentUser.uid, "session_logs");

        console.log('Writing to Path:', logsPath);

        try {
            // Add all buffered question logs in a single transaction
            logsToSync.forEach((log, idx) => {
                const newLogRef = doc(logsRef);
                batch.set(newLogRef, {
                    ...log,
                    studentId: auth.currentUser.uid, // Added for Admin Collection Group queries
                    timestamp: serverTimestamp(),
                    syncedAt: Date.now()
                });
                console.log(`[syncToCloud] Batched log ${idx + 1} of ${logsToSync.length}`);
            });

            // Update global student profile using the latest ref to avoid stale data
            batch.update(userRef, {
                ...statsRef.current,
                powerPoints: statsRef.current.powerPoints,
                lastUpdated: serverTimestamp(),
                lastSyncTime: serverTimestamp()
            });

            console.log('Committing batch write...');
            await batch.commit();

            console.log('✅ Batch committed successfully!');

            // Reset buffer AFTER successful cloud persistence
            setLocalBuffer({ logs: [], pointsGained: 0 });
            console.log('Buffer cleared');

            if (isFinal) {
                localStorage.removeItem(`ninja_session_${auth.currentUser.uid}`);
                console.log('localStorage cleared (final sync)');
            }

            // Refresh history view after sync
            await fetchSessionLogs(auth.currentUser.uid);

            console.log('✅ syncToCloud Lifecycle Complete');

        } catch (error) {
            console.error("❌ Batch sync failed:", error);
            console.error('Error details:', {
                logsCount: logsToSync.length,
                userId: auth.currentUser?.uid,
                errorCode: error.code,
                errorMessage: error.message
            });
        }
        console.groupEnd();
    };


    /**
 * refreshSessionLogs (NEW)
 * Explicitly fetches the latest session logs from Firestore.
 * Should be called after mission completion to display new analytics.
 */
    const refreshSessionLogs = async () => {
        if (!auth.currentUser) return;

        try {
            const logRef = collection(db, "students", auth.currentUser.uid, "session_logs");
            const q = query(logRef, orderBy("timestamp", "desc"), limit(50));
            const querySnapshot = await getDocs(q);
            const logs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                timestamp: doc.data().timestamp?.toDate?.() || new Date(doc.data().timestamp)
            }));

            console.log('[refreshSessionLogs] Fetched logs:', logs.length);
            setSessionHistory(logs);
            return logs;
        } catch (error) {
            console.error("[refreshSessionLogs] Failed to fetch session logs:", error);
            return [];
        }
    };


    /**
 * fetchSessionLogs (Phase 2.2)
 * Retrieves the transactional log for the student to power dashboard charts.
 */

    const fetchSessionLogs = async (uid) => {
        try {
            const logRef = collection(db, "students", uid, "session_logs");
            const q = query(logRef, orderBy("timestamp", "desc"), limit(50));
            const querySnapshot = await getDocs(q);
            const logs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSessionHistory(logs);
        } catch (error) {
            console.error("Failed to fetch session logs:", error);
        }
    };


    /**
     * logQuestionResult (Phase 2.0 Critical Addition - UPDATED FOR COMPLETE FIELDS)
     * Creates a transactional log of every answer for deep analytics.
     * Stores every interaction in a sub-collection for downstream analytics.
     * Records: questionId, answer, timing, velocity, and mastery changes.
     * * ✅ FIXED: Now ensures all 14 required fields are present:
     * questionId, studentAnswer, isCorrect, isRecovered, recoveryVelocity,
     * diagnosticTag, timeSpent, cappedThinkingTime, speedRating,
     * masteryBefore, masteryAfter, atomId, mode, timestamp
     */
    const logQuestionResult = async (logData) => {
        console.group('📝 [logQuestionResult] Direct Cloud Write');
        if (!auth.currentUser) {
            console.warn('🛑 Direct log aborted: No user');
            console.groupEnd();
            return;
        }

        try {
            // ✅ CRITICAL: Ensure all required fields are present with proper defaults
            const completeLog = {
                // Identity
                questionId: logData.questionId || '',
                studentAnswer: logData.studentAnswer || '',
                studentId: auth.currentUser.uid, // Added for analytical tracing

                // Performance
                isCorrect: logData.isCorrect !== undefined ? logData.isCorrect : false,
                isRecovered: logData.isRecovered !== undefined ? logData.isRecovered : false,

                // ✅ FIXED: recoveryVelocity (was missing)
                recoveryVelocity: logData.recoveryVelocity !== undefined ? logData.recoveryVelocity : 0,

                // Learning Target
                diagnosticTag: logData.diagnosticTag || null,

                // Timing
                timeSpent: logData.timeSpent || 0,

                // ✅ FIXED: cappedThinkingTime (was missing)
                // Cap thinking time at 60 seconds to prevent outlier skewing
                cappedThinkingTime: logData.timeSpent ? Math.min(logData.timeSpent, 60) : 0,

                // Speed Analysis
                speedRating: logData.speedRating || 'NORMAL',

                // Mastery Tracking
                masteryBefore: logData.masteryBefore !== undefined ? logData.masteryBefore : 0,
                masteryAfter: logData.masteryAfter !== undefined ? logData.masteryAfter : 0,

                // Curriculum
                atomId: logData.atomId || '',

                // Context
                mode: logData.mode || 'DAILY',

                // Server timestamp will be added by Firestore
            };

            // Log to Cloud Firestore
            const logPath = `students/${auth.currentUser.uid}/session_logs`;
            const logRef = collection(db, "students", auth.currentUser.uid, "session_logs");

            console.log('Creating log at:', logPath);
            await addDoc(logRef, {
                ...completeLog,
                timestamp: serverTimestamp()
            });
            console.log('✅ Direct write successful');

            // Refresh history after logging new data
            fetchSessionLogs(auth.currentUser.uid);

        } catch (error) {
            console.error("❌ Failed to log session event:", error);
        }
        console.groupEnd();

        // 2. Nexus Local Logging (For Dev Validation)
        // If in development mode, we duplicate the log to IndexedDB so the script can find it
        if (import.meta.env.DEV) {
            await nexusDB.logs.add({
                ...logData,
                timestamp: Date.now(),
                isLocalDev: true
            });
        }
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
        const updatedStats = { ...ninjaStats, powerPoints: newPoints, heroLevel: newLevel };
        setNinjaStats(updatedStats);

        const userRef = doc(db, "students", auth.currentUser.uid);
        try {
            await updateDoc(userRef, {
                powerPoints: newPoints,
                heroLevel: newLevel
            });

            // Trigger achievement logic if the ninja leveled up
            // Achievement logic: Level Up notification
            if (newLevel > currentLevel) {
                setActiveAchievement({
                    id: 'level_up',
                    name: `Level ${newLevel} Reached!`,
                    icon: '🚀',
                    description: "Your Blue Ninja spirit is soaring higher!"
                });
                setTimeout(() => setActiveAchievement(null), 5000);
            }
        } catch (error) {
            console.error("Error persisting power points:", error);
        }

        // Buffer the change locally for the next Cloud sync
        const updatedBuffer = {
            ...localBuffer,
            pointsGained: localBuffer.pointsGained + gain
        };
        setLocalBuffer(updatedBuffer);

        // Mirror to LocalStorage to protect against page refreshes
        localStorage.setItem(`ninja_session_${auth.currentUser.uid}`, JSON.stringify({
            stats: updatedStats,
            buffer: updatedBuffer
        }));
    };

    /**
     * logQuestionResultLocal
     * Buffers detailed analytics (recovery velocity, timing, mastery deltas) locally.
     * Triggers syncToCloud at Question 5 (Midpoint) and Question 10 (Completion).
     */
    const logQuestionResultLocal = (logData, currentQuestionIndex) => {
        console.log(`📍 Buffering log locally for question index ${currentQuestionIndex + 1}`);
        const updatedLogs = [...localBuffer.logs, logData];
        const newBuffer = { ...localBuffer, logs: updatedLogs };

        // Update local buffer state
        setLocalBuffer(newBuffer);

        // Milestone Batching: Sync at Question 5 and Question 10 to save quota
        // WHY: We pass updatedLogs directly to syncToCloud to fix the race condition 
        // caused by asynchronous React state updates.
        if (currentQuestionIndex === 4 || currentQuestionIndex === 9) {
            console.log(`📊 Milestone reached (${currentQuestionIndex + 1}). Triggering Cloud Sync...`);
            syncToCloud(currentQuestionIndex === 9, updatedLogs);
        }
    };

    /**
     * updateStreak (Phase 2.0)
     * Increments the daily streak if a mission is completed.
     */
    const updateStreak = async () => {
        if (!auth.currentUser) {
            console.warn('[updateStreak] No authenticated user');
            return false;
        }

        const today = new Date().toISOString().split('T')[0];

        if (ninjaStats.lastMissionDate === today) {
            console.log('[updateStreak] Streak already updated today:', today);
            return true;
        }

        const userRef = doc(db, "students", auth.currentUser.uid);
        const newStreak = (ninjaStats.streakCount || 0) + 1;

        try {
            await updateDoc(userRef, {
                streakCount: newStreak,
                lastMissionDate: today,
                lastStreakUpdate: serverTimestamp(),
                completedMissions: ((ninjaStats.completedMissions || 0) + 1)
            });

            setNinjaStats(prev => ({
                ...prev,
                streakCount: newStreak,
                lastMissionDate: today,
                completedMissions: (prev.completedMissions || 0) + 1
            }));


            console.log('[updateStreak] ✅ Streak updated successfully:', {
                newStreak,
                today,
                userId: auth.currentUser.uid
            });

            return true;

        } catch (error) {
            console.error('[updateStreak] ❌ Failed to update streak:', error);
            console.log('[updateStreak] 🔄 Retrying streak update...');

            await new Promise(r => setTimeout(r, 1000));

            try {
                await updateDoc(userRef, {
                    streakCount: newStreak,
                    lastMissionDate: today,
                    lastStreakUpdate: serverTimestamp()
                });

                setNinjaStats(prev => ({
                    ...prev,
                    streakCount: newStreak,
                    lastMissionDate: today,
                    completedMissions: (prev.completedMissions || 0) + 1
                }));

                console.log('[updateStreak] ✅ Streak updated successfully (retry):', {
                    newStreak,
                    today
                });

                return true;

            } catch (retryError) {
                console.error('[updateStreak] ❌ Streak update failed permanently:', retryError);
                localStorage.setItem(`pending_streak_${auth.currentUser.uid}`, JSON.stringify({
                    streakCount: newStreak,
                    lastMissionDate: today,
                    timestamp: Date.now()
                }));
                return false;
            }
        }
    };

    return (
        <NinjaContext.Provider value={{
            user,
            ninjaStats,
            sessionHistory,
            setNinjaStats, // Exposed for Analytics components
            updatePower,
            logQuestionResult,
            logQuestionResultLocal,
            updateStreak,
            syncToCloud,
            refreshSessionLogs,
            loading,
            activeAchievement,
            userRole,
            setUserRole
        }}>
            {!loading && children}
        </NinjaContext.Provider>
    );
};

export const useNinja = () => useContext(NinjaContext);