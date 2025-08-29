import React, { useState, useEffect } from 'react';
import { companyService, busService, typeBusService } from '../../services/api';
import { Company, Bus, BusDetail, CreateTypeBusWithDiagramRequest, SeatPosition, CreateBusRequest, UpdateBusRequest, BusType } from '../../types/company';
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
  // New states for bus detail view
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedBusDetail, setSelectedBusDetail] = useState<BusDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingEdit, setLoadingEdit] = useState(false);

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

  const openEditBus = async (bus: Bus, companyId: number) => {
    if (!isManager()) return;
    try {
      setLoadingEdit(true);
      // Get full bus details from API for editing
      const busDetail = await busService.getBusById(bus.id);
      setEditingBus(bus);
      setFormData({ 
        name: busDetail.name, 
        numberPlate: busDetail.numberPlate, 
        typeBusId: busDetail.typeBusId, 
        companyId,
        brand: busDetail.brand || '', 
        amentity: busDetail.amentity || ''
      });
      setIsFormOpen(true);
    } catch (error) {
      console.error('Error fetching bus details for edit:', error);
      // Fallback to basic info if API fails
      setEditingBus(bus);
      setFormData({ 
        name: bus.name, 
        numberPlate: bus.numberPlate, 
        typeBusId: bus.typeBusId, 
        companyId,
        brand: '', 
        amentity: ''
      });
      setIsFormOpen(true);
      showToast('Không thể tải đầy đủ thông tin xe. Một số thông tin có thể thiếu.', 'error');
    } finally {
      setLoadingEdit(false);
    }
  };

  // New function to view bus details
  const openBusDetail = async (busId: number) => {
    try {
      setLoadingDetail(true);
      const busDetail = await busService.getBusById(busId);
      setSelectedBusDetail(busDetail);
      setIsDetailModalOpen(true);
    } catch (error) {
      console.error('Error fetching bus detail:', error);
      showToast('Không thể tải chi tiết xe. Vui lòng thử lại.', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeBusDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedBusDetail(null);
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
        // For update, use UpdateBusRequest format
        const updateData: UpdateBusRequest = {
          name: formData.name,
          numberPlate: formData.numberPlate,
          brand: formData.brand,
          amentity: formData.amentity,
          modelYear: new Date().toISOString(), // Current date as modelYear
          typeBusId: formData.typeBusId,
          companyId: formData.companyId
        };
        await busService.updateBus(editingBus.id, updateData);
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
                        <button 
                          onClick={() => openBusDetail(bus.id)}
                          disabled={loadingDetail}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3"
                        >
                          {loadingDetail ? 'Đang tải...' : 'Xem'}
                        </button>
                        {isManager() && getUserCompanyId() === (selectedCompany?.id || companies[0]?.id) && (
                          <>
                            <button
                              onClick={() => openEditBus(bus, selectedCompany?.id || companies[0]?.id)}
                              disabled={loadingEdit}
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 mr-3 disabled:opacity-50"
                            >
                              {loadingEdit ? 'Đang tải...' : 'Sửa'}
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
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/90 backdrop-blur-sm transition-opacity" onClick={closeTypeModal}></div>
            
            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Tạo loại xe với sơ đồ ghế</h3>
                      <p className="text-blue-100 text-sm mt-1">Thiết lập cấu hình và bố trí ghế ngồi</p>
                    </div>
                  </div>
                  <button 
                    onClick={closeTypeModal} 
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Toast Notification */}
              {toast && (
                <div className={`mx-8 mt-4 p-4 rounded-xl flex items-center space-x-3 ${
                  toast.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' 
                    : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {toast.type === 'success' ? (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">{toast.message}</span>
                </div>
              )}
              {/* Form Content */}
              <div className="p-8">
                <form onSubmit={handleSubmitType} className="space-y-8">
                  {/* Basic Information */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin cơ bản</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span>Tên loại xe</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                          type="text" 
                          value={typeForm.name} 
                          onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} 
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500"
                          placeholder="VD: Xe giường nằm cao cấp"
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span>Số ghế</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                          type="number" 
                          min={0} 
                          value={typeForm.numberOfSeat} 
                          onChange={(e) => setTypeForm({ ...typeForm, numberOfSeat: parseInt(e.target.value) || 0 })} 
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                          placeholder="0"
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span>Số tầng</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={typeForm.numberOfFloors}
                          onChange={(e) => setTypeForm({ ...typeForm, numberOfFloors: parseInt(e.target.value) || 1 })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                          required
                        >
                          <option value={1}>1 tầng</option>
                          <option value={2}>2 tầng</option>
                        </select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả</label>
                        <input 
                          type="text" 
                          value={typeForm.description} 
                          onChange={(e) => setTypeForm({ ...typeForm, description: e.target.value })} 
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500"
                          placeholder="Mô tả chi tiết về loại xe"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seat Diagram Configuration */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Cấu hình sơ đồ ghế</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span>Tên sơ đồ</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                          type="text" 
                          value={typeForm.seatDiagram.name} 
                          onChange={(e) => setTypeForm({ ...typeForm, seatDiagram: { ...typeForm.seatDiagram, name: e.target.value } })} 
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500"
                          placeholder="VD: Sơ đồ xe 40 chỗ"
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span>Số hàng (rows)</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                          type="number" 
                          min={1} 
                          value={typeForm.seatDiagram.row} 
                          onChange={(e) => setTypeForm({ ...typeForm, seatDiagram: { ...typeForm.seatDiagram, row: Math.max(1, parseInt(e.target.value) || 1) } })} 
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span>Số cột (columns)</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input 
                          type="number" 
                          min={1} 
                          value={typeForm.seatDiagram.column} 
                          onChange={(e) => setTypeForm({ ...typeForm, seatDiagram: { ...typeForm.seatDiagram, column: Math.max(1, parseInt(e.target.value) || 1) } })} 
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
                          required 
                        />
                      </div>
                    </div>
                  </div>
                  {/* Seat Diagram */}
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Thiết kế sơ đồ ghế</h4>
                      </div>
                      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-2 rounded-xl">
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                          {typeForm.seatDiagram.selectedSeats.length} ghế đã chọn
                        </span>
                      </div>
                    </div>
                    
                    {Array.from({ length: typeForm.numberOfFloors }, (_, floorIdx) => floorIdx + 1).map(floor => (
                      <div key={floor} className="mb-8 last:mb-0">
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-2xl p-6 border-2 border-dashed border-blue-200 dark:border-blue-800">
                          {/* Floor Header */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                </svg>
                              </div>
                              <div>
                                <h5 className="text-xl font-bold text-gray-800 dark:text-gray-200">Tầng {floor}</h5>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {typeForm.seatDiagram.selectedSeats.filter(s => s.floorIndex === floor).length} / {typeForm.seatDiagram.row * typeForm.seatDiagram.column} ghế
                                </p>
                              </div>
                            </div>
                            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl px-4 py-2 border border-white/20">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {Math.round((typeForm.seatDiagram.selectedSeats.filter(s => s.floorIndex === floor).length / (typeForm.seatDiagram.row * typeForm.seatDiagram.column)) * 100)}% sử dụng
                              </span>
                            </div>
                          </div>
                          
                          {/* Seat Grid */}
                          <div className="bg-white/40 dark:bg-gray-900/40 rounded-xl p-4 backdrop-blur-sm">
                            {/* Column Headers */}
                            <div className="flex mb-2">
                              <div className="w-10"></div>
                              {Array.from({ length: typeForm.seatDiagram.column }, (_, c) => (
                                <div key={c} className="w-12 h-8 flex items-center justify-center">
                                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md">
                                    {c + 1}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            {/* Seat Rows */}
                            {Array.from({ length: typeForm.seatDiagram.row }, (_, r) => (
                              <div key={r} className="flex items-center mb-2 last:mb-0">
                                {/* Row Label */}
                                <div className="w-10 h-12 flex items-center justify-center">
                                  <span className="text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md">
                                    {String.fromCharCode(65 + r)}
                                  </span>
                                </div>
                                
                                {/* Seat Buttons */}
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
                                      className={`mx-1 w-10 h-10 text-xs font-bold rounded-lg border-2 transition-all duration-300 transform hover:scale-110 hover:shadow-lg ${
                                        selected 
                                          ? 'bg-gradient-to-br from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white border-green-500 shadow-green-200 shadow-md' 
                                          : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 shadow-sm hover:shadow-md'
                                      }`}
                                      title={`Tầng ${floor} - Ghế ${seatNumber} ${selected ? '(Đã chọn)' : '(Có thể chọn)'}`}
                                    >
                                      {selected ? (
                                        <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                        </svg>
                                      ) : (
                                        seatNumber
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            ))}
                          </div>
                          
                          {/* Floor Legend */}
                          <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-6">
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 bg-gradient-to-br from-green-400 to-green-600 rounded-md"></div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Ghế đã chọn</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="w-4 h-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-md border border-gray-300 dark:border-gray-600"></div>
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Vị trí trống</span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-lg">
                                <span className="font-medium">{typeForm.seatDiagram.row * typeForm.seatDiagram.column}</span> vị trí khả dụng
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Overall Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl p-6 border border-blue-200 dark:border-blue-800 mt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                          </div>
                          <div>
                            <h5 className="font-bold text-blue-800 dark:text-blue-200 text-lg">Tổng kết thiết kế</h5>
                            <p className="text-sm text-blue-600 dark:text-blue-300">Xem lại cấu hình sơ đồ ghế</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                            {typeForm.seatDiagram.selectedSeats.length}
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-300">
                            / {typeForm.numberOfFloors * typeForm.seatDiagram.row * typeForm.seatDiagram.column} ghế
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Help Text */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start space-x-3">
                        <div className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                          </svg>
                        </div>
                        <div>
                          <h6 className="font-medium text-amber-800 dark:text-amber-200 mb-1">Hướng dẫn sử dụng</h6>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            🎯 Nhấp vào các ô để chọn/bỏ chọn vị trí ghế • 
                            📊 Hàng được đánh dấu A-Z, cột được đánh số 1-n • 
                            ✨ Ghế màu xanh là đã chọn, màu xám là vị trí trống
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      type="button" 
                      onClick={closeTypeModal} 
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit" 
                      className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                      Tạo loại xe
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Manager Bus Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/90 backdrop-blur-sm transition-opacity" onClick={closeForm}></div>
            
            {/* Modal Content */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        {editingBus ? 'Cập nhật thông tin xe' : 'Thêm xe mới vào hệ thống'}
                      </h3>
                      <p className="text-green-100 text-sm mt-1">
                        {editingBus ? 'Chỉnh sửa thông tin chi tiết của xe' : 'Nhập thông tin chi tiết để thêm xe mới'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={closeForm} 
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Toast Notification */}
              {toast && (
                <div className={`mx-8 mt-6 p-4 rounded-xl flex items-center space-x-3 ${
                  toast.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200' 
                    : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {toast.type === 'success' ? (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">{toast.message}</span>
                </div>
              )}

              {/* Form Content */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Vehicle Information Section */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin xe</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span>Tên xe</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500"
                          placeholder="VD: Xe Limousine cao cấp"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span>Biển số xe</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.numberPlate}
                          onChange={(e) => setFormData({ ...formData, numberPlate: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500"
                          placeholder="VD: 29A-12345"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span>Thương hiệu xe</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.brand}
                          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500"
                          placeholder="VD: Mercedes, Hyundai, Isuzu..."
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                          <span>Loại xe</span>
                          <span className="text-red-500 ml-1">*</span>
                        </label>
                        <select
                          value={formData.typeBusId}
                          onChange={(e) => setFormData({ ...formData, typeBusId: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white"
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
                    </div>
                  </div>

                  {/* Amenities Section */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-6">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Tiện ích & Dịch vụ</h4>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">
                        <span>Tiện ích có sẵn</span>
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <textarea
                        value={formData.amentity}
                        onChange={(e) => setFormData({ ...formData, amentity: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 dark:text-white placeholder-gray-500 resize-none"
                        placeholder="VD: WiFi miễn phí, Điều hòa 2 chiều, TV LCD, Ghế massage, Ổ cắm điện, Nước suối..."
                        required
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        💡 Mô tả các tiện ích và dịch vụ có sẵn trên xe để hành khách biết
                      </p>
                    </div>
                  </div>

                  {/* Company Information */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin công ty</h4>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {selectedCompany?.name || companies[0]?.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: #{formData.companyId}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button 
                      type="button" 
                      onClick={closeForm} 
                      className="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                    >
                      Hủy bỏ
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting} 
                      className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {submitting ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
                          <span>Đang xử lý...</span>
                        </div>
                      ) : (
                        editingBus ? 'Cập nhật xe' : 'Thêm xe mới'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Bus Detail Modal */}
      {isDetailModalOpen && selectedBusDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/90 backdrop-blur-sm transition-opacity" onClick={closeBusDetail}></div>
            
            {/* Modal Content */}
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">Chi tiết xe</h3>
                      <p className="text-indigo-100 text-sm mt-1">Thông tin chi tiết về xe bus</p>
                    </div>
                  </div>
                  <button 
                    onClick={closeBusDetail} 
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm transition-all duration-200 hover:scale-105"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Basic Information */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin cơ bản</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800/50">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ID xe:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedBusDetail.busId}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800/50">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Tên xe:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedBusDetail.name}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800/50">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Biển số:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedBusDetail.numberPlate}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-blue-200 dark:border-blue-800/50">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Thương hiệu:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedBusDetail.brand}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Công ty:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedBusDetail.companyName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2 mb-6">
                        <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Chi tiết kỹ thuật</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-800/50">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Loại xe ID:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedBusDetail.typeBusId}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-green-200 dark:border-green-800/50">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Năm sản xuất:</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {selectedBusDetail.modelYear ? new Date(selectedBusDetail.modelYear).getFullYear() : 'Không xác định'}
                          </span>
                        </div>
                        <div className="py-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-2">Tiện ích:</span>
                          <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                            <span className="text-sm text-gray-900 dark:text-white">{selectedBusDetail.amentity || 'Không có thông tin tiện ích'}</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Trạng thái:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            selectedBusDetail.isDeleted 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                              : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          }`}>
                            {selectedBusDetail.isDeleted ? 'Đã xóa' : 'Hoạt động'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    onClick={closeBusDetail} 
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyBusManagement; 