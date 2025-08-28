import { useEffect, useState } from 'react';
import { Ticket } from '../../types/company';
import { ticketService, companyService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PageMeta from '../../components/common/PageMeta';
import { Modal } from '../../components/ui/modal';

export default function TicketList() {
  const { isAdmin, isCompanyRestricted, getUserCompanyId, isSeller, isStaff } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [ticketToCancel, setTicketToCancel] = useState<Ticket | null>(null);
  const [canceling, setCanceling] = useState<boolean>(false);
  // const [userCompanyName, setUserCompanyName] = useState<string>('');

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await ticketService.getAllTickets();

        // RBAC filtering: Admin sees all; restricted users see only their company
        let finalTickets = data;
        if (!isAdmin() && isCompanyRestricted()) {
          const companyId = getUserCompanyId();
          if (companyId) {
            try {
              const company = await companyService.getCompanyById(companyId);
              finalTickets = data.filter(t => t.companyName === company.name);
            } catch (e) {
              // fallback: show none if cannot resolve company name
              finalTickets = [];
            }
          } else {
            finalTickets = [];
          }
        }

        setTickets(finalTickets);
      } catch (e: any) {
        setError(e?.message || 'Không thể tải danh sách vé');
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [isAdmin, isCompanyRestricted, getUserCompanyId]);

  // Filter tickets based on search and status
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch = 
      ticket.ticketId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ticket.status.toString() === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: number) => {
    const statusConfig = {
      0: { label: 'Đã thanh toán', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
      1: { label: 'Đã điểm danh', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400' },
      2: { label: 'Đã Hoàn tiền', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' },
      3: { label: 'Chờ thanh toán', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' },
      4: { label: 'Thất bại', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
      5: { label: 'Hoàn thành', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig[0];
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTicketStats = () => {
    const total = filteredTickets.length;
    const confirmed = filteredTickets.filter(t => t.status === 1).length;
    const completed = filteredTickets.filter(t => t.status === 3).length;
    const cancelled = filteredTickets.filter(t => t.status === 4).length;
    // Revenue should include only paid or finished tickets (0: Đã thanh toán, 5: Hoàn thành)
    const totalRevenue = filteredTickets.reduce((sum, t) => (t.status === 0 || t.status === 5) ? sum + t.price : sum, 0);

    return { total, confirmed, completed, cancelled, totalRevenue };
  };

  const stats = getTicketStats();

  const handleCancelTicket = async () => {
    if (!ticketToCancel) return;
    // Only allow cancel if status is 0 (Đã thanh toán)
    if (ticketToCancel.status !== 0) {
      alert('Chỉ có thể hủy vé ở trạng thái "Đã thanh toán".');
      return;
    }
    
    setCanceling(true);
    try {
      await ticketService.cancelTicket(ticketToCancel.id);
      
      // Refresh tickets list
      const data = await ticketService.getAllTickets();
      let finalTickets = data;
      if (!isAdmin() && isCompanyRestricted()) {
        const companyId = getUserCompanyId();
        if (companyId) {
          try {
            const company = await companyService.getCompanyById(companyId);
            finalTickets = data.filter(t => t.companyName === company.name);
          } catch (e) {
            finalTickets = [];
          }
        } else {
          finalTickets = [];
        }
      }
      setTickets(finalTickets);
      
      setShowCancelModal(false);
      setTicketToCancel(null);
    } catch (e) {
      alert('Hủy vé thất bại. Vui lòng thử lại.');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <>
        <PageMeta title="Quản lý vé" description="Quản lý và theo dõi vé xe khách" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải...</span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title="Quản lý vé" description="Quản lý và theo dõi vé xe khách" />
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title="Quản lý vé" description="Quản lý và theo dõi vé xe khách" />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý vé</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isAdmin() ? 'Tất cả vé trong hệ thống' : 'Vé thuộc công ty của bạn'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-full dark:bg-blue-900/20">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng vé</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-full dark:bg-green-900/20">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đã xác nhận</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-full dark:bg-purple-900/20">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Hoàn thành</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-full dark:bg-red-900/20">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đã hủy</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.cancelled}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center">
            <div className="p-3 bg-pink-100 rounded-full dark:bg-pink-900/20">
              <svg className="w-6 h-6 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Doanh thu</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Tìm theo mã vé, tên khách hàng, công ty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-pink-500 dark:focus:border-pink-500"
              />
            </div>
          </div>
          
          <div className="sm:w-48">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trạng thái
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:focus:ring-pink-500 dark:focus:border-pink-500"
            >
              <option value="all">Tất cả</option>
              <option value="0">Chờ xác nhận</option>
              <option value="1">Đã xác nhận</option>
              <option value="2">Đang di chuyển</option>
              <option value="3">Hoàn thành</option>
              <option value="4">Đã hủy</option>
              <option value="5">Hoàn tiền</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Danh sách vé ({filteredTickets.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Vé & Khách hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Hành trình
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Ghế & Giá
                </th>
                {isAdmin() && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Công ty
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-gray-800">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {ticket.ticketId}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {ticket.customerName}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDateTime(ticket.createDate)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <span className="truncate max-w-[100px]">{ticket.fromTripStation}</span>
                        <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        <span className="truncate max-w-[100px]">{ticket.toTripStation}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-white">
                        Đi: {formatDateTime(ticket.timeStart)}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        Đến: {formatDateTime(ticket.timeEnd)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-gray-900 dark:text-white font-medium">
                        Ghế {ticket.seatId}
                      </div>
                      <div className="text-pink-600 dark:text-pink-400 font-semibold">
                        {formatCurrency(ticket.price)}
                      </div>
                    </div>
                  </td>
                  {isAdmin() && (
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {ticket.companyName}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => window.open(ticket.qrCodeUrl, '_blank')}
                        className="text-pink-600 hover:text-pink-900 dark:text-pink-400 dark:hover:text-pink-300"
                        title="Xem QR Code"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {(isSeller() || isStaff()) && ticket.status === 0 && (
                        <button
                          onClick={() => {
                            setTicketToCancel(ticket);
                            setShowCancelModal(true);
                          }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          title="Hủy vé"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredTickets.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg">
                {searchTerm || statusFilter !== 'all' ? 'Không tìm thấy vé nào' : 'Chưa có vé nào'}
              </p>
              {(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="mt-2 text-pink-600 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Ticket Modal */}
      <Modal 
        isOpen={showCancelModal} 
        onClose={() => !canceling && setShowCancelModal(false)}
        className="max-w-md p-6"
      >
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20">
              <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Xác nhận hủy vé
          </h3>
          
          {ticketToCancel && (
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Bạn muốn hủy vé này?
              </p>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
                <div className="text-sm">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Mã vé:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{ticketToCancel.ticketId}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Khách hàng:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{ticketToCancel.customerName}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-500 dark:text-gray-400">Ghế:</span>
                    <span className="font-medium text-gray-900 dark:text-white">{ticketToCancel.seatId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Giá:</span>
                    <span className="font-medium text-pink-600 dark:text-pink-400">{formatCurrency(ticketToCancel.price)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3">
            <button
              type="button"
              disabled={canceling}
              onClick={() => {
                setShowCancelModal(false);
                setTicketToCancel(null);
              }}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              disabled={canceling}
              onClick={handleCancelTicket}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canceling ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Đang hủy...
                </div>
              ) : (
                'Xác nhận hủy'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}


