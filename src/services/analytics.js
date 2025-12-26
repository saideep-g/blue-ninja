import { db, auth } from '../firebase/config';
import { doc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

export const analytics = {
    // Track user activity
    trackEvent: async (eventName, eventData = {}) => {
        try {
            const userId = auth.currentUser?.uid;
            if (!userId) return;

            const eventRef = doc(db, `users/${userId}/events`, `${Date.now()}`);
            await updateDoc(eventRef, {
                event: eventName,
                ...eventData,
                timestamp: serverTimestamp()
            }).catch(async () => {
                // Create if doesn't exist
                await setDoc(eventRef, {
                    event: eventName,
                    ...eventData,
                    timestamp: serverTimestamp()
                });
            });
        } catch (error) {
            console.error('Analytics error:', error);
        }
    },

    // Track mission completion
    trackMissionComplete: async (accuracy, timeSpent, flowGained) => {
        await analytics.trackEvent('mission_complete', {
            accuracy,
            timeSpent,
            flowGained
        });

        // Update user stats
        const userId = auth.currentUser?.uid;
        await updateDoc(doc(db, 'users', userId), {
            missionsCompleted: increment(1),
            totalFlowGained: increment(flowGained),
            lastActiveDate: new Date().toDateString()
        });
    },

    // Track error patterns
    trackError: async (questionId, errorType, recoveryTime) => {
        await analytics.trackEvent('error_tracked', {
            questionId,
            errorType,
            recoveryTime
        });
    },

    // Track engagement
    trackSessionDuration: async (startTime, endTime) => {
        const duration = (endTime - startTime) / 1000 / 60; // in minutes
        await analytics.trackEvent('session', {
            duration,
            endTime: new Date(endTime).toISOString()
        });
    }
};

// Google Analytics Integration (optional)
export const initializeGA = () => {
    if (process.env.REACT_APP_GA_ID) {
        // Add Google Analytics script
        window.dataLayer = window.dataLayer || [];
        function gtag() {
            dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', process.env.REACT_APP_GA_ID);
    }
};

export default analytics;
