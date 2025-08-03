import ReactApexChart from "react-apexcharts";

export default function BookingStatusChart() {
  const series = [68, 23, 9];
  const options = {
    chart: {
      type: "donut" as const,
    },
    colors: ["#10b981", "#f59e0b", "#ef4444"],
    labels: ["Đã xác nhận", "Chờ xử lý", "Đã hủy"],
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
            68%
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Chờ xử lý</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            23%
          </p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Đã hủy</span>
          </div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            9%
          </p>
        </div>
      </div>
    </div>
  );
}
