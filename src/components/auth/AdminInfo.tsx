import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminInfo: React.FC = () => {
  const { user, isAdmin, isManager, isStaff } = useAuth();

  if (!user) return null;

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1: return 'Admin';
      case 2: return 'Manager';
      case 3: return 'Staff';
      default: return 'Unknown';
    }
  };

  const getRoleColor = (roleId: number) => {
    switch (roleId) {
      case 1: return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 2: return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 3: return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            {user.fullName?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user.fullName}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {user.email}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.roleId)}`}>
          {getRoleName(user.roleId)}
        </span>
      </div>
    </div>
  );
};

export default AdminInfo;
