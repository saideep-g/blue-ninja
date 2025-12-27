/**
 * Feature Flags for Blue Ninja v2.0 Rollout
 * 
 * Enables safe parallel deployment and gradual rollout of v2.0 features
 * while keeping v1 operational as fallback.
 */

import { db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// ============================================================================
// ENVIRONMENT-BASED FEATURE FLAGS (Global)
// ============================================================================

/**
 * Global feature flags controlled via environment variables
 * 
 * Set in .env file:
 *   REACT_APP_QUIZ_V2_ENABLED=true
 *   REACT_APP_ADMIN_V2_ENABLED=true
 *   REACT_APP_CURRICULUM_V2_ENABLED=true
 *   REACT_APP_VALIDATION_V2_ENABLED=true
 */
export const GLOBAL_FEATURE_FLAGS = {
  // Quiz delivery system
  QUIZ_V2_ENABLED: process.env.REACT_APP_QUIZ_V2_ENABLED === 'true',
  
  // Admin panel
  ADMIN_PANEL_V2_ENABLED: process.env.REACT_APP_ADMIN_V2_ENABLED === 'true',
  
  // Curriculum navigator
  CURRICULUM_BROWSER_ENABLED: process.env.REACT_APP_CURRICULUM_V2_ENABLED === 'true',
  
  // Validation engine
  VALIDATION_V2_ENABLED: process.env.REACT_APP_VALIDATION_V2_ENABLED === 'true'
};

// ============================================================================
// USER-SPECIFIC FEATURE FLAGS (Firestore)
// ============================================================================

/**
 * Get user-specific feature flags from Firestore
 * 
 * User document path: users/{userId}
 * Document structure:
 * {
 *   featureFlags: {
 *     QUIZ_V2_ENABLED: true,
 *     ADMIN_PANEL_V2_ENABLED: true,
 *     ...
 *   },
 *   betaVersion: true,  // User opted into beta testing
 *   role: 'teacher'     // Can determine access to new features
 * }
 * 
 * @param userId - Firebase user ID
 * @returns Object with feature flag overrides for this user
 */
export async function getUserFeatureFlags(
  userId: string
): Promise<Record<string, boolean>> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return {};
    }
    
    const userData = userDoc.data();
    return userData?.featureFlags || {};
  } catch (error) {
    console.error(`Error fetching feature flags for user ${userId}:`, error);
    return {};
  }
}

// ============================================================================
// FEATURE FLAG CHECKING
// ============================================================================

/**
 * Check if a feature is enabled for a user
 * 
 * Resolution order (stops at first match):
 * 1. User-specific override (if userId provided)
 * 2. Global environment flag
 * 3. Default to false (feature disabled)
 * 
 * @param featureName - Name of feature to check
 * @param userId - Optional user ID for per-user overrides
 * @returns true if feature is enabled for user
 */
export async function isFeatureEnabled(
  featureName: string,
  userId?: string
): Promise<boolean> {
  // Check global flag first (fast path)
  if (!(featureName in GLOBAL_FEATURE_FLAGS)) {
    console.warn(`Unknown feature flag: ${featureName}`);
    return false;
  }
  
  // Check user-level override if userId provided
  if (userId) {
    try {
      const userFlags = await getUserFeatureFlags(userId);
      if (featureName in userFlags) {
        return userFlags[featureName];
      }
    } catch (error) {
      console.error(`Error checking user feature flags: ${error}`);
    }
  }
  
  // Fall back to global flag
  return GLOBAL_FEATURE_FLAGS[featureName as keyof typeof GLOBAL_FEATURE_FLAGS] || false;
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/**
 * Check if user should see v2 quiz interface
 */
export async function useQuizV2(userId?: string): Promise<boolean> {
  return isFeatureEnabled('QUIZ_V2_ENABLED', userId);
}

/**
 * Check if user should see v2 admin panel
 */
export async function useAdminPanelV2(userId?: string): Promise<boolean> {
  return isFeatureEnabled('ADMIN_PANEL_V2_ENABLED', userId);
}

/**
 * Check if v2 curriculum browser is available
 */
export async function useCurriculumBrowserV2(userId?: string): Promise<boolean> {
  return isFeatureEnabled('CURRICULUM_BROWSER_ENABLED', userId);
}

/**
 * Check if v2 validation engine should be used
 */
export async function useValidationV2(userId?: string): Promise<boolean> {
  return isFeatureEnabled('VALIDATION_V2_ENABLED', userId);
}

// ============================================================================
// FEATURE FLAG MANAGEMENT (for admins)
// ============================================================================

/**
 * Statuses for tracking feature rollout progress
 */
export enum RolloutStage {
  DISABLED = 'disabled',          // Feature disabled for all users
  INTERNAL_TESTING = 'internal',  // Testing team only
  BETA = 'beta',                  // Opt-in beta users
  GRADUAL_10 = 'gradual_10',     // 10% of users
  GRADUAL_25 = 'gradual_25',     // 25% of users
  GRADUAL_50 = 'gradual_50',     // 50% of users
  GRADUAL_75 = 'gradual_75',     // 75% of users
  FULL_ROLLOUT = 'full'           // 100% of users
}

/**
 * Get current rollout status for a feature
 * (This could be stored in Firestore and fetched)
 */
export const ROLLOUT_STATUS: Record<string, RolloutStage> = {
  QUIZ_V2_ENABLED: RolloutStage.DISABLED,          // Start disabled
  ADMIN_PANEL_V2_ENABLED: RolloutStage.DISABLED,
  CURRICULUM_BROWSER_ENABLED: RolloutStage.DISABLED,
  VALIDATION_V2_ENABLED: RolloutStage.INTERNAL_TESTING
};

// ============================================================================
// ROLLOUT PLAN
// ============================================================================

/**
 * Recommended rollout timeline for v2.0 features:
 * 
 * Week 1: Internal Testing
 *   - VALIDATION_V2_ENABLED: INTERNAL_TESTING
 *   - Admin team tests new validation engine
 *   - Collect feedback on error messages
 * 
 * Week 2: Admin Beta Testing
 *   - ADMIN_PANEL_V2_ENABLED: BETA
 *   - 3-5 admin users test new admin panel
 *   - Test question uploads and curriculum browsing
 * 
 * Week 3: Student Beta (10-25%)
 *   - QUIZ_V2_ENABLED: GRADUAL_10
 *   - CURRICULUM_BROWSER_ENABLED: GRADUAL_10
 *   - Monitor performance and user feedback
 *   - Increase to GRADUAL_25 if no issues
 * 
 * Week 4: Student Rollout (50%+)
 *   - QUIZ_V2_ENABLED: GRADUAL_50
 *   - CURRICULUM_BROWSER_ENABLED: GRADUAL_50
 *   - Continue gradual increase
 * 
 * Week 5: Full Rollout
 *   - QUIZ_V2_ENABLED: FULL_ROLLOUT
 *   - ADMIN_PANEL_V2_ENABLED: FULL_ROLLOUT
 *   - CURRICULUM_BROWSER_ENABLED: FULL_ROLLOUT
 *   - VALIDATION_V2_ENABLED: FULL_ROLLOUT
 *   - Deprecate v1 code (keep as fallback)
 */

export const ROLLOUT_PLAN = {
  week1: {
    stage: 'Internal Testing',
    changes: {
      VALIDATION_V2_ENABLED: true
    },
    description: 'Admin team tests new validation engine'
  },
  week2: {
    stage: 'Admin Beta',
    changes: {
      ADMIN_PANEL_V2_ENABLED: true
    },
    description: 'Admin users test new admin panel'
  },
  week3: {
    stage: 'Student Beta (10-25%)',
    changes: {
      QUIZ_V2_ENABLED: true,
      CURRICULUM_BROWSER_ENABLED: true
    },
    description: 'Gradual student rollout with monitoring'
  },
  week4: {
    stage: 'Student Rollout (50%)',
    changes: {
      // Continue rollout
    },
    description: 'Expand to 50% of students'
  },
  week5: {
    stage: 'Full Rollout',
    changes: {
      // All features enabled globally
    },
    description: 'Complete migration to v2.0'
  }
};

export default GLOBAL_FEATURE_FLAGS;