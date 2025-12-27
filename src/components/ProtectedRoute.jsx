/**
 * ProtectedRoute.jsx - SECURITY CRITICAL COMPONENT
 * 
 * Protects admin and sensitive routes from unauthorized access.
 * Verifies user authentication and role before rendering components.
 * 
 * Usage:
 * <Route
 *   path="/admin"
 *   element={
 *     <ProtectedRoute
 *       component={AnalyticsLogViewer}
 *       requiredRole="ADMIN"
 *     />
 *   }
 * />
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useNinja } from '../context/NinjaContext';

/**
 * ProtectedRoute Component
 * 
 * Verifies:
 * 1. User is authenticated (logged in)
 * 2. User role matches required role
 * 3. Role is verified on backend (from NinjaContext)
 * 
 * @param {React.Component} component - Component to render if authorized
 * @param {string} requiredRole - Required role (e.g., 'ADMIN', 'TEACHER')
 * @param {string} redirectTo - Redirect path if unauthorized (default: '/')
 */
const ProtectedRoute = ({ component: Component, requiredRole, redirectTo = '/' }) => {
    const { user, userRole, loading } = useNinja();

    // Still loading auth state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-blue-50">
                <div className="animate-pulse text-4xl">🌊</div>
            </div>
        );
    }

    // Check 1: User must be authenticated
    if (!user) {
        console.warn('❌ ProtectedRoute: User not authenticated - redirecting to login');
        return <Navigate to="/login" replace />;
    }

    // Check 2: User must have required role
    if (requiredRole && userRole !== requiredRole) {
        console.warn(`❌ ProtectedRoute: User role '${userRole}' does not match required role '${requiredRole}' - redirecting to home`);
        return <Navigate to={redirectTo} replace />;
    }

    // ✅ All checks passed - render component
    console.log(`✅ ProtectedRoute: Access granted to ${requiredRole} - user role: '${userRole}'`);
    return <Component />;
};

export default ProtectedRoute;