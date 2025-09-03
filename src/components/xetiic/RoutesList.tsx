import { useEffect, useState } from "react";
import { tripService } from "../../services/api";

type RouteRow = {
  id: number;
  route: string;
  time: string;
  price: string;
  available?: number | null;
  total?: number | null;
  status: "available" | "full" | "inactive";
};

export default function RoutesList() {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const getStatusBadge = (status: string, available: number) => {
    if (status === "full") {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Hết vé</span>;
    } else if (available <= 5) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Sắp hết</span>;
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Còn vé</span>;
    }
  };

  useEffect(() => {
    const fetchActiveTrips = async () => {
      setLoading(true);
      try {
        const resp = await tripService.getAllTrips(0, 100, true);
        // Take top 10 trips as returned by API (no extra filtering here)
        const trips = (resp.data || []).slice(0, 10);

        const rows: RouteRow[] = trips.map(t => ({
          id: t.id,
          route: `${t.fromLocation} - ${t.endLocation}`,
          time: `${new Date(t.timeStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(t.timeEnd).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
          price: new Intl.NumberFormat('vi-VN').format(t.price),
          available: null,
          total: null,
          status: t.status === 1 && !t.isDeleted ? "available" : "inactive",
        }));
        setRoutes(rows);
      } catch (e) {
        console.error('Error fetching active trips:', e);
        setRoutes([]);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveTrips();
  }, []);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tuyến đường phổ biến 
        </h3>
        <button className="text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400">
        </button>
      </div>

      <div className="overflow-x-auto max-h-[28rem] overflow-y-auto">
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
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Đang tải...</td>
              </tr>
            ) : routes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">Không có chuyến đi đang hoạt động</td>
              </tr>
            ) : (
              routes.map((route) => (
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
                    <span className="text-gray-500 dark:text-gray-400">-</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(route.status, route.available ?? 10)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
