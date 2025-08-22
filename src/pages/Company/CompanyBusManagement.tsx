import React, { useState, useEffect } from 'react';
import { companyService, busService, typeBusService } from '../../services/api';
import { Company, Bus, CreateTypeBusWithDiagramRequest, SeatPosition, CreateBusRequest, BusType } from '../../types/company';
import { useAuth } from '../../context/AuthContext';
import RoleAccessNotice from '../../components/common/RoleAccessNotice';

const CompanyBusManagement: React.FC = () => {
  const { isAdmin, isManager, isCompanyRestricted, getUserCompanyId } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeBuses, setTypeBuses] = useState<BusType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<Bus | null>(null);
  const [formData, setFormData] = useState<CreateBusRequest>({ 
    name: '', 
    numberPlate: '', 
    typeBusId: 0, 
    companyId: 0, 
    brand: '', 
    amentity: '' 
  });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [typeForm, setTypeForm] = useState<CreateTypeBusWithDiagramRequest>({
    name: '',
    numberOfSeat: 0,
    numberOfFloors: 1,
    description: '',
    seatDiagram: {
      name: '',
      row: 1,
      column: 1,
      selectedSeats: [],
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching companies, buses and type buses...');
      
      // Fetch companies, buses, and type buses
      const [companiesResponse, busesResponse, typeBusesResponse] = await Promise.all([
        companyService.getAllCompanies(),
        busService.getAllBuses(),
        typeBusService.getAllTypeBuses()
      ]);
      
      console.log('Companies response:', companiesResponse);
      console.log('Buses response:', busesResponse);
      console.log('TypeBuses response:', typeBusesResponse);
      
      if (companiesResponse?.data && busesResponse?.data) {
        let filteredCompanies = companiesResponse.data;
        let filteredBuses = busesResponse.data;
        setTypeBuses((typeBusesResponse?.data || []));

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
    setFormData({ 
      name: '', 
      numberPlate: '', 
      typeBusId: 0, 
      companyId: company.id, 
      brand: '', 
      amentity: '' 
    });
    setIsFormOpen(true);
  };

  const openCreateType = () => {
    if (!isManager()) return;
    setTypeForm({
      name: '',
      numberOfSeat: 0,
      numberOfFloors: 1,
      description: '',
      seatDiagram: { name: '', row: 1, column: 1, selectedSeats: [] },
    });
    setIsTypeModalOpen(true);
  };

  const openEditBus = (bus: Bus, companyId: number) => {
    if (!isManager()) return;
    setEditingBus(bus);
    setFormData({ 
      name: bus.name, 
      numberPlate: bus.numberPlate, 
      typeBusId: bus.typeBusId, 
      companyId,
      brand: '', // Will need to get from bus data if available
      amentity: '' // Will need to get from bus data if available
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingBus(null);
  };

  const closeTypeModal = () => {
    setIsTypeModalOpen(false);
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

  const toggleSeat = (floorIndex: number, rowIndex: number, colIndex: number) => {
    const key = (s: SeatPosition) => `${s.floorIndex}-${s.rowIndex}-${s.colIndex}`;
    const exists = typeForm.seatDiagram.selectedSeats.find(s => key(s) === `${floorIndex}-${rowIndex}-${colIndex}`);
    const nextSeats = exists
      ? typeForm.seatDiagram.selectedSeats.filter(s => key(s) !== `${floorIndex}-${rowIndex}-${colIndex}`)
      : [...typeForm.seatDiagram.selectedSeats, { floorIndex, rowIndex, colIndex }];
    setTypeForm({ ...typeForm, seatDiagram: { ...typeForm.seatDiagram, selectedSeats: nextSeats } });
  };

  const handleSubmitType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isManager()) return;
    try {
      if (typeForm.numberOfFloors < 1) {
        showToast('Số tầng phải >= 1', 'error');
        return;
      }
      if (typeForm.seatDiagram.row < 1 || typeForm.seatDiagram.column < 1) {
        showToast('Số hàng/cột phải >= 1', 'error');
        return;
      }
      if (typeForm.numberOfSeat < 0) {
        showToast('Số ghế không hợp lệ', 'error');
        return;
      }
      const res = await typeBusService.createTypeBusWithDiagram(typeForm);
      showToast('Tạo loại xe thành công!', 'success');
      setIsTypeModalOpen(false);
      console.log('Created type bus:', res);
    } catch (err) {
      console.error(err);
      showToast('Không thể tạo loại xe. Vui lòng thử lại.', 'error');
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
              {isManager() && (
                <button
                  onClick={openCreateType}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  + Tạo loại xe
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
      {/* Type Bus Create Modal */}
      {isTypeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeTypeModal}></div>
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tạo loại xe với sơ đồ ghế</h3>
                <button onClick={closeTypeModal} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              {toast && (
                <div className={`mb-3 rounded p-2 text-sm ${toast.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{toast.message}</div>
              )}
              <form onSubmit={handleSubmitType} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tên loại xe<span className="text-red-500">*</span></label>
                    <input type="text" value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Số ghế<span className="text-red-500">*</span></label>
                    <input type="number" min={0} value={typeForm.numberOfSeat} onChange={(e) => setTypeForm({ ...typeForm, numberOfSeat: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Số tầng<span className="text-red-500">*</span></label>
                    <input type="number" min={1} max={2} value={typeForm.numberOfFloors} onChange={(e) => setTypeForm({ ...typeForm, numberOfFloors: Math.min(2, Math.max(1, parseInt(e.target.value) || 1)) })} className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Mô tả</label>
                    <input type="text" value={typeForm.description} onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Tên sơ đồ<span className="text-red-500">*</span></label>
                    <input type="text" value={typeForm.seatDiagram.name} onChange={(e) => setTypeForm({ ...typeForm, seatDiagram: { ...typeForm.seatDiagram, name: e.target.value } })} className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Hàng (row)<span className="text-red-500">*</span></label>
                    <input type="number" min={1} value={typeForm.seatDiagram.row} onChange={(e) => setTypeForm({ ...typeForm, seatDiagram: { ...typeForm.seatDiagram, row: Math.max(1, parseInt(e.target.value) || 1) } })} className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Cột (column)<span className="text-red-500">*</span></label>
                    <input type="number" min={1} value={typeForm.seatDiagram.column} onChange={(e) => setTypeForm({ ...typeForm, seatDiagram: { ...typeForm.seatDiagram, column: Math.max(1, parseInt(e.target.value) || 1) } })} className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700" required />
                  </div>
                </div>
                {/* Seat Diagram */}
                <div className="space-y-6">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Sơ đồ ghế ({typeForm.seatDiagram.selectedSeats.length} ghế đã chọn)
                  </div>
                  
                  {Array.from({ length: typeForm.numberOfFloors }, (_, floorIdx) => floorIdx + 1).map(floor => (
                    <div key={floor} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                          </svg>
                          Tầng {floor}
                        </h4>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {typeForm.seatDiagram.selectedSeats.filter(s => s.floorIndex === floor).length} ghế
                        </div>
                      </div>
                      
                      {/* Row and column labels */}
                      <div className="flex">
                        {/* Column headers */}
                        <div className="w-8"></div>
                        {Array.from({ length: typeForm.seatDiagram.column }, (_, c) => (
                          <div key={c} className="w-12 h-6 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                            {c + 1}
                          </div>
                        ))}
                      </div>
                      
                      {/* Seat grid with row labels */}
                      {Array.from({ length: typeForm.seatDiagram.row }, (_, r) => (
                        <div key={r} className="flex items-center">
                          {/* Row label */}
                          <div className="w-8 h-12 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400">
                            {String.fromCharCode(65 + r)}
                          </div>
                          
                          {/* Seat buttons */}
                          {Array.from({ length: typeForm.seatDiagram.column }, (_, c) => {
                            const selected = !!typeForm.seatDiagram.selectedSeats.find(s => 
                              s.floorIndex === floor && s.rowIndex === r + 1 && s.colIndex === c + 1
                            );
                            const seatNumber = `${String.fromCharCode(65 + r)}${c + 1}`;
                            
                            return (
                              <button
                                type="button"
                                key={`${r}-${c}`}
                                onClick={() => toggleSeat(floor, r + 1, c + 1)}
                                className={`m-1 w-10 h-10 text-xs font-medium rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                                  selected 
                                    ? 'bg-green-500 hover:bg-green-600 text-white border-green-600 shadow-md' 
                                    : 'bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 shadow-sm'
                                }`}
                                title={`Tầng ${floor} - Ghế ${seatNumber} ${selected ? '(Đã chọn)' : '(Trống)'}`}
                              >
                                {selected ? (
                                  <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                                  </svg>
                                ) : (
                                  <div className="text-gray-400">
                                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                                    </svg>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                      
                      {/* Floor summary */}
                      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                              <span className="text-gray-600 dark:text-gray-400">Ghế đã chọn</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded mr-2"></div>
                              <span className="text-gray-600 dark:text-gray-400">Vị trí trống</span>
                            </div>
                          </div>
                          <div className="text-gray-500 dark:text-gray-400">
                            Tổng: {typeForm.seatDiagram.row * typeForm.seatDiagram.column} vị trí
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Overall summary */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        <span className="font-medium text-blue-800 dark:text-blue-200">
                          Tổng kết sơ đồ
                        </span>
                      </div>
                      <div className="text-blue-700 dark:text-blue-300 text-sm">
                        <span className="font-semibold">{typeForm.seatDiagram.selectedSeats.length}</span> ghế / 
                        <span className="font-semibold">{typeForm.numberOfFloors * typeForm.seatDiagram.row * typeForm.seatDiagram.column}</span> vị trí
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center bg-gray-100 dark:bg-gray-800 rounded p-2">
                    💡 Nhấp vào các ô để đánh dấu vị trí ghế. Hàng được đánh số bằng chữ cái (A, B, C...), cột bằng số (1, 2, 3...)
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeTypeModal} className="px-4 py-2 rounded border">Hủy</button>
                  <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white">Tạo loại xe</button>
                </div>
              </form>
            </div>
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
                  <label className="block text-sm font-medium mb-1">Loại xe<span className="text-red-500">*</span></label>
                  <select
                    value={formData.typeBusId}
                    onChange={(e) => setFormData({ ...formData, typeBusId: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                    required
                  >
                    <option value={0}>Chọn loại xe</option>
                    {typeBuses.map(tb => (
                      <option key={tb.id} value={tb.id}>
                        {tb.name} ({tb.numberOfSeat} ghế, {tb.numberOfFloors} tầng)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Thương hiệu<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                    placeholder="VD: Mercedes, Hyundai..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tiện ích<span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.amentity}
                    onChange={(e) => setFormData({ ...formData, amentity: e.target.value })}
                    className="w-full px-3 py-2 border rounded dark:bg-gray-800 dark:border-gray-700"
                    placeholder="VD: WiFi, Điều hòa, TV..."
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