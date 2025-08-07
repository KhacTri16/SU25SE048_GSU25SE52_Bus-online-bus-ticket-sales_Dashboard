import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: string | number;
  requiredPermission?: string;
  requiredPermissions?: string[]; 
}

const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requiredRole, 
  requiredPermission,
  requiredPermissions 
}) => {
  const { isAuthenticated, isLoading, user, hasPermission } = useAuth();
  const location = useLocation();

  console.log('AuthGuard: State:', { isAuthenticated, isLoading, user: !!user, pathname: location.pathname });

  // Show loading spinner while checking authentication
  if (isLoading) {
    console.log('AuthGuard: Showing loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    console.log('AuthGuard: Not authenticated, redirecting to /signin');
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  console.log('AuthGuard: User authenticated, checking permissions...');

  // Check role requirement (now using roleId)
  if (requiredRole) {
    let requiredRoleId: number | undefined;
    if (typeof requiredRole === 'number') {
      requiredRoleId = requiredRole;
    } else if (typeof requiredRole === 'string') {
      if (requiredRole === 'admin') requiredRoleId = 1;
      else if (requiredRole === 'manager') requiredRoleId = 2;
      else if (requiredRole === 'staff') requiredRoleId = 3;
      // Add more mappings if needed
    }
    
    // Admin (roleId: 1) can access everything
    if (user.roleId !== 1 && user.roleId !== requiredRoleId) {
      console.log('AuthGuard: Role check failed. User roleId:', user.roleId, 'Required:', requiredRoleId);
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Không có quyền truy cập
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Bạn không có quyền truy cập vào trang này. Vai trò yêu cầu: {requiredRole}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      );
    }
  }

  // Check single permission requirement
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log('AuthGuard: Permission check failed. Required:', requiredPermission);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Bạn không có quyền thực hiện hành động này. Quyền yêu cầu: {requiredPermission}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Check multiple permissions requirement (user must have ALL permissions)
  if (requiredPermissions && requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => hasPermission(permission));
    if (!hasAllPermissions) {
      console.log('AuthGuard: Multiple permissions check failed. Required:', requiredPermissions);
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 text-red-500">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
              Không có quyền truy cập
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Bạn không có đủ quyền truy cập. Quyền yêu cầu: {requiredPermissions.join(', ')}
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Quay lại
            </button>
          </div>
        </div>
      );
    }
  }

  console.log('AuthGuard: Access granted');
  // User is authenticated and has required permissions
  return <>{children}</>;
};

// Helper component for permission-based content
export const PermissionGate: React.FC<{
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}> = ({ children, permission, fallback }) => {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(permission)) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
};

// Helper component for role-based content
export const RoleGate: React.FC<{
  children: ReactNode;
  allowedRoles: number[];
  fallback?: ReactNode;
}> = ({ children, allowedRoles, fallback }) => {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.roleId)) {
    return fallback ? <>{fallback}</> : null;
  }
  
  return <>{children}</>;
};

export default AuthGuard;
