/**
 * src/hooks/useIndexedDB.js
 * React hook for IndexedDB operations with state management
 * Handles initialization, error recovery, and automatic cleanup
 * Production-ready with proper lifecycle management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { indexedDBService } from '../services/indexedDBService.js';

/**
 * Custom hook for managing IndexedDB operations
 * Provides methods for CRUD operations and session management
 */
export function useIndexedDB() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dbRef = useRef(null);
  const initAttempts = useRef(0);
  const MAX_INIT_ATTEMPTS = 3;

  /**
   * Initialize IndexedDB service
   */
  useEffect(() => {
    const initDB = async () => {
      if (isInitialized || initAttempts.current >= MAX_INIT_ATTEMPTS) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Initialize service
        await indexedDBService.initDatabase();
        dbRef.current = indexedDBService;
        setIsInitialized(true);
        setError(null);
        console.log('[useIndexedDB] Initialized successfully');
      } catch (err) {
        initAttempts.current++;
        const errorMessage = `Failed to initialize IndexedDB (attempt ${initAttempts.current}/${MAX_INIT_ATTEMPTS}): ${err.message}`;
        console.error('[useIndexedDB]', errorMessage);
        setError(errorMessage);

        // Retry after delay
        if (initAttempts.current < MAX_INIT_ATTEMPTS) {
          setTimeout(initDB, 1000 * initAttempts.current);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initDB();
  }, [isInitialized]);

  /**
   * Add pending question
   */
  const addPendingQuestion = useCallback(
    async (qId, questionData) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.addPendingQuestion(qId, questionData);
    },
    []
  );

  /**
   * Update pending question
   */
  const updatePendingQuestion = useCallback(
    async (qId, updates) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.updatePendingQuestion(qId, updates);
    },
    []
  );

  /**
   * Get a specific pending question
   */
  const getPendingQuestion = useCallback(
    async (qId) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.getPendingQuestion(qId);
    },
    []
  );

  /**
   * Get all pending questions with optional filtering
   */
  const getAllPendingQuestions = useCallback(
    async (sessionId = null) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.getAllPendingQuestions(sessionId);
    },
    []
  );

  /**
   * Get questions by status
   */
  const getPendingQuestionsByStatus = useCallback(
    async (status, sessionId = null) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.getPendingQuestionsByStatus(status, sessionId);
    },
    []
  );

  /**
   * Delete a question
   */
  const deletePendingQuestion = useCallback(
    async (qId) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.deletePendingQuestion(qId);
    },
    []
  );

  /**
   * Delete batch by session
   */
  const deleteBatchBySessionId = useCallback(
    async (sessionId) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.deleteBatchBySessionId(sessionId);
    },
    []
  );

  /**
   * Create upload session
   */
  const createSession = useCallback(
    async (sessionId, metadata) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.createSession(sessionId, metadata);
    },
    []
  );

  /**
   * Get session
   */
  const getSession = useCallback(
    async (sessionId) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.getSession(sessionId);
    },
    []
  );

  /**
   * Update session
   */
  const updateSession = useCallback(
    async (sessionId, updates) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.updateSession(sessionId, updates);
    },
    []
  );

  /**
   * Close session
   */
  const closeSession = useCallback(
    async (sessionId) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.closeSession(sessionId);
    },
    []
  );

  /**
   * Get all sessions
   */
  const getAllSessions = useCallback(
    async (limit = 20, offset = 0) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.getAllSessions(limit, offset);
    },
    []
  );

  /**
   * Get sessions by admin
   */
  const getSessionsByAdmin = useCallback(
    async (adminId, limit = 10) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.getSessionsByAdmin(adminId, limit);
    },
    []
  );

  /**
   * Cache validation result
   */
  const cacheValidationResult = useCallback(
    async (qId, result) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.cacheValidationResult(qId, result);
    },
    []
  );

  /**
   * Get validation cache
   */
  const getValidationCache = useCallback(
    async (qId) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.getValidationCache(qId);
    },
    []
  );

  /**
   * Clear validation cache
   */
  const clearValidationCache = useCallback(
    async (qId) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.clearValidationCache(qId);
    },
    []
  );

  /**
   * Clear expired cache
   */
  const clearExpiredCache = useCallback(
    async () => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.clearExpiredCache();
    },
    []
  );

  /**
   * Clear old sessions
   */
  const clearOldSessions = useCallback(
    async (daysOld = 30) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.clearOldSessions(daysOld);
    },
    []
  );

  /**
   * Export session
   */
  const exportSession = useCallback(
    async (sessionId) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.exportSession(sessionId);
    },
    []
  );

  /**
   * Import session
   */
  const importSession = useCallback(
    async (exportedData) => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.importSession(exportedData);
    },
    []
  );

  /**
   * Get database statistics
   */
  const getStats = useCallback(
    async () => {
      if (!dbRef.current) {
        throw new Error('IndexedDB not initialized');
      }
      return await dbRef.current.getStats();
    },
    []
  );

  /**
   * Retry initialization
   */
  const retryInit = useCallback(() => {
    initAttempts.current = 0;
    setIsInitialized(false);
    setError(null);
  }, []);

  return {
    // Status
    isInitialized,
    isLoading,
    error,

    // Question operations
    addPendingQuestion,
    updatePendingQuestion,
    getPendingQuestion,
    getAllPendingQuestions,
    getPendingQuestionsByStatus,
    deletePendingQuestion,
    deleteBatchBySessionId,

    // Session operations
    createSession,
    getSession,
    updateSession,
    closeSession,
    getAllSessions,
    getSessionsByAdmin,

    // Cache operations
    cacheValidationResult,
    getValidationCache,
    clearValidationCache,
    clearExpiredCache,

    // Cleanup operations
    clearOldSessions,

    // Import/Export
    exportSession,
    importSession,

    // Statistics
    getStats,

    // Error recovery
    retryInit
  };
}

export default useIndexedDB;
