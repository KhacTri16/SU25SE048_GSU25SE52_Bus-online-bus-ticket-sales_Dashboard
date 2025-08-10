import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { systemUserService, companyService } from "../../services/api";
import { SystemUser } from "../../services/api";
import { Company } from "../../types/company";
import PageMeta from "../../components/common/PageMeta";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { useModal } from "../../hooks/useModal";
import CreateUserForm from "../../components/auth/CreateUserForm";

export default function UserManagement() {
  console.log('UserManagement: Component rendering...');
  
  // Add safety check for useAuth
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    console.error('Error getting auth context:', error);
    return (
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Lỗi xác thực</h1>
          <p className="text-gray-600">Không thể tải thông tin xác thực. Vui lòng đăng nhập lại.</p>
        </div>
      </div>
    );
  }
  
  const { isAdmin, isCompanyRestricted, getUserCompanyId } = authContext;
  const { openModal, closeModal, isOpen } = useModal();
  
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    console.log('UserManagement: useEffect running...');
    fetchUsers();
    fetchCompanies();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await systemUserService.getAllUsers();
      
      // Filter users based on RBAC
      let filteredUsers = response.data || [];
      if (isCompanyRestricted()) {
        const userCompanyId = getUserCompanyId();
        if (userCompanyId) {
          filteredUsers = (response.data || []).filter(user => user.companyId === userCompanyId);
          console.log(`Filtered users for user companyId ${userCompanyId}:`, filteredUsers);
        }
      }
      
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Không thể tải danh sách người dùng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyService.getAllCompanies(1, 100);
      setCompanies(response.data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setCompanies([]);
    }
  };

  const handleUserCreated = () => {
    setSuccess("Tạo tài khoản thành công!");
    fetchUsers(); // Refresh user list
    closeModal();
    
    // Auto hide success message after 3 seconds
    setTimeout(() => {
      setSuccess("");
    }, 3000);
  };

  const getRoleName = (roleId: number) => {
    switch (roleId) {
      case 1: return "Admin";
      case 2: return "Manager";
      case 3: return "Staff";
      case 4: return "Driver";
      case 5: return "Seller";
      default: return "Unknown";
    }
  };

  const getCompanyName = (companyId: number) => {
    const company = companies.find(c => c.id === companyId);
    return company ? company.name : "Unknown";
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (error) {
      return 'N/A';
    }
  };

  const canCreateUser = () => {
    try {
      return isAdmin() || isCompanyRestricted();
    } catch (error) {
      console.error('Error checking user permissions:', error);
      return false;
    }
  };

  const getPageTitle = () => {
    try {
      if (isAdmin()) {
        return "Quản lý người dùng";
      } else if (isCompanyRestricted()) {
        return "Quản lý người dùng công ty";
      }
      return "Quản lý người dùng";
    } catch (error) {
      console.error('Error getting page title:', error);
      return "Quản lý người dùng";
    }
  };

  const getPageDescription = () => {
    try {
      if (isAdmin()) {
        return "Quản lý tất cả người dùng trong hệ thống";
      } else if (isCompanyRestricted()) {
        return "Quản lý người dùng của công ty bạn";
      }
      return "Quản lý người dùng";
    } catch (error) {
      console.error('Error getting page description:', error);
      return "Quản lý người dùng";
    }
  };

  console.log('UserManagement: canCreateUser check:', canCreateUser());
  
  // Simple loading state to test if component is rendering
  if (loading && users.length === 0) {
    return (
      <>
        <PageMeta
          title="Quản lý người dùng - XeTiic"
          description="Quản lý người dùng hệ thống"
        />
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="mb-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Đang tải...
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Vui lòng chờ trong giây lát.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }
  
  if (!canCreateUser()) {
    return (
      <>
        <PageMeta
          title="Quản lý người dùng - XeTiic"
          description="Quản lý người dùng hệ thống"
        />
        <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Không có quyền truy cập
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Bạn không có quyền truy cập trang quản lý người dùng.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Quản lý người dùng - XeTiic"
        description="Quản lý người dùng hệ thống"
      />
      
      <div className="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {getPageTitle()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {getPageDescription()}
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <button
            onClick={openModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50"
          >
            <PlusIcon className="h-4 w-4" />
            Tạo tài khoản mới
          </button>
        </div>

        {/* Users Table */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Thông tin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Vai trò
                  </th>
                  {(() => {
                    try {
                      return isAdmin();
                    } catch (error) {
                      console.error('Error checking isAdmin:', error);
                      return false;
                    }
                  })() && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                      Công ty
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={(() => {
                      try {
                        return isAdmin() ? 6 : 5;
                      } catch (error) {
                        console.error('Error checking isAdmin for colSpan:', error);
                        return 5;
                      }
                    })()} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Đang tải...
                    </td>
                  </tr>
                ) : !users || users.length === 0 ? (
                  <tr>
                    <td colSpan={(() => {
                      try {
                        return isAdmin() ? 6 : 5;
                      } catch (error) {
                        console.error('Error checking isAdmin for colSpan:', error);
                        return 5;
                      }
                    })()} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      Không có người dùng nào
                    </td>
                  </tr>
                ) : (
                  (users || []).map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img
                              className="h-10 w-10 rounded-full"
                              src={user.avartar || "https://via.placeholder.com/40"}
                              alt={user.fullName}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.fullName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.email}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {user.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.roleId === 1
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : user.roleId === 2
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : user.roleId === 3
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : user.roleId === 4
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                            : user.roleId === 5
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300'
                        }`}>
                          {getRoleName(user.roleId)}
                        </span>
                      </td>
                      {(() => {
                        try {
                          return isAdmin();
                        } catch (error) {
                          console.error('Error checking isAdmin:', error);
                          return false;
                        }
                      })() && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {getCompanyName(user.companyId)}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                          {user.isActive ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(user.systemId)} {/* Using systemId as creation date placeholder */}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            className="text-pink-600 hover:text-pink-900 dark:text-pink-400 dark:hover:text-pink-300"
                            onClick={() => {
                              // TODO: Implement edit functionality
                              console.log('Edit user:', user.id);
                            }}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            onClick={() => {
                              // TODO: Implement delete functionality
                              console.log('Delete user:', user.id);
                            }}
                          >
                            <TrashBinIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create User Modal - Temporarily disabled for debugging */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeModal}></div>
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-lg shadow-xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Tạo tài khoản mới
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 max-h-[80vh] overflow-y-auto">
                <CreateUserForm onSuccess={handleUserCreated} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
