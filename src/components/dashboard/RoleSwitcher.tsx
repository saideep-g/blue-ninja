import React from 'react';
import { UserRole } from '../types/roles';

interface RoleSwitcherProps {
    currentRole: UserRole;
    availableRoles: UserRole[];
    onRoleChange: (role: UserRole) => void;
}

const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
    currentRole,
    availableRoles,
    onRoleChange
}) => {
    const roleIcons: Record<UserRole, string> = {
        'STUDENT': '👨‍🎓',
        'PARENT': '👨‍👩‍👧',
        'TEACHER': '👨‍🏫',
        'ADMIN': '⚙️'
    };

    const roleLabels: Record<UserRole, string> = {
        'STUDENT': 'Student',
        'PARENT': 'Parent',
        'TEACHER': 'Teacher',
        'ADMIN': 'Admin'
    };

    return (
        <div className="bg-white border-b border-gray-200 px-4 md:px-8 py-4">
            <div className="flex items-center gap-2 md:gap-4">
                <span className="text-sm font-medium text-gray-700">Switch View:</span>
                <div className="flex gap-2">
                    {availableRoles.map(role => (
                        <button
                            key={role}
                            onClick={() => onRoleChange(role)}
                            className={`px-3 py-2 rounded-lg transition-colors ${currentRole === role
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            title={`Switch to ${roleLabels[role]} view`}
                        >
                            <span className="mr-1">{roleIcons[role]}</span>
                            {roleLabels[role]}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default RoleSwitcher;
