import React from 'react';

const AuthInstructions: React.FC = () => {
  return (
    <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
        🚀 Hướng dẫn đăng nhập hệ thống
      </h3>
      
      <div className="space-y-3 text-xs text-blue-600 dark:text-blue-300">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Admin Account */}
          <div className="bg-white dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold mr-2">
                A
              </div>
              <span className="font-semibold text-blue-800 dark:text-blue-200">Admin Account</span>
            </div>
            <div className="space-y-1">
              <p><strong>Email:</strong> admin@xetiic.com</p>
              <p><strong>Password:</strong> admin123</p>
              <p className="text-blue-500 dark:text-blue-400">✓ Quyền: Toàn bộ hệ thống</p>
            </div>
          </div>

          {/* Manager Account */}
          <div className="bg-white dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700">
            <div className="flex items-center mb-2">
              <div className="w-6 h-6 bg-purple-500 rounded text-white text-xs flex items-center justify-center font-bold mr-2">
                M
              </div>
              <span className="font-semibold text-blue-800 dark:text-blue-200">Manager Account</span>
            </div>
            <div className="space-y-1">
              <p><strong>Email:</strong> manager@xetiic.com</p>
              <p><strong>Password:</strong> manager123</p>
              <p className="text-blue-500 dark:text-blue-400">✓ Quyền: Quản lý operations</p>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
          <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            🎯 Tính năng hệ thống:
          </p>
          <div className="grid grid-cols-2 gap-2 text-blue-600 dark:text-blue-400">
            <div>• Station Management</div>
            <div>• Role & Permission System</div>
            <div>• Routes Management</div>
            <div>• Analytics Dashboard</div>
            <div>• User Management</div>
            <div>• Modern Responsive UI</div>
          </div>
        </div>

        {/* Quick Start */}
        <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
          <p className="font-medium text-blue-800 dark:text-blue-200 mb-2">
            ⚡ Quick Start:
          </p>
          <ol className="space-y-1 text-blue-600 dark:text-blue-400">
            <li>1. Chọn tài khoản Admin hoặc Manager</li>
            <li>2. Copy email & password từ bảng trên</li>
            <li>3. Paste vào form đăng nhập</li>
            <li>4. Khám phá dashboard và features!</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default AuthInstructions;
