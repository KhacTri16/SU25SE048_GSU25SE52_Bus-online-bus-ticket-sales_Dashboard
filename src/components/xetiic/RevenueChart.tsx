import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { useAuth } from "../../context/AuthContext";
import { paymentService } from "../../services/api";

export default function RevenueChart() {
  const { getUserCompanyId } = useAuth();
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [monthlyRevenue, setMonthlyRevenue] = useState<number[]>(Array(12).fill(0));
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const options = useMemo(() => ({
    chart: {
      height: 350,
      type: "area" as const,
      toolbar: {
        show: false,
      },
    },
    colors: ["#e36666"],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth" as const,
      width: 3,
    },
    xaxis: {
      categories: [
        "T1", "T2", "T3", "T4", "T5", "T6",
        "T7", "T8", "T9", "T10", "T11", "T12"
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: "Doanh thu (VND)",
      },
      labels: {
        formatter: (value: number) => new Intl.NumberFormat('vi-VN').format(value),
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.1,
        stops: [0, 90, 100],
      },
    },
    grid: {
      borderColor: "#f1f1f1",
      strokeDashArray: 3,
    },
    tooltip: {
      x: {
        format: "MM/yyyy",
      },
      y: {
        formatter: function (val: number) {
          return new Intl.NumberFormat('vi-VN').format(val) + " VND";
        },
      },
    },
  }), []);

  const series = useMemo(() => ([{ name: "Doanh thu", data: monthlyRevenue }]), [monthlyRevenue]);

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
        setMonthlyRevenue(results.map(r => r.revenue || 0));
      } catch (e) {
        console.error('Error loading revenue', e);
        setMonthlyRevenue(Array(12).fill(0));
      } finally {
        setIsLoading(false);
      }
    };
    fetchRevenue();
  }, [getUserCompanyId, year]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Doanh thu theo tháng
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Biểu đồ doanh thu 12 tháng gần nhất
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

      <div className="overflow-hidden">
        <ReactApexChart
          options={options}
          series={series}
          type="area"
          height={350}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {totalRevenue === null ? (isLoading ? '...' : '0') : new Intl.NumberFormat('vi-VN').format(totalRevenue)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tổng doanh thu</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">+23.1%</p>
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
  );
}
