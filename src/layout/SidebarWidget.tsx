import React from 'react';
import { useAuth } from '../context/AuthContext';

const SidebarWidget: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1: return 'Admin';
      case 2: return 'Manager';
      case 3: return 'Staff';
      case 4: return 'Driver';
      case 5: return 'Seller';
      default: return 'User';
    }
  };

  const getRoleColor = (roleId: number) => {
    switch (roleId) {
      case 1: return 'bg-red-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-green-500';
      case 4: return 'bg-yellow-500';
      case 5: return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className={`w-8 h-8 rounded-full ${getRoleColor(user.roleId)} flex items-center justify-center text-white text-sm font-bold`}>
          {user.fullName?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.fullName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getRoleName(user.roleId)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SidebarWidget;
