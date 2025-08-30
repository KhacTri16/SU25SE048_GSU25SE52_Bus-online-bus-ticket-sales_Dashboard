import React, { useState, useEffect } from 'react';
import { customerService } from '../../services/api';
import { Customer, CustomerWithTickets, CustomerDetail } from '../../types/company';
import { useAuth } from '../../context/AuthContext';
import RoleAccessNotice from '../../components/common/RoleAccessNotice';

const CustomerList: React.FC = () => {
  const { isCompanyRestricted, getUserCompanyId } = useAuth();
  const [customers, setCustomers] = useState<(Customer & { numericId?: number })[]>([]);
  const [companyCustomers, setCompanyCustomers] = useState<CustomerWithTickets[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Modal states for customer detail
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<CustomerDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching customers...');
      
      // Check if user is company-restricted (not admin)
      if (isCompanyRestricted()) {
        const userCompanyId = getUserCompanyId();
        if (userCompanyId) {
          console.log(`Fetching customers for company ${userCompanyId}...`);
          const response = await customerService.getCustomersByCompany(userCompanyId);
          console.log('Company customers response:', response);
          
          // Convert CustomerWithTickets to Customer format for display, but preserve the numeric ID
          const convertedCustomers: (Customer & { numericId?: number })[] = response.map(customer => ({
            customerId: customer.customerId,
            customerName: customer.fullName,
            customerEmail: customer.gmail,
            customerPhone: customer.phone,
            ticketId: customer.numberOfTickets > 0 ? `${customer.numberOfTickets} vé` : null,
            ticketStatus: customer.numberOfTickets > 0 ? 4 : null, // Assume paid if has tickets
            numericId: customer.id // Preserve the numeric ID for API calls
          }));
          
          setCompanyCustomers(response);
          setCustomers(convertedCustomers);
        } else {
          throw new Error('Không tìm thấy thông tin công ty của người dùng');
        }
      } else {
        // Admin can see all customers
        console.log('Fetching all customers (admin)...');
        const response = await customerService.getAllCustomers();
        console.log('Admin customers response:', response);
        console.log('First admin customer structure:', response[0]);
        
        // Check if admin response has id fields
        if (response.length > 0 && response[0]) {
          console.log('Admin customer has id field?', 'id' in response[0], 'typeof id:', typeof response[0].id);
          console.log('Admin customer customerId:', `"${response[0].customerId}"`);
        }
        
        setCustomers(response || []);
        setCompanyCustomers([]);
      }
    } catch (err: any) {
      console.error('Error details:', err);
      let errorMessage = 'Không thể tải danh sách khách hàng. ';
      
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

  const filteredCustomers = customers.filter(customer =>
    customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.customerPhone && customer.customerPhone.includes(searchTerm))
  );

  // Handle viewing customer detail
  const handleViewCustomer = async (customer: (Customer & { numericId?: number }) | CustomerWithTickets) => {
    try {
      setLoadingDetail(true);
      console.log('Customer data passed to handleViewCustomer:', customer);
      
      // Priority 1: Use numeric id field if available (from both admin and company APIs)
      if (customer.id && typeof customer.id === 'number' && customer.id > 0) {
        console.log('Using numeric ID field:', customer.id);
        const customerDetail = await customerService.getCustomerById(customer.id);
        setSelectedCustomerDetail(customerDetail);
        setIsDetailModalOpen(true);
      }
      // Priority 2: Use preserved numericId field (from converted company data)
      else if ('numericId' in customer && customer.numericId && customer.numericId > 0) {
        console.log('Using numericId field:', customer.numericId);
        const customerDetail = await customerService.getCustomerById(customer.numericId);
        setSelectedCustomerDetail(customerDetail);
        setIsDetailModalOpen(true);
      }
      // Priority 3: For admin customers without numeric ID, create mock detail from available data
      else if ('customerName' in customer && customer.customerName) {
        console.log('Admin customer without numeric ID - using available data');
        const mockDetail: CustomerDetail = {
          customerId: customer.customerId?.trim() || 'N/A',
          fullName: customer.customerName || 'N/A',
          gmail: customer.customerEmail || 'N/A',
          phone: customer.customerPhone || 'N/A'
        };
        setSelectedCustomerDetail(mockDetail);
        setIsDetailModalOpen(true);
      }
      else {
        console.error('No valid customer data found:', customer);
        setError('Không thể hiển thị thông tin chi tiết khách hàng');
      }
    } catch (error) {
      console.error('Error fetching customer detail:', error);
      setError('Failed to load customer detail');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Close detail modal
  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedCustomerDetail(null);
  };

  const getStatusBadge = (ticketStatus: number | null) => {
    if (ticketStatus === null) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
          Chưa có vé
        </span>
      );
    }
    
    switch (ticketStatus) {
      case 0:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
            Đã đặt
          </span>
        );
      case 4:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Đã thanh toán
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
            Trạng thái: {ticketStatus}
          </span>
        );
    }
  };

  // Tính toán thống kê
  const getStatistics = () => {
    if (isCompanyRestricted()) {
      // For company-specific view
      const totalCustomers = companyCustomers.length;
      const totalTickets = companyCustomers.reduce((sum, customer) => sum + customer.numberOfTickets, 0);
      const customersWithTickets = companyCustomers.filter(customer => customer.numberOfTickets > 0).length;

      return { 
        totalCustomers, 
        customersWithTickets, 
        customersWithPaidTickets: customersWithTickets, // Assume all tickets are paid
        totalTickets 
      };
    } else {
      // For admin view (original logic)
      const totalCustomers = customers.length;
      const customersWithTickets = customers.filter(customer => customer.ticketId !== null).length;
      const customersWithPaidTickets = customers.filter(customer => customer.ticketStatus === 4).length;

      return { totalCustomers, customersWithTickets, customersWithPaidTickets, totalTickets: 0 };
    }
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
              {isCompanyRestricted() ? (
                <>
                  <p>Endpoint: https://bobts-server-e7dxfwh7e5g9e3ad.malaysiawest-01.azurewebsites.net/api/Customers/company/{getUserCompanyId()}/with-tickets</p>
                  <p>Role: Company-restricted user (Manager/Staff/Driver/Seller)</p>
                </>
              ) : (
                <>
                  <p>Endpoint: https://bobts-server-e7dxfwh7e5g9e3ad.malaysiawest-01.azurewebsites.net/api/Customers/GetAllCustomers</p>
                  <p>Parameters: All=true</p>
                  <p>Role: Admin (can see all customers)</p>
                </>
              )}
            </div>
          </details>
          <button 
            onClick={fetchCustomers}
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
                {isCompanyRestricted() ? 'Khách hàng công ty' : 'Tổng khách hàng'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCustomers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900/20">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {isCompanyRestricted() ? 'Khách có vé' : 'Có vé'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.customersWithTickets}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full dark:bg-green-900/20">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {isCompanyRestricted() ? 'Tổng số vé' : 'Đã thanh toán'}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {isCompanyRestricted() ? stats.totalTickets : stats.customersWithPaidTickets}
              </p>
            </div>
            <div className="p-3 bg-pink-100 rounded-full dark:bg-pink-900/20">
              <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isCompanyRestricted() ? 'Khách hàng công ty' : 'Danh sách tất cả khách hàng'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {isCompanyRestricted() ? (
                <>
                  Tổng số: {customers.length} khách hàng • Tổng vé đã bán: {stats.totalTickets}
                </>
              ) : (
                <>
                  Tổng số: {customers.length} khách hàng (toàn hệ thống)
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2">
           
          </div>
        </div>

        {/* Search Box */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
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
                  Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  {isCompanyRestricted() ? 'Số vé đã mua' : 'Vé xe'}
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
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'Không tìm thấy khách hàng nào phù hợp' : 'Chưa có khách hàng nào'}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={`customer-${customer.id || index}-${customer.customerEmail?.replace(/\s+/g, '') || customer.customerId?.replace(/\s+/g, '') || index}`} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12">
                          <div className="h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center dark:bg-pink-900/20">
                            <span className="text-pink-600 dark:text-pink-400 font-semibold text-lg">
                              {customer.customerName?.charAt(0) || 'C'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.customerName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            ID: {customer.customerId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{customer.customerEmail}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.customerPhone || 'Chưa có số điện thoại'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {isCompanyRestricted() ? (
                          // Show number of tickets for company users
                          companyCustomers.find(c => c.customerId === customer.customerId)?.numberOfTickets || 0
                        ) : (
                          // Show ticket ID for admin
                          customer.ticketId || 'Chưa có vé'
                        )}
                        {isCompanyRestricted() && ' vé'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(customer.ticketStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        onClick={() => handleViewCustomer(customer)}
                        disabled={loadingDetail}
                      >
                        {loadingDetail ? 'Đang tải...' : 'Xem'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu khách hàng</p>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      {isDetailModalOpen && selectedCustomerDetail && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-md p-6 -m-5 mb-5">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">
                  Chi tiết khách hàng
                </h3>
                <button
                  onClick={closeDetailModal}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Họ và tên
                  </label>
                  <p className="text-gray-900 dark:text-white font-semibold">
                    {selectedCustomerDetail.fullName}
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedCustomerDetail.gmail}
                  </p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Số điện thoại
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {selectedCustomerDetail.phone}
                  </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Mã khách hàng
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    #{selectedCustomerDetail.customerId}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={closeDetailModal}
                className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors duration-200"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
