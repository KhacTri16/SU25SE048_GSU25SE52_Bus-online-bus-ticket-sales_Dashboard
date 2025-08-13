import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/AuthContext";
import { paymentService } from "../../services/api";

export default function RevenueReport() {
  const { getUserCompanyId } = useAuth();
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
      const companyId = getUserCompanyId();
      if (!companyId) return;
      setIsLoading(true);
      try {
        const total = await paymentService.getCompanyTotalRevenue(companyId);
        setTotalRevenue(total);

        const monthPromises = Array.from({ length: 12 }, (_, idx) =>
          paymentService.getMonthlyRevenue(companyId, year, idx + 1)
        );
        const results = await Promise.all(monthPromises);
        setMonthlyRevenue(results.map((r) => r.revenue || 0));
      } catch (err) {
        console.error(err);
        setMonthlyRevenue(Array(12).fill(0));
      } finally {
        setIsLoading(false);
      }
    };

    fetchRevenue();
  }, [getUserCompanyId, year]);

  return (
    <>
      <PageMeta title="Báo cáo doanh thu" description="Xem doanh thu theo tháng của công ty" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Báo cáo doanh thu</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Theo công ty của bạn</p>
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
              {totalRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(totalRevenue)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tổng doanh thu</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{/** Placeholder growth */}+0%</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tăng trưởng</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {new Intl.NumberFormat('vi-VN').format(monthlyRevenue[new Date().getMonth()] || 0)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tháng này</p>
          </div>
        </div>
      </div>
    </>
  );
}

