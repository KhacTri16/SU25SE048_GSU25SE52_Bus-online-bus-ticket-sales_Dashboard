import React, { useState, useEffect } from 'react';
import { companyService, busService } from '../../services/api';
import { Company, Bus } from '../../types/company';
import { useAuth } from '../../context/AuthContext';
import RoleAccessNotice from '../../components/common/RoleAccessNotice';

const CompanyBusManagement: React.FC = () => {
  const { isAdmin, isManager, isCompanyRestricted, getUserCompanyId } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState({ name: '', numberPlate: '', typeBusId: 0, companyId: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching companies and buses...');
      
      // Fetch both companies and buses
      const [companiesResponse, busesResponse] = await Promise.all([
        companyService.getAllCompanies(),
        busService.getAllBuses()
      ]);
      
      console.log('Companies response:', companiesResponse);
      console.log('Buses response:', busesResponse);
      
      if (companiesResponse?.data && busesResponse?.data) {
        let filteredCompanies = companiesResponse.data;
        let filteredBuses = busesResponse.data;

        // If user is company-restricted, filter data by their company
        if (isCompanyRestricted()) {
          const userCompanyId = getUserCompanyId();
          console.log('User company ID:', userCompanyId);
          
          if (userCompanyId) {
            // Filter companies to only show user's company
            filteredCompanies = companiesResponse.data.filter(
              company => company.id === userCompanyId
            );
            
            // Get the user's company name for bus filtering
            const userCompany = companiesResponse.data.find(
              company => company.id === userCompanyId
            );
            
            if (userCompany) {
              // Filter buses to only show buses from user's company
              filteredBuses = busesResponse.data.filter(
                bus => bus.companyName === userCompany.name
              );
              
              console.log('User company name:', userCompany.name);
              console.log('Filtered companies:', filteredCompanies);
              console.log('Filtered buses:', filteredBuses);
              
              if (filteredBuses.length === 0) {
                try {
                  console.log(`No buses found for company "${userCompany.name}", checking if there are any buses with this company name`);
                  // This is a fallback - in a real scenario, you might want to add a getBusesByCompany API endpoint
                  const allBuses = busesResponse.data;
                  const companyBuses = allBuses.filter(bus => 
                    bus.companyName.toLowerCase().includes(userCompany.name.toLowerCase()) ||
                    userCompany.name.toLowerCase().includes(bus.companyName.toLowerCase())
                  );
                  
                  if (companyBuses.length > 0) {
                    filteredBuses = companyBuses;
                    console.log('Found buses with partial company name match:', companyBuses);
                  }
                } catch (busErr) {
                  console.error('Error in bus fallback filtering:', busErr);
                }
              }
            }
          }
        }
        
        setCompanies(filteredCompanies);
        setBuses(filteredBuses);
        setError(null);
      } else {
        console.warn('Invalid response structure');
        setCompanies([]);
        setBuses([]);
        setError('Dữ liệu trả về không hợp lệ');
      }
    } catch (err: any) {
      console.error('Error details:', err);
      let errorMessage = 'Không thể tải dữ liệu. ';
      
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

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const openCreateBus = (company: Company) => {
    if (!isManager()) return;
    setEditingBus(null);
    setFormData({ name: '', numberPlate: '', typeBusId: 0, companyId: company.id });
    setIsFormOpen(true);
  };

  const openEditBus = (bus: Bus, companyId: number) => {
    if (!isManager()) return;
    setEditingBus(bus);
    setFormData({ name: bus.name, numberPlate: bus.numberPlate, typeBusId: bus.typeBusId, companyId });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingBus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager()) return;
    try {
      setSubmitting(true);
      const userCompanyId = getUserCompanyId();
      if (!userCompanyId || userCompanyId !== formData.companyId) {
        showToast('Bạn chỉ có thể quản lý xe của công ty mình.', 'error');
        return;
      }
      if (editingBus) {
        await busService.updateBus(editingBus.id, formData);
        showToast('Cập nhật xe thành công!', 'success');
      } else {
        await busService.createBus(formData);
        showToast('Thêm xe thành công!', 'success');
      }
      await fetchData();
      closeForm();
    } catch (err) {
      console.error(err);
      showToast('Không thể lưu xe. Vui lòng thử lại.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bus: Bus, companyId: number) => {
    if (!isManager()) return;
    try {
      const userCompanyId = getUserCompanyId();
      if (!userCompanyId || userCompanyId !== companyId) {
        showToast('Bạn chỉ có thể xóa xe của công ty mình.', 'error');
        return;
      }
      await busService.deleteBus(bus.id);
      showToast('Xóa xe thành công!', 'success');
      await fetchData();
    } catch (err) {
      console.error(err);
      showToast('Không thể xóa xe. Vui lòng thử lại.', 'error');
    }
  };

  // Filter buses by selected company
  const getBusesByCompany = (companyId: string) => {
    return buses.filter(bus => bus.companyName === companyId);
  };

  // (unused) Get all unique company names from buses

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.companyId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const getStatistics = () => {
    const totalCompanies = companies.length;
    const totalBuses = buses.length;
    const activeCompanies = companies.filter(company => company.status === 1).length;

    return { totalCompanies, totalBuses, activeCompanies };
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
              <p>Endpoint: https://bobts-server-e7dxfwh7e5g9e3ad.malaysiawest-01.azurewebsites.net/api/Company</p>
              <p>Endpoint: https://bobts-server-e7dxfwh7e5g9e3ad.malaysiawest-01.azurewebsites.net/api/Bus</p>
            </div>
          </details>
          <button 
            onClick={fetchData}
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
      {/* Role-based access notice */}
      <RoleAccessNotice className="mb-6" />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {isCompanyRestricted() ? 'Công ty của bạn' : 'Tổng công ty'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCompanies}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900/20">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {isCompanyRestricted() ? 'Xe của công ty' : 'Tổng xe'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBuses}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full dark:bg-green-900/20">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {isCompanyRestricted() ? 'Trạng thái công ty' : 'Công ty hoạt động'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCompanies}</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-full dark:bg-pink-900/20">
              <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Company Selection - Only show for admin or if user has multiple companies */}
      {isAdmin() || companies.length > 1 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {isAdmin() ? 'Chọn công ty để xem xe' : 'Công ty của bạn'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tổng số: {companies.length} công ty
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={fetchData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                🔄 Làm mới
              </button>
            </div>
          </div>

          {/* Search Box - Only for admin */}
          {isAdmin() && (
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên công ty..."
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
          )}

          {/* Company Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompanies.map((company) => {
              const companyBuses = getBusesByCompany(company.name);
              return (
                <div
                  key={company.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedCompany?.id === company.id
                      ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                      : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                  }`}
                  onClick={() => setSelectedCompany(company)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {company.name}
                    </h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full dark:bg-blue-900/20 dark:text-blue-400">
                      {companyBuses.length} xe
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    ID: {company.companyId}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {company.phone}
                  </p>
                  {isManager() && getUserCompanyId() === company.id && (
                    <div className="mt-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); openCreateBus(company); }}
                        className="px-3 py-1.5 text-xs font-medium rounded bg-green-600 text-white hover:bg-green-700"
                      >
                        + Thêm xe cho công ty này
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Bus List for Selected Company or User's Company */}
      {(selectedCompany || (isCompanyRestricted() && companies.length === 1)) && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Xe của {selectedCompany?.name || companies[0]?.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Tổng số: {getBusesByCompany(selectedCompany?.name || companies[0]?.name).length} xe
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Manager add bus button for their own company */}
              {(() => {
                const currentCompany = selectedCompany || companies[0];
                return isManager() && currentCompany && getUserCompanyId() === currentCompany.id;
              })() && (
                <button
                  onClick={() => openCreateBus(selectedCompany || (companies[0] as Company))}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  + Thêm xe
                </button>
              )}
              {selectedCompany && (
                <button 
                  onClick={() => setSelectedCompany(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium"
                >
                  Đóng
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Thông tin xe
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Biển số
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-800">
                {getBusesByCompany(selectedCompany?.name || companies[0]?.name).length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      Không có xe nào cho công ty này
                    </td>
                  </tr>
                ) : (
                  getBusesByCompany(selectedCompany?.name || companies[0]?.name).map((bus) => (
                    <tr key={bus.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center dark:bg-blue-900/20">
                              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {bus.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              ID: {bus.busId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white font-medium">
                          {bus.numberPlate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">
                          Xem
                        </button>
                        {isManager() && getUserCompanyId() === (selectedCompany?.id || companies[0]?.id) && (
                          <>
                            <button
                              onClick={() => openEditBus(bus, selectedCompany?.id || companies[0]?.id)}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete(bus, selectedCompany?.id || companies[0]?.id)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              Xóa
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Manager Bus Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeForm}></div>
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingBus ? 'Cập nhật xe' : 'Thêm xe mới'}
                </h3>
                <button onClick={closeForm} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              {toast && (
                <div className={`mb-3 rounded p-2 text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{toast.message}</div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên xe<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Biển số<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.numberPlate}
                    onChange={(e) => setFormData({ ...formData, numberPlate: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loại xe (typeBusId)<span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min={1}
                    value={formData.typeBusId}
                    onChange={(e) => setFormData({ ...formData, typeBusId: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Công ty</label>
                  <input
                    type="text"
                    value={(selectedCompany?.name || companies[0]?.name) + ` (#${formData.companyId})`}
                    disabled
                    className="w-full px-3 py-2 border rounded bg-gray-100 dark:bg-gray-800 dark:border-gray-700"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeForm} className="px-4 py-2 rounded border">Hủy</button>
                  <button type="submit" disabled={submitting} className="px-4 py-2 rounded bg-pink-600 text-white disabled:opacity-60">
                    {submitting ? 'Đang lưu...' : (editingBus ? 'Cập nhật' : 'Tạo mới')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBusManagement; 