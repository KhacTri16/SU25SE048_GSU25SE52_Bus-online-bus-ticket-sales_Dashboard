import { useEffect, useState } from "react";
import { ticketService } from "../../services/api";

type BookingRow = {
  id: string;
  customerName: string;
  route: string;
  departureTime: string;
  date: string;
  seatNumber: string;
  price: string;
  status: "confirmed" | "pending" | "cancelled";
};

export default function RecentBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoading(true);
      try {
        const tickets = await ticketService.getAllTickets();
        // Sort by createDate desc and take latest 5
        tickets.sort((a, b) => new Date(b.createDate).getTime() - new Date(a.createDate).getTime());
        const latest = tickets.slice(0, 5).map(t => {
          let status: "confirmed" | "pending" | "cancelled";
          if (t.status === 0 || t.status === 5) {
            status = "confirmed";
          } else if (t.status === 2) {
            status = "cancelled";
          } else {
            status = "pending";
          }
          
          return {
            id: t.ticketId,
            customerName: t.customerName,
            route: `${t.fromTripStation} - ${t.toTripStation}`,
            departureTime: new Date(t.timeStart).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(t.timeStart).toLocaleDateString('vi-VN'),
            seatNumber: t.seatId,
            price: new Intl.NumberFormat('vi-VN').format(t.price),
            status: status,
          };
        });
        setBookings(latest);
      } catch (e) {
        console.error('Error fetching recent bookings:', e);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Đã xác nhận</span>;
      case "pending":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Chờ xử lý</span>;
      case "cancelled":
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Đã hủy</span>;
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Đặt vé gần đây
        </h3>
        <button className="text-sm font-medium text-pink-600 hover:text-pink-700 dark:text-pink-400">
          Xem tất cả
        </button>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Đang tải...</div>
        ) : bookings.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 dark:text-gray-400">Chưa có đặt vé nào gần đây</div>
        ) : bookings.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg dark:bg-gray-900/50">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center dark:bg-pink-900/20">
                  <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                    {booking.customerName?.charAt(0) || 'C'}
                  </span>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {booking.customerName}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    #{booking.id}
                  </span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {booking.route}
                  </p>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {booking.date} {booking.departureTime}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Ghế {booking.seatNumber}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {booking.price} VNĐ
                </p>
                {getStatusBadge(booking.status)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
