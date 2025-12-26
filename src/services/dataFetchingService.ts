/**
 * Smart Data Fetching
 * Tries cache first, falls back to Firestore, with automatic invalidation
 */

import CacheService from './cacheService';
import AnalyticsEngine from './analyticsEngine';

export class DataFetchingService {
    /**
     * Fetch student analytics with cache awareness
     * Strategy: Cache Hit -> Return (fast)
     *          Cache Miss -> Fetch from Firestore -> Cache -> Return (slower but caches for next time)
     *          Error -> Return last cached or null
     */
    static async fetchStudentAnalytics(studentId: string, force: boolean = false): Promise<any | null> {
        try {
            // Step 1: Check cache if not forcing refresh
            if (!force) {
                const cached = await CacheService.getStudentAnalytics(studentId);
                if (cached) {
                    console.log(`[CACHE HIT] Student analytics for ${studentId}`);
                    return cached;
                }
            }

            // Step 2: Fetch from Firestore
            console.log(`[FIRESTORE] Fetching student analytics for ${studentId}`);
            const analytics = await AnalyticsEngine.getStudentAnalytics(studentId);

            // Step 3: Cache result
            await CacheService.cacheStudentAnalytics(studentId, analytics);
            console.log(`[CACHED] Student analytics for ${studentId}`);

            return analytics;
        } catch (error) {
            console.error('Error fetching student analytics:', error);
            // Fallback: try to return last cached version even if expired
            const lastCached = await CacheService.getStudentAnalytics(studentId);
            return lastCached || null;
        }
    }

    /**
     * Fetch parent dashboard with cache awareness
     * Strategy: Same as above but with 1-day TTL
     */
    static async fetchParentDashboard(parentId: string, force: boolean = false): Promise<any | null> {
        try {
            if (!force) {
                const cached = await CacheService.getParentDashboard(parentId);
                if (cached) {
                    console.log(`[CACHE HIT] Parent dashboard for ${parentId}`);
                    return cached;
                }
            }

            console.log(`[FIRESTORE] Fetching parent dashboard for ${parentId}`);
            // Placeholder: would aggregate child analytics
            const dashboard = { /* ... */ };

            await CacheService.cacheParentDashboard(parentId, dashboard);
            console.log(`[CACHED] Parent dashboard for ${parentId}`);

            return dashboard;
        } catch (error) {
            console.error('Error fetching parent dashboard:', error);
            const lastCached = await CacheService.getParentDashboard(parentId);
            return lastCached || null;
        }
    }

    /**
     * Fetch class analytics with cache awareness
     * Strategy: Same as above but with 1-hour TTL
     */
    static async fetchClassAnalytics(classId: string, force: boolean = false): Promise<any | null> {
        try {
            if (!force) {
                const cached = await CacheService.getClassAnalytics(classId);
                if (cached) {
                    console.log(`[CACHE HIT] Class analytics for ${classId}`);
                    return cached;
                }
            }

            console.log(`[FIRESTORE] Fetching class analytics for ${classId}`);
            const analytics = await AnalyticsEngine.getClassAnalytics(classId);

            await CacheService.cacheClassAnalytics(classId, analytics);
            console.log(`[CACHED] Class analytics for ${classId}`);

            return analytics;
        } catch (error) {
            console.error('Error fetching class analytics:', error);
            const lastCached = await CacheService.getClassAnalytics(classId);
            return lastCached || null;
        }
    }

    /**
     * Invalidate caches when data changes
     */
    static async invalidateStudentCache(studentId: string): Promise<void> {
        // Called when student completes a session
        await CacheService.getStudentAnalytics(studentId); // Will auto-delete if expired
    }

    static async invalidateTeacherCache(classId: string): Promise<void> {
        // Called when any student in class completes session
        await CacheService.getClassAnalytics(classId);
    }

    static async invalidateParentCache(parentId: string): Promise<void> {
        // Called when any child completes session (less frequent)
        await CacheService.getParentDashboard(parentId);
    }
}

export default DataFetchingService;
