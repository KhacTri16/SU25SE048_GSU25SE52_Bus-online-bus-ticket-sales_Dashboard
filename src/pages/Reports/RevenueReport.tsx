import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { paymentService, CompanyRevenueData } from "../../services/api";

export default function RevenueReport() {
  const authContext = useAuth();
  const { getUserCompanyId, isAdmin } = authContext;
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(Array(12).fill(0));
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Admin-specific states
  const [allCompaniesData, setAllCompaniesData] = useState<CompanyRevenueData[]>([]);
  const [systemTotalRevenue, setSystemTotalRevenue] = useState<number | null>(null);
  const [loadingDetailedData, setLoadingDetailedData] = useState<boolean>(false);

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
      title: { text: "Doanh thu (VND)" },
      labels: { formatter: (v: number) => new Intl.NumberFormat('vi-VN').format(v) },
    },
    fill: { opacity: 0.8 },
    tooltip: {
      y: { formatter: (val: number) => new Intl.NumberFormat('vi-VN').format(val) + " VND" },
    },
  }), []);

  useEffect(() => {
    const fetchRevenue = async () => {
      setIsLoading(true);
      try {
        if (isAdmin()) {
          // Admin: First get the total revenue quickly
          console.log('Admin user detected, fetching total revenue...');
          try {
            const simpleRevenueData = await paymentService.getAllCompaniesRevenue();
            setSystemTotalRevenue(simpleRevenueData.totalRevenue);
            console.log('Total system revenue:', simpleRevenueData.totalRevenue);
          } catch (error) {
            console.error('Error fetching simple revenue:', error);
          }
          
          // Then try to get detailed breakdown
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
            
            // For chart display, show aggregated monthly data from all companies
            const aggregatedMonthly = Array(12).fill(0);
            allRevenueData.companiesRevenue.forEach(company => {
              company.monthlyRevenue.forEach((revenue, idx) => {
                if (idx < 12) {
                  aggregatedMonthly[idx] += revenue;
                }
              });
            });
            setMonthlyRevenue(aggregatedMonthly);
          } catch (error) {
            console.error('Error fetching detailed revenue breakdown:', error);
            // If detailed breakdown fails, at least show the total
            setAllCompaniesData([]);
            setMonthlyRevenue(Array(12).fill(0));
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
            // Get company total revenue
            console.log(`Calling API: /api/Payment/company/revenue/total?companyId=${companyId}`);
            const total = await paymentService.getCompanyTotalRevenue(companyId);
            console.log(`Company ${companyId} total revenue response:`, total, typeof total);
            
            setTotalRevenue(total);

            // Get monthly revenue data
            console.log(`Fetching monthly revenue for company ${companyId}, year ${year}`);
            const monthPromises = Array.from({ length: 12 }, (_, idx) =>
              paymentService.getMonthlyRevenue(companyId, year, idx + 1)
            );
            const results = await Promise.all(monthPromises);
            const monthlyData = results.map((r) => r.revenue || 0);
            setMonthlyRevenue(monthlyData);
            console.log(`Company ${companyId} monthly revenue:`, monthlyData);
          } catch (error) {
            console.error(`Error fetching revenue for company ${companyId}:`, error);
            setTotalRevenue(0);
            setMonthlyRevenue(Array(12).fill(0));
          }
        }
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setMonthlyRevenue(Array(12).fill(0));
        setAllCompaniesData([]);
        setSystemTotalRevenue(null);
        setTotalRevenue(null);
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Doanh thu theo tháng</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Năm {year}</p>
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
          series={[{ name: "Doanh thu", data: monthlyRevenue }]}
          type="bar"
          height={380}
        />

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {isAdmin() 
                ? (systemTotalRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(systemTotalRevenue))
                : (totalRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(totalRevenue))
              }
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isAdmin() ? "Tổng doanh thu hệ thống" : "Tổng doanh thu công ty"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {isAdmin() ? allCompaniesData.length : '1'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isAdmin() ? "Số công ty" : "Công ty"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('vi-VN').format(monthlyRevenue[new Date().getMonth()] || 0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Doanh thu tháng này</p>
          </div>
        </div>
      </div>

      {/* Admin: Total Revenue Summary when no detailed data */}
      {isAdmin() && allCompaniesData.length === 0 && systemTotalRevenue && systemTotalRevenue > 0 && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tổng doanh thu hệ thống</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Tổng doanh thu của tất cả công ty</p>
          </div>
          
          <div className="text-center py-8">
            <div className="text-4xl font-bold text-pink-600 dark:text-pink-400 mb-2">
              {new Intl.NumberFormat('vi-VN').format(systemTotalRevenue)} VND
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Tổng doanh thu toàn hệ thống
            </p>
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




      {/* Manager/Staff: Company Info Card - Show even if totalRevenue is 0 for debugging */}
      {!isAdmin() && totalRevenue !== null && (
        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Thông tin công ty</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Chi tiết doanh thu công ty của bạn</p>
          </div>
          
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mr-3">
                    <span className="text-white font-semibold text-sm">C</span>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Công ty của bạn</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">ID: {getUserCompanyId()}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${totalRevenue > 0 ? 'text-pink-600 dark:text-pink-400' : 'text-gray-400 dark:text-gray-500'}`}>
                  {new Intl.NumberFormat('vi-VN').format(totalRevenue)} VND
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {totalRevenue > 0 ? 'Tổng doanh thu' : 'Chưa có doanh thu'}
                </p>
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
                    <td colSpan={4} className="px-6 py-8 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-600 mr-3"></div>
                        <span className="text-gray-500 dark:text-gray-400">Đang tải dữ liệu công ty...</span>
                      </div>
                    </td>
                  </tr>
                ) : allCompaniesData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center">
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

