/**
 * Firestore Schema Definitions and Path Helpers for Blue Ninja v2.0
 * 
 * This module defines the complete Firestore collection structure for the
 * redesigned platform supporting multi-template questions with curriculum-aware
 * organization.
 */

// ============================================================================
// COLLECTION DEFINITIONS
// ============================================================================

export const FIRESTORE_COLLECTIONS = {
  // Main curriculum metadata collection
  CURRICULUM_METADATA: 'curriculum',
  
  // New v2.0 questions collection (hierarchical by curriculum)
  QUESTIONS_V2: 'questions_v2',
  
  // Global index for fast question search and filtering
  QUESTIONS_V2_INDEX: 'questions_v2_index',
  
  // Admin session logs and validation results
  ADMIN_SESSIONS: 'admin_sessions',
  
  // Temporary cache for validation results (24h TTL)
  VALIDATION_CACHE: 'validation_cache',
  
  // Background processing queue for bulk operations
  BULK_OPERATIONS: 'bulk_operations'
};

// ============================================================================
// CURRICULUM CONFIGURATION
// ============================================================================

export const CURRICULUM_ID = 'mathquest-cbse7-olympiad-eapcet-foundation';

// ============================================================================
// FIRESTORE DOCUMENT PATH HELPERS
// ============================================================================

/**
 * Centralized path helpers for all Firestore document references
 * 
 * These functions prevent typos and ensure consistent path structure
 * across the entire application.
 */
export const docPaths = {
  /**
   * Get full path to a specific question document
   * 
   * Path: questions_v2/{moduleId}/atom/{atomId}/{questionId}
   * Example: questions_v2/CBSE7-CH04-SIMPLE-EQUATIONS/atom/CBSE7.CH04.EQ.04/MQ.CBSE7.CH04.EQ.04.BAL.0001
   */
  questionV2: (moduleId: string, atomId: string, questionId: string): string => 
    `${FIRESTORE_COLLECTIONS.QUESTIONS_V2}/${moduleId}/atom/${atomId}/${questionId}`,
  
  /**
   * Get collection path for all questions in an atom
   * 
   * Path: questions_v2/{moduleId}/atom/{atomId}
   * Useful for querying all questions within a specific learning objective
   */
  atomQuestions: (moduleId: string, atomId: string): string => 
    `${FIRESTORE_COLLECTIONS.QUESTIONS_V2}/${moduleId}/atom/${atomId}`,
  
  /**
   * Get collection path for all atoms in a module
   * 
   * Path: questions_v2/{moduleId}/atom
   * Useful for querying entire module structure
   */
  moduleAtoms: (moduleId: string): string => 
    `${FIRESTORE_COLLECTIONS.QUESTIONS_V2}/${moduleId}/atom`,
  
  /**
   * Get index document path for filtered searches
   * 
   * Path: questions_v2_index/{templateId}_{difficulty}_{status}
   * Example: questions_v2_index/BALANCEOPS_2_PUBLISHED
   * Enables fast batch retrieval without full collection scan
   */
  indexDoc: (templateId: string, difficulty: number, status: string): string =>
    `${FIRESTORE_COLLECTIONS.QUESTIONS_V2_INDEX}/${templateId}_${difficulty}_${status}`,
  
  /**
   * Get admin session document path
   * 
   * Path: admin_sessions/{sessionId}
   * Stores validation results and audit trail for each upload session
   */
  adminSession: (sessionId: string): string =>
    `${FIRESTORE_COLLECTIONS.ADMIN_SESSIONS}/${sessionId}`,
  
  /**
   * Get validation cache document path
   * 
   * Path: validation_cache/{questionId}
   * Temporary storage for validation results (auto-expires after 24h)
   */
  validationCache: (questionId: string): string =>
    `${FIRESTORE_COLLECTIONS.VALIDATION_CACHE}/${questionId}`,
  
  /**
   * Get bulk operation document path
   * 
   * Path: bulk_operations/{batchId}
   * Tracks status and progress of background batch operations
   */
  bulkOperation: (batchId: string): string =>
    `${FIRESTORE_COLLECTIONS.BULK_OPERATIONS}/${batchId}`
};

// ============================================================================
// FIRESTORE INDEX RECOMMENDATIONS
// ============================================================================

/**
 * These indexes should be created in Firestore for optimal performance
 * 
 * Index 1: Questions by Module, Atom, Status
 * Collection: questions_v2/{moduleId}/atom/{atomId}
 * Fields: (Collection), status, createdAt
 * Purpose: Query all published questions in an atom, ordered by creation date
 * 
 * Index 2: Global Template Search
 * Collection: questions_v2_index
 * Fields: templateId, difficulty, status
 * Purpose: Fast retrieval of questions by template type and difficulty
 * 
 * Index 3: Admin Sessions Timeline
 * Collection: admin_sessions
 * Fields: uploadedBy, uploadedAt
 * Purpose: Timeline view of uploads by each admin user
 */

export const FIRESTORE_INDEXES = {
  QUESTIONS_BY_MODULE_ATOM: {
    collection: 'questions_v2/{moduleId}/atom/{atomId}',
    fields: ['status', 'createdAt'],
    scope: 'COLLECTION'
  },
  GLOBAL_TEMPLATE_SEARCH: {
    collection: 'questions_v2_index',
    fields: ['templateId', 'difficulty', 'status'],
    scope: 'COLLECTION'
  },
  ADMIN_SESSIONS_TIMELINE: {
    collection: 'admin_sessions',
    fields: ['uploadedBy', 'uploadedAt'],
    scope: 'COLLECTION'
  }
};

// ============================================================================
// FIRESTORE SECURITY RULES REFERENCE
// ============================================================================

/**
 * Recommended Firestore Security Rules
 * 
 * Place in firestore.rules file
 */
export const FIRESTORE_SECURITY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Curriculum metadata - readable by all authenticated users
    match /curriculum/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid != null && 
                      'admin' in request.auth.customClaims;
    }
    
    // Questions v2 - readable by all, writable by admin/teacher
    match /questions_v2/{moduleId}/atom/{atomId}/{questionId} {
      allow read: if true;
      allow write: if request.auth.uid != null && 
                      ('admin' in request.auth.customClaims || 
                       'teacher' in request.auth.customClaims);
      allow delete: if request.auth.uid != null && 
                       'admin' in request.auth.customClaims;
    }
    
    // Index documents - admin only
    match /questions_v2_index/{document=**} {
      allow read: if true;
      allow write: if request.auth.uid != null && 
                      'admin' in request.auth.customClaims;
    }
    
    // Admin sessions - admin only
    match /admin_sessions/{sessionId} {
      allow read: if request.auth.uid != null && 
                     'admin' in request.auth.customClaims;
      allow write: if request.auth.uid != null && 
                      'admin' in request.auth.customClaims;
    }
    
    // Validation cache - temporary, auto-cleanup
    match /validation_cache/{questionId} {
      allow read, write: if request.auth.uid != null && 
                            'admin' in request.auth.customClaims;
    }
  }
}
`;

export default FIRESTORE_COLLECTIONS;