import ReactApexChart from "react-apexcharts";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { ticketService, companyService } from "../../services/api";

export default function BookingStatusChart() {
  const { isAdmin, isCompanyRestricted, getUserCompanyId } = useAuth();
  const [series, setSeries] = useState<number[]>([0, 0, 0]);

  useEffect(() => {
    const load = async () => {
      try {
        const tickets = await ticketService.getAllTickets();
        let filtered = tickets;
        if (!isAdmin() && isCompanyRestricted()) {
          const cid = getUserCompanyId();
          if (cid) {
            try {
              const company = await companyService.getCompanyById(cid);
              filtered = tickets.filter(t => t.companyName === company.name);
            } catch {
              filtered = [];
            }
          } else {
            filtered = [];
          }
        }

        // Map statuses to three buckets for the donut: Confirmed, Pending, Cancelled
        // Using provided mapping:
        // 0: Đã thanh toán, 1: Đã điểm danh, 2: Đã Hoàn tiền, 3: Chờ thanh toán, 4: Thất bại, 5: Hoàn thành
        const confirmed = filtered.filter(t => t.status === 0 || t.status === 1 || t.status === 5).length;
        const pending = filtered.filter(t => t.status === 3).length;
        const cancelled = filtered.filter(t => t.status === 2 || t.status === 4).length;
        const total = confirmed + pending + cancelled || 1;
        setSeries([
          Math.round((confirmed / total) * 100),
          Math.round((pending / total) * 100),
          Math.round((cancelled / total) * 100),
        ]);
      } catch (error) {
        console.error('Error loading booking data:', error);
      }
    };
    load();
  }, [isAdmin, isCompanyRestricted, getUserCompanyId]);
  const options = {
    chart: {
      type: "donut" as const,
    },
    colors: ["#10b981", "#f59e0b", "#ef4444"],
    labels: ["Đã xác nhận", "Chờ thanh toán", "Đã hủy/Hoàn tiền"],
    legend: {
      position: "bottom" as const,
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: "bottom" as const,
          },
        },
      },
    ],
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + "%";
        },
      },
    },
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Trạng thái đặt vé
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Tỷ lệ phần trăm theo trạng thái
        </p>
      </div>

      <div className="flex justify-center">
        <ReactApexChart
          options={options}
          series={series}
          type="donut"
          height={280}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Đã xác nhận</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {series[0]}%
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Chờ xử lý</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {series[1]}%
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Đã hủy</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {series[2]}%
          </p>
        </div>
      </div>
    </div>
  );
}
