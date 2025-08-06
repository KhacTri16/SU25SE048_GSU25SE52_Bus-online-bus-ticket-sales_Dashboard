import TicketMetrics from "../../components/xetiic/TicketMetrics";
import RevenueChart from "../../components/xetiic/RevenueChart";
import BookingStatusChart from "../../components/xetiic/BookingStatusChart";
import RoutesList from "../../components/xetiic/RoutesList";
import RecentBookings from "../../components/xetiic/RecentBookings";
import PageMeta from "../../components/common/PageMeta";
import AdminInfo from "../../components/auth/AdminInfo";
import { useAuth } from "../../context/AuthContext";

export default function XeTiicDashboard() {
  const { user, isAdmin } = useAuth();

  return (
    <>
      <PageMeta
        title="XeTiic Dashboard - Hệ thống bán vé xe khách"
        description="Dashboard quản lý hệ thống bán vé xe khách XeTiic"
      />
      
      {/* Admin Info Section - Only show for first-time login or admin */}
      {user && (isAdmin() || user.role === 'manager') && (
        <div className="mb-8">
          <AdminInfo />
        </div>
      )}
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard Hệ thống XeTiic �
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Theo dõi và quản lý hệ thống bán vé xe khách
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Metrics */}
        <div className="col-span-12">
          <TicketMetrics />
        </div>

        {/* Revenue Chart */}
        <div className="col-span-12 xl:col-span-8">
          <RevenueChart />
        </div>

        {/* Booking Status Chart */}
        <div className="col-span-12 xl:col-span-4">
          <BookingStatusChart />
        </div>

        {/* Routes List */}
        <div className="col-span-12 xl:col-span-7">
          <RoutesList />
        </div>

        {/* Recent Bookings */}
        <div className="col-span-12 xl:col-span-5">
          <RecentBookings />
        </div>
      </div>
    </>
  );
}
