import React, { createContext, useState, useEffect, useContext } from 'react';
import { nexusDB, pullQuestionsFromCloud } from '../services/nexusSync';

export const DevModeContext = createContext();

const BLUE_NINJA_TEST_USER = 'test_user_dev_mode_12345';

/**
 * DevModeProvider: Controls the stability and auditing environment.
 * Phase 3 Update: Implements "Scenario Injection" for high-velocity testing.
 */
export function DevModeProvider({ children }) {
    const [devMode, setDevMode] = useState(
        import.meta.env.DEV && localStorage.getItem('DEV_MODE') === 'true'
    );

    const [devConfig, setDevConfig] = useState({
        currentView: 'DEV_MENU', // DEV_MENU | AUDITOR | DIAGNOSTIC_TEST | DAILY_TEST
        syncStatus: 'IDLE',
        localQuestionCount: 0,
        testQuestions: [],      // The "Injected" pool for the current test
        testUserId: BLUE_NINJA_TEST_USER
    });

    useEffect(() => {
        const updateCount = async () => {
            const count = await nexusDB.questions.count();
            setDevConfig(prev => ({ ...prev, localQuestionCount: count }));
        };
        if (devMode) updateCount();
    }, [devMode]);

    const toggleDevMode = () => {
        const newValue = !devMode;
        setDevMode(newValue);
        localStorage.setItem('DEV_MODE', newValue ? 'true' : 'false');
        window.location.reload();
    };

    /**
     * startTestScenario
     * Logic: Pulls X questions from IndexedDB and jumps to the requested view.
     * Benefit: 0ms latency testing using local data only.
     */
    const startTestScenario = async (view, count) => {
        const all = await nexusDB.questions.toArray();
        const selection = all.sort(() => Math.random() - 0.5).slice(0, count);

        setDevConfig(prev => ({
            ...prev,
            currentView: view,
            testQuestions: selection
        }));
    };

    const runInitialSync = async () => {
        setDevConfig(prev => ({ ...prev, syncStatus: 'SYNCING' }));
        try {
            const count = await pullQuestionsFromCloud();
            setDevConfig(prev => ({
                ...prev,
                syncStatus: 'COMPLETED',
                localQuestionCount: count
            }));
        } catch (e) {
            setDevConfig(prev => ({ ...prev, syncStatus: 'ERROR' }));
        }
    };

    return (
        <DevModeContext.Provider
            value={{
                devMode,
                devConfig,
                setDevConfig,
                toggleDevMode,
                runInitialSync,
                startTestScenario,
                TEST_USER_ID: BLUE_NINJA_TEST_USER
            }}
        >
            {children}
        </DevModeContext.Provider>
    );
}

export const useDevMode = () => useContext(DevModeContext);