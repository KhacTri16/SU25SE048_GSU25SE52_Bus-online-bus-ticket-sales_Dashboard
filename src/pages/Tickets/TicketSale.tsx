import { useEffect, useMemo, useState } from 'react';
import PageMeta from '../../components/common/PageMeta';
import { useAuth } from '../../context/AuthContext';
import { locationService, stationService, tripService, reservationService } from '../../services/api';
import { Location, Station, TripSearchByCompanyResponse, TripSearchTrip, TransferTripItem, TripleTripItem, SeatAvailability } from '../../types/company';

// Staff-only page to search trips (direct / transfer / triple) for selling tickets.
// For now this page only performs search; actual ticket booking flow can be added later.

export default function TicketSale() {
  const { isStaff, getUserCompanyId, user } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [fromLocationId, setFromLocationId] = useState<number | undefined>();
  const [toLocationId, setToLocationId] = useState<number | undefined>();
  const [fromStationId, setFromStationId] = useState<number | undefined>();
  const [toStationId, setToStationId] = useState<number | undefined>();
  const [date, setDate] = useState<string>('');
  const [result, setResult] = useState<TripSearchByCompanyResponse | null>(null);
  const [selectedLegs, setSelectedLegs] = useState<TripSearchTrip[] | null>(null); // hành trình đã chọn (có thể nhiều chặng)
  const [seatsByLeg, setSeatsByLeg] = useState<Record<number, SeatAvailability[]>>({}); // key = tripId
  const [selectedSeatsByLeg, setSelectedSeatsByLeg] = useState<Record<number, string[]>>({});
  const [seatLoading, setSeatLoading] = useState<boolean>(false);
  const [seatError, setSeatError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<{success:boolean; message:string} | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch locations, stations concurrently
    const loadMeta = async () => {
      try {
        const [locRes, staRes] = await Promise.all([
          locationService.getAllLocations(),
          stationService.getAllStations(),
        ]);
        setLocations(locRes.data);
        setStations(staRes.data);
      } catch (e: any) {
        setError(e?.message || 'Không thể tải dữ liệu địa điểm / trạm');
      }
    };
    loadMeta();
  }, []);

  const filteredFromStations = useMemo(() => {
    if (!fromLocationId) return stations;
    return stations.filter(s => s.locationName && locations.find(l => l.id === fromLocationId)?.name === s.locationName);
  }, [stations, fromLocationId, locations]);

  const filteredToStations = useMemo(() => {
    if (!toLocationId) return stations;
    return stations.filter(s => s.locationName && locations.find(l => l.id === toLocationId)?.name === s.locationName);
  }, [stations, toLocationId, locations]);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const companyId = getUserCompanyId();
      if (!companyId) throw new Error('Không xác định được công ty của bạn');
      if (!date) throw new Error('Vui lòng chọn ngày');

      const res = await tripService.searchTripsByCompany({
        FromLocationId: fromLocationId,
        FromStationId: fromStationId,
        ToLocationId: toLocationId,
        ToStationId: toStationId,
        Date: date,
        companyId,
      });
      setResult(res);
      setSelectedLegs(null);
      setSeatsByLeg({});
      setSelectedSeatsByLeg({});
    } catch (e: any) {
      setError(e?.message || 'Tìm kiếm thất bại');
    } finally {
      setLoading(false);
    }
  };

  const beginSeatSelection = async (legs: TripSearchTrip[]) => {
    setSelectedLegs(legs);
    setSeatError(null);
    setSeatsByLeg({});
    setSelectedSeatsByLeg({});
    if (!legs.length) return;
    setSeatLoading(true);
    try {
      // tải song song tất cả sơ đồ ghế theo từng chặng
      const seatPromises = legs.map(async (leg) => {
        const data = await tripService.getSeatAvailability(leg.id, leg.fromStationId, leg.toStationId);
        return { tripId: leg.id, seats: data };
      });
      const all = await Promise.all(seatPromises);
      const map: Record<number, SeatAvailability[]> = {};
      all.forEach(r => { map[r.tripId] = r.seats; });
      setSeatsByLeg(map);
      // khởi tạo mảng chọn rỗng cho từng chặng
      const sel: Record<number, string[]> = {};
      legs.forEach(l => { sel[l.id] = []; });
      setSelectedSeatsByLeg(sel);
    } catch (e: any) {
      setSeatError(e?.message || 'Không tải được sơ đồ ghế');
    } finally {
      setSeatLoading(false);
    }
  };

  const toggleSeat = (tripId: number, seatId: string, available: boolean) => {
    if (!available) return;
    setSelectedSeatsByLeg(prev => {
      const current = prev[tripId] || [];
      return {
        ...prev,
        [tripId]: current.includes(seatId)
          ? current.filter(s => s !== seatId)
          : [...current, seatId]
      };
    });
  };

  const allLegsHaveSeat = useMemo(() => {
    if (!selectedLegs) return false;
    return selectedLegs.every(leg => (selectedSeatsByLeg[leg.id] || []).length > 0);
  }, [selectedLegs, selectedSeatsByLeg]);

  const totalPrice = useMemo(() => {
    if (!selectedLegs) return 0;
    // Price per leg; could integrate seat-based pricing if differs
    return selectedLegs.reduce((sum, l) => sum + (l.price || 0), 0);
  }, [selectedLegs]);

  const proceedToCheckout = () => {
    setShowCheckout(true);
    setBookingResult(null);
  };

  const submitReservation = async () => {
    if (!selectedLegs) return;
    setBookingLoading(true);
    setBookingResult(null);
    try {
      // Map seatIds: need numeric ids; we only have textual seatId plus SeatAvailability id (primary). Use availability id map.
      const tripSeats = selectedLegs.map(leg => {
        const seats = seatsByLeg[leg.id] || [];
        const selectedCodes = selectedSeatsByLeg[leg.id] || [];
        const seatPrimaryIds = seats.filter(s => selectedCodes.includes(s.seatId)).map(s => s.id);
        return {
          tripId: leg.id,
          fromStationId: leg.fromStationId,
          toStationId: leg.toStationId,
          seatIds: seatPrimaryIds
        };
      });

      const payload = {
        customerId: user ? parseInt(user.id, 10) : 0, // tự động lấy id staff đang đăng nhập
        isReturn: false,
        tripSeats,
        returnTripSeats: []
      };
      const res = await reservationService.createCounterReservation(payload);
      setBookingResult({ success: res.success, message: res.message });
      if (res.success) {
        // Optionally reset states here
      }
    } catch (e: any) {
      setBookingResult({ success: false, message: e?.response?.data?.message || e?.message || 'Đặt vé thất bại' });
    } finally {
      setBookingLoading(false);
    }
  };

  if (!isStaff()) {
    return (
      <div className="p-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]">
        <p className="text-red-600 dark:text-red-400 font-medium">Chỉ nhân viên (Staff) mới có quyền truy cập trang bán vé.</p>
      </div>
    );
  }

  return (
    <>
      <PageMeta title="Bán vé" description="Nhân viên tìm chuyến và bán vé" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bán vé</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Tìm chuyến theo địa điểm, trạm và ngày khởi hành</p>
      </div>

      {/* Search Form */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tỉnh/TP đi</label>
            <select value={fromLocationId ?? ''} onChange={e => { const v = e.target.value; setFromLocationId(v? Number(v): undefined); setFromStationId(undefined); }} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="">-- Chọn --</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bến đi</label>
            <select value={fromStationId ?? ''} onChange={e => setFromStationId(e.target.value? Number(e.target.value): undefined)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="">-- Tất cả --</option>
              {filteredFromStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ngày đi</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tỉnh/TP đến</label>
            <select value={toLocationId ?? ''} onChange={e => { const v = e.target.value; setToLocationId(v? Number(v): undefined); setToStationId(undefined); }} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="">-- Chọn --</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bến đến</label>
            <select value={toStationId ?? ''} onChange={e => setToStationId(e.target.value? Number(e.target.value): undefined)} className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="">-- Tất cả --</option>
              {filteredToStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={handleSearch} disabled={loading} className="px-6 py-2 w-full md:w-auto rounded-lg bg-pink-600 hover:bg-pink-700 text-white font-medium disabled:opacity-50">
              {loading ? 'Đang tìm...' : 'Tìm chuyến'}
            </button>
          </div>
        </div>
        {error && <p className="mt-4 text-red-600 dark:text-red-400 text-sm">{error}</p>}
      </div>

      {/* Results */}
  {result && !selectedLegs && (
        <div className="space-y-8">
          {/* Direct Trips */}
          {result.directTrips.length > 0 && (
            <TripGroup title="Chuyến thẳng" trips={result.directTrips} onSelect={t => beginSeatSelection([t])} />
          )}
          {/* Transfer Trips */}
          {result.transferTrips.length > 0 && (
            <TransferTripGroup title="Chuyến 2 chặng" trips={result.transferTrips} onSelect={legs => beginSeatSelection(legs)} />
          )}
          {/* Triple Trips */}
          {result.tripleTrips.length > 0 && (
            <TripleTripGroup title="Chuyến 3 chặng" trips={result.tripleTrips} onSelect={legs => beginSeatSelection(legs)} />
          )}
          {result.directTrips.length===0 && result.transferTrips.length===0 && result.tripleTrips.length===0 && (
            <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] text-center text-gray-500 dark:text-gray-400">Không có chuyến phù hợp</div>
          )}
        </div>
      )}

      {/* Seat selection */}
      {selectedLegs && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedLegs(null); setSeatsByLeg({}); setSelectedSeatsByLeg({}); }} className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">← Quay lại kết quả</button>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chọn ghế</h2>
          </div>
          <div className="space-y-8">
            <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]">
              <p className="text-sm text-gray-600 dark:text-gray-400">Hành trình: {selectedLegs[0].fromLocation} → {selectedLegs[selectedLegs.length-1].endLocation} • {selectedLegs.length} chặng</p>
              {seatLoading && <div className="mt-4 text-gray-500 dark:text-gray-400">Đang tải sơ đồ ghế...</div>}
              {seatError && <div className="mt-4 text-red-600 dark:text-red-400 text-sm">{seatError}</div>}
            </div>
            {selectedLegs.map((leg, idx) => {
              const seats = seatsByLeg[leg.id];
              const selected = selectedSeatsByLeg[leg.id] || [];
              return (
                <div key={leg.id} className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03]">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Chặng {idx+1}: {leg.fromLocation} → {leg.endLocation}</h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(leg.timeStart).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
                      {' - '}
                      {new Date(leg.timeEnd).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                  {!seats && seatLoading && <div className="text-gray-500 dark:text-gray-400">Đang tải ghế...</div>}
                  {seats && (
                    <>
                      <div className="grid gap-2 grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
                        {seats.map(seat => {
                          const active = selected.includes(seat.seatId);
                          return (
                            <button
                              key={seat.id+seat.seatId}
                              disabled={!seat.isAvailable}
                              onClick={() => toggleSeat(leg.id, seat.seatId, seat.isAvailable)}
                              className={`h-10 text-xs font-medium rounded-md border flex items-center justify-center transition
                                ${!seat.isAvailable ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : active ? 'bg-pink-600 text-white border-pink-600 shadow' : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-pink-500 hover:text-pink-600'}
                              `}
                            >{seat.seatId}</button>
                          );
                        })}
                      </div>
                      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">Ghế đã chọn: {selected.length>0 ? selected.join(', ') : 'Chưa chọn'}</div>
                    </>
                  )}
                </div>
              );
            })}
            <div className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-white/[0.03] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">Tổng số chặng: {selectedLegs.length} • Tất cả đã chọn ghế: {allLegsHaveSeat ? '✔' : '✖'} • Tổng giá: <span className="font-semibold text-pink-600 dark:text-pink-400">{totalPrice.toLocaleString('vi-VN')}₫</span></div>
              <div className="flex gap-3">
                <button disabled={!allLegsHaveSeat} onClick={proceedToCheckout} className="px-6 py-2 rounded-lg bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium hover:bg-pink-700">Tiếp tục thanh toán</button>
              </div>
            </div>
            {showCheckout && (
              <div className="p-6 rounded-2xl border border-pink-200 dark:border-pink-800 bg-white dark:bg-gray-900 space-y-5">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Xác nhận & Thanh toán (Tại quầy)</h3>
                <div className="space-y-3 text-sm">
                  {selectedLegs.map((leg, idx) => (
                    <div key={leg.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="font-medium text-gray-800 dark:text-gray-200">Chặng {idx+1}: {leg.fromLocation} → {leg.endLocation}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{new Date(leg.timeStart).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit'})} - {new Date(leg.timeEnd).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Ghế: {(selectedSeatsByLeg[leg.id] || []).join(', ')}</div>
                      <div className="text-xs text-pink-600 dark:text-pink-400 font-semibold mt-1">Giá chặng: {leg.price.toLocaleString('vi-VN')}₫</div>
                    </div>
                  ))}
                  <div className="pt-3 flex justify-between text-sm border-t border-gray-200 dark:border-gray-700">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Tổng cộng</span>
                    <span className="font-semibold text-pink-600 dark:text-pink-400">{totalPrice.toLocaleString('vi-VN')}₫</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Nhân viên đặt vé: <span className="font-medium text-gray-700 dark:text-gray-300">{user?.fullName} (ID: {user?.id})</span></div>
                {bookingResult && (
                  <div className={`text-sm font-medium ${bookingResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{bookingResult.message}</div>
                )}
                <div className="flex gap-3">
                  <button disabled={bookingLoading} onClick={submitReservation} className="px-6 py-2 rounded-lg bg-pink-600 disabled:opacity-50 text-white font-medium hover:bg-pink-700 flex items-center gap-2">
                    {bookingLoading && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>}
                    Xác nhận đặt vé
                  </button>
                  <button disabled={bookingLoading} onClick={() => { setShowCheckout(false); setBookingResult(null); }} className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Huỷ</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function TripCard({ trip, onSelect }: { trip: TripSearchTrip; onSelect?: (t: TripSearchTrip) => void }) {
  return (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-gray-900 dark:text-white">{trip.tripId}</h4>
        <span className="text-pink-600 dark:text-pink-400 font-semibold">{trip.price.toLocaleString('vi-VN')}₫</span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-300">
        {trip.fromLocation} → {trip.endLocation}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {new Date(trip.timeStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        {' - '}
        {new Date(trip.timeEnd).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
      </div>
      {trip.routeDescription && <div className="text-xs text-gray-400 line-clamp-2">{trip.routeDescription}</div>}
  <button onClick={() => onSelect && onSelect(trip)} className="mt-2 inline-flex justify-center px-3 py-1.5 rounded-md bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium">Chọn</button>
    </div>
  );
}

function TripGroup({ title, trips, onSelect }: { title: string; trips: TripSearchTrip[]; onSelect?: (t: TripSearchTrip) => void }) {
  return (
    <div>
      <h3 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">{title} ({trips.length})</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {trips.map(t => <TripCard key={t.id} trip={t} onSelect={onSelect} />)}
      </div>
    </div>
  );
}

function TransferTripGroup({ title, trips, onSelect }: { title: string; trips: TransferTripItem[]; onSelect?: (legs: TripSearchTrip[]) => void }) {
  return (
    <div>
      <h3 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">{title} ({trips.length})</h3>
      <div className="space-y-4">
        {trips.map((t, idx) => (
          <MultiLegTripCard key={idx} legs={[t.firstTrip, t.secondTrip]} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function TripleTripGroup({ title, trips, onSelect }: { title: string; trips: TripleTripItem[]; onSelect?: (legs: TripSearchTrip[]) => void }) {
  return (
    <div>
      <h3 className="mb-3 font-semibold text-gray-800 dark:text-gray-200">{title} ({trips.length})</h3>
      <div className="space-y-4">
        {trips.map((t, idx) => (
          <MultiLegTripCard key={idx} legs={[t.firstTrip, t.secondTrip, t.thirdTrip]} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function MultiLegTripCard({ legs, onSelect }: { legs: TripSearchTrip[]; onSelect?: (legs: TripSearchTrip[]) => void }) {
  const first = legs[0];
  const last = legs[legs.length - 1];
  const totalPrice = legs.reduce((sum, l) => sum + (l.price || 0), 0);
  const departure = new Date(first.timeStart);
  const arrival = new Date(last.timeEnd);
  const totalMinutes = Math.round((arrival.getTime() - departure.getTime()) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const layovers = legs.length > 1 ? legs.slice(0, -1).map((l, i) => {
    const next = legs[i + 1];
    const gap = Math.round((new Date(next.timeStart).getTime() - new Date(l.timeEnd).getTime()) / 60000);
    return gap;
  }) : [];

  return (
    <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-white/[0.05] space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white">{first.fromLocation} → {last.endLocation}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{legs.length} chặng • Thời gian tổng: {hours}h{mins>0?`${mins}`:''}</p>
          {layovers.length > 0 && (
            <p className="text-[11px] text-gray-400">{layovers.map((g,i)=>`Trung chuyển ${i+1}: ${g} phút`).join(' • ')}</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500 dark:text-gray-400">Giờ đi / đến</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {departure.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})} - {arrival.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
          </div>
        </div>
        <div className="text-right min-w-[110px]">
          <div className="text-xs text-gray-500 dark:text-gray-400">Tổng giá</div>
            <div className="text-pink-600 dark:text-pink-400 font-semibold">{totalPrice.toLocaleString('vi-VN')}₫</div>
        </div>
        <div>
          <button onClick={() => onSelect && onSelect(legs)} className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium w-full md:w-auto">Chọn</button>
        </div>
      </div>
      <div className="space-y-3">
        {legs.map((leg, i) => (
          <div key={leg.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg border border-gray-100 dark:border-gray-800 p-3 bg-gray-50 dark:bg-gray-800/40">
            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">Chặng {i+1}: {leg.tripId}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400 flex-1">{leg.fromLocation} → {leg.endLocation}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(leg.timeStart).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
              {' - '}
              {new Date(leg.timeEnd).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}
            </div>
            <div className="text-xs text-pink-600 dark:text-pink-400 font-semibold">{leg.price.toLocaleString('vi-VN')}₫</div>
          </div>
        ))}
      </div>
    </div>
  );
}
