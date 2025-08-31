import { useEffect, useState } from "react";
import {
  ArrowUpIcon,
  // ArrowDownIcon,
  BoxIconLine,
  GroupIcon,
  DollarLineIcon,
  CalenderIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useAuth } from "../../context/AuthContext";
import { ticketService, customerService, tripService, paymentService } from "../../services/api";

export default function TicketMetrics() {
  const { getUserCompanyId, isAdmin } = useAuth();
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalCustomers, setTotalCustomers] = useState<number>(0);
  const [totalTrips, setTotalTrips] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        if (isAdmin()) {
          // Admin: Fetch system-wide data
          console.log('Admin user detected, fetching system metrics...');
          
          // Fetch tickets for total count
          const tickets = await ticketService.getAllTickets();
          setTotalTickets(tickets.length);
          
          // Fetch system total revenue from payment service
          try {
            const revenueData = await paymentService.getAllCompaniesRevenue();
            setTotalRevenue(revenueData.totalRevenue);
            console.log('System total revenue:', revenueData.totalRevenue);
          } catch (error) {
            console.error('Error fetching system revenue, falling back to ticket calculation:', error);
            // Fallback to ticket calculation
            const revenue = tickets.reduce((sum, ticket) => {
              if (ticket.status === 0 || ticket.status === 5) {
                return sum + (ticket.price || 0);
              }
              return sum;
            }, 0);
            setTotalRevenue(revenue);
          }
          
          // Fetch all customers
          const customers = await customerService.getAllCustomers();
          setTotalCustomers(customers.length);
          
          // Fetch all trips
          const tripsResponse = await tripService.getAllTrips(0, 1000, true);
          setTotalTrips(tripsResponse.data?.length || 0);
          
        } else {
          // Non-admin: Fetch company-specific data
          const companyId = getUserCompanyId();
          console.log('Non-admin user detected, fetching company metrics for company ID:', companyId);
          
          if (!companyId) {
            console.warn('No company ID found for user');
            setTotalTickets(0);
            setTotalRevenue(0);
            setTotalCustomers(0);
            setTotalTrips(0);
            return;
          }
          
          // Fetch tickets and filter by company
          const tickets = await ticketService.getAllTickets();
          const filteredTickets = tickets.filter(ticket => 
            ticket.companyName && ticket.companyName.trim() !== ''
          );
          setTotalTickets(filteredTickets.length);
          
          // Fetch company revenue
          try {
            const companyRevenueData = await paymentService.getCompanyRevenueSummary(companyId);
            setTotalRevenue(companyRevenueData.totalRevenue);
            console.log('Company total revenue:', companyRevenueData.totalRevenue);
          } catch (error) {
            console.error('Error fetching company revenue, falling back to ticket calculation:', error);
            // Fallback to ticket calculation
            const revenue = filteredTickets.reduce((sum, ticket) => {
              if (ticket.status === 0 || ticket.status === 5) {
                return sum + (ticket.price || 0);
              }
              return sum;
            }, 0);
            setTotalRevenue(revenue);
          }
          
          // For non-admin, we'll show all customers (or could be filtered by company if needed)
          const customers = await customerService.getAllCustomers();
          setTotalCustomers(customers.length);
          
          // For non-admin, we'll show all trips (or could be filtered by company if needed)
          const tripsResponse = await tripService.getAllTrips(0, 1000, true);
          setTotalTrips(tripsResponse.data?.length || 0);
        }

      } catch (error) {
        console.error('Error fetching metrics:', error);
        // Set default values on error
        setTotalTickets(0);
        setTotalRevenue(0);
        setTotalCustomers(0);
        setTotalTrips(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetrics();
  }, [getUserCompanyId, isAdmin]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* Tổng vé */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl dark:bg-pink-900/20">
          <BoxIconLine className="text-pink-600 size-6 dark:text-pink-400" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isAdmin() ? "Tổng vé hệ thống" : "Tổng vé công ty"}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? '...' : totalTickets.toLocaleString('vi-VN')}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            {isLoading ? '...' : 'Active'}
          </Badge>
        </div>
      </div>

      {/* Tổng doanh thu */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl dark:bg-pink-900/20">
          <DollarLineIcon className="text-pink-600 size-6 dark:text-pink-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isAdmin() ? "Tổng doanh thu hệ thống" : "Tổng doanh thu công ty"}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? '...' : new Intl.NumberFormat('vi-VN').format(totalRevenue) + ' VNĐ'}
            </h4>
          </div>

          <Badge color="success">
            <ArrowUpIcon />
            {isLoading ? '...' : 'Revenue'}
          </Badge>
        </div>
      </div>

      {/* Tổng khách hàng */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl dark:bg-pink-900/20">
          <GroupIcon className="text-pink-600 size-6 dark:text-pink-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isAdmin() ? "Tổng khách hàng hệ thống" : "Tổng khách hàng"}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? '...' : totalCustomers.toLocaleString('vi-VN')}
            </h4>
          </div>

          <Badge color="success">
            <ArrowUpIcon />
            {isLoading ? '...' : 'Customers'}
          </Badge>
        </div>
      </div>

      {/* Tổng chuyến xe */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl dark:bg-pink-900/20">
          <CalenderIcon className="text-pink-600 size-6 dark:text-pink-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isAdmin() ? "Tổng chuyến xe hệ thống" : "Tổng chuyến xe"}
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {isLoading ? '...' : totalTrips.toLocaleString('vi-VN')}
            </h4>
          </div>

          <Badge color="success">
            <ArrowUpIcon />
            {isLoading ? '...' : 'Trips'}
          </Badge>
        </div>
      </div>
    </div>
  );
}
