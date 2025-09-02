import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { paymentService, CompanyRevenueData, companyService, ticketService } from "../../services/api";
import { CompanySettlement, AdminRevenueSummary } from "../../types/company";

export default function RevenueReport() {
  const authContext = useAuth();
  const { getUserCompanyId, isAdmin } = authContext;
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(Array(12).fill(0));
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [companyName, setCompanyName] = useState<string>("");
  
  // Admin-specific states
  const [allCompaniesData, setAllCompaniesData] = useState<CompanyRevenueData[]>([]);
  const [systemTotalRevenue, setSystemTotalRevenue] = useState<number | null>(null);
  const [systemTotalRefunded, setSystemTotalRefunded] = useState<number | null>(null);
  const [systemFee, setSystemFee] = useState<number | null>(null);
  const [systemNetRevenue, setSystemNetRevenue] = useState<number | null>(null);
  const [systemCounterRevenue, setSystemCounterRevenue] = useState<number | null>(null);
  const [systemOnlineRevenue, setSystemOnlineRevenue] = useState<number | null>(null);
  const [currentMonthDetail, setCurrentMonthDetail] = useState<AdminRevenueSummary | null>(null);
  const [loadingDetailedData, setLoadingDetailedData] = useState<boolean>(false);
  const [settlements, setSettlements] = useState<CompanySettlement[] | null>(null);
  const [loadingSettlements, setLoadingSettlements] = useState<boolean>(false);
  
  // Company-specific states for non-admin users
  const [companyRevenueSummary, setCompanyRevenueSummary] = useState<AdminRevenueSummary | null>(null);

     const options = useMemo(() => ({
     chart: { type: "bar" as const, toolbar: { show: false } },
     colors: ["#6366f1"],
     plotOptions: { bar: { horizontal: false, columnWidth: "45%" } },
     dataLabels: { enabled: false },
     stroke: { show: true, width: 2, colors: ["transparent"] },
     xaxis: {
       categories: ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12"],
     },
     yaxis: {
       title: { text: isAdmin() ? "Tổng doanh thu hệ thống (VND)" : "Doanh thu (VND)" },
       labels: { formatter: (v: number) => new Intl.NumberFormat('vi-VN').format(v) },
     },
     fill: { opacity: 0.8 },
     tooltip: {
       y: { formatter: (val: number) => new Intl.NumberFormat('vi-VN').format(val) + " VND" },
     },
   }), [isAdmin]);

  useEffect(() => {
    const fetchRevenue = async () => {
      setIsLoading(true);
      try {
        if (isAdmin()) {
          console.log('Admin user detected, fetching total revenue...');
          try {
            const simpleRevenueData = await paymentService.getAllCompaniesRevenue();
            setSystemTotalRevenue(simpleRevenueData.totalRevenue);
            setSystemTotalRefunded(simpleRevenueData.totalRefunded);
            setSystemFee(simpleRevenueData.systemFee);
            setSystemNetRevenue(simpleRevenueData.netRevenue);
            setSystemCounterRevenue(simpleRevenueData.counterRevenue || 0);
            setSystemOnlineRevenue(simpleRevenueData.onlineRevenue || 0);
            console.log('Admin revenue summary:', {
              totalRevenue: simpleRevenueData.totalRevenue,
              totalRefunded: simpleRevenueData.totalRefunded,
              systemFee: simpleRevenueData.systemFee,
              netRevenue: simpleRevenueData.netRevenue,
              counterRevenue: simpleRevenueData.counterRevenue,
              onlineRevenue: simpleRevenueData.onlineRevenue
            });
          } catch (error) {
            console.error('Error fetching simple revenue:', error);
          }
          
          // Fetch monthly revenue for the entire system
          try {
            console.log('Fetching system monthly revenue...');
            const systemMonthlyData = await paymentService.getSystemMonthlyRevenue(year);
            setMonthlyRevenue(systemMonthlyData);
            console.log('System monthly revenue:', systemMonthlyData);
          } catch (error) {
            console.error('Error fetching system monthly revenue:', error);
            setMonthlyRevenue(Array(12).fill(0));
          }
          
          // Fetch detailed revenue for current month
          try {
            const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
            const currentYear = new Date().getFullYear();
            console.log('Fetching current month detailed revenue...');
            const currentMonthData = await paymentService.getSystemMonthlyRevenueDetail(currentYear, currentMonth);
            setCurrentMonthDetail(currentMonthData);
            console.log('Current month detailed revenue:', currentMonthData);
          } catch (error) {
            console.error('Error fetching current month detailed revenue:', error);
            setCurrentMonthDetail(null);
          }
          
          // Then try to get detailed breakdown for companies table
          try {
            setLoadingDetailedData(true);
            console.log('Fetching detailed companies breakdown...');
            const allRevenueData = await paymentService.getAllCompaniesRevenueDetailed();
            
            console.log('Detailed revenue data received:', {
              totalRevenue: allRevenueData.totalRevenue,
              companiesCount: allRevenueData.companiesRevenue.length,
              companiesWithRevenue: allRevenueData.companiesRevenue.filter(c => c.totalRevenue > 0).length
            });
            
            setAllCompaniesData(allRevenueData.companiesRevenue);
            
            // Update total revenue if detailed call returns a different value
            if (allRevenueData.totalRevenue > 0) {
              setSystemTotalRevenue(allRevenueData.totalRevenue);
            }
          } catch (error) {
            console.error('Error fetching detailed revenue breakdown:', error);
            // If detailed breakdown fails, at least show the total
            setAllCompaniesData([]);
          } finally {
            setLoadingDetailedData(false);
          }
                 } else {
           // Manager/Staff/Driver/Seller: Fetch only their company data
           const companyId = getUserCompanyId();
           console.log('Current user context:', {
             userId: authContext.user?.id,
             roleId: authContext.user?.roleId,
             companyId: authContext.user?.companyId,
             extractedCompanyId: companyId
           });
           
           if (!companyId) {
             console.warn('No company ID found for user');
             setTotalRevenue(0);
             setMonthlyRevenue(Array(12).fill(0));
             return;
           }
           
           console.log(`Fetching revenue for company ${companyId} (user role: ${authContext.user?.roleId})`);
           
           try {
             // Fetch company name for display
             try {
               const company = await companyService.getCompanyById(companyId);
               setCompanyName(company.name);
             } catch (nameErr) {
               console.warn('Could not fetch company name:', nameErr);
               setCompanyName("");
             }

             // Fetch detailed company revenue summary using new API
             try {
               console.log('Fetching company revenue summary...');
               const companyRevenueData = await paymentService.getCompanyRevenueSummary(companyId);
               setCompanyRevenueSummary(companyRevenueData);
               setTotalRevenue(companyRevenueData.totalRevenue);
               console.log('Company revenue summary:', companyRevenueData);
             } catch (error) {
               console.error('Error fetching company revenue summary:', error);
               setCompanyRevenueSummary(null);
               setTotalRevenue(0);
             }

                           // Fetch monthly revenue using new API
              try {
                console.log('Fetching company monthly revenue...');
                const companyMonthlyData = await paymentService.getCompanyMonthlyRevenue(companyId, year);
                setMonthlyRevenue(companyMonthlyData);
                console.log(`Company ${companyId} monthly revenue (from API):`, companyMonthlyData);
              } catch (error) {
                console.error('Error fetching company monthly revenue:', error);
                // Fallback to ticket computation if API fails
                const tickets = await ticketService.getAllTickets();
                let filtered = tickets;
                try {
                  const company = await companyService.getCompanyById(companyId);
                  filtered = tickets.filter(t => t.companyName === company.name);
                } catch {}

                const byYear = filtered.filter(t => new Date(t.timeStart).getFullYear() === year);
                const monthly = Array(12).fill(0);
                byYear.forEach(t => {
                  // Count revenue for paid or completed statuses
                  if (t.status === 0 || t.status === 5) {
                    const m = new Date(t.timeStart).getMonth();
                    monthly[m] += t.price || 0;
                  }
                });
                setMonthlyRevenue(monthly);
                console.log(`Company ${companyId} monthly revenue (fallback computed):`, monthly);
              }

             // Fetch settlements for this company (Manager view)
             try {
               setLoadingSettlements(true);
               const list = await companyService.getCompanySettlements(companyId);
               // sort by createdAt desc
               list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
               setSettlements(list);
             } catch (settleErr) {
               console.warn('Could not load settlements:', settleErr);
               setSettlements([]);
             } finally {
               setLoadingSettlements(false);
             }
           } catch (error) {
             console.error(`Error fetching revenue for company ${companyId}:`, error);
             setTotalRevenue(0);
             setMonthlyRevenue(Array(12).fill(0));
             setSettlements([]);
             setCompanyRevenueSummary(null);
           }
        }
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setMonthlyRevenue(Array(12).fill(0));
        setAllCompaniesData([]);
        setSystemTotalRevenue(null);
        setTotalRevenue(null);
        setSettlements([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenue();
  }, [getUserCompanyId, year, isAdmin]);

  return (
    <>
      <PageMeta title="Báo cáo doanh thu" description="Xem doanh thu theo tháng của công ty" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo cáo doanh thu</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {isAdmin() ? "Tổng quan doanh thu hệ thống" : "Theo công ty của bạn"}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
                 <div className="flex items-center justify-between mb-6">
           <div>
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
               {isAdmin() ? "Tổng doanh thu hệ thống theo tháng" : "Doanh thu theo tháng"}
             </h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
               {isAdmin() ? `Tổng doanh thu toàn hệ thống năm ${year}` : `Năm ${year}`}
             </p>
           </div>
          <div className="flex items-center space-x-2">
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 dark:border-gray-800 dark:bg-gray-900 dark:text-white"
            >
              <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
              <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
            </select>
          </div>
        </div>

                 <ReactApexChart
           options={options}
           series={[{ name: isAdmin() ? "Tổng doanh thu hệ thống" : "Doanh thu", data: monthlyRevenue }]}
           type="bar"
           height={380}
         />

                 <div className={`grid ${isAdmin() ? 'grid-cols-2 md:grid-cols-6' : 'grid-cols-2 md:grid-cols-4'} gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800`}>
           <div className="text-center">
             <p className="text-2xl font-bold text-gray-900 dark:text-white">
               {isAdmin() 
                 ? (systemTotalRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(systemTotalRevenue))
                 : (companyRevenueSummary?.totalRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(companyRevenueSummary?.totalRevenue || 0))
               }
             </p>
             <p className="text-sm text-gray-500 dark:text-gray-400">
               {isAdmin() ? "Tổng doanh thu hệ thống" : "Tổng doanh thu công ty"}
             </p>
           </div>
           {(isAdmin() || companyRevenueSummary) && (
             <div className="text-center">
               <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                 {isAdmin() 
                   ? (systemTotalRefunded === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(systemTotalRefunded))
                   : (companyRevenueSummary?.totalRefunded === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(companyRevenueSummary?.totalRefunded || 0))
                 }
               </p>
               <p className="text-sm text-gray-500 dark:text-gray-400">
                 Tổng hoàn tiền
               </p>
             </div>
           )}
           {(isAdmin() || companyRevenueSummary) && (
             <div className="text-center">
               <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                 {isAdmin() 
                   ? (systemFee === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(systemFee))
                   : (companyRevenueSummary?.systemFee === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(companyRevenueSummary?.systemFee || 0))
                 }
               </p>
               <p className="text-sm text-gray-500 dark:text-gray-400">
                 Phí hệ thống
               </p>
             </div>
           )}
           {(isAdmin() || companyRevenueSummary) && (
             <div className="text-center">
               <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                 {isAdmin() 
                   ? (systemNetRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(systemNetRevenue))
                   : (companyRevenueSummary?.netRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(companyRevenueSummary?.netRevenue || 0))
                 }
               </p>
               <p className="text-sm text-gray-500 dark:text-gray-400">
                 Doanh thu ròng
               </p>
             </div>
           )}
           {isAdmin() && (
             <div className="text-center">
               <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                 {systemCounterRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(systemCounterRevenue)}
               </p>
               <p className="text-sm text-gray-500 dark:text-gray-400">
                 Doanh thu quầy
               </p>
             </div>
           )}
           {isAdmin() && (
             <div className="text-center">
               <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                 {systemOnlineRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(systemOnlineRevenue)}
               </p>
               <p className="text-sm text-gray-500 dark:text-gray-400">
                 Doanh thu online
               </p>
             </div>
           )}
         </div>
             </div>

       {/* Admin: Current Month Detailed Revenue */}
       {isAdmin() && currentMonthDetail && (
         <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
           <div className="mb-4">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doanh thu tháng hiện tại</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
               Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}
             </p>
           </div>
           
           <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
             <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
               <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                 {new Intl.NumberFormat('vi-VN').format(currentMonthDetail.totalRevenue)}
               </div>
               <p className="text-sm text-gray-600 dark:text-gray-400">Tổng doanh thu</p>
             </div>
             
             <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
               <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                 {new Intl.NumberFormat('vi-VN').format(currentMonthDetail.totalRefunded)}
               </div>
               <p className="text-sm text-gray-600 dark:text-gray-400">Tổng hoàn tiền</p>
             </div>
             
             <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
               <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                 {new Intl.NumberFormat('vi-VN').format(currentMonthDetail.systemFee)}
               </div>
               <p className="text-sm text-gray-600 dark:text-gray-400">Phí hệ thống</p>
             </div>
             
             <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
               <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                 {new Intl.NumberFormat('vi-VN').format(currentMonthDetail.netRevenue)}
               </div>
               <p className="text-sm text-gray-600 dark:text-gray-400">Doanh thu ròng</p>
             </div>
             
             <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
               <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                 {new Intl.NumberFormat('vi-VN').format(currentMonthDetail.onlineRevenue || 0)}
               </div>
               <p className="text-sm text-gray-600 dark:text-gray-400">Doanh thu online</p>
             </div>
             
             <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
               <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                 {new Intl.NumberFormat('vi-VN').format(currentMonthDetail.counterRevenue || 0)}
               </div>
               <p className="text-sm text-gray-600 dark:text-gray-400">Doanh thu quầy</p>
             </div>
           </div>
         </div>
       )}

       {/* Admin: Total Revenue Summary when no detailed data */}
      {isAdmin() && allCompaniesData.length === 0 && systemTotalRevenue && systemTotalRevenue > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tổng doanh thu hệ thống</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tổng doanh thu của tất cả công ty</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                {new Intl.NumberFormat('vi-VN').format(systemTotalRevenue || 0)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng doanh thu</p>
            </div>
            
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
                {new Intl.NumberFormat('vi-VN').format(systemTotalRefunded || 0)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tổng hoàn tiền</p>
            </div>
            
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {new Intl.NumberFormat('vi-VN').format(systemFee || 0)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Phí hệ thống</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 mb-1">
                {new Intl.NumberFormat('vi-VN').format(systemNetRevenue || 0)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Doanh thu ròng</p>
            </div>
            
            <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                {new Intl.NumberFormat('vi-VN').format(systemOnlineRevenue || 0)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Doanh thu online</p>
            </div>
            
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {new Intl.NumberFormat('vi-VN').format(systemCounterRevenue || 0)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Doanh thu quầy</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            {loadingDetailedData ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  <strong>Đang tải</strong> chi tiết doanh thu từng công ty...
                </p>
              </div>
            ) : (
              <p className="text-sm text-blue-600 dark:text-blue-400">
                💡 <strong>Lưu ý:</strong> Chi tiết doanh thu từng công ty sẽ hiển thị sau khi tải xong.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Manager/Staff: Company Settlements */}
      {!isAdmin() && settlements && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Quyết toán công ty</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Danh sách kỳ quyết toán của công ty bạn</p>
            </div>
          </div>

          {loadingSettlements ? (
            <div className="py-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mr-3"></div>
              <span className="text-gray-600 dark:text-gray-400">Đang tải quyết toán...</span>
            </div>
          ) : settlements.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">
              Chưa có quyết toán nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Kỳ</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Giao dịch</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Doanh thu gộp</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Phí hệ thống</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Doanh thu ròng</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Tải xuống</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                  {settlements.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {new Date(item.period).toLocaleDateString('vi-VN', { year: 'numeric', month: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                        {item.totalPayments.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-blue-600 dark:text-blue-400">
                        {item.grossAmount.toLocaleString('vi-VN')} VND
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600 dark:text-red-400">
                        -{item.chargeAmount.toLocaleString('vi-VN')} VND
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600 dark:text-green-400">
                        {item.netAmount.toLocaleString('vi-VN')} VND
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => window.open(item.excelReportUrl, '_blank')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg"
                        >
                          Tải Excel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}



             {/* Manager/Staff: Company Info Card - Show even if totalRevenue is 0 for debugging */}
       {!isAdmin() && companyRevenueSummary && (
         <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
           <div className="mb-4">
             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin công ty</h3>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chi tiết doanh thu công ty của bạn</p>
           </div>
           
           <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-6">
             <div className="flex items-center justify-between mb-4">
               <div>
                 <div className="flex items-center mb-2">
                   <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mr-3">
                     <span className="text-white font-semibold text-sm">C</span>
                   </div>
                   <div>
                     <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Công ty của bạn</h4>
                     <p className="text-sm text-gray-500 dark:text-gray-400">Công ty: {companyName || 'Đang tải...'}</p>
                   </div>
                 </div>
               </div>
               <div className="text-right">
                 <div className={`text-2xl font-bold ${companyRevenueSummary.totalRevenue > 0 ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`}>
                   {new Intl.NumberFormat('vi-VN').format(companyRevenueSummary.totalRevenue)} VND
                 </div>
                 <p className="text-sm text-gray-500 dark:text-gray-400">
                   {companyRevenueSummary.totalRevenue > 0 ? 'Tổng doanh thu' : 'Chưa có doanh thu'}
                 </p>
               </div>
             </div>
             
             {/* Detailed revenue breakdown */}
             <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-4 pt-4 border-t border-pink-200 dark:border-pink-800">
               <div className="text-center">
                 <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                   {new Intl.NumberFormat('vi-VN').format(companyRevenueSummary.totalRevenue)}
                 </div>
                 <p className="text-xs text-gray-600 dark:text-gray-400">Tổng doanh thu</p>
               </div>
               <div className="text-center">
                 <div className="text-lg font-semibold text-red-600 dark:text-red-400">
                   {new Intl.NumberFormat('vi-VN').format(companyRevenueSummary.totalRefunded)}
                 </div>
                 <p className="text-xs text-gray-600 dark:text-gray-400">Tổng hoàn tiền</p>
               </div>
               <div className="text-center">
                 <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                   {new Intl.NumberFormat('vi-VN').format(companyRevenueSummary.systemFee)}
                 </div>
                 <p className="text-xs text-gray-600 dark:text-gray-400">Phí hệ thống</p>
               </div>
               <div className="text-center">
                 <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                   {new Intl.NumberFormat('vi-VN').format(companyRevenueSummary.netRevenue)}
                 </div>
                 <p className="text-xs text-gray-600 dark:text-gray-400">Doanh thu ròng</p>
               </div>
               <div className="text-center">
                 <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                   {new Intl.NumberFormat('vi-VN').format(companyRevenueSummary.onlineRevenue || 0)}
                 </div>
                 <p className="text-xs text-gray-600 dark:text-gray-400">Doanh thu online</p>
               </div>
               <div className="text-center">
                 <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                   {new Intl.NumberFormat('vi-VN').format(companyRevenueSummary.counterRevenue || 0)}
                 </div>
                 <p className="text-xs text-gray-600 dark:text-gray-400">Doanh thu quầy</p>
               </div>
             </div>
           </div>
         </div>
       )}

      {/* Admin: Companies Revenue Table - Show even if loading or no data */}
      {isAdmin() && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doanh thu theo công ty</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chi tiết doanh thu từng công ty trong hệ thống</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Công ty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Tổng doanh thu
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Doanh thu online
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Doanh thu quầy
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Phí hệ thống
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Doanh thu ròng
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    Doanh thu tháng này
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                    % Tổng doanh thu
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {loadingDetailedData ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mr-3"></div>
                        <span className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu công ty...</span>
                      </div>
                    </td>
                  </tr>
                ) : allCompaniesData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <div className="text-lg mb-2">📊</div>
                        <div>Không có dữ liệu công ty</div>
                        <div className="text-sm mt-1">Vui lòng kiểm tra kết nối API</div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  allCompaniesData.map((company, _) => {
                    const currentMonthRevenue = company.monthlyRevenue[new Date().getMonth()] || 0;
                    const percentage = systemTotalRevenue ? ((company.totalRevenue / systemTotalRevenue) * 100) : 0;
                    
                    return (
                      <tr key={company.companyId} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {company.companyName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {company.companyName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {company.companyId}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('vi-VN').format(company.totalRevenue)} VND
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            {new Intl.NumberFormat('vi-VN').format(company.onlineRevenue || 0)} VND
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-green-600 dark:text-green-400">
                            {new Intl.NumberFormat('vi-VN').format(company.counterRevenue || 0)} VND
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-orange-600 dark:text-orange-400">
                            {new Intl.NumberFormat('vi-VN').format(company.systemFee || 0)} VND
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                            {new Intl.NumberFormat('vi-VN').format(company.netRevenue || 0)} VND
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('vi-VN').format(currentMonthRevenue)} VND
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end">
                            <div className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                              {percentage.toFixed(1)}%
                            </div>
                            <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                              <div 
                                className="bg-pink-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(percentage, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Summary Row */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {loadingDetailedData ? (
                  "Đang tải dữ liệu..."
                ) : (
                  `Tổng cộng (${allCompaniesData.length} công ty)`
                )}
              </div>
              <div className="text-lg font-bold text-pink-600 dark:text-pink-400">
                {systemTotalRevenue ? new Intl.NumberFormat('vi-VN').format(systemTotalRevenue) : '0'} VND
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

