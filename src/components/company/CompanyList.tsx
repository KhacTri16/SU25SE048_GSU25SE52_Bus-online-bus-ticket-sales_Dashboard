import { useState, useEffect } from 'react';
import { Company, CreateCompanyRequest, ChargeRate } from '../../types/company';
import { companyService, chargeRateService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/modal';

export default function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<{totalCount: number, totalPage: number} | null>(null);
  const { getUserCompanyId, isCompanyRestricted, isAdmin } = useAuth();
  const [settlingCompany, setSettlingCompany] = useState<number | null>(null);
  const [periodByCompany, setPeriodByCompany] = useState<Record<number, string>>({});
  const [settlementResult, setSettlementResult] = useState<{
    type: 'success' | 'error';
    company: Company;
    period: string;
    data?: any;
    error?: string;
  } | null>(null);
  // Track periods already settled per company (key format YYYY-MM)
  const [settledPeriods, setSettledPeriods] = useState<Record<number, Set<string>>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateCompanyRequest>({
    companyId: '',
    name: '',
    phone: '',
    address: '',
    website: '',
    status: 0,
    taxNumber: '',
    description: '',
    maxPercent: 0,
    minPercent: 0,
    chargeRateId: 0,
    logo: null,
  });

  // Charge rate states
  const [chargeRates, setChargeRates] = useState<ChargeRate[]>([]);
  const [loadingChargeRates, setLoadingChargeRates] = useState<boolean>(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching companies...');
        
        // Thử gọi API
        const response = await companyService.getAllCompanies(1, 50);
        console.log('Companies response:', response);
        
        let companiesData = response.data || [];
        
        // Apply RBAC filtering for manager and staff
        if (isCompanyRestricted()) {
          const userCompanyId = getUserCompanyId();
          if (userCompanyId) {
            companiesData = companiesData.filter(company => company.id === userCompanyId);
            console.log(`Filtered companies for user companyId ${userCompanyId}:`, companiesData);
            
            if (companiesData.length === 0) {
              try {
                console.log(`No companies found after filtering, fetching specific company with ID ${userCompanyId}`);
                const specificCompanyResponse = await companyService.getCompanyById(userCompanyId);
                if (specificCompanyResponse) {
                  companiesData = [specificCompanyResponse];
                  console.log('Fetched specific company:', specificCompanyResponse);
                }
              } catch (specificErr) {
                console.error('Error fetching specific company:', specificErr);
              }
            }
          }
        }
        
        setCompanies(companiesData);
        setApiInfo({
          totalCount: response.totalCount,
          totalPage: response.totalPage
        });
      } catch (err: any) {
        console.error('Error details:', err);
        let errorMessage = 'Không thể tải danh sách công ty. ';
        
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

    fetchCompanies();
  }, [isCompanyRestricted, getUserCompanyId]);

  // Fetch charge rates when create modal opens
  useEffect(() => {
    const fetchChargeRates = async () => {
      if (isCreateOpen && isAdmin()) {
        try {
          setLoadingChargeRates(true);
          const response = await chargeRateService.getAllChargeRates(1, 100);
          setChargeRates(response.data || []);
        } catch (error) {
          console.error('Error fetching charge rates:', error);
          setChargeRates([]);
        } finally {
          setLoadingChargeRates(false);
        }
      }
    };

    fetchChargeRates();
  }, [isCreateOpen, isAdmin]);

  const getStatusBadge = (status: number) => {
    return status === 1 ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
        Hoạt động
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
        Không hoạt động
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Tính toán thống kê
  const getStatistics = () => {
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(company => company.status === 1).length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const newThisMonth = companies.filter(company => {
      const createDate = new Date(company.createAt);
      return createDate.getMonth() === currentMonth && createDate.getFullYear() === currentYear;
    }).length;

    return { totalCompanies, activeCompanies, newThisMonth };
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
              <p>Endpoint: https://bobts-server-e7dxfwh7e5g9e3ad.malaysiawest-01.azurewebsites.net/api/Company/GetAllCompanyy</p>
              <p>Parameters: Page=1, Amount=50, All=true</p>
            </div>
          </details>
          <button 
            onClick={() => window.location.reload()}
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
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {isCompanyRestricted() ? "Công ty của bạn" : "Tổng công ty"}
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
                {isCompanyRestricted() ? "Trạng thái hoạt động" : "Đang hoạt động"}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeCompanies}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {isCompanyRestricted() ? "Thông tin công ty" : "Mới tháng này"}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.newThisMonth}</p>
            </div>
            <div className="p-3 bg-pink-100 rounded-full dark:bg-pink-900/20">
              <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Company List */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isCompanyRestricted() ? "Thông tin công ty của bạn" : "Danh sách công ty vận tải"}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isCompanyRestricted() 
                ? `Hiển thị thông tin công ty của bạn` 
                : (apiInfo ? `Tổng số: ${apiInfo.totalCount} công ty (${apiInfo.totalPage} trang)` : `Tổng số: ${companies.length} công ty`)
              }
            </p>
          </div>
          <div className="flex gap-2">
            {isAdmin() && (
              <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm font-medium">
                Thêm công ty mới
              </button>
            )}
            
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Công ty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Địa chỉ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Tỷ lệ phần trăm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Ngày tạo
                </th>
                {isAdmin() && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Quyết toán</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-800">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        {company.logo ? (
                          <img
                            className="h-12 w-12 rounded-lg object-cover"
                            src={company.logo}
                            alt={company.name}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center ${company.logo ? 'hidden' : ''}`}>
                          <span className="text-pink-600 font-semibold text-lg">
                            {company.name?.charAt(0) || 'C'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {company.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: {company.companyId}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {company.phone}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {company.website}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {company.address}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      Min: {company.minPercent}%
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Max: {company.maxPercent}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(company.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(company.createAt)}
                  </td>
                  {isAdmin() && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <input
                          type="month"
                          className="border border-gray-200 rounded-lg px-2 py-1 text-sm dark:border-gray-800 dark:bg-gray-900 dark:text-white"
                          value={periodByCompany[company.id] || ''}
                          onChange={(e) => setPeriodByCompany(prev => ({ ...prev, [company.id]: e.target.value }))}
                        />
                        <button
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium disabled:opacity-50"
                          disabled={
                            settlingCompany === company.id ||
                            !periodByCompany[company.id] ||
                            (periodByCompany[company.id]
                              ? (settledPeriods[company.id]?.has(periodByCompany[company.id]!) ?? false)
                              : false)
                          }
                          onClick={async () => {
                            const period = periodByCompany[company.id];
                            if (!period) {
                              setSettlementResult({
                                type: 'error',
                                company,
                                period: '',
                                error: 'Vui lòng chọn kỳ quyết toán (YYYY-MM)'
                              });
                              return;
                            }
                            // Ensure only one settlement per company per month
                            try {
                              // If we don't have cached periods for this company, fetch them
                              if (!settledPeriods[company.id]) {
                                const existing = await companyService.getCompanySettlements(company.id);
                                const periodSet = new Set<string>();
                                existing.forEach(s => {
                                  if (s.period) {
                                    const key = s.period.slice(0,7); // YYYY-MM
                                    periodSet.add(key);
                                  }
                                });
                                setSettledPeriods(prev => ({ ...prev, [company.id]: periodSet }));
                              }
                              // After potential fetch, check again
                              const already = (settledPeriods[company.id]?.has(period)) || false;
                              if (already) {
                                setSettlementResult({
                                  type: 'error',
                                  company,
                                  period,
                                  error: 'Kỳ quyết toán này đã được tạo trước đó. Mỗi tháng chỉ tạo 1 lần.'
                                });
                                return;
                              }
                            } catch (prefetchErr:any) {
                              console.warn('Không thể tải danh sách quyết toán trước khi tạo, tiếp tục:', prefetchErr);
                            }
                            try {
                              setSettlingCompany(company.id);
                              const result = await companyService.createSettlement(company.id, period);
                              
                              setSettlementResult({
                                type: 'success',
                                company,
                                period,
                                data: result
                              });
                              // Mark period as settled
                              setSettledPeriods(prev => {
                                const copy = { ...prev };
                                const set = new Set(copy[company.id] || []);
                                set.add(period);
                                copy[company.id] = set;
                                return copy;
                              });
                            } catch (err: any) {
                              setSettlementResult({
                                type: 'error',
                                company,
                                period,
                                error: err?.response?.data?.message || err.message
                              });
                            } finally {
                              setSettlingCompany(null);
                            }
                          }}
                        >
                          {settlingCompany === company.id
                            ? 'Đang tạo...'
                            : (periodByCompany[company.id] && (settledPeriods[company.id]?.has(periodByCompany[company.id]!) ?? false)
                                ? 'Đã quyết toán'
                                : 'Tạo quyết toán')}
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {companies.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu công ty</p>
          </div>
        )}
      </div>

      {isAdmin() && (
        <Modal isOpen={isCreateOpen} onClose={() => !creating && setIsCreateOpen(false)} className="max-w-2xl max-h-[90vh] p-0 overflow-hidden">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Tạo công ty mới</h3>
                    <p className="text-blue-100 text-sm">Thêm công ty vận tải vào hệ thống</p>
                  </div>
                </div>
                <button
                  onClick={() => !creating && setIsCreateOpen(false)}
                  className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="max-h-[calc(90vh-120px)] overflow-y-auto">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    setCreating(true);
                    await companyService.createCompany(form);
                    // refresh list
                    setIsCreateOpen(false);
                    setForm({ companyId: '', name: '', phone: '', address: '', website: '', status: 0, taxNumber: '', description: '', maxPercent: 0, minPercent: 0, chargeRateId: 0, logo: null });
                    // reload companies by calling existing effect logic
                    setLoading(true);
                    const response = await companyService.getAllCompanies(1, 50);
                    let companiesData = response.data || [];
                    if (isCompanyRestricted()) {
                      const userCompanyId = getUserCompanyId();
                      if (userCompanyId) {
                        companiesData = companiesData.filter(company => company.id === userCompanyId);
                        if (companiesData.length === 0) {
                          try {
                            const specificCompanyResponse = await companyService.getCompanyById(userCompanyId);
                            if (specificCompanyResponse) {
                              companiesData = [specificCompanyResponse];
                            }
                          } catch {}
                        }
                      }
                    }
                    setCompanies(companiesData);
                    setApiInfo({ totalCount: response.totalCount, totalPage: response.totalPage });
                  } catch (err) {
                    console.error('Create company failed:', err);
                    alert('Tạo công ty thất bại. Vui lòng kiểm tra dữ liệu và thử lại.');
                  } finally {
                    setCreating(false);
                    setLoading(false);
                  }
                }}
                className="p-6 space-y-4"
              >
                {/* Basic Information Section */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">Thông tin cơ bản</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mã công ty <span className="text-red-500">*</span>
                      </label>
                      <input 
                        value={form.companyId} 
                        onChange={(e) => setForm({ ...form, companyId: e.target.value })} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" 
                        placeholder="VD: ABC123" 
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tên công ty <span className="text-red-500">*</span>
                      </label>
                      <input 
                        value={form.name} 
                        onChange={(e) => setForm({ ...form, name: e.target.value })} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" 
                        placeholder="Tên công ty vận tải" 
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Số điện thoại
                      </label>
                      <input 
                        value={form.phone} 
                        onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" 
                        placeholder="0123456789" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Website
                      </label>
                      <input 
                        value={form.website} 
                        onChange={(e) => setForm({ ...form, website: e.target.value })} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" 
                        placeholder="https://example.com" 
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Địa chỉ
                      </label>
                      <input 
                        value={form.address} 
                        onChange={(e) => setForm({ ...form, address: e.target.value })} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" 
                        placeholder="Địa chỉ trụ sở chính" 
                      />
                    </div>
                  </div>
                </div>

                {/* Business Information Section */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-green-100 dark:bg-green-900/30 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">Thông tin kinh doanh</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mã số thuế
                      </label>
                      <input 
                        value={form.taxNumber} 
                        onChange={(e) => setForm({ ...form, taxNumber: e.target.value })} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" 
                        placeholder="Mã số thuế công ty" 
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Trạng thái
                      </label>
                      <select 
                        value={form.status ?? 0} 
                        onChange={(e) => setForm({ ...form, status: parseInt(e.target.value) })} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                      >
                        <option value={0}>Không hoạt động</option>
                        <option value={1}>Hoạt động</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tỷ lệ tối thiểu (%)
                      </label>
                      <input 
                        type="number" 
                        value={form.minPercent ?? 0} 
                        onChange={(e) => setForm({ ...form, minPercent: parseInt(e.target.value || '0') })} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" 
                        min="0"
                        max="100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tỷ lệ tối đa (%)
                      </label>
                      <input 
                        type="number" 
                        value={form.maxPercent ?? 0} 
                        onChange={(e) => setForm({ ...form, maxPercent: parseInt(e.target.value || '0') })} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" 
                        min="0"
                        max="100"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tỷ lệ phí hệ thống
                      </label>
                      <select 
                        value={form.chargeRateId ?? 0} 
                        onChange={(e) => setForm({ ...form, chargeRateId: parseInt(e.target.value || '0') })} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm"
                        disabled={loadingChargeRates}
                      >
                        <option value={0}>Chọn tỷ lệ phí</option>
                        {chargeRates.map((rate) => (
                          <option key={rate.id} value={rate.id}>
                            {rate.name} - {rate.rate}% (Hết hạn: {new Date(rate.endDate).toLocaleDateString('vi-VN')})
                          </option>
                        ))}
                      </select>
                      {loadingChargeRates && (
                        <div className="flex items-center mt-1 text-xs text-gray-500">
                          <div className="w-3 h-3 border border-gray-300 border-t-blue-600 rounded-full animate-spin mr-1"></div>
                          Đang tải tỷ lệ phí...
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Information Section */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">Thông tin bổ sung</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Mô tả
                      </label>
                      <textarea 
                        value={form.description} 
                        onChange={(e) => setForm({ ...form, description: e.target.value })} 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-sm" 
                        rows={3}
                        placeholder="Mô tả về công ty, dịch vụ, đặc điểm..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Logo công ty
                      </label>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center hover:border-blue-400 dark:hover:border-blue-400 transition-colors">
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={(e) => setForm({ ...form, logo: e.target.files && e.target.files[0] ? e.target.files[0] : null })} 
                          className="hidden" 
                          id="logo-upload"
                        />
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {form.logo ? form.logo.name : 'Tải lên logo công ty'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                PNG, JPG, GIF tối đa 10MB
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    type="button" 
                    disabled={creating} 
                    onClick={() => setIsCreateOpen(false)} 
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-sm"
                  >
                    Hủy
                  </button>
                  <button 
                    type="submit" 
                    disabled={creating} 
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center gap-2 disabled:opacity-50 text-sm"
                  >
                    {creating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Đang tạo...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Tạo công ty
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </Modal>
      )}

      {/* Settlement Result Popup */}
      {settlementResult && (
        <Modal 
          isOpen={true} 
          onClose={() => setSettlementResult(null)} 
          className="max-w-lg p-0 overflow-hidden"
        >
          {settlementResult.type === 'success' ? (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
              {/* Header */}
              <div className="px-6 py-4 bg-green-500 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Quyết toán thành công!</h3>
                    <p className="text-green-100 text-sm">{settlementResult.company.name}</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-4">
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    📊 Chi tiết quyết toán kỳ {settlementResult.period}
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tổng giao dịch:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {settlementResult.data.totalPayments.toLocaleString('vi-VN')} giao dịch
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Doanh thu gộp:</span>
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {settlementResult.data.grossAmount.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phí hệ thống:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">
                        -{settlementResult.data.chargeAmount.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                      <span className="font-medium text-gray-900 dark:text-white">Doanh thu ròng:</span>
                      <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                        {settlementResult.data.netAmount.toLocaleString('vi-VN')} VND
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="font-medium text-blue-900 dark:text-blue-100">Báo cáo Excel</span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                    Báo cáo chi tiết đã được tạo và sẵn sàng tải xuống
                  </p>
                  <button
                    onClick={() => {
                      window.open(settlementResult.data.excelReportUrl, '_blank');
                      setSettlementResult(null);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    📥 Tải xuống báo cáo Excel
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
                <button
                  onClick={() => setSettlementResult(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
              {/* Error Header */}
              <div className="px-6 py-4 bg-red-500 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Tạo quyết toán thất bại</h3>
                    <p className="text-red-100 text-sm">{settlementResult.company.name}</p>
                  </div>
                </div>
              </div>

              {/* Error Content */}
              <div className="px-6 py-6 space-y-4">
                <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    🔍 Chi tiết lỗi
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 p-3 rounded">
                    {settlementResult.error}
                  </p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    💡 Gợi ý khắc phục
                  </h4>
                  <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                    <li>• Kiểm tra lại kỳ quyết toán đã chọn ({settlementResult.period})</li>
                    <li>• Đảm bảo có dữ liệu giao dịch trong kỳ này</li>
                    <li>• Thử lại sau ít phút</li>
                    <li>• Liên hệ bộ phận kỹ thuật nếu lỗi vẫn tiếp tục</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-2">
                <button
                  onClick={() => setSettlementResult(null)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setSettlementResult(null);
                    // Optionally trigger the settlement again
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg"
                >
                  Thử lại
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
