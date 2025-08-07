import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PermissionGate, RoleGate } from '../components/auth/AuthGuard';

const Blank: React.FC = () => {
  const { user, isAdmin, isManager, isStaff } = useAuth();

  if (!user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Không có thông tin người dùng</h1>
      </div>
    );
  }

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1: return 'Admin';
      case 2: return 'Manager';
      case 3: return 'Staff';
      default: return 'Unknown';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Test Phân Quyền
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Thông tin người dùng
            </h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Họ tên:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {user.fullName}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {user.email}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Vai trò:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {getRoleName(user.roleId)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Trạng thái vai trò
            </h2>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Admin:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isAdmin() 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {isAdmin() ? '✓ Có' : '✗ Không'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Manager:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isManager() 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {isManager() ? '✓ Có' : '✗ Không'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Staff:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  isStaff() 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                }`}>
                  {isStaff() ? '✓ Có' : '✗ Không'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Permission Testing */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Test Quyền Hạn
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Dashboard Permission */}
          <PermissionGate permission="dashboard.read">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="font-medium text-green-800 dark:text-green-400 mb-2">
                Dashboard Access
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Bạn có quyền truy cập dashboard
              </p>
            </div>
          </PermissionGate>

          {/* Company Management */}
          <PermissionGate permission="company.read">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
                Company Management
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Bạn có quyền xem thông tin công ty
              </p>
            </div>
          </PermissionGate>

          {/* Routes Management */}
          <PermissionGate permission="routes.write">
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
              <h3 className="font-medium text-purple-800 dark:text-purple-400 mb-2">
                Routes Management
              </h3>
              <p className="text-sm text-purple-700 dark:text-purple-300">
                Bạn có quyền quản lý tuyến đường
              </p>
            </div>
          </PermissionGate>

          {/* Admin Only Features */}
          <RoleGate allowedRoles={[1]}>
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 className="font-medium text-red-800 dark:text-red-400 mb-2">
                Admin Only
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300">
                Chỉ Admin mới thấy được nội dung này
              </p>
            </div>
          </RoleGate>

          {/* Manager Only Features */}
          <RoleGate allowedRoles={[2]}>
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
              <h3 className="font-medium text-orange-800 dark:text-orange-400 mb-2">
                Manager Only
              </h3>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Chỉ Manager mới thấy được nội dung này
              </p>
            </div>
          </RoleGate>

          {/* Staff Only Features */}
          <RoleGate allowedRoles={[3]}>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <h3 className="font-medium text-green-800 dark:text-green-400 mb-2">
                Staff Only
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Chỉ Staff mới thấy được nội dung này
              </p>
            </div>
          </RoleGate>
        </div>
      </div>
    </div>
  );
};

export default Blank;
