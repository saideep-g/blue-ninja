import {
    UserRoleAssignment,
    UserRole,
    Permission,
    ROLE_PERMISSIONS,
    ParentTeacherComboUser
} from '../types/roles';
import { db } from '../firebase-config';
import { doc, getDoc, setDoc, updateDoc, query, collection, where, getDocs } from 'firebase/firestore';

export class RoleService {
    /**
     * Get user's complete role assignment
     */
    static async getUserRoles(userId: string): Promise<UserRoleAssignment | null> {
        try {
            const roleRef = doc(db, 'users', userId, 'metadata', 'roles');
            const snapshot = await getDoc(roleRef);
            return snapshot.exists() ? snapshot.data() as UserRoleAssignment : null;
        } catch (error) {
            console.error('Error fetching user roles:', error);
            return null;
        }
    }

    /**
     * Check if user has specific permission
     */
    static async hasPermission(userId: string, permission: Permission): Promise<boolean> {
        const roleAssignment = await this.getUserRoles(userId);
        if (!roleAssignment) return false;

        return roleAssignment.permissions.includes(permission);
    }

    /**
     * Check if user can view specific resource
     * @param userId - User trying to access
     * @param resourceType - 'student' | 'class' | 'school'
     * @param resourceId - Student ID, Class ID, or School ID
     */
    static async canViewResource(
        userId: string,
        resourceType: 'student' | 'class' | 'school',
        resourceId: string
    ): Promise<boolean> {
        const roleAssignment = await this.getUserRoles(userId);
        if (!roleAssignment) return false;

        // PARENT: Can only see their own children
        if (roleAssignment.roles.includes('PARENT') && resourceType === 'student') {
            const parentChildrenRef = doc(db, 'users', userId, 'metadata', 'families');
            const snapshot = await getDoc(parentChildrenRef);
            const children = snapshot.data()?.childrenIds || [];
            return children.includes(resourceId);
        }

        // TEACHER: Can only see students in their classes
        if (roleAssignment.roles.includes('TEACHER') && resourceType === 'student') {
            const studentClassRef = doc(db, 'students', resourceId, 'metadata', 'enrollment');
            const snapshot = await getDoc(studentClassRef);
            const classId = snapshot.data()?.classId;
            return roleAssignment.metadata.classIds?.includes(classId) || false;
        }

        // TEACHER: Can see their own classes
        if (roleAssignment.roles.includes('TEACHER') && resourceType === 'class') {
            return roleAssignment.metadata.classIds?.includes(resourceId) || false;
        }

        // ADMIN: Can see everything
        if (roleAssignment.roles.includes('ADMIN')) {
            return true;
        }

        return false;
    }

    /**
     * Set active role for Parent+Teacher combo users
     * Affects dashboard view and data access
     */
    static async setActiveRole(
        userId: string,
        newRole: UserRole
    ): Promise<boolean> {
        try {
            const roleAssignment = await this.getUserRoles(userId);
            if (!roleAssignment || !roleAssignment.roles.includes(newRole)) {
                return false;
            }

            const roleRef = doc(db, 'users', userId, 'metadata', 'roles');
            await updateDoc(roleRef, { activeRole: newRole });

            // Track role switch for analytics
            await this.logRoleSwitch(userId, newRole);

            return true;
        } catch (error) {
            console.error('Error setting active role:', error);
            return false;
        }
    }

    /**
     * Get dashboard data based on user's active role
     * Different data shapes for different roles
     */
    static async getDashboardData(userId: string): Promise<any> {
        const roleAssignment = await this.getUserRoles(userId);
        if (!roleAssignment) return null;

        const activeRole = roleAssignment.activeRole;

        switch (activeRole) {
            case 'STUDENT':
                return this.getStudentDashboard(userId);
            case 'PARENT':
                return this.getParentDashboard(userId, roleAssignment.metadata.studentIds || []);
            case 'TEACHER':
                return this.getTeacherDashboard(userId, roleAssignment.metadata.classIds || []);
            case 'ADMIN':
                return this.getAdminDashboard(userId);
            default:
                return null;
        }
    }

    private static async getStudentDashboard(studentId: string): Promise<any> {
        // Student sees their own learning data
        const sessionsRef = collection(db, 'students', studentId, 'sessions');
        const snapshot = await getDocs(sessionsRef);
        return {
            role: 'STUDENT',
            sessions: snapshot.docs.map(d => d.data()),
            personalMetrics: await this.getStudentMetrics(studentId)
        };
    }

    private static async getParentDashboard(
        parentId: string,
        childrenIds: string[]
    ): Promise<any> {
        // Parent sees aggregated data for their children
        const childData = await Promise.all(
            childrenIds.map(async childId => ({
                childId,
                metrics: await this.getStudentMetrics(childId),
                recentActivity: await this.getRecentActivity(childId)
            }))
        );

        return {
            role: 'PARENT',
            children: childData,
            summary: {
                totalChildrenTracked: childrenIds.length,
                averageMastery: childData.reduce((acc, c) => acc + (c.metrics?.overallMastery || 0), 0) / childrenIds.length,
                criticalAreas: this.identifyCriticalAreas(childData)
            }
        };
    }

    private static async getTeacherDashboard(
        teacherId: string,
        classIds: string[]
    ): Promise<any> {
        // Teacher sees class-level analytics and individual student performance
        const classData = await Promise.all(
            classIds.map(async classId => {
                const studentsRef = query(
                    collection(db, 'students'),
                    where('classId', '==', classId)
                );
                const studentsSnapshot = await getDocs(studentsRef);
                const students = studentsSnapshot.docs;

                const metrics = await Promise.all(
                    students.map(async doc => ({
                        studentId: doc.id,
                        name: doc.data().name,
                        metrics: await this.getStudentMetrics(doc.id)
                    }))
                );

                return {
                    classId,
                    studentCount: students.length,
                    students: metrics,
                    classAnalytics: this.calculateClassAnalytics(metrics)
                };
            })
        );

        return {
            role: 'TEACHER',
            classes: classData,
            insights: this.generateTeacherInsights(classData)
        };
    }

    private static async getAdminDashboard(adminId: string): Promise<any> {
        // Admin sees school-wide analytics
        const schoolRef = doc(db, 'schools', 'default');
        const schoolSnapshot = await getDoc(schoolRef);

        return {
            role: 'ADMIN',
            school: schoolSnapshot.data(),
            systemMetrics: await this.getSystemMetrics(),
            alerts: await this.getSystemAlerts()
        };
    }

    private static async getStudentMetrics(studentId: string): Promise<any> {
        try {
            const metricsRef = doc(db, 'students', studentId, 'metrics', 'current');
            const snapshot = await getDoc(metricsRef);
            return snapshot.exists() ? snapshot.data() : null;
        } catch (error) {
            console.error('Error fetching student metrics:', error);
            return null;
        }
    }

    private static async getRecentActivity(studentId: string): Promise<any> {
        try {
            const sessionsRef = collection(db, 'students', studentId, 'sessions');
            const query_obj = query(sessionsRef);
            const snapshot = await getDocs(query_obj);
            return snapshot.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .slice(0, 5); // Last 5 sessions
        } catch (error) {
            console.error('Error fetching recent activity:', error);
            return [];
        }
    }

    private static identifyCriticalAreas(childData: any[]): string[] {
        const criticalAreas: Set<string> = new Set();
        childData.forEach(child => {
            const metrics = child.metrics?.atoms || {};
            Object.entries(metrics).forEach(([atomId, data]: [string, any]) => {
                if (data.mastery < 0.3) {
                    criticalAreas.add(atomId);
                }
            });
        });
        return Array.from(criticalAreas);
    }

    private static calculateClassAnalytics(students: any[]): any {
        const masteryScores = students
            .map(s => s.metrics?.overallMastery || 0)
            .filter(m => m > 0);

        return {
            averageMastery: masteryScores.length > 0
                ? masteryScores.reduce((a, b) => a + b, 0) / masteryScores.length
                : 0,
            studentCount: students.length,
            successRate: students.filter(s => (s.metrics?.overallMastery || 0) > 0.7).length / students.length,
            needsSupport: students.filter(s => (s.metrics?.overallMastery || 0) < 0.3).length
        };
    }

    private static generateTeacherInsights(classData: any[]): string[] {
        const insights: string[] = [];

        classData.forEach(cls => {
            const avg = cls.classAnalytics.averageMastery;
            if (avg < 0.5) {
                insights.push(`Class ${cls.classId}: Overall mastery low (${(avg * 100).toFixed(0)}%). Consider review.`);
            }
            if (cls.classAnalytics.needsSupport > cls.studentCount * 0.3) {
                insights.push(`Class ${cls.classId}: ${cls.classAnalytics.needsSupport} students need support.`);
            }
        });

        return insights;
    }

    private static async getSystemMetrics(): Promise<any> {
        // Placeholder for school-wide analytics
        return {};
    }

    private static async getSystemAlerts(): Promise<any[]> {
        // Placeholder for system alerts
        return [];
    }

    private static async logRoleSwitch(userId: string, newRole: UserRole): Promise<void> {
        // Log role switches for analytics
        const logRef = collection(db, 'users', userId, 'auditLog');
        await setDoc(doc(logRef), {
            event: 'ROLE_SWITCH',
            newRole,
            timestamp: Date.now()
        });
    }
}

export default RoleService;
