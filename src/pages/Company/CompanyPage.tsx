import CompanyList from "../../components/company/CompanyList";
import PageMeta from "../../components/common/PageMeta";
import RoleAccessNotice from "../../components/common/RoleAccessNotice";

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

      {/* Role Access Notice */}
      <RoleAccessNotice />

      {/* Company List */}
      <div className="col-span-12 lg:col-span-9">
        <CompanyList />
      </div>
      
    </>
  );
}
