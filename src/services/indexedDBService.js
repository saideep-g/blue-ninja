/**
 * src/services/indexedDBService.js
 * ================================
 * 
 * Production-ready IndexedDB service using Dexie library for persistent storage.
 * Handles pending questions, upload sessions, and validation caching.
 * 
 * Why IndexedDB instead of localStorage?
 * - localStorage throws SecurityError in strict Firestore rules
 * - IndexedDB has 50MB+ limit vs localStorage's 5-10MB
 * - Async API (non-blocking)
 * - Designed for this use case
 * 
 * Database Schema:
 * - pendingQuestions: Questions being reviewed before publishing
 * - uploadSessions: Upload batch metadata and progress
 * - validationCache: Cached validation results (24h TTL)
 * 
 * Usage:
 * ------
 * const db = new IndexedDBService();
 * await db.initDatabase();
 * await db.addPendingQuestion('Q1', questionData);
 * const result = await db.getValidationCache('Q1');
 */

import Dexie, { type Table } from 'dexie';

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

export class AdminPanelDB extends Dexie {
  pendingQuestions: Table;
  uploadSessions: Table;
  validationCache: Table;

  constructor() {
    super('AdminPanelDB');
    this.version(1).stores({
      pendingQuestions: 'qId, sessionId, status, lastModified',
      uploadSessions: 'sessionId, uploadedAt, status',
      validationCache: 'qId, expiresAt'
    });
  }
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class IndexedDBService {
  constructor() {
    this.db = new AdminPanelDB();
    this.isInitialized = false;
    this.initError = null;
  }

  /**
   * Initialize the database
   * Should be called once on app startup
   */
  async initDatabase() {
    if (this.isInitialized) {
      return;
    }

    const MAX_ATTEMPTS = 3;
    let attempt = 0;
    let lastError;

    while (attempt < MAX_ATTEMPTS) {
      try {
        await this.db.open();
        this.isInitialized = true;
        console.log('[IndexedDB] Database initialized successfully');
        return;
      } catch (error) {
        attempt++;
        lastError = error;
        console.warn(`[IndexedDB] Initialization attempt ${attempt} failed:`, error);

        if (attempt < MAX_ATTEMPTS) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        }
      }
    }

    this.initError = lastError;
    console.error('[IndexedDB] Failed to initialize after', MAX_ATTEMPTS, 'attempts');
    throw new Error(`Failed to initialize IndexedDB: ${lastError?.message}`);
  }

  /**
   * Ensures database is initialized
   * @private
   */
  async _ensureInitialized() {
    if (!this.isInitialized) {
      await this.initDatabase();
    }
  }

  // ============================================================================
  // PENDING QUESTIONS OPERATIONS
  // ============================================================================

  /**
   * Add a pending question
   * @param {string} qId - Question ID
   * @param {Object} questionData - Question data object
   */
  async addPendingQuestion(qId, questionData) {
    await this._ensureInitialized();
    try {
      const data = {
        qId,
        sessionId: questionData.sessionId || null,
        originalData: questionData.originalData || {},
        editedData: questionData.editedData || null,
        status: questionData.status || 'DRAFT', // DRAFT, VALIDATING, VALID, NEEDS_REVIEW, READY_TO_PUBLISH
        validationResult: questionData.validationResult || null,
        errors: questionData.errors || [],
        warnings: questionData.warnings || [],
        isReadyToPublish: questionData.isReadyToPublish || false,
        publishAttempts: 0,
        createdAt: Date.now(),
        lastModified: Date.now()
      };

      await this.db.pendingQuestions.put(data);
      console.log(`[IndexedDB] Added pending question: ${qId}`);
    } catch (error) {
      console.error('[IndexedDB] Error adding pending question:', error);
      throw error;
    }
  }

  /**
   * Update a pending question
   * @param {string} qId - Question ID
   * @param {Object} updates - Partial update object
   */
  async updatePendingQuestion(qId, updates) {
    await this._ensureInitialized();
    try {
      const existing = await this.db.pendingQuestions.get(qId);
      if (!existing) {
        throw new Error(`Question ${qId} not found`);
      }

      const updated = {
        ...existing,
        ...updates,
        lastModified: Date.now()
      };

      await this.db.pendingQuestions.put(updated);
      console.log(`[IndexedDB] Updated pending question: ${qId}`);
    } catch (error) {
      console.error('[IndexedDB] Error updating pending question:', error);
      throw error;
    }
  }

  /**
   * Get a single pending question
   * @param {string} qId - Question ID
   * @returns {Object|undefined} Question data or undefined
   */
  async getPendingQuestion(qId) {
    await this._ensureInitialized();
    try {
      return await this.db.pendingQuestions.get(qId);
    } catch (error) {
      console.error('[IndexedDB] Error getting pending question:', error);
      throw error;
    }
  }

  /**
   * Get all pending questions (optionally filtered by session)
   * @param {string} sessionId - Optional session ID filter
   * @returns {Array} Array of pending questions
   */
  async getAllPendingQuestions(sessionId = null) {
    await this._ensureInitialized();
    try {
      let query = this.db.pendingQuestions;

      if (sessionId) {
        query = query.where('sessionId').equals(sessionId);
      }

      return await query.toArray();
    } catch (error) {
      console.error('[IndexedDB] Error getting all pending questions:', error);
      throw error;
    }
  }

  /**
   * Delete a pending question
   * @param {string} qId - Question ID
   */
  async deletePendingQuestion(qId) {
    await this._ensureInitialized();
    try {
      await this.db.pendingQuestions.delete(qId);
      console.log(`[IndexedDB] Deleted pending question: ${qId}`);
    } catch (error) {
      console.error('[IndexedDB] Error deleting pending question:', error);
      throw error;
    }
  }

  /**
   * Delete all pending questions for a session
   * @param {string} sessionId - Session ID
   */
  async deleteBatchBySessionId(sessionId) {
    await this._ensureInitialized();
    try {
      const questions = await this.db.pendingQuestions
        .where('sessionId')
        .equals(sessionId)
        .toArray();

      for (const q of questions) {
        await this.db.pendingQuestions.delete(q.qId);
      }

      console.log(`[IndexedDB] Deleted ${questions.length} questions for session ${sessionId}`);
    } catch (error) {
      console.error('[IndexedDB] Error deleting batch:', error);
      throw error;
    }
  }

  // ============================================================================
  // UPLOAD SESSION OPERATIONS
  // ============================================================================

  /**
   * Create a new upload session
   * @param {string} sessionId - Unique session ID (UUID)
   * @param {Object} metadata - Session metadata
   */
  async createSession(sessionId, metadata) {
    await this._ensureInitialized();
    try {
      const session = {
        sessionId,
        fileName: metadata.fileName || 'unknown',
        fileSize: metadata.fileSize || 0,
        uploadedAt: metadata.uploadedAt || Date.now(),
        totalQuestions: metadata.totalQuestions || 0,
        questionsProcessed: 0,
        questionsPublished: 0,
        questionsWithErrors: 0,
        questionsSkipped: 0,
        adminId: metadata.adminId || null,
        adminEmail: metadata.adminEmail || null,
        status: 'IN_PROGRESS', // IN_PROGRESS, COMPLETED, FAILED
        notes: metadata.notes || '',
        errorLog: [],
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await this.db.uploadSessions.put(session);
      console.log(`[IndexedDB] Created upload session: ${sessionId}`);
    } catch (error) {
      console.error('[IndexedDB] Error creating session:', error);
      throw error;
    }
  }

  /**
   * Get a session
   * @param {string} sessionId - Session ID
   * @returns {Object|undefined} Session data or undefined
   */
  async getSession(sessionId) {
    await this._ensureInitialized();
    try {
      return await this.db.uploadSessions.get(sessionId);
    } catch (error) {
      console.error('[IndexedDB] Error getting session:', error);
      throw error;
    }
  }

  /**
   * Update a session
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Partial update object
   */
  async updateSession(sessionId, updates) {
    await this._ensureInitialized();
    try {
      const session = await this.db.uploadSessions.get(sessionId);
      if (!session) {
        throw new Error(`Session ${sessionId} not found`);
      }

      const updated = {
        ...session,
        ...updates,
        updatedAt: Date.now()
      };

      await this.db.uploadSessions.put(updated);
      console.log(`[IndexedDB] Updated session: ${sessionId}`);
    } catch (error) {
      console.error('[IndexedDB] Error updating session:', error);
      throw error;
    }
  }

  /**
   * Close a session (mark as completed)
   * @param {string} sessionId - Session ID
   */
  async closeSession(sessionId) {
    await this._ensureInitialized();
    try {
      await this.updateSession(sessionId, {
        status: 'COMPLETED',
        completedAt: Date.now()
      });
      console.log(`[IndexedDB] Closed session: ${sessionId}`);
    } catch (error) {
      console.error('[IndexedDB] Error closing session:', error);
      throw error;
    }
  }

  /**
   * Get all sessions (with optional limit)
   * @param {number} limit - Max number of sessions to return
   * @returns {Array} Array of sessions
   */
  async getAllSessions(limit = 20) {
    await this._ensureInitialized();
    try {
      return await this.db.uploadSessions
        .orderBy('uploadedAt')
        .reverse()
        .limit(limit)
        .toArray();
    } catch (error) {
      console.error('[IndexedDB] Error getting all sessions:', error);
      throw error;
    }
  }

  // ============================================================================
  // VALIDATION CACHE OPERATIONS
  // ============================================================================

  /**
   * Cache a validation result
   * @param {string} qId - Question ID
   * @param {Object} result - Validation result object
   * @param {number} ttlHours - Time to live in hours (default 24)
   */
  async cacheValidationResult(qId, result, ttlHours = 24) {
    await this._ensureInitialized();
    try {
      const now = Date.now();
      const expiresAt = now + ttlHours * 60 * 60 * 1000;

      const cacheEntry = {
        qId,
        validationResult: result,
        cachedAt: now,
        expiresAt
      };

      await this.db.validationCache.put(cacheEntry);
      console.log(`[IndexedDB] Cached validation for: ${qId}`);
    } catch (error) {
      console.error('[IndexedDB] Error caching validation:', error);
      throw error;
    }
  }

  /**
   * Get cached validation result
   * @param {string} qId - Question ID
   * @returns {Object|undefined} Validation result or undefined if expired/not found
   */
  async getValidationCache(qId) {
    await this._ensureInitialized();
    try {
      const cache = await this.db.validationCache.get(qId);

      if (!cache) {
        return undefined;
      }

      // Check if expired
      if (Date.now() > cache.expiresAt) {
        await this.db.validationCache.delete(qId);
        return undefined;
      }

      return cache.validationResult;
    } catch (error) {
      console.error('[IndexedDB] Error getting validation cache:', error);
      throw error;
    }
  }

  /**
   * Clear validation cache for a question
   * @param {string} qId - Question ID
   */
  async clearValidationCache(qId) {
    await this._ensureInitialized();
    try {
      await this.db.validationCache.delete(qId);
      console.log(`[IndexedDB] Cleared cache for: ${qId}`);
    } catch (error) {
      console.error('[IndexedDB] Error clearing cache:', error);
      throw error;
    }
  }

  // ============================================================================
  // CLEANUP & MAINTENANCE
  // ============================================================================

  /**
   * Clear all expired cache entries
   * @returns {number} Number of entries cleared
   */
  async clearExpiredCache() {
    await this._ensureInitialized();
    try {
      const now = Date.now();
      const expired = await this.db.validationCache
        .where('expiresAt')
        .below(now)
        .toArray();

      for (const entry of expired) {
        await this.db.validationCache.delete(entry.qId);
      }

      console.log(`[IndexedDB] Cleared ${expired.length} expired cache entries`);
      return expired.length;
    } catch (error) {
      console.error('[IndexedDB] Error clearing expired cache:', error);
      throw error;
    }
  }

  /**
   * Clear old completed sessions
   * @param {number} daysOld - Sessions older than this many days will be deleted
   * @returns {number} Number of sessions deleted
   */
  async clearOldSessions(daysOld = 30) {
    await this._ensureInitialized();
    try {
      const cutoffTime = Date.now() - daysOld * 24 * 60 * 60 * 1000;

      const oldSessions = await this.db.uploadSessions
        .where('uploadedAt')
        .below(cutoffTime)
        .toArray();

      for (const session of oldSessions) {
        // Delete questions associated with this session
        await this.deleteBatchBySessionId(session.sessionId);
        // Delete session
        await this.db.uploadSessions.delete(session.sessionId);
      }

      console.log(`[IndexedDB] Deleted ${oldSessions.length} old sessions`);
      return oldSessions.length;
    } catch (error) {
      console.error('[IndexedDB] Error clearing old sessions:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   * @returns {Object} Storage stats
   */
  async getStats() {
    await this._ensureInitialized();
    try {
      const questionCount = await this.db.pendingQuestions.count();
      const sessionCount = await this.db.uploadSessions.count();
      const cacheCount = await this.db.validationCache.count();

      const stats = {
        pendingQuestions: questionCount,
        uploadSessions: sessionCount,
        cachedValidations: cacheCount,
        totalRecords: questionCount + sessionCount + cacheCount,
        estimatedSizeMB: ((questionCount * 5 + sessionCount * 2 + cacheCount * 3) / 1024).toFixed(2),
        lastUpdated: new Date().toISOString()
      };

      console.log('[IndexedDB] Statistics:', stats);
      return stats;
    } catch (error) {
      console.error('[IndexedDB] Error getting stats:', error);
      throw error;
    }
  }

  // ============================================================================
  // EXPORT/IMPORT (BACKUP)
  // ============================================================================

  /**
   * Export a session and its questions
   * @param {string} sessionId - Session ID
   * @returns {Object} Exportable data
   */
  async exportSession(sessionId) {
    await this._ensureInitialized();
    try {
      const session = await this.getSession(sessionId);
      const questions = await this.getAllPendingQuestions(sessionId);

      return {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        session,
        questions,
        questionCount: questions.length
      };
    } catch (error) {
      console.error('[IndexedDB] Error exporting session:', error);
      throw error;
    }
  }

  /**
   * Import a previously exported session
   * @param {Object} data - Exported data object
   */
  async importSession(data) {
    await this._ensureInitialized();
    try {
      if (data.version !== '1.0') {
        throw new Error('Unsupported export version');
      }

      // Import session
      await this.db.uploadSessions.put(data.session);

      // Import questions
      for (const question of data.questions) {
        await this.db.pendingQuestions.put(question);
      }

      console.log(`[IndexedDB] Imported session with ${data.questionCount} questions`);
    } catch (error) {
      console.error('[IndexedDB] Error importing session:', error);
      throw error;
    }
  }

  /**
   * Clear all data (destructive!)
   * Use with caution
   */
  async clearAll() {
    await this._ensureInitialized();
    try {
      await this.db.pendingQuestions.clear();
      await this.db.uploadSessions.clear();
      await this.db.validationCache.clear();
      console.warn('[IndexedDB] All data cleared!');
    } catch (error) {
      console.error('[IndexedDB] Error clearing all data:', error);
      throw error;
    }
  }
}

// Create singleton instance
let instance = null;

/**
 * Get singleton IndexedDB service instance
 * @returns {IndexedDBService}
 */
export function getIndexedDBService() {
  if (!instance) {
    instance = new IndexedDBService();
  }
  return instance;
}

export default IndexedDBService;
