/**
 * src/hooks/useIndexedDB.js
 * ==========================
 * 
 * React hook for accessing IndexedDB service with automatic initialization
 * and lifecycle management.
 * 
 * Features:
 * - Automatic database initialization
 * - Error handling and recovery
 * - Loading state management
 * - All CRUD operations wrapped
 * - Auto-cleanup on unmount
 * 
 * Usage:
 * ------
 * const db = useIndexedDB();
 * 
 * if (!db.isInitialized) return <Loading />;
 * if (db.error) return <Error msg={db.error} />;
 * 
 * await db.addPendingQuestion(qId, questionData);
 * const questions = await db.getAllPendingQuestions(sessionId);
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { IndexedDBService } from '../services/indexedDBService';

/**
 * Custom React hook for IndexedDB operations
 * @returns {Object} Hook interface with all database methods
 */
export function useIndexedDB() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const dbRef = useRef(null);
  const isMountedRef = useRef(true);

  // Initialize database on mount
  useEffect(() => {
    let isMounted = true;
    isMountedRef.current = true;

    const initialize = async () => {
      try {
        if (!dbRef.current) {
          dbRef.current = new IndexedDBService();
        }

        await dbRef.current.initDatabase();

        if (isMounted && isMountedRef.current) {
          setIsInitialized(true);
          setError(null);
        }
      } catch (err) {
        if (isMounted && isMountedRef.current) {
          setError(err.message || 'Failed to initialize IndexedDB');
          setIsInitialized(false);
          console.error('[useIndexedDB] Initialization error:', err);
        }
      }
    };

    initialize();

    return () => {
      isMounted = false;
      isMountedRef.current = false;
    };
  }, []);

  // Wrapped methods
  const addPendingQuestion = useCallback(async (qId, questionData) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.addPendingQuestion(qId, questionData);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const updatePendingQuestion = useCallback(async (qId, updates) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.updatePendingQuestion(qId, updates);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const getPendingQuestion = useCallback(async (qId) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.getPendingQuestion(qId);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const getAllPendingQuestions = useCallback(async (sessionId = null) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.getAllPendingQuestions(sessionId);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const deletePendingQuestion = useCallback(async (qId) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.deletePendingQuestion(qId);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const deleteBatchBySessionId = useCallback(async (sessionId) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.deleteBatchBySessionId(sessionId);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  // Session operations
  const createSession = useCallback(async (sessionId, metadata) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.createSession(sessionId, metadata);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const getSession = useCallback(async (sessionId) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.getSession(sessionId);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const updateSession = useCallback(async (sessionId, updates) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.updateSession(sessionId, updates);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const closeSession = useCallback(async (sessionId) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.closeSession(sessionId);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const getAllSessions = useCallback(async (limit = 20) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.getAllSessions(limit);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  // Validation cache operations
  const cacheValidationResult = useCallback(async (qId, result, ttlHours = 24) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const cacheResult = await dbRef.current.cacheValidationResult(qId, result, ttlHours);
      setError(null);
      return cacheResult;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const getValidationCache = useCallback(async (qId) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.getValidationCache(qId);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const clearValidationCache = useCallback(async (qId) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.clearValidationCache(qId);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  // Maintenance operations
  const clearExpiredCache = useCallback(async () => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.clearExpiredCache();
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const clearOldSessions = useCallback(async (daysOld = 30) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.clearOldSessions(daysOld);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const getStats = useCallback(async () => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.getStats();
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  // Export/Import operations
  const exportSession = useCallback(async (sessionId) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.exportSession(sessionId);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const importSession = useCallback(async (data) => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.importSession(data);
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  const clearAll = useCallback(async () => {
    if (!dbRef.current || !isInitialized) {
      throw new Error('Database not initialized');
    }
    try {
      setIsLoading(true);
      const result = await dbRef.current.clearAll();
      setError(null);
      return result;
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [isInitialized]);

  return {
    // State
    isInitialized,
    isLoading,
    error,

    // Question operations
    addPendingQuestion,
    updatePendingQuestion,
    getPendingQuestion,
    getAllPendingQuestions,
    deletePendingQuestion,
    deleteBatchBySessionId,

    // Session operations
    createSession,
    getSession,
    updateSession,
    closeSession,
    getAllSessions,

    // Cache operations
    cacheValidationResult,
    getValidationCache,
    clearValidationCache,
    clearExpiredCache,

    // Maintenance
    clearOldSessions,
    getStats,

    // Export/Import
    exportSession,
    importSession,
    clearAll
  };
}

export default useIndexedDB;
