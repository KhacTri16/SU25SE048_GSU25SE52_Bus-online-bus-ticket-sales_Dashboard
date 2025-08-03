import { useState, useEffect } from "react";
import { Route, CreateRouteRequest, UpdateRouteRequest } from "../../types/company";
import { routeService } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import RouteFormModal from "../../components/Routes/RouteFormModal";
import DeleteConfirmModal from "../../components/Routes/DeleteConfirmModal";

export default function RoutesManagement() {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Success/Error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, [currentPage]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await routeService.getAllRoutes(currentPage, 10, true);
      setRoutes(response.data);
      setTotalPages(response.totalPage);
      setTotalCount(response.totalCount);
    } catch (err) {
      setError('Không thể tải dữ liệu tuyến đường. Vui lòng thử lại.');
      console.error('Error fetching routes:', err);
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
    
    // Auto hide after 5 seconds
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 5000);
  };

  const handleCreateRoute = async (data: CreateRouteRequest) => {
    try {
      await routeService.createRoute(data);
      showMessage('Tạo tuyến đường thành công!', 'success');
      fetchRoutes();
    } catch (error) {
      console.error('Error creating route:', error);
      showMessage('Không thể tạo tuyến đường. Vui lòng thử lại.', 'error');
      throw error;
    }
  };

  const handleUpdateRoute = async (data: UpdateRouteRequest) => {
    if (!selectedRoute) return;
    
    try {
      await routeService.updateRoute(selectedRoute.id, data);
      showMessage('Cập nhật tuyến đường thành công!', 'success');
      fetchRoutes();
    } catch (error) {
      console.error('Error updating route:', error);
      showMessage('Không thể cập nhật tuyến đường. Vui lòng thử lại.', 'error');
      throw error;
    }
  };

  const handleDeleteRoute = async () => {
    if (!selectedRoute) return;
    
    try {
      setIsDeleting(true);
      await routeService.deleteRoute(selectedRoute.id);
      showMessage('Xóa tuyến đường thành công!', 'success');
      setIsDeleteModalOpen(false);
      setSelectedRoute(null);
      fetchRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
      showMessage('Không thể xóa tuyến đường. Vui lòng thử lại.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateModal = () => {
    setSelectedRoute(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (route: Route) => {
    setSelectedRoute(route);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (route: Route) => {
    setSelectedRoute(route);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedRoute(null);
  };

  const filteredRoutes = routes.filter(route =>
    route.routeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.toLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDistance = (distance: number) => {
    return `${distance} km`;
  };

  const getStatusBadge = (route: Route) => {
    if (!route.isCreate) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">Chưa tạo</span>;
    } else if (route.isDelete) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Đã xóa</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Hoạt động</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Quản lý tuyến đường - XeTiic"
        description="Quản lý các tuyến đường xe khách trong hệ thống"
      />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quản lý tuyến đường
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Danh sách và quản lý các tuyến đường xe khách
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/10 dark:border-green-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-400 hover:text-green-600 dark:hover:text-green-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {(error || errorMessage) && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/10 dark:border-red-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800 dark:text-red-200">{error || errorMessage}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => {
                  setError(null);
                  setErrorMessage(null);
                }}
                className="text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        {/* Header với search */}
        <div className="border-b border-gray-200 dark:border-gray-800 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Danh sách tuyến đường
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tổng cộng {totalCount} tuyến đường
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm tuyến đường..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <svg className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Thêm tuyến
              </button>
              <button
                onClick={fetchRoutes}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-pink-600 hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
              >
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Mã tuyến
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Tuyến đường
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Khoảng cách
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Công ty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-800">
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {route.routeId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="font-medium">{route.fromLocation}</div>
                      <div className="text-gray-500 dark:text-gray-400">→ {route.toLocation}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDistance(route.distance)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {formatDuration(route.duration)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {route.companyName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(route.createAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(route)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(route)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        title="Chỉnh sửa"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => openDeleteModal(route)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        title="Xóa"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>

                      {route.routeLicense && route.routeLicense.startsWith('http') && (
                        <a
                          href={route.routeLicense}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                          title="Xem giấy phép"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredRoutes.length === 0 && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0M15 17a2 2 0 104 0" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Không có tuyến đường</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm ? 'Không tìm thấy tuyến đường phù hợp với từ khóa tìm kiếm.' : 'Chưa có tuyến đường nào trong hệ thống.'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Trang {currentPage + 1} / {totalPages} - Tổng cộng {totalCount} tuyến đường
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-600"
                >
                  Trước
                </button>
                <span className="px-3 py-1 text-sm font-medium text-gray-900 bg-pink-50 border border-pink-200 rounded-md dark:bg-pink-900/20 dark:border-pink-800 dark:text-pink-400">
                  {currentPage + 1}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage >= totalPages - 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:disabled:bg-gray-800 dark:disabled:text-gray-600"
                >
                  Tiếp
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <RouteFormModal
        isOpen={isFormModalOpen}
        onClose={closeModals}
        onSubmit={selectedRoute ? handleUpdateRoute : handleCreateRoute}
        route={selectedRoute}
        title={selectedRoute ? 'Chỉnh sửa tuyến đường' : 'Thêm tuyến đường mới'}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDeleteRoute}
        route={selectedRoute}
        isDeleting={isDeleting}
      />
    </>
  );
}