import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { tripService } from '../../services/api';
import { Trip } from '../../types/company';
import { useAuth } from '../../context/AuthContext';

export default function DriverTrips() {
  const { user, isDriver } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        setError(null);
        if (!user || !isDriver()) {
          setTrips([]);
          return;
        }
        const driverId = parseInt(user.id, 10);
        const res = await tripService.getTripsByDriver(driverId, 0, 100, true);
        setTrips(res.data || []);
      } catch (e) {
        console.error('Error loading driver trips:', e);
        setError('Không thể tải danh sách chuyến của tài xế.');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [user, isDriver]);

  if (!isDriver()) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <p className="text-gray-700 dark:text-gray-300">Chức năng này chỉ dành cho tài xế.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/10">
        <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Chuyến của tài xế</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Tổng cộng {trips.length} chuyến</p>
      </div>
      {trips.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-12">Không có chuyến nào.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Mã chuyến</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Lộ trình</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Khởi hành</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Đến nơi</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Giá vé</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Xe</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-800">
              {trips.map(t => (
                <tr key={t.id} className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02]" onClick={() => navigate(`/driver-trips/${t.id}/passengers`)}>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{t.tripId}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{t.fromLocation} → {t.endLocation}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{new Date(t.timeStart).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{new Date(t.timeEnd).toLocaleString('vi-VN')}</td>
                  <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{t.price.toLocaleString('vi-VN')} đ</td>
                  <td className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300">{t.busName}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${t.status === 1 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'}`}>
                      {t.status === 1 ? 'Hoạt động' : 'Tạm dừng'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



