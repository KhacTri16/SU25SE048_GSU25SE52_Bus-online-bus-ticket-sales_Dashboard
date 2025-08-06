import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AdminInfo: React.FC = () => {
  const { user, isAdmin, isManager } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Chào mừng, {user.firstName} {user.lastName}!
        </h1>
        <p className="text-blue-100">
          Bạn đang đăng nhập với vai trò <span className="font-semibold text-white">{user.role}</span>
        </p>
      </div>

      {/* Admin Info Card */}
      {isAdmin() && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4">
              A
            </div>
            <div>
              <h2 className="text-xl font-semibold text-red-800 dark:text-red-200">
                Quản trị viên (Admin)
              </h2>
              <p className="text-red-600 dark:text-red-400 text-sm">
                Quyền truy cập toàn bộ hệ thống
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-red-800 dark:text-red-200">Quyền hạn:</h3>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                <li>• Quản lý tất cả stations</li>
                <li>• Quản lý roles & permissions</li>
                <li>• Quản lý users & companies</li>
                <li>• Truy cập tất cả báo cáo</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-red-800 dark:text-red-200">Tài khoản demo:</h3>
              <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded text-sm">
                <p className="text-red-800 dark:text-red-200">
                  <strong>Email:</strong> admin@xetiic.com
                </p>
                <p className="text-red-800 dark:text-red-200">
                  <strong>Password:</strong> admin123
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manager Info Card */}
      {isManager() && !isAdmin() && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white text-xl font-bold mr-4">
              M
            </div>
            <div>
              <h2 className="text-xl font-semibold text-purple-800 dark:text-purple-200">
                Quản lý (Manager)
              </h2>
              <p className="text-purple-600 dark:text-purple-400 text-sm">
                Quyền quản lý operations
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium text-purple-800 dark:text-purple-200">Quyền hạn:</h3>
              <ul className="text-sm text-purple-600 dark:text-purple-400 space-y-1">
                <li>• Quản lý stations</li>
                <li>• Quản lý routes</li>
                <li>• Xem báo cáo</li>
                <li>• Quản lý trong company</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-purple-800 dark:text-purple-200">Tài khoản demo:</h3>
              <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded text-sm">
                <p className="text-purple-800 dark:text-purple-200">
                  <strong>Email:</strong> manager@xetiic.com
                </p>
                <p className="text-purple-800 dark:text-purple-200">
                  <strong>Password:</strong> manager123
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Hành động nhanh
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAdmin() && (
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
                Admin Tasks
              </h3>
              <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                <li>→ Quản lý Roles</li>
                <li>→ Cấu hình hệ thống</li>
                <li>→ Xem logs</li>
              </ul>
            </div>
          )}
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
              Station Management
            </h3>
            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
              <li>→ Xem danh sách stations</li>
              <li>→ Thêm station mới</li>
              <li>→ Cập nhật thông tin</li>
            </ul>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
            <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
              Reports & Analytics
            </h3>
            <ul className="text-sm text-green-600 dark:text-green-400 space-y-1">
              <li>→ Thống kê operations</li>
              <li>→ Báo cáo doanh thu</li>
              <li>→ Phân tích trends</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Thông tin tài khoản
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Email:</span>
            <p className="font-medium text-gray-800 dark:text-white">{user.email}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Vai trò:</span>
            <p className="font-medium text-gray-800 dark:text-white capitalize">{user.role}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Trạng thái:</span>
            <p className="font-medium text-green-600 dark:text-green-400">
              {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Đăng ký:</span>
            <p className="font-medium text-gray-800 dark:text-white">
              {new Date(user.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInfo;
