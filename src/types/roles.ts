/**
 * Role System
 * Supports multiple roles per user (Parent + Teacher combo)
 * Each role has distinct permissions and data access
 */

export type UserRole = 'STUDENT' | 'PARENT' | 'TEACHER' | 'ADMIN';

export interface UserRoleAssignment {
    userId: string;
    roles: UserRole[];
    permissions: Permission[];
    activeRole: UserRole; // Current role context
    metadata: {
        studentIds?: string[]; // For parents (children they manage)
        classIds?: string[]; // For teachers (classes they teach)
        schoolId?: string;
        assignedAt: number;
        updatedAt: number;
    };
}

export type Permission =
    | 'VIEW_OWN_PROFILE'
    | 'VIEW_CHILD_DASHBOARD'
    | 'VIEW_CLASS_ANALYTICS'
    | 'EXPORT_ANALYTICS'
    | 'EDIT_CURRICULUM'
    | 'MANAGE_USERS'
    | 'VIEW_SCHOOL_ANALYTICS'
    | 'CREATE_QUESTIONS'
    | 'VIEW_RECOVERY_METRICS';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
    STUDENT: [
        'VIEW_OWN_PROFILE'
    ],
    PARENT: [
        'VIEW_OWN_PROFILE',
        'VIEW_CHILD_DASHBOARD'
    ],
    TEACHER: [
        'VIEW_OWN_PROFILE',
        'VIEW_CLASS_ANALYTICS',
        'EXPORT_ANALYTICS',
        'EDIT_CURRICULUM',
        'CREATE_QUESTIONS',
        'VIEW_RECOVERY_METRICS'
    ],
    ADMIN: [
        'VIEW_OWN_PROFILE',
        'VIEW_CLASS_ANALYTICS',
        'EXPORT_ANALYTICS',
        'EDIT_CURRICULUM',
        'MANAGE_USERS',
        'VIEW_SCHOOL_ANALYTICS',
        'CREATE_QUESTIONS',
        'VIEW_RECOVERY_METRICS'
    ]
};

/**
 * CRITICAL: Parent+Teacher Combo User Rules
 * 
 * A parent who is also a teacher should see:
 * 1. OWN child data in "Parent View" tab
 * 2. ENTIRE CLASS data in "Teacher View" tab
 * 3. CANNOT see other children's data (only their own)
 * 4. Can switch contexts with role switcher
 */
export interface ParentTeacherComboUser {
    userId: string;
    roles: ['PARENT', 'TEACHER'];
    activeRole: 'PARENT' | 'TEACHER';
    childrenIds: string[]; // Only see these children
    classIds: string[]; // Can see all students in these classes
    switchRolePreference: 'AUTO' | 'MANUAL';
}

export const DASHBOARD_ACCESS: Record<UserRole, DashboardConfig> = {
    STUDENT: {
        canView: ['OWN'],
        refreshInterval: 5 * 60 * 1000, // 5 min
        cacheStrategy: 'MEMORY_ONLY'
    },
    PARENT: {
        canView: ['OWN_CHILDREN'],
        refreshInterval: 24 * 60 * 60 * 1000, // 1 day (parent checks weekly)
        cacheStrategy: 'INDEXEDDB_WITH_FALLBACK'
    },
    TEACHER: {
        canView: ['OWN_CLASSES'],
        refreshInterval: 60 * 60 * 1000, // 1 hour (teacher checks daily)
        cacheStrategy: 'INDEXEDDB_WITH_FALLBACK'
    },
    ADMIN: {
        canView: ['ALL'],
        refreshInterval: 30 * 60 * 1000, // 30 min
        cacheStrategy: 'INDEXEDDB_WITH_FALLBACK'
    }
};

interface DashboardConfig {
    canView: string[];
    refreshInterval: number;
    cacheStrategy: 'MEMORY_ONLY' | 'INDEXEDDB_WITH_FALLBACK';
}
