import React, { useState, useEffect } from 'react';
import { stationService } from '../../services/api';
import { Station, CreateStationRequest, UpdateStationRequest } from '../../types/company';
import StationFormModal from '../../components/Station/StationFormModal';
import DeleteConfirmModal from '../../components/Station/DeleteConfirmModal';
import { useAuth } from '../../context/AuthContext';
import RoleAccessNotice from '../../components/common/RoleAccessNotice';

const StationList: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const { isAdmin } = useAuth();
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Success/Error messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching stations...');
      
      const response = await stationService.getAllStations();
      console.log('Stations response:', response);
      
      // Defensive check for response structure
      if (response && response.data && Array.isArray(response.data)) {
        setStations(response.data);
        setError(null);
      } else {
        console.warn('Invalid response structure:', response);
        setStations([]);
        setError('Dữ liệu trả về không hợp lệ');
      }
    } catch (err: any) {
      console.error('Error details:', err);
      let errorMessage = 'Không thể tải danh sách trạm xe. ';
      
      if (err.response) {
        errorMessage += `Server error: ${err.response.status} - ${err.response.statusText}`;
      } else if (err.request) {
        errorMessage += 'Không thể kết nối đến server.';
      } else {
        errorMessage += err.message;
      }
      
      setError(errorMessage);
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

  const handleCreateStation = async (data: CreateStationRequest) => {
    try {
      if (!isAdmin()) {
        showMessage('Chỉ quản trị viên (Admin) mới có quyền tạo trạm.', 'error');
        return;
      }
      await stationService.createStation(data);
      showMessage('Tạo trạm xe thành công!', 'success');
      fetchStations();
    } catch (error) {
      console.error('Error creating station:', error);
      showMessage('Không thể tạo trạm xe. Vui lòng thử lại.', 'error');
      throw error;
    }
  };

  const handleUpdateStation = async (data: UpdateStationRequest) => {
    if (!selectedStation) return;
    try {
      if (!isAdmin()) {
        showMessage('Chỉ quản trị viên (Admin) mới có quyền cập nhật trạm.', 'error');
        return;
      }
      await stationService.updateStation(selectedStation.id, data);
      showMessage('Cập nhật trạm xe thành công!', 'success');
      fetchStations();
    } catch (error) {
      console.error('Error updating station:', error);
      showMessage('Không thể cập nhật trạm xe. Vui lòng thử lại.', 'error');
      throw error;
    }
  };

  const handleDeleteStation = async () => {
    if (!selectedStation) return;
    try {
      setIsDeleting(true);
      if (!isAdmin()) {
        showMessage('Chỉ quản trị viên (Admin) mới có quyền xóa trạm.', 'error');
        return;
      }
      await stationService.deleteStation(selectedStation.id);
      showMessage('Xóa trạm xe thành công!', 'success');
      setIsDeleteModalOpen(false);
      setSelectedStation(null);
      fetchStations();
    } catch (error) {
      console.error('Error deleting station:', error);
      showMessage('Không thể xóa trạm xe. Vui lòng thử lại.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const openCreateModal = () => {
    setSelectedStation(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (station: Station) => {
    setSelectedStation(station);
    setIsFormModalOpen(true);
  };

  const openDeleteModal = (station: Station) => {
    setSelectedStation(station);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsFormModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedStation(null);
  };

  const filteredStations = (stations || []).filter(station =>
    station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.locationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.stationId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tính toán thống kê
  const getStatistics = () => {
    const totalStations = stations.length;
    const activeStations = stations.filter(station => station.status === 1).length;
    const inactiveStations = stations.filter(station => station.status === 0).length;

    return { totalStations, activeStations, inactiveStations };
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌</div>
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <details className="text-left text-sm text-gray-600 dark:text-gray-400 mb-4">
            <summary className="cursor-pointer">Chi tiết lỗi</summary>
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <p>Endpoint: https://bobts-server-e7dxfwh7e5g9e3ad.malaysiawest-01.azurewebsites.net/api/Station</p>
              <p>Parameters: All=true</p>
            </div>
          </details>
          <button 
            onClick={fetchStations}
            className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const stats = getStatistics();

  return (
    <div className="space-y-6">
      <RoleAccessNotice />
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng trạm xe</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalStations}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900/20">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đang hoạt động</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeStations}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full dark:bg-green-900/20">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Không hoạt động</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inactiveStations}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full dark:bg-red-900/20">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Station List */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Danh sách trạm xe
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tổng số: {stations.length} trạm xe
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin() && (
              <button 
                onClick={openCreateModal}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm font-medium"
              >
                Thêm trạm xe mới
              </button>
            )}
            
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-4 dark:bg-green-900/20 dark:border-green-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800 dark:text-green-400">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4 dark:bg-red-900/20 dark:border-red-800">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800 dark:text-red-400">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Box */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên trạm, địa điểm, mã trạm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Thông tin trạm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Địa điểm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-800">
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Không tìm thấy trạm xe nào phù hợp' : 'Chưa có trạm xe nào'}
                  </td>
                </tr>
              ) : (
                filteredStations.map((station) => (
                  <tr key={station.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center dark:bg-blue-900/20">
                            <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {station.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {station.stationId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {station.locationName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {isAdmin() ? (
                        <>
                          <button 
                            onClick={() => openEditModal(station)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                          >
                            Sửa
                          </button>
                          <button 
                            onClick={() => openDeleteModal(station)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Xóa
                          </button>
                        </>
                      ) : (
                        <span className="text-gray-400">Chỉ xem</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredStations.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu trạm xe</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <StationFormModal
        isOpen={isFormModalOpen}
        onClose={closeModals}
        onSubmit={selectedStation ? handleUpdateStation : handleCreateStation}
        station={selectedStation}
        title={selectedStation ? 'Chỉnh sửa trạm xe' : 'Thêm trạm xe mới'}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={closeModals}
        onConfirm={handleDeleteStation}
        station={selectedStation}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default StationList;
