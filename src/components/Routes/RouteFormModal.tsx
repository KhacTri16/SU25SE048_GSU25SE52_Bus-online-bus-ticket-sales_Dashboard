import { useState, useEffect } from "react";
import { Route, CreateRouteRequest, UpdateRouteRequest, Company, Location } from "../../types/company";
import { companyService, locationService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

interface RouteFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateRouteRequest | UpdateRouteRequest) => Promise<void>;
  route?: Route | null;
  title: string;
}

export default function RouteFormModal({ isOpen, onClose, onSubmit, route, title }: RouteFormModalProps) {
  const { isAdmin, isCompanyRestricted, getUserCompanyId } = useAuth();
  const [formData, setFormData] = useState({
    routeId: '',
    fromLocation: '',
    toLocation: '',
    fromLocationId: 0,
    toLocationId: 0,
    duration: 0,
    distance: 0,
    description: '',
    companyId: 0,
  });
  const [license, setLicense] = useState<File | undefined>(undefined);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
      fetchLocations();
      if (route) {
        setFormData({
          routeId: route.routeId,
          fromLocation: route.fromLocation,
          toLocation: route.toLocation,
          fromLocationId: 0,
          toLocationId: 0,
          duration: route.duration,
          distance: route.distance,
          description: route.description,
          companyId: 0, // We'll need to match company name to ID
        });
      } else {
        resetForm();
      }
    }
  }, [isOpen, route]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await companyService.getAllCompanies(1, 100);
      
      // If user is company-restricted, filter companies to only show their company
      let filteredCompanies = response.data;
      if (isCompanyRestricted()) {
        const userCompanyId = getUserCompanyId();
        if (userCompanyId) {
          filteredCompanies = response.data.filter(company => company.id === userCompanyId);
          
          // Auto-set company ID for company-restricted users
          if (filteredCompanies.length > 0) {
            setFormData(prev => ({
              ...prev,
              companyId: userCompanyId
            }));
          }
        }
      }
      
      setCompanies(filteredCompanies);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await locationService.getAllLocations();
      setLocations(response.data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    const userCompanyId = getUserCompanyId();
    setFormData({
      routeId: '',
      fromLocation: '',
      toLocation: '',
      fromLocationId: 0,
      toLocationId: 0,
      duration: 0,
      distance: 0,
      description: '',
      companyId: isCompanyRestricted() && userCompanyId ? userCompanyId : 0,
    });
  setLicense(undefined);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.routeId.trim()) {
      newErrors.routeId = 'Mã tuyến là bắt buộc';
    }
    if (!formData.fromLocationId) {
      newErrors.fromLocationId = 'Điểm đi là bắt buộc';
    }
    if (!formData.toLocationId) {
      newErrors.toLocationId = 'Điểm đến là bắt buộc';
    }
    if (formData.duration <= 0) {
      newErrors.duration = 'Thời gian phải lớn hơn 0';
    }
    if (formData.distance <= 0) {
      newErrors.distance = 'Khoảng cách phải lớn hơn 0';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Mô tả là bắt buộc';
    }
    if (formData.companyId <= 0) {
      newErrors.companyId = 'Vui lòng chọn công ty';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const fromLocationName = locations.find(l => l.id === formData.fromLocationId)?.name || '';
      const toLocationName = locations.find(l => l.id === formData.toLocationId)?.name || '';
      const submitData: CreateRouteRequest | UpdateRouteRequest = {
        ...formData,
        fromLocation: fromLocationName,
        toLocation: toLocationName,
        license,
      };
      await onSubmit(submitData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
  setLicense(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mã tuyến */}
              <div onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mã tuyến <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.routeId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="VD: HN-HCM-001"
                />
                {errors.routeId && <p className="mt-1 text-sm text-red-500">{errors.routeId}</p>}
              </div>

              {/* Công ty - Only show for admin or if user is not company-restricted */}
              {isAdmin() || !isCompanyRestricted() ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Công ty <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.companyId}
                    onChange={(e) => setFormData({ ...formData, companyId: parseInt(e.target.value) })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                      errors.companyId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={loading}
                  >
                    <option value={0}>Chọn công ty</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                  {errors.companyId && <p className="mt-1 text-sm text-red-500">{errors.companyId}</p>}
                </div>
              ) : (
                /* Show company info for company-restricted users */
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Công ty
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                    {companies.length > 0 ? companies[0].name : 'Đang tải...'}
                  </div>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Bạn chỉ có thể tạo tuyến đường cho công ty của mình
                  </p>
                </div>
              )}

              {/* Điểm đi */}
              <div onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Điểm đi <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.fromLocationId}
                  onChange={(e) => setFormData({ ...formData, fromLocationId: parseInt(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    (errors as any).fromLocationId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value={0}>Chọn điểm đi</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                {(errors as any).fromLocationId && <p className="mt-1 text-sm text-red-500">{(errors as any).fromLocationId}</p>}
              </div>

              {/* Điểm đến */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Điểm đến <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.toLocationId}
                  onChange={(e) => setFormData({ ...formData, toLocationId: parseInt(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    (errors as any).toLocationId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value={0}>Chọn điểm đến</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
                {(errors as any).toLocationId && <p className="mt-1 text-sm text-red-500">{(errors as any).toLocationId}</p>}
              </div>

              {/* Thời gian (phút) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thời gian (phút) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.duration ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="VD: 960"
                />
                {errors.duration && <p className="mt-1 text-sm text-red-500">{errors.duration}</p>}
              </div>

              {/* Khoảng cách (km) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Khoảng cách (km) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={formData.distance}
                  onChange={(e) => setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                    errors.distance ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="VD: 1650"
                />
                {errors.distance && <p className="mt-1 text-sm text-red-500">{errors.distance}</p>}
              </div>
            </div>

            {/* Mô tả */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                  errors.description ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Mô tả chi tiết về tuyến đường..."
              />
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
            </div>

            {/* File upload */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Giấy phép tuyến đường
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              {license && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Đã chọn: {license.name}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {submitting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {route ? 'Cập nhật' : 'Tạo mới'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}