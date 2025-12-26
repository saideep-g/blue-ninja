import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import RoleService from '../services/roleService';
import StudentDashboard from './dashboards/StudentDashboard';
import ParentDashboard from './dashboards/ParentDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import AdminDashboard from './dashboards/AdminDashboard';
import RoleSwitcher from './components/RoleSwitcher';
import { UserRoleAssignment, UserRole } from '../types/roles';

interface UnifiedDashboardProps {
    userId: string;
}

const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({ userId }) => {
    const { currentUser } = useAuth();
    const [roleAssignment, setRoleAssignment] = useState<UserRoleAssignment | null>(null);
    const [activeRole, setActiveRole] = useState<UserRole | null>(null);
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load user's roles on mount
    useEffect(() => {
        const loadRoles = async () => {
            try {
                const roles = await RoleService.getUserRoles(userId);
                setRoleAssignment(roles);
                setActiveRole(roles?.activeRole || 'STUDENT');
            } catch (err) {
                setError('Failed to load user roles');
                console.error(err);
            }
        };
        loadRoles();
    }, [userId]);

    // Load dashboard data whenever active role changes
    useEffect(() => {
        const loadDashboardData = async () => {
            if (!activeRole) return;

            setLoading(true);
            try {
                // Update active role in database
                await RoleService.setActiveRole(userId, activeRole);

                // Fetch appropriate dashboard data
                const data = await RoleService.getDashboardData(userId);
                setDashboardData(data);
            } catch (err) {
                setError('Failed to load dashboard data');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadDashboardData();
    }, [activeRole, userId]);

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (error) {
        return <div className="text-red-600 p-4">{error}</div>;
    }

    if (!roleAssignment || !activeRole) {
        return <div>No role assignment found</div>;
    }

    // Show role switcher if user has multiple roles
    const hasMultipleRoles = roleAssignment.roles.length > 1;

    return (
        <div className="min-h-screen bg-gray-50">
            {hasMultipleRoles && (
                <RoleSwitcher
                    currentRole={activeRole}
                    availableRoles={roleAssignment.roles}
                    onRoleChange={setActiveRole}
                />
            )}

            <div className="p-4 md:p-8">
                {activeRole === 'STUDENT' && <StudentDashboard data={dashboardData} />}
                {activeRole === 'PARENT' && <ParentDashboard data={dashboardData} />}
                {activeRole === 'TEACHER' && <TeacherDashboard data={dashboardData} />}
                {activeRole === 'ADMIN' && <AdminDashboard data={dashboardData} />}
            </div>
        </div>
    );
};

export default UnifiedDashboard;
