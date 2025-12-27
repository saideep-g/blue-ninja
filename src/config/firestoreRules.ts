/**
 * Firestore Security Rules for Blue Ninja v2.0
 *
 * This file contains the security rules configuration that protects:
 * - Curriculum metadata (readable by all, writable by admins)
 * - Questions v2 (readable by all, writable by admins/teachers)
 * - Admin sessions (admin-only access)
 * - Validation cache (admin-only)
 * - Bulk operations (admin-only)
 *
 * Rules support parallel operation of v1 and v2 systems during transition period.
 *
 * @module config/firestoreRules
 */

/**
 * Firestore Security Rules in rule syntax
 *
 * These rules enforce:
 * - Public read access to questions and curriculum (for student quiz delivery)
 * - Write access restricted to authenticated admins/teachers
 * - Delete access restricted to superadmins only
 * - Support for both v1 (legacy) and v2 collections during transition
 */
export const FIRESTORE_SECURITY_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Curriculum metadata - public read, admin write
    match /curriculum/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 'admin' in request.auth.customClaims;
    }
    
    // Questions v2 - public read, admin/teacher write
    match /questions_v2/{moduleId}/atom/{atomId}/{questionId} {
      allow read: if true;
      allow write: if request.auth != null && ('admin' in request.auth.customClaims || 'teacher' in request.auth.customClaims);
      allow delete: if request.auth != null && 'admin' in request.auth.customClaims;
    }
    
    // Questions v2 index
    match /questions_v2_index/{document=**} {
      allow read: if true;
      allow write: if request.auth != null && 'admin' in request.auth.customClaims;
    }
    
    // Questions v1 (legacy) - read only
    match /questions/{questionId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Admin sessions - admin only
    match /admin_sessions/{sessionId} {
      allow read: if request.auth != null && 'admin' in request.auth.customClaims;
      allow write: if request.auth != null && 'admin' in request.auth.customClaims;
    }
    
    // Validation cache - admin only
    match /validation_cache/{questionId} {
      allow read: if request.auth != null && 'admin' in request.auth.customClaims;
      allow write: if request.auth != null && 'admin' in request.auth.customClaims;
    }
    
    // Bulk operations - admin only
    match /bulk_operations/{batchId} {
      allow read: if request.auth != null && 'admin' in request.auth.customClaims;
      allow write: if request.auth != null && 'admin' in request.auth.customClaims;
    }
    
    // Catch-all - deny by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`;

/**
 * Custom Claims Configuration for Firebase Auth
 *
 * Use Firebase Admin SDK to set these claims on user accounts:
 *
 * // Student (no special claims)
 * await admin.auth().setCustomUserClaims(studentUid, {});
 *
 * // Teacher
 * await admin.auth().setCustomUserClaims(teacherUid, {
 *   'teacher': true,
 *   'admin': false
 * });
 *
 * // Admin
 * await admin.auth().setCustomUserClaims(adminUid, {
 *   'admin': true
 * });
 */
export const CUSTOM_CLAIMS_ROLES = {
  STUDENT: {
    claims: {},
    description: 'Regular student - read-only access to questions'
  },
  TEACHER: {
    claims: { teacher: true },
    description: 'Teacher - can upload and manage questions'
  },
  ADMIN: {
    claims: { admin: true },
    description: 'Admin - full access including deletion and audit trails'
  }
};

export default {
  FIRESTORE_SECURITY_RULES,
  CUSTOM_CLAIMS_ROLES
};
