import {
  ArrowUpIcon,
  ArrowDownIcon,
  BoxIconLine,
  GroupIcon,
  DollarLineIcon,
  CalenderIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

export default function TicketMetrics() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* Vé đã bán hôm nay */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl dark:bg-pink-900/20">
          <BoxIconLine className="text-pink-600 size-6 dark:text-pink-400" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Vé đã bán hôm nay
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              247
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            +15.2%
          </Badge>
        </div>
      </div>

      {/* Doanh thu hôm nay */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl dark:bg-pink-900/20">
          <DollarLineIcon className="text-pink-600 size-6 dark:text-pink-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Doanh thu hôm nay
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              12.5M VNĐ
            </h4>
          </div>

          <Badge color="success">
            <ArrowUpIcon />
            +8.1%
          </Badge>
        </div>
      </div>

      {/* Khách hàng mới */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl dark:bg-pink-900/20">
          <GroupIcon className="text-pink-600 size-6 dark:text-pink-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Khách hàng mới
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              89
            </h4>
          </div>

          <Badge color="success">
            <ArrowUpIcon />
            +12.5%
          </Badge>
        </div>
      </div>

      {/* Chuyến xe hôm nay */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl dark:bg-pink-900/20">
          <CalenderIcon className="text-pink-600 size-6 dark:text-pink-400" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Chuyến xe hôm nay
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              45
            </h4>
          </div>

          <Badge color="error">
            <ArrowDownIcon />
            -2.4%
          </Badge>
        </div>
      </div>
    </div>
  );
}
