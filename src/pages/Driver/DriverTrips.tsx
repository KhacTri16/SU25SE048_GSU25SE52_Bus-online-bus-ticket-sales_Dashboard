import { useEffect, useState, Fragment } from 'react';
import { useNavigate } from 'react-router';
import { tripService, ticketService } from '../../services/api';
import { Trip } from '../../types/company';
import { useAuth } from '../../context/AuthContext';

export default function DriverTrips() {
  const { user, isDriver } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [tripTickets, setTripTickets] = useState<Record<number, { loading: boolean; error?: string; stations?: Array<{ tripStationId: number; stationName: string; passengerCount: number; passengers: { ticketId: string; customerFullName?: string }[] }> }>>({});

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
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400 w-10"></th>
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
              {trips.map(t => {
                const isOpen = !!expanded[t.id];
                const ticketsState = tripTickets[t.id];
                return (
                  <Fragment key={t.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                      <td className="px-2 py-2 align-top">
                        <button
                          onClick={async () => {
                            setExpanded(prev => ({ ...prev, [t.id]: !prev[t.id] }));
                            if (!tripTickets[t.id]) {
                              setTripTickets(prev => ({ ...prev, [t.id]: { loading: true } }));
                              try {
                                const data = await ticketService.getTripStationPassengerCount(t.id);
                                setTripTickets(prev => ({ ...prev, [t.id]: { loading: false, stations: data } }));
                              } catch (e: any) {
                                setTripTickets(prev => ({ ...prev, [t.id]: { loading: false, error: e?.message || 'Lỗi tải vé' } }));
                              }
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                          title={isOpen ? 'Ẩn vé' : 'Hiện vé'}
                        >
                          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </td>
                      <td onClick={() => navigate(`/driver-trips/${t.id}/passengers`)} className="px-4 py-2 text-sm text-gray-900 dark:text-white cursor-pointer">{t.tripId}</td>
                      <td onClick={() => navigate(`/driver-trips/${t.id}/passengers`)} className="px-4 py-2 text-sm text-gray-900 dark:text-white cursor-pointer">{t.fromLocation} → {t.endLocation}</td>
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
                    {isOpen && (
                      <tr>
                        <td colSpan={8} className="px-6 pb-4 pt-0 bg-gray-50 dark:bg-gray-900/30">
                          {ticketsState?.loading && <div className="py-4 text-sm text-gray-500 dark:text-gray-400">Đang tải vé...</div>}
                          {ticketsState?.error && <div className="py-4 text-sm text-red-600 dark:text-red-400">{ticketsState.error}</div>}
                          {ticketsState?.stations && (
                            <div className="space-y-4 pt-4">
                              {ticketsState.stations.filter(s => (s.passengerCount || 0) > 0).length === 0 && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">Chưa có vé (hành khách) nào.</div>
                              )}
                              {ticketsState.stations.filter(s => (s.passengerCount || 0) > 0).map(st => (
                                <div key={st.tripStationId} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800/50">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{st.stationName}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">{st.passengerCount} vé</div>
                                  </div>
                                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {st.passengers.map(p => (
                                      <li key={p.ticketId} className="py-1.5 flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">#{p.ticketId}</span>
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{p.customerFullName || 'Unknown'}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}



