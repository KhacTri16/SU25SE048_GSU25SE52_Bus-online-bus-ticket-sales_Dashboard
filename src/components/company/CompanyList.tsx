import { useState, useEffect } from 'react';
import { Company } from '../../types/company';
import { companyService } from '../../services/api';

export default function CompanyList() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiInfo, setApiInfo] = useState<{totalCount: number, totalPage: number} | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching companies...');
        
        // Thử gọi API
        const response = await companyService.getAllCompanies(1, 50);
        console.log('Companies response:', response);
        
        setCompanies(response.data || []);
        setApiInfo({
          totalCount: response.totalCount,
          totalPage: response.totalPage
        });
      } catch (err: any) {
        console.error('Error details:', err);
        let errorMessage = 'Không thể tải danh sách công ty. ';
        
        if (err.response) {
          errorMessage += `Server error: ${err.response.status} - ${err.response.statusText}`;
        } else if (err.request) {
          errorMessage += 'Không thể kết nối đến server.';
        } else {
          errorMessage += err.message;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const getStatusBadge = (status: number) => {
    return status === 1 ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
        Hoạt động
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
        Không hoạt động
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
          <span className="ml-2 text-gray-600 dark:text-gray-400">Đang tải...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌</div>
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <details className="text-left text-sm text-gray-600 dark:text-gray-400 mb-4">
            <summary className="cursor-pointer">Chi tiết lỗi</summary>
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded">
              <p>Endpoint: https://bobts-server-e7dxfwh7e5g9e3ad.malaysiawest-01.azurewebsites.net/api/Company/GetAllCompanyy</p>
              <p>Parameters: Page=1, Amount=50, All=true</p>
            </div>
          </details>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Danh sách công ty vận tải
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {apiInfo ? `Tổng số: ${apiInfo.totalCount} công ty (${apiInfo.totalPage} trang)` : `Tổng số: ${companies.length} công ty`}
          </p>
        </div>
        <button className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm font-medium mr-2">
          Thêm công ty mới
        </button>
        <button 
          onClick={() => {
            setLoading(true);
            setError(null);
            companyService.getAllCompanies(1, 50)
              .then(res => {
                setCompanies(res.data || []);
                setApiInfo({totalCount: res.totalCount, totalPage: res.totalPage});
                setLoading(false);
              })
              .catch(err => {
                setError(`API Error: ${err.message}`);
                setLoading(false);
              });
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          🔄 Test API
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Công ty
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Liên hệ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Địa chỉ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Tỷ lệ phần trăm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                Ngày tạo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 dark:bg-transparent dark:divide-gray-800">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-12 w-12">
                      {company.logo ? (
                        <img
                          className="h-12 w-12 rounded-lg object-cover"
                          src={company.logo}
                          alt={company.name}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`h-12 w-12 rounded-lg bg-pink-100 flex items-center justify-center ${company.logo ? 'hidden' : ''}`}>
                        <span className="text-pink-600 font-semibold text-lg">
                          {company.name.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {company.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {company.companyId}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    {company.phone}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {company.website}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {company.address}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 dark:text-white">
                    Min: {company.minPercent}%
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Max: {company.maxPercent}%
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(company.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(company.createAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {companies.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">Không có dữ liệu công ty</p>
        </div>
      )}
    </div>
  );
}
