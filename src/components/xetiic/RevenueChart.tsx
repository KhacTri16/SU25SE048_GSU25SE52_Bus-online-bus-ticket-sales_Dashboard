import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { useAuth } from "../../context/AuthContext";
import { ticketService, companyService, paymentService } from "../../services/api";

export default function RevenueChart() {
  const { getUserCompanyId, isAdmin, isCompanyRestricted } = useAuth();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(Array(12).fill(0));
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  const series = useMemo(() => ([{ name: isAdmin() ? "Tổng doanh thu hệ thống" : "Doanh thu", data: monthlyRevenue }]), [monthlyRevenue, isAdmin]);

  useEffect(() => {
    const fetchRevenue = async () => {
      setIsLoading(true);
      try {
        if (isAdmin()) {
          // Admin: Fetch system monthly revenue
          try {
            console.log('Fetching system monthly revenue...');
            const systemMonthlyData = await paymentService.getSystemMonthlyRevenue(year);
            setMonthlyRevenue(systemMonthlyData);
            console.log('System monthly revenue:', systemMonthlyData);
            
            // Calculate total revenue from monthly data
            const total = systemMonthlyData.reduce((a, b) => a + b, 0);
            setTotalRevenue(total);
          } catch (error) {
            console.error('Error fetching system monthly revenue:', error);
            setMonthlyRevenue(Array(12).fill(0));
            setTotalRevenue(0);
          }
        } else {
          // Non-admin: Fetch company-specific data
          const companyId = getUserCompanyId();
          if (!companyId) {
            console.warn('No company ID found for user');
            setTotalRevenue(0);
            setMonthlyRevenue(Array(12).fill(0));
            return;
          }

          try {
            // Fetch company monthly revenue using new API
            console.log('Fetching company monthly revenue...');
            const companyMonthlyData = await paymentService.getCompanyMonthlyRevenue(companyId, year);
            setMonthlyRevenue(companyMonthlyData);
            console.log(`Company ${companyId} monthly revenue (from API):`, companyMonthlyData);
            
            // Calculate total revenue from monthly data
            const total = companyMonthlyData.reduce((a, b) => a + b, 0);
            setTotalRevenue(total);
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
            setTotalRevenue(monthly.reduce((a, b) => a + b, 0));
            console.log(`Company ${companyId} monthly revenue (fallback computed):`, monthly);
          }
        }
      } catch (err) {
        console.error('Error fetching revenue data:', err);
        setMonthlyRevenue(Array(12).fill(0));
        setTotalRevenue(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRevenue();
  }, [getUserCompanyId, year, isAdmin]);

  return (
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
        series={series}
        type="bar"
        height={380}
      />

      <div className={`grid ${isAdmin() ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-4'} gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800`}>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {isAdmin() 
              ? (totalRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(totalRevenue))
              : (totalRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(totalRevenue))
            }
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isAdmin() ? "Tổng doanh thu hệ thống" : "Tổng doanh thu công ty"}
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {new Intl.NumberFormat('vi-VN').format(monthlyRevenue[new Date().getMonth()] || 0)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tháng này</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {monthlyRevenue.length > 0 ? Math.max(...monthlyRevenue).toLocaleString('vi-VN') : '0'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tháng cao nhất</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {monthlyRevenue.length > 0 ? Math.min(...monthlyRevenue.filter(v => v > 0)).toLocaleString('vi-VN') || '0' : '0'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tháng thấp nhất</p>
        </div>
      </div>
    </div>
  );
}
