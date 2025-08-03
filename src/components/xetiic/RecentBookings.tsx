import { useState } from "react";

const recentBookings = [
  {
    id: "TK001",
    customerName: "Nguyễn Văn A",
    route: "Hà Nội - TP.HCM",
    departureTime: "06:00",
    date: "30/07/2025",
    seatNumber: "A12",
    price: "650,000",
    status: "confirmed"
  },
  {
    id: "TK002", 
    customerName: "Trần Thị B",
    route: "Hà Nội - Đà Nẵng",
    departureTime: "07:30",
    date: "30/07/2025",
    seatNumber: "B08",
    price: "450,000",
    status: "confirmed"
  },
  {
    id: "TK003",
    customerName: "Lê Văn C",
    route: "TP.HCM - Đà Lạt",
    departureTime: "08:00",
    date: "31/07/2025",
    seatNumber: "C15",
    price: "320,000",
    status: "pending"
  },
  {
    id: "TK004",
    customerName: "Phạm Thị D",
    route: "Hà Nội - Hải Phòng",
    departureTime: "09:15",
    date: "30/07/2025",
    seatNumber: "D05",
    price: "180,000",
    status: "confirmed"
  },
  {
    id: "TK005",
    customerName: "Hoàng Văn E",
    route: "TP.HCM - Vũng Tàu",
    departureTime: "10:30",
    date: "30/07/2025",
    seatNumber: "E22",
    price: "150,000",
    status: "cancelled"
  }
];

export default function RecentBookings() {
  const [bookings] = useState(recentBookings);

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
        {bookings.map((booking) => (
          <div key={booking.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg dark:bg-gray-900/50">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center dark:bg-pink-900/20">
                  <span className="text-sm font-medium text-pink-600 dark:text-pink-400">
                    {booking.customerName.charAt(0)}
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
