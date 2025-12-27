/**
 * Feature Flags Configuration for Blue Ninja v2.0 Rollout
 *
 * This file manages feature toggles for the parallel v1/v2 system rollout.
 * Supports:
 * - Environment-level toggles (global enable/disable)
 * - User-level toggles (individual user beta testing)
 * - Gradual rollout (percentage-based user targeting)
 *
 * Feature flags control:
 * - QUIZ_V2_ENABLED: New multi-template quiz UI
 * - ADMIN_V2_ENABLED: New admin panel with curriculum browser
 * - CURRICULUM_V2_ENABLED: New curriculum navigation
 * - BETA_FEATURES: Early access features
 *
 * @module config/featureFlags
 */

/**
 * Environment-level feature flag defaults
 *
 * These are read from .env.local or set in Firebase config.
 * Override in environment variables:
 * - REACT_APP_QUIZ_V2_ENABLED=true
 * - REACT_APP_ADMIN_V2_ENABLED=true
 * - etc.
 */
export const FEATURE_FLAGS = {
  // Enable v2 quiz delivery UI with multi-template support
  QUIZ_V2_ENABLED: process.env.REACT_APP_QUIZ_V2_ENABLED === 'true' || false,

  // Enable v2 admin panel with curriculum browser and batch operations
  ADMIN_V2_ENABLED: process.env.REACT_APP_ADMIN_V2_ENABLED === 'true' || false,

  // Enable curriculum-first navigation in v2 systems
  CURRICULUM_V2_ENABLED: process.env.REACT_APP_CURRICULUM_V2_ENABLED === 'true' || false,

  // Feature flag source: where to read user-level toggles
  // 'firestore' = read from Firestore user document
  // 'local' = use only environment flags
  // 'hybrid' = try Firestore first, fall back to local
  FLAG_SOURCE: (process.env.REACT_APP_FEATURE_FLAG_SOURCE || 'hybrid') as 'firestore' | 'local' | 'hybrid',

  // Development mode: show feature flag UI and logging
  DEBUG_ENABLED: process.env.REACT_APP_DEBUG_FLAGS === 'true' || false
};

/**
 * User-level feature flag schema (stored in Firestore)
 *
 * Example user document:
 * users/{userId}
 *   featureFlags:
 *     QUIZ_V2_ENABLED: true
 *     ADMIN_V2_ENABLED: false
 *     CURRICULUM_V2_ENABLED: true
 *     BETA_FEATURES: true
 *     ROLLOUT_PERCENTAGE: 100
 */
export const USER_FEATURE_FLAGS = {
  QUIZ_V2_ENABLED: 'QUIZ_V2_ENABLED',
  ADMIN_V2_ENABLED: 'ADMIN_V2_ENABLED',
  CURRICULUM_V2_ENABLED: 'CURRICULUM_V2_ENABLED',
  BETA_FEATURES: 'BETA_FEATURES',
  ROLLOUT_PERCENTAGE: 'ROLLOUT_PERCENTAGE'
} as const;

/**
 * Rollout strategy stages
 *
 * Each stage defines what percentage of users get the feature.
 * Allows gradual rollout from 0% (internal testing) to 100% (full production).
 */
export const ROLLOUT_STAGES = {
  INTERNAL_TESTING: {
    name: 'Internal Testing',
    percentageOfUsers: 0,
    description: 'Only internal team members',
    durationDays: 2,
    nextStage: 'LIMITED_BETA'
  },

  LIMITED_BETA: {
    name: 'Limited Beta',
    percentageOfUsers: 10,
    description: '10% of active users',
    durationDays: 2,
    nextStage: 'EXPANDED_BETA'
  },

  EXPANDED_BETA: {
    name: 'Expanded Beta',
    percentageOfUsers: 50,
    description: '50% of active users',
    durationDays: 3,
    nextStage: 'FULL_ROLLOUT'
  },

  FULL_ROLLOUT: {
    name: 'Full Rollout',
    percentageOfUsers: 100,
    description: '100% of users - production stable',
    durationDays: null,
    nextStage: 'DEPRECATED'
  },

  DEPRECATED: {
    name: 'Deprecated',
    percentageOfUsers: 100,
    description: 'v1 deprecated, v2 only',
    durationDays: null,
    nextStage: null
  }
} as const;

/**
 * Current rollout status for each feature
 * Update this as you progress through stages
 */
export const ROLLOUT_STATUS: Record<string, keyof typeof ROLLOUT_STAGES> = {
  QUIZ_V2_ENABLED: 'INTERNAL_TESTING',
  ADMIN_V2_ENABLED: 'INTERNAL_TESTING',
  CURRICULUM_V2_ENABLED: 'INTERNAL_TESTING',
  BETA_FEATURES: 'INTERNAL_TESTING'
};

/**
 * Helper: Determine if a feature is enabled for a user
 *
 * Logic:
 * 1. Check if environment flag is globally disabled (hard override)
 * 2. Check user-level override in Firestore (if available)
 * 3. Use environment-level default
 *
 * @param featureName - Feature flag name
 * @param userId - Optional user ID for user-level override
 * @param userFlags - Optional user feature flags from Firestore
 * @param deviceId - Optional device ID for A/B testing
 * @returns Whether feature is enabled for this user
 */
export function isFeatureEnabled(
  featureName: keyof typeof FEATURE_FLAGS,
  userId?: string,
  userFlags?: Record<string, boolean>,
  deviceId?: string
): boolean {
  // 1. Check environment flag (global override)
  if (!FEATURE_FLAGS[featureName]) {
    return false; // Feature globally disabled
  }

  // 2. Check user-level override (if provided)
  if (userFlags && featureName in userFlags) {
    return userFlags[featureName];
  }

  // 3. Check rollout percentage (probabilistic rollout)
  if (userId || deviceId) {
    const rolloutStage = ROLLOUT_STATUS[featureName];
    const stage = ROLLOUT_STAGES[rolloutStage];
    const rolloutPercentage = stage.percentageOfUsers;

    if (rolloutPercentage < 100) {
      // Use consistent hash of userId/deviceId to determine if in rollout percentage
      const hash = hashUserId(userId || deviceId || '');
      return hash % 100 < rolloutPercentage;
    }
  }

  // Default: use environment flag
  return FEATURE_FLAGS[featureName];
}

/**
 * Helper: Get all user feature flags
 * (would be called with Firestore data)
 *
 * @param userId - User ID
 * @returns Promise of user feature flags from Firestore
 */
export async function getUserFeatureFlags(userId: string): Promise<Record<string, boolean>> {
  // This would be implemented to fetch from Firestore user document
  // Placeholder for now
  try {
    // const userDoc = await db.collection('users').doc(userId).get();
    // return userDoc.data()?.featureFlags || {};
    return {};
  } catch (error) {
    console.error('Error fetching user feature flags:', error);
    return {};
  }
}

/**
 * Simple hash function for consistent user rollout
 *
 * Maps userId to 0-99 range so that the same userId
 * always gets the same result. Allows for deterministic
 * but randomized rollout percentages.
 *
 * @param userId - User ID or device ID
 * @returns Hash value 0-99
 */
function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Debug logging for feature flag evaluation
 *
 * @param featureName - Feature name
 * @param enabled - Whether enabled
 * @param reason - Why it's enabled/disabled
 */
export function logFeatureFlagDecision(
  featureName: string,
  enabled: boolean,
  reason: string
) {
  if (FEATURE_FLAGS.DEBUG_ENABLED) {
    console.log(
      `[FeatureFlag] ${featureName}: ${enabled ? 'ENABLED' : 'DISABLED'} - ${reason}`
    );
  }
}

/**
 * Feature flag monitoring interface
 * 
 * Use this to track feature flag performance and errors
 */
export interface FeatureFlagMetrics {
  featureName: string;
  enabled: boolean;
  evaluationTimeMs: number;
  userId?: string;
  rolloutPercentage?: number;
  timestamp: string;
}

/**
 * Query current rollout status for monitoring/dashboards
 *
 * @returns Current status of all features
 */
export function getRolloutStatus() {
  const status: Record<string, any> = {};

  for (const feature of Object.keys(ROLLOUT_STATUS)) {
    const stage = ROLLOUT_STATUS[feature as keyof typeof ROLLOUT_STATUS];
    const stageDetails = ROLLOUT_STAGES[stage];

    status[feature] = {
      currentStage: stage,
      ...stageDetails,
      environmentEnabled: FEATURE_FLAGS[feature as keyof typeof FEATURE_FLAGS],
      timestamp: new Date().toISOString()
    };
  }

  return status;
}

export default {
  FEATURE_FLAGS,
  USER_FEATURE_FLAGS,
  ROLLOUT_STAGES,
  ROLLOUT_STATUS,
  isFeatureEnabled,
  getUserFeatureFlags,
  getRolloutStatus,
  logFeatureFlagDecision
};
