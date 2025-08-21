import { useState, useEffect, Fragment } from "react";
import { Route, CreateRouteRequest, UpdateRouteRequest, Trip, CreateTripRequest } from "../../types/company";
import { routeService, companyService, tripService } from "../../services/api";
import PageMeta from "../../components/common/PageMeta";
import RouteFormModal from "../../components/Routes/RouteFormModal";
import DeleteConfirmModal from "../../components/Routes/DeleteConfirmModal";
import { useAuth } from "../../context/AuthContext";
import RoleAccessNotice from "../../components/common/RoleAccessNotice";

export default function RoutesManagement() {
  const { isManager, isAdmin, isCompanyRestricted, getUserCompanyId } = useAuth();
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
  const [tripsByRouteId, setTripsByRouteId] = useState<Record<number, Trip[]>>({});
  const [expandedRoutes, setExpandedRoutes] = useState<Record<number, boolean>>({});
  const [creatingTripForRoute, setCreatingTripForRoute] = useState<Route | null>(null);
  const [newTrip, setNewTrip] = useState<CreateTripRequest | null>(null);

  useEffect(() => {
    fetchRoutes();
  }, [currentPage]);

  const fetchRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await routeService.getAllRoutes(currentPage, 10, true);
      
      // Filter routes based on user's company if they are company-restricted
      let filteredRoutes = response.data;
      if (isCompanyRestricted()) {
        const userCompanyId = getUserCompanyId();
        if (userCompanyId) {
          // Get user's company name for route filtering
          try {
            const companiesResponse = await companyService.getAllCompanies(1, 100);
            const userCompany = companiesResponse.data.find(
              company => company.id === userCompanyId
            );
            
            if (userCompany) {
              // Filter routes to only show routes from user's company
              filteredRoutes = response.data.filter(
                route => route.companyName === userCompany.name
              );
              
              // Fallback: partial name matching if exact match fails
              if (filteredRoutes.length === 0) {
                const companyRoutes = response.data.filter(route => 
                  route.companyName.toLowerCase().includes(userCompany.name.toLowerCase()) ||
                  userCompany.name.toLowerCase().includes(route.companyName.toLowerCase())
                );
                
                if (companyRoutes.length > 0) {
                  filteredRoutes = companyRoutes;
                }
              }
              
              console.log(`Filtered routes for user companyId ${userCompanyId}:`, filteredRoutes);
            }
          } catch (companyError) {
            console.error('Error fetching companies for filtering:', companyError);
            console.log('Showing all routes (backend should filter)');
          }
        }
      }
      
      setRoutes(filteredRoutes);
      setTotalPages(response.totalPage);
      setTotalCount(filteredRoutes.length); // Use filtered count
      // Fetch trips for the currently visible routes
      await fetchTripsForRoutes(filteredRoutes);
    } catch (err) {
      setError('Không thể tải dữ liệu tuyến đường. Vui lòng thử lại.');
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTripsForRoutes = async (visibleRoutes: Route[]) => {
    try {
      const tripsResponse = await tripService.getAllTrips(0, 1000, true);
      const routeIds = new Set(visibleRoutes.map(r => r.id));
      const map: Record<number, Trip[]> = {};
      for (const trip of tripsResponse.data || []) {
        if (routeIds.has(trip.routeId) && !trip.isDeleted) {
          if (!map[trip.routeId]) map[trip.routeId] = [];
          map[trip.routeId].push(trip);
        }
      }
      setTripsByRouteId(map);
    } catch (e) {
      console.error('Error fetching trips:', e);
    }
  };

  const toggleExpand = (routeId: number) => {
    setExpandedRoutes(prev => ({ ...prev, [routeId]: !prev[routeId] }));
  };

  const openCreateTrip = (route: Route) => {
    if (!isManager()) {
      showMessage('Chỉ Manager mới có thể tạo chuyến.', 'error');
      return;
    }
    if (!route.isCreate || route.isDelete) {
      showMessage('Chỉ có thể tạo chuyến cho tuyến đã được Admin duyệt.', 'error');
      return;
    }
    setCreatingTripForRoute(route);
    setNewTrip({
      timeStart: new Date().toISOString(),
      timeEnd: new Date(Date.now() + 3600000).toISOString(),
      price: 0,
      routeId: route.id,
      busId: 0,
      driverId: 0,
      description: ''
    });
  };

  const submitCreateTrip = async () => {
    if (!creatingTripForRoute || !newTrip) return;
    try {
      if (!isManager()) {
        showMessage('Chỉ Manager mới có thể tạo chuyến.', 'error');
        return;
      }
      await tripService.createTrip(newTrip);
      showMessage('Tạo chuyến thành công!', 'success');
      setCreatingTripForRoute(null);
      setNewTrip(null);
      await fetchTripsForRoutes(routes);
    } catch (e) {
      console.error('Error creating trip:', e);
      showMessage('Không thể tạo chuyến. Vui lòng thử lại.', 'error');
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
      // Only Manager can create
      if (!isManager()) {
        showMessage('Chỉ Manager mới có quyền tạo tuyến đường.', 'error');
        return;
      }
      // If user is company-restricted, automatically set their company ID
      if (isCompanyRestricted()) {
        const userCompanyId = getUserCompanyId();
        if (userCompanyId) {
          data.companyId = userCompanyId;
        }
      }
      
      await routeService.createRoute(data);
      showMessage('Tạo tuyến đường thành công! Chờ Admin duyệt.', 'success');
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
      // Only Manager can update
      if (!isManager()) {
        showMessage('Chỉ Manager mới có quyền cập nhật tuyến đường.', 'error');
        return;
      }
      // Enforce company restriction on update: selected route must belong to manager's company
      if (isCompanyRestricted()) {
        const userCompanyId = getUserCompanyId();
        if (userCompanyId) {
          try {
            const companiesResponse = await companyService.getAllCompanies(1, 100);
            const userCompany = companiesResponse.data.find(c => c.id === userCompanyId);
            if (userCompany && selectedRoute.companyName !== userCompany.name) {
              showMessage('Bạn chỉ có thể cập nhật tuyến đường của công ty mình.', 'error');
              return;
            }
          } catch {
            // If company fetch fails, block to be safe
            showMessage('Không thể xác minh công ty. Vui lòng thử lại.', 'error');
            return;
          }
        }
      }
      console.log('Updating route:', selectedRoute.id);
      
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
      // Only Manager can delete
      if (!isManager()) {
        showMessage('Chỉ Manager mới có quyền xóa tuyến đường.', 'error');
        return;
      }
      // Enforce company restriction on delete
      if (isCompanyRestricted()) {
        const userCompanyId = getUserCompanyId();
        if (userCompanyId) {
          try {
            const companiesResponse = await companyService.getAllCompanies(1, 100);
            const userCompany = companiesResponse.data.find(c => c.id === userCompanyId);
            if (userCompany && selectedRoute.companyName !== userCompany.name) {
              showMessage('Bạn chỉ có thể xóa tuyến đường của công ty mình.', 'error');
              return;
            }
          } catch {
            showMessage('Không thể xác minh công ty. Vui lòng thử lại.', 'error');
            return;
          }
        }
      }
      console.log('Deleting route:', selectedRoute.id);
      
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
    if (route.isDelete) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Đã xóa</span>;
    } else if (!route.isCreate) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Chờ duyệt</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Hoạt động</span>;
    }
  };

  const getTripsForRoute = (routeId: number): Trip[] => {
    return tripsByRouteId[routeId] || [];
  };

  const hasTripsForRoute = (routeId: number): boolean => {
    const trips = getTripsForRoute(routeId);
    return trips.length > 0;
  };

  const handleApproveRoute = async (route: Route) => {
    try {
      if (!isAdmin()) {
        showMessage('Chỉ Admin mới có quyền duyệt tuyến đường.', 'error');
        return;
      }
      await routeService.activateRoute(route.id);
      showMessage('Đã duyệt tuyến đường thành công.', 'success');
      fetchRoutes();
    } catch (error) {
      console.error('Error approving route:', error);
      showMessage('Không thể duyệt tuyến đường. Vui lòng thử lại.', 'error');
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
      
      {/* Role-based access notice */}
      <RoleAccessNotice className="mb-6" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {isCompanyRestricted() ? 'Tuyến đường của công ty' : 'Quản lý tuyến đường'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isCompanyRestricted() 
            ? 'Danh sách và quản lý các tuyến đường của công ty bạn'
            : 'Danh sách và quản lý các tuyến đường xe khách'
          }
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

      {/* Admin pending approval notice */}
      {isAdmin() && routes.some(r => !r.isCreate && !r.isDelete) && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 dark:bg-yellow-900/10 dark:border-yellow-800">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.366-.756 1.42-.756 1.786 0l7.163 14.787A1 1 0 0116.163 20H3.837a1 1 0 01-.894-1.45L10.106 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V7a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-yellow-800 dark:text-yellow-200">
              Bạn cần duyệt chuyến đi mới. Có {routes.filter(r => !r.isCreate && !r.isDelete).length} tuyến chờ duyệt.
            </p>
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
              {isManager() && (
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm tuyến
                </button>
              )}
              
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
                {!isCompanyRestricted() && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Công ty
                  </th>
                )}
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
                <Fragment key={route.id}>
                <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {route.routeId}
                    </div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                    onClick={() => toggleExpand(route.id)}
                    title={expandedRoutes[route.id] ? 'Ẩn chuyến' : 'Xem chuyến'}
                  >
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
                  {!isCompanyRestricted() && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {route.companyName}
                      </div>
                    </td>
                  )}
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
                        onClick={() => toggleExpand(route.id)}
                        className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                        title={expandedRoutes[route.id] ? 'Ẩn chuyến' : 'Xem chuyến'}
                      >
                        <svg className={`h-4 w-4 transform transition-transform ${expandedRoutes[route.id] ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      {isAdmin() && !route.isCreate && !route.isDelete && (
                        <button
                          onClick={() => handleApproveRoute(route)}
                          className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                          title="Duyệt tuyến"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                      {isManager() && (
                        <button
                          onClick={() => openEditModal(route)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          title="Chỉnh sửa"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                      
                      {isManager() && (
                        <button
                          onClick={() => openDeleteModal(route)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          title="Xóa"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}

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
                {expandedRoutes[route.id] && (
                  <tr>
                    <td colSpan={isCompanyRestricted() ? 7 : 8} className="px-6 pb-6">
                      <div className="mt-2 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          Chuyến đi của tuyến {route.routeId}
                        </div>
                        <div className="overflow-x-auto">
                          {hasTripsForRoute(route.id) && (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                              <thead className="bg-white dark:bg-transparent">
                                <tr>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Mã chuyến</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Lộ trình</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Khởi hành</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Đến nơi</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Giá vé</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Xe</th>
                                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Trạng thái</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-800">
                                {getTripsForRoute(route.id).map(trip => (
                                  <tr key={trip.id}>
                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{trip.tripId}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{trip.fromLocation} → {trip.endLocation}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{new Date(trip.timeStart).toLocaleString('vi-VN')}</td>
                                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{new Date(trip.timeEnd).toLocaleString('vi-VN')}</td>
                                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{trip.price.toLocaleString('vi-VN')} đ</td>
                                    <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{trip.busName}</td>
                                    <td className="px-4 py-2">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${trip.status === 1 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'}`}>
                                        {trip.status === 1 ? 'Hoạt động' : 'Tạm dừng'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {!hasTripsForRoute(route.id) && (
                            <div className="px-4 py-6 text-sm text-gray-500 dark:text-gray-400">Không có chuyến cho tuyến này.</div>
                          )}
                          {isManager() && route.isCreate && !route.isDelete && (
                            <div className="px-4 py-4">
                              <button
                                onClick={() => openCreateTrip(route)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                              >
                                Thêm chuyến
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
                </Fragment>
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

      {creatingTripForRoute && newTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => { setCreatingTripForRoute(null); setNewTrip(null); }} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tạo chuyến cho tuyến {creatingTripForRoute.routeId}</h3>
              <button onClick={() => { setCreatingTripForRoute(null); setNewTrip(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thời gian khởi hành</label>
                <input type="datetime-local" value={new Date(newTrip.timeStart).toISOString().slice(0,16)} onChange={(e) => setNewTrip({ ...newTrip, timeStart: new Date(e.target.value).toISOString() })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Thời gian đến</label>
                <input type="datetime-local" value={new Date(newTrip.timeEnd).toISOString().slice(0,16)} onChange={(e) => setNewTrip({ ...newTrip, timeEnd: new Date(e.target.value).toISOString() })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Giá vé (đ)</label>
                <input type="number" min={0} value={newTrip.price} onChange={(e) => setNewTrip({ ...newTrip, price: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bus ID</label>
                  <input type="number" min={1} value={newTrip.busId} onChange={(e) => setNewTrip({ ...newTrip, busId: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Driver ID</label>
                  <input type="number" min={1} value={newTrip.driverId} onChange={(e) => setNewTrip({ ...newTrip, driverId: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mô tả</label>
                <textarea value={newTrip.description} onChange={(e) => setNewTrip({ ...newTrip, description: e.target.value })} rows={3} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            <div className="p-5 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button onClick={() => { setCreatingTripForRoute(null); setNewTrip(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">Hủy</button>
              <button onClick={submitCreateTrip} className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg">Tạo chuyến</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}