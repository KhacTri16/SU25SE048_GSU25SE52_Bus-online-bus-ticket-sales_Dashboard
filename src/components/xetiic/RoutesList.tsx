import { useState } from "react";

const routesData = [
  {
    id: 1,
    route: "Hà Nội - TP.HCM",
    time: "06:00 - 22:30",
    price: "650,000",
    available: 12,
    total: 45,
    status: "available"
  },
  {
    id: 2,
    route: "Hà Nội - Đà Nẵng",
    time: "07:30 - 18:45",
    price: "450,000",
    available: 8,
    total: 40,
    status: "available"
  },
  {
    id: 3,
    route: "TP.HCM - Đà Lạt",
    time: "08:00 - 14:30",
    price: "320,000",
    available: 0,
    total: 35,
    status: "full"
  },
  {
    id: 4,
    route: "Hà Nội - Hải Phòng",
    time: "09:15 - 11:45",
    price: "180,000",
    available: 25,
    total: 40,
    status: "available"
  },
  {
    id: 5,
    route: "TP.HCM - Vũng Tàu",
    time: "10:30 - 13:00",
    price: "150,000",
    available: 18,
    total: 30,
    status: "available"
  }
];

export default function RoutesList() {
  const [routes] = useState(routesData);

  const getStatusBadge = (status: string, available: number, total: number) => {
    if (status === "full") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Hết vé</span>;
    } else if (available <= 5) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Sắp hết</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Còn vé</span>;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tuyến đường phổ biến hôm nay
        </h3>
        <button className="text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400">
          Xem tất cả
        </button>
      </div>

      <div className="overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Tuyến đường
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Thời gian
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Giá vé
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Còn lại/Tổng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Trạng thái
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-800">
            {routes.map((route) => (
              <tr key={route.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {route.route}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {route.time}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {route.price} VNĐ
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`${route.available <= 5 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {route.available}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">/{route.total}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(route.status, route.available, route.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
