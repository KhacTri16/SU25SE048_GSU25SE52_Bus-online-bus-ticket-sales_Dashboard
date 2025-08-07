import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface RoleAccessNoticeProps {
  className?: string;
}

const RoleAccessNotice: React.FC<RoleAccessNoticeProps> = ({ className = '' }) => {
  const { isAdmin, isManager, isStaff, isCompanyRestricted } = useAuth();

  if (!isCompanyRestricted()) {
    return null;
  }

  const getRoleText = () => {
    if (isAdmin()) {
      return 'Bạn có quyền truy cập tất cả dữ liệu trong hệ thống';
    } else if (isManager()) {
      return 'Bạn chỉ có thể xem và quản lý dữ liệu của công ty của mình';
    } else if (isStaff()) {
      return 'Bạn chỉ có thể xem dữ liệu của công ty của mình';
    }
    return '';
  };

  const getRoleColor = () => {
    if (isAdmin()) {
      return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 text-green-800 dark:text-green-200';
    } else if (isManager()) {
      return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200';
    } else if (isStaff()) {
      return 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200';
    }
    return 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
  };

  const getRoleIcon = () => {
    if (isAdmin()) {
      return (
        <svg className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    } else if (isManager()) {
      return (
        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (isStaff()) {
      return (
        <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-2xl border p-4 ${getRoleColor()} ${className}`}>
      <div className="flex items-center">
        {getRoleIcon()}
        <p className="text-sm font-medium">{getRoleText()}</p>
      </div>
    </div>
  );
};

export default RoleAccessNotice; 