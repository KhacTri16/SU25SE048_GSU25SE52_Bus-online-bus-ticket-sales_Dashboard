import React, { useState, useEffect } from 'react';
import { roleService } from '../../services/api';
import { Role, CreateRoleRequest, UpdateRoleRequest } from '../../types/company';
import RoleFormModal from '../../components/Role/RoleFormModal';
import RoleDeleteModal from '../../components/Role/RoleDeleteModal';

const RoleManagement: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Success/Error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleService.getAllRoles();
      
      if (response && response.data && Array.isArray(response.data)) {
        setRoles(response.data);
        setError(null);
      } else {
        console.warn('Invalid response structure:', response);
        setRoles([]);
        setError('Dữ liệu trả về không hợp lệ');
      }
    } catch (err) {
      setError('Không thể tải danh sách vai trò');
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setErrorMessage(null);
    } else {
      setErrorMessage(message);
      setSuccessMessage(null);
    }
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 5000);
  };

  const handleCreateRole = async (data: CreateRoleRequest) => {
    try {
      await roleService.createRole(data);
      showMessage('Tạo vai trò thành công!', 'success');
      fetchRoles();
    } catch (error) {
      console.error('Error creating role:', error);
      showMessage('Không thể tạo vai trò. Vui lòng thử lại.', 'error');
      throw error;
    }
  };

  const handleUpdateRole = async (data: UpdateRoleRequest) => {
    if (!selectedRole) return;
    try {
      await roleService.updateRole(selectedRole.id, data);
      showMessage('Cập nhật vai trò thành công!', 'success');
      fetchRoles();
    } catch (error) {
      console.error('Error updating role:', error);
      showMessage('Không thể cập nhật vai trò. Vui lòng thử lại.', 'error');
      throw error;
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRole) return;
    try {
      setIsDeleting(true);
      await roleService.deleteRole(selectedRole.id);
      showMessage('Xóa vai trò thành công!', 'success');
      setIsDeleteModalOpen(false);
      setSelectedRole(null);
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      showMessage('Không thể xóa vai trò. Vui lòng thử lại.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateModal = () => {
    setSelectedRole(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (role: Role) => {
    setSelectedRole(role);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedRole(null);
  };

  const filteredRoles = (roles || []).filter(role =>
    role.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPermissionText = (permission: boolean) => {
    return permission ? 'Có quyền truy cập' : 'Quyền hạn chế';
  };

  const getPermissionClass = (permission: boolean) => {
    return permission ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchRoles}
                className="text-sm bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Quản lý vai trò & phân quyền</h1>
        
        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search Box */}
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên vai trò, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Add Role Button */}
        <div className="mb-4">
          <button 
            onClick={openCreateModal}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center"
          >
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm vai trò mới
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{(roles || []).length}</div>
              <div className="text-gray-600">Tổng số vai trò</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(roles || []).filter(r => r.permission === true).length}
              </div>
              <div className="text-gray-600">Có quyền truy cập</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {(roles || []).filter(r => r.permission === false).length}
              </div>
              <div className="text-gray-600">Quyền hạn chế</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {(roles || []).filter(r => r.isDeleted === true).length}
              </div>
              <div className="text-gray-600">Đã xóa</div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vai trò
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quyền truy cập
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'Không tìm thấy vai trò nào phù hợp' : 'Chưa có vai trò nào'}
                  </td>
                </tr>
              ) : (
                filteredRoles.map((role) => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1L21 18m-6.75 0H9l1.5-1.5" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {role.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {role.id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {role.description.length > 50 ? role.description.substring(0, 50) + '...' : role.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPermissionClass(role.permission)}`}>
                        {getPermissionText(role.permission)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        role.isDeleted ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {role.isDeleted ? 'Đã xóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => openEditModal(role)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        Xem
                      </button>
                      <button 
                        onClick={() => openEditModal(role)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Sửa
                      </button>
                      <button 
                        onClick={() => openDeleteModal(role)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredRoles.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Hiển thị {filteredRoles.length} vai trò
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <RoleFormModal
        isOpen={isFormModalOpen}
        onClose={closeModals}
        onSubmit={selectedRole ? handleUpdateRole : handleCreateRole}
        role={selectedRole}
        title={selectedRole ? 'Chỉnh sửa vai trò' : 'Thêm vai trò mới'}
      />

      <RoleDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDeleteRole}
        role={selectedRole}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default RoleManagement;
