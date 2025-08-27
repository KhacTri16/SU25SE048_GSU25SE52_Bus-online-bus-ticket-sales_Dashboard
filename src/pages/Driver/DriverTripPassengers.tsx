import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ticketService, tripService } from '../../services/api';

type PassengerItem = { ticketId: string; customerFullName: string };
type StationPassengers = { tripStationId: number; stationName: string; passengerCount: number; passengers: PassengerItem[] };

export default function DriverTripPassengers() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [stations, setStations] = useState<StationPassengers[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeMsg, setCompleteMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!tripId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await ticketService.getTripStationPassengerCount(Number(tripId));
        setStations(data);
      } catch (e) {
        console.error('Failed loading passengers:', e);
        setError('Không thể tải danh sách khách theo trạm.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tripId]);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Quản lý khách trên xe</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Trip ID: {tripId}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              if (!tripId) return;
              setCompleting(true);
              setCompleteMsg(null);
              try {
                const msg = await tripService.completeTrip(Number(tripId));
                setCompleteMsg(msg);
              } catch (e: any) {
                setCompleteMsg(e.message || 'Không thể hoàn thành chuyến');
              } finally {
                setCompleting(false);
              }
            }}
            disabled={completing}
            className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50"
          >
            {completing ? 'Đang hoàn thành...' : 'Hoàn thành chuyến'}
          </button>
          <button onClick={() => navigate(-1)} className="text-sm text-pink-600 hover:text-pink-700 dark:text-pink-400">Quay lại</button>
        </div>
      </div>
      {completeMsg && (
        <div className={`mb-4 text-sm font-medium ${completeMsg.toLowerCase().includes('không') || completeMsg.toLowerCase().includes('thất bại') ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{completeMsg}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-pink-600" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/10">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      ) : (
        <div className="space-y-5">
          {stations.map((s) => (
            <div key={s.tripStationId} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{s.stationName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Số khách: {s.passengerCount}</p>
                </div>
              </div>
              <div className="mt-3">
                {s.passengers.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Chưa có khách.</p>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {s.passengers.map((p) => (
                      <li key={p.ticketId} className="py-2 flex items-center justify-between">
                        <div className="text-sm text-gray-900 dark:text-white">{p.customerFullName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">#{p.ticketId}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


