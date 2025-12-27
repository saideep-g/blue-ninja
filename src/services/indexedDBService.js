/**
 * src/services/indexedDBService.js
 * IndexedDB abstraction using Dexie for admin panel
 * Handles pending questions, upload sessions, and validation cache
 * Production-ready with proper error handling and transaction support
 */

import Dexie from 'dexie';

// Initialize Dexie database
const db = new Dexie('BlueNinjaAdminDB');

db.version(1).stores({
  // pendingQuestions: Store for questions in upload workflow
  pendingQuestions: '&qId, sessionId, status, lastModified',
  
  // uploadSessions: Track bulk upload sessions
  uploadSessions: '&sessionId, uploadedAt, adminId',
  
  // validationCache: Cache validation results (24h TTL)
  validationCache: '&qId, expiresAt'
});

/**
 * Question object shape:
 * {
 *   qId: string (unique),
 *   sessionId: string,
 *   originalData: object (full question from file),
 *   editedData: object (with user edits, merged with original),
 *   status: 'DRAFT' | 'VALIDATING' | 'READY_TO_PUBLISH' | 'NEEDS_REVIEW' | 'PUBLISHED' | 'FAILED',
 *   validationResult: object (from questionValidator),
 *   errors: array,
 *   warnings: array,
 *   lastModified: timestamp,
 *   isReadyToPublish: boolean,
 *   publishAttempts: number,
 *   publishError: string | null
 * }
 */

/**
 * Session object shape:
 * {
 *   sessionId: uuid,
 *   uploadedAt: timestamp,
 *   fileName: string,
 *   fileSize: number,
 *   totalQuestions: number,
 *   questionsProcessed: number,
 *   questionsPublished: number,
 *   questionsWithErrors: number,
 *   status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED',
 *   adminId: string,
 *   adminEmail: string,
 *   notes: string,
 *   completedAt: timestamp | null
 * }
 */

class IndexedDBService {
  /**
   * Initialize database and ensure schema is set up
   */
  async initDatabase() {
    try {
      // Test connection
      const count = await db.pendingQuestions.count();
      console.log(`[IndexedDB] Initialized successfully, ${count} pending questions`);
      return true;
    } catch (error) {
      console.error('[IndexedDB] Initialization failed:', error);
      throw new Error(`Failed to initialize IndexedDB: ${error.message}`);
    }
  }

  /**
   * ===== PENDING QUESTIONS OPERATIONS =====
   */

  /**
   * Add a new pending question to the database
   */
  async addPendingQuestion(qId, questionData) {
    try {
      if (!qId || !questionData) {
        throw new Error('qId and questionData are required');
      }

      const record = {
        qId,
        sessionId: questionData.sessionId,
        originalData: questionData.originalData || {},
        editedData: null,
        status: questionData.status || 'DRAFT',
        validationResult: null,
        errors: [],
        warnings: [],
        lastModified: Date.now(),
        isReadyToPublish: false,
        publishAttempts: 0,
        publishError: null
      };

      await db.pendingQuestions.add(record);
      console.log(`[IndexedDB] Added question: ${qId}`);
      return record;
    } catch (error) {
      console.error(`[IndexedDB] Failed to add question ${qId}:`, error);
      throw error;
    }
  }

  /**
   * Update an existing pending question
   */
  async updatePendingQuestion(qId, updates) {
    try {
      if (!qId) {
        throw new Error('qId is required');
      }

      const updateObj = {
        ...updates,
        lastModified: Date.now()
      };

      const changes = await db.pendingQuestions.update(qId, updateObj);
      console.log(`[IndexedDB] Updated question: ${qId}`);
      return changes > 0;
    } catch (error) {
      console.error(`[IndexedDB] Failed to update question ${qId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific pending question
   */
  async getPendingQuestion(qId) {
    try {
      if (!qId) {
        throw new Error('qId is required');
      }

      const question = await db.pendingQuestions.get(qId);
      return question || null;
    } catch (error) {
      console.error(`[IndexedDB] Failed to get question ${qId}:`, error);
      throw error;
    }
  }

  /**
   * Get all pending questions (optionally filter by session)
   */
  async getAllPendingQuestions(sessionId = null) {
    try {
      let query = db.pendingQuestions;

      if (sessionId) {
        query = query.where('sessionId').equals(sessionId);
      }

      const questions = await query.toArray();
      console.log(`[IndexedDB] Retrieved ${questions.length} pending questions`);
      return questions;
    } catch (error) {
      console.error('[IndexedDB] Failed to get pending questions:', error);
      throw error;
    }
  }

  /**
   * Get pending questions by status
   */
  async getPendingQuestionsByStatus(status, sessionId = null) {
    try {
      let query = db.pendingQuestions.where('status').equals(status);

      const questions = await query.toArray();

      if (sessionId) {
        return questions.filter(q => q.sessionId === sessionId);
      }

      return questions;
    } catch (error) {
      console.error(`[IndexedDB] Failed to get questions by status ${status}:`, error);
      throw error;
    }
  }

  /**
   * Delete a pending question
   */
  async deletePendingQuestion(qId) {
    try {
      if (!qId) {
        throw new Error('qId is required');
      }

      await db.pendingQuestions.delete(qId);
      console.log(`[IndexedDB] Deleted question: ${qId}`);
    } catch (error) {
      console.error(`[IndexedDB] Failed to delete question ${qId}:`, error);
      throw error;
    }
  }

  /**
   * Delete all questions in a batch (session)
   */
  async deleteBatchBySessionId(sessionId) {
    try {
      if (!sessionId) {
        throw new Error('sessionId is required');
      }

      const questions = await db.pendingQuestions
        .where('sessionId')
        .equals(sessionId)
        .toArray();

      const deletedCount = await db.pendingQuestions
        .where('sessionId')
        .equals(sessionId)
        .delete();

      console.log(`[IndexedDB] Deleted ${deletedCount} questions from session: ${sessionId}`);
      return deletedCount;
    } catch (error) {
      console.error(`[IndexedDB] Failed to delete batch ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * ===== SESSION MANAGEMENT =====
   */

  /**
   * Create a new upload session
   */
  async createSession(sessionId, metadata) {
    try {
      if (!sessionId) {
        throw new Error('sessionId is required');
      }

      const session = {
        sessionId,
        uploadedAt: Date.now(),
        fileName: metadata.fileName || '',
        fileSize: metadata.fileSize || 0,
        totalQuestions: metadata.totalQuestions || 0,
        questionsProcessed: 0,
        questionsPublished: 0,
        questionsWithErrors: 0,
        status: 'IN_PROGRESS',
        adminId: metadata.adminId || '',
        adminEmail: metadata.adminEmail || '',
        notes: metadata.notes || '',
        completedAt: null
      };

      await db.uploadSessions.add(session);
      console.log(`[IndexedDB] Created session: ${sessionId}`);
      return session;
    } catch (error) {
      console.error(`[IndexedDB] Failed to create session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get a specific session
   */
  async getSession(sessionId) {
    try {
      if (!sessionId) {
        throw new Error('sessionId is required');
      }

      const session = await db.uploadSessions.get(sessionId);
      return session || null;
    } catch (error) {
      console.error(`[IndexedDB] Failed to get session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Update a session
   */
  async updateSession(sessionId, updates) {
    try {
      if (!sessionId) {
        throw new Error('sessionId is required');
      }

      const updateObj = {
        ...updates,
        lastModified: Date.now()
      };

      await db.uploadSessions.update(sessionId, updateObj);
      console.log(`[IndexedDB] Updated session: ${sessionId}`);
    } catch (error) {
      console.error(`[IndexedDB] Failed to update session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Close a session (mark as completed)
   */
  async closeSession(sessionId) {
    try {
      if (!sessionId) {
        throw new Error('sessionId is required');
      }

      await db.uploadSessions.update(sessionId, {
        status: 'COMPLETED',
        completedAt: Date.now()
      });

      console.log(`[IndexedDB] Closed session: ${sessionId}`);
    } catch (error) {
      console.error(`[IndexedDB] Failed to close session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get all sessions with pagination
   */
  async getAllSessions(limit = 20, offset = 0) {
    try {
      const sessions = await db.uploadSessions
        .orderBy('uploadedAt')
        .reverse()
        .offset(offset)
        .limit(limit)
        .toArray();

      console.log(`[IndexedDB] Retrieved ${sessions.length} sessions`);
      return sessions;
    } catch (error) {
      console.error('[IndexedDB] Failed to get sessions:', error);
      throw error;
    }
  }

  /**
   * Get sessions by admin
   */
  async getSessionsByAdmin(adminId, limit = 10) {
    try {
      if (!adminId) {
        throw new Error('adminId is required');
      }

      const sessions = await db.uploadSessions
        .where('adminId')
        .equals(adminId)
        .reverse()
        .limit(limit)
        .toArray();

      return sessions;
    } catch (error) {
      console.error(`[IndexedDB] Failed to get sessions for admin ${adminId}:`, error);
      throw error;
    }
  }

  /**
   * ===== VALIDATION CACHE =====
   */

  /**
   * Cache a validation result (24-hour TTL)
   */
  async cacheValidationResult(qId, result) {
    try {
      if (!qId || !result) {
        throw new Error('qId and result are required');
      }

      const now = Date.now();
      const TTL = 24 * 60 * 60 * 1000; // 24 hours

      const cacheRecord = {
        qId,
        validationResult: result,
        cachedAt: now,
        expiresAt: now + TTL
      };

      await db.validationCache.put(cacheRecord);
      console.log(`[IndexedDB] Cached validation for: ${qId}`);
    } catch (error) {
      console.error(`[IndexedDB] Failed to cache validation for ${qId}:`, error);
      throw error;
    }
  }

  /**
   * Get a cached validation result (if not expired)
   */
  async getValidationCache(qId) {
    try {
      if (!qId) {
        throw new Error('qId is required');
      }

      const cacheRecord = await db.validationCache.get(qId);

      if (!cacheRecord) {
        return null;
      }

      // Check if expired
      if (cacheRecord.expiresAt < Date.now()) {
        await db.validationCache.delete(qId);
        return null;
      }

      return cacheRecord.validationResult;
    } catch (error) {
      console.error(`[IndexedDB] Failed to get cache for ${qId}:`, error);
      throw error;
    }
  }

  /**
   * Clear a specific validation cache entry
   */
  async clearValidationCache(qId) {
    try {
      if (!qId) {
        throw new Error('qId is required');
      }

      await db.validationCache.delete(qId);
      console.log(`[IndexedDB] Cleared cache for: ${qId}`);
    } catch (error) {
      console.error(`[IndexedDB] Failed to clear cache for ${qId}:`, error);
      throw error;
    }
  }

  /**
   * ===== CLEANUP OPERATIONS =====
   */

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache() {
    try {
      const now = Date.now();
      const expiredRecords = await db.validationCache
        .where('expiresAt')
        .below(now)
        .toArray();

      const idsToDelete = expiredRecords.map(r => r.qId);

      for (const qId of idsToDelete) {
        await db.validationCache.delete(qId);
      }

      console.log(`[IndexedDB] Cleared ${idsToDelete.length} expired cache entries`);
      return idsToDelete.length;
    } catch (error) {
      console.error('[IndexedDB] Failed to clear expired cache:', error);
      throw error;
    }
  }

  /**
   * Clear old completed sessions (older than 30 days)
   */
  async clearOldSessions(daysOld = 30) {
    try {
      const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

      const oldSessions = await db.uploadSessions
        .where('uploadedAt')
        .below(cutoffTime)
        .and(s => s.status === 'COMPLETED')
        .toArray();

      for (const session of oldSessions) {
        // Delete associated questions
        await this.deleteBatchBySessionId(session.sessionId);
        // Delete session
        await db.uploadSessions.delete(session.sessionId);
      }

      console.log(`[IndexedDB] Cleared ${oldSessions.length} old sessions`);
      return oldSessions.length;
    } catch (error) {
      console.error('[IndexedDB] Failed to clear old sessions:', error);
      throw error;
    }
  }

  /**
   * ===== EXPORT/IMPORT OPERATIONS =====
   */

  /**
   * Export a session's data for backup or sharing
   */
  async exportSession(sessionId) {
    try {
      if (!sessionId) {
        throw new Error('sessionId is required');
      }

      const session = await this.getSession(sessionId);
      const questions = await this.getAllPendingQuestions(sessionId);

      return {
        session,
        questions,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`[IndexedDB] Failed to export session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Import previously exported session data
   */
  async importSession(exportedData) {
    try {
      if (!exportedData || !exportedData.session || !exportedData.questions) {
        throw new Error('Invalid export data format');
      }

      const { session, questions } = exportedData;

      // Create session
      await this.createSession(session.sessionId, session);

      // Add questions
      for (const question of questions) {
        await db.pendingQuestions.add(question);
      }

      console.log(`[IndexedDB] Imported ${questions.length} questions from session ${session.sessionId}`);
      return questions.length;
    } catch (error) {
      console.error('[IndexedDB] Failed to import session:', error);
      throw error;
    }
  }

  /**
   * ===== STATISTICS =====
   */

  /**
   * Get database statistics
   */
  async getStats() {
    try {
      const totalQuestions = await db.pendingQuestions.count();
      const readyToPublish = await db.pendingQuestions
        .where('status')
        .equals('READY_TO_PUBLISH')
        .count();
      const needsReview = await db.pendingQuestions
        .where('status')
        .equals('NEEDS_REVIEW')
        .count();
      const totalSessions = await db.uploadSessions.count();
      const cacheSize = await db.validationCache.count();

      return {
        pendingQuestions: {
          total: totalQuestions,
          readyToPublish,
          needsReview
        },
        uploadSessions: totalSessions,
        validationCache: cacheSize,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('[IndexedDB] Failed to get stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const indexedDBService = new IndexedDBService();

export default indexedDBService;
