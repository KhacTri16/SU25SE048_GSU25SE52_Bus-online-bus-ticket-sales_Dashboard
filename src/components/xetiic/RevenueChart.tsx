import { useState } from "react";
import ReactApexChart from "react-apexcharts";

export default function RevenueChart() {
  const [state] = useState({
    series: [
      {
        name: "Doanh thu",
        data: [8.5, 12.3, 9.8, 15.2, 11.7, 18.4, 14.9, 20.1, 16.8, 22.5, 19.3, 25.8],
      },
    ],
    options: {
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
          text: "Doanh thu (Tỷ VNĐ)",
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
            return val + " tỷ VNĐ";
          },
        },
      },
    },
  });

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
          <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 dark:border-gray-800 dark:bg-gray-900 dark:text-white">
            <option value="2025">2025</option>
            <option value="2024">2024</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden">
        <ReactApexChart
          options={state.options}
          series={state.series}
          type="area"
          height={350}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">187.5M</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tổng doanh thu</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">+23.1%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tăng trưởng</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">25.8M</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tháng này</p>
        </div>
      </div>
    </div>
  );
}
