import CompanyList from "../../components/company/CompanyList";
import PageMeta from "../../components/common/PageMeta";

export default function CompanyPage() {
  return (
    <>
      <PageMeta
        title="Quản lý công ty - XeTiic Dashboard"
        description="Danh sách và quản lý các công ty vận tải trong hệ thống XeTiic"
      />
      
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Quản lý công ty vận tải 🏢
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Danh sách các công ty đối tác trong hệ thống XeTiic
        </p>
      </div>

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Company Statistics */}
        <div className="col-span-12 lg:col-span-3">
          <div className="grid grid-cols-1 gap-4">
            {/* Total Companies */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-xl dark:bg-pink-900/20 mb-4">
                <span className="text-pink-600 text-2xl">🏢</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Tổng công ty
                </span>
                <h4 className="mt-1 font-bold text-gray-800 text-xl dark:text-white/90">
                  13
                </h4>
              </div>
            </div>

            {/* Active Companies */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl dark:bg-green-900/20 mb-4">
                <span className="text-green-600 text-2xl">✅</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Đang hoạt động
                </span>
                <h4 className="mt-1 font-bold text-gray-800 text-xl dark:text-white/90">
                  13
                </h4>
              </div>
            </div>

            {/* New This Month */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl dark:bg-blue-900/20 mb-4">
                <span className="text-blue-600 text-2xl">📈</span>
              </div>
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Mới tháng này
                </span>
                <h4 className="mt-1 font-bold text-gray-800 text-xl dark:text-white/90">
                  12
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* Company List */}
        <div className="col-span-12 lg:col-span-9">
          <CompanyList />
        </div>
      </div>
    </>
  );
}
