import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { systemUserService, companyService } from "../../services/api";
import { Company } from "../../types/company";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";

interface CreateUserFormData {
  Email: string;
  FullName: string;
  Phone: string;
  Address: string;
  CompanyId: number;
  Password: string;
  Role: number;
  Avartar?: File;
}

interface CreateUserFormProps {
  onSuccess?: () => void;
}

export default function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const { isAdmin, isManager, isCompanyRestricted, getUserCompanyId } = useAuth();
  const navigate = useNavigate();
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [formData, setFormData] = useState<CreateUserFormData>({
    Email: "",
    FullName: "",
    Phone: "",
    Address: "",
    CompanyId: 0,
    Password: "",
    Role: 0
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Preset for Manager: fixed to company and role=3 (Staff)
    if (isCompanyRestricted()) {
      const managerCompanyId = getUserCompanyId() || 0;
      setFormData(prev => ({
        ...prev,
        CompanyId: managerCompanyId,
        Role: 3,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await companyService.getAllCompanies(1, 100);
      
      // If user is company-restricted (Manager), only show their company
      let filteredCompanies = response.data;
      if (isCompanyRestricted()) {
        const userCompanyId = getUserCompanyId();
        if (userCompanyId) {
          filteredCompanies = response.data.filter(company => company.id === userCompanyId);
          
          // Auto-set company ID for company-restricted users
          if (filteredCompanies.length > 0) {
            setFormData(prev => ({
              ...prev,
              CompanyId: userCompanyId
            }));
          }
        }
      }
      
      setCompanies(filteredCompanies || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Không thể tải danh sách công ty. Vui lòng thử lại.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        Avartar: file
      }));
    }
  };

  const validateForm = () => {
    if (!formData.Email || !formData.FullName || !formData.Phone || !formData.Address || !formData.Password) {
      setError("Vui lòng điền đầy đủ thông tin bắt buộc");
      return false;
    }

    if (!formData.CompanyId) {
      setError("Vui lòng chọn công ty");
      return false;
    }

    if (!formData.Role) {
      setError("Vui lòng chọn vai trò");
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.Email)) {
      setError("Email không hợp lệ");
      return false;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.Phone)) {
      setError("Số điện thoại không hợp lệ (10-11 số)");
      return false;
    }

    // Password validation
    if (formData.Password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return false;
    }

    // Role validation based on current user's role
    if (isAdmin()) {
      // Admin: only create Manager (2)
      if (formData.Role !== 2) {
        setError("Admin chỉ có thể tạo tài khoản Manager");
        return false;
      }
    } else if (isManager()) {
      // Manager: can create Staff (3), Driver (4), Seller (5)
      if (![3, 4, 5].includes(formData.Role)) {
        setError("Manager chỉ có thể tạo tài khoản Staff, Driver hoặc Seller");
        return false;
      }
      // Manager must create within their own company
      const managerCompanyId = getUserCompanyId();
      if (!managerCompanyId || formData.CompanyId !== managerCompanyId) {
        setError("Manager chỉ có thể tạo tài khoản cho công ty của mình");
        return false;
      }
    } else {
      setError("Bạn không có quyền tạo tài khoản");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await systemUserService.createUser(formData);
      setSuccess("Tạo tài khoản thành công!");
      
      // Reset form
      setFormData({
        Email: "",
        FullName: "",
        Phone: "",
        Address: "",
        CompanyId: isCompanyRestricted() ? getUserCompanyId() || 0 : 0,
        Password: "",
        Role: isCompanyRestricted() ? 3 : 0,
      });
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      } else {
        // Auto hide success message after 3 seconds
        setTimeout(() => {
          setSuccess("");
        }, 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Tạo tài khoản thất bại. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleOptions = () => {
    try {
      if (isAdmin()) {
        return [
          { value: 2, label: "Manager" }
        ];
      } else if (isManager()) {
        return [
          { value: 3, label: "Staff" },
          { value: 4, label: "Driver" },
          { value: 5, label: "Seller" }
        ];
      }
      return [];
    } catch (error) {
      console.error('Error getting role options:', error);
      return [];
    }
  };

  const getPageTitle = () => {
    if (isAdmin()) {
      return "Tạo tài khoản Manager";
    } else if (isManager()) {
      return "Tạo tài khoản cho công ty";
    }
    return "Tạo tài khoản";
  };

  const getPageDescription = () => {
    if (isAdmin()) {
      return "Admin tạo tài khoản Manager cho hệ thống";
    } else if (isManager()) {
      return "Tạo tài khoản Staff / Driver / Seller cho công ty của bạn";
    }
    return "Tạo tài khoản mới";
  };

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
      {!onSuccess && (
        <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <ChevronLeftIcon className="size-5" />
            Quay lại
          </button>
        </div>
      )}
      
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getPageDescription()}
            </p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <Label htmlFor="Email">Email <span className="text-red-500">*</span></Label>
              <Input
                type="email"
                name="Email"
                value={formData.Email}
                onChange={handleChange}
                placeholder="example@gmail.com"
                required
              />
            </div>

            {/* Full Name */}
            <div>
              <Label htmlFor="FullName">Họ và tên <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                name="FullName"
                value={formData.FullName}
                onChange={handleChange}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="Phone">Số điện thoại <span className="text-red-500">*</span></Label>
              <Input
                type="tel"
                name="Phone"
                value={formData.Phone}
                onChange={handleChange}
                placeholder="0909090909"
                required
              />
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="Address">Địa chỉ <span className="text-red-500">*</span></Label>
              <Input
                type="text"
                name="Address"
                value={formData.Address}
                onChange={handleChange}
                placeholder="123 Đường ABC, Quận 1, TP.HCM"
                required
              />
            </div>

            {/* Company Selection - Only show for Admin */}
            {isAdmin() && (
              <div>
                <Label htmlFor="CompanyId">Công ty <span className="text-red-500">*</span></Label>
                <Select
                  options={(companies || []).map(company => ({
                    value: company.id.toString(),
                    label: company.name
                  }))}
                  placeholder="Chọn công ty"
                  value={formData.CompanyId ? formData.CompanyId.toString() : ""}
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      CompanyId: parseInt(value) || 0
                    }));
                  }}
                />
              </div>
            )}

            {/* Company Info for Manager */}
            {isCompanyRestricted() && (
              <div>
                <Label htmlFor="CompanyId">Công ty</Label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                  {companies.length > 0 ? companies[0].name : 'Đang tải...'}
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Bạn chỉ có thể tạo tài khoản cho công ty của mình
                </p>
              </div>
            )}

            {/* Role Selection */}
            {isAdmin() ? (
              <div>
                <Label htmlFor="Role">Vai trò <span className="text-red-500">*</span></Label>
                <Select
                  options={(getRoleOptions() || []).map(role => ({
                    value: role.value.toString(),
                    label: role.label
                  }))}
                  placeholder="Chọn vai trò"
                  value={formData.Role ? formData.Role.toString() : ""}
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      Role: parseInt(value) || 0
                    }));
                  }}
                />
              </div>
            ) : isManager() ? (
              <div>
                <Label htmlFor="Role">Vai trò <span className="text-red-500">*</span></Label>
                <Select
                  options={(getRoleOptions() || []).map(role => ({
                    value: role.value.toString(),
                    label: role.label
                  }))}
                  placeholder="Chọn vai trò"
                  value={formData.Role ? formData.Role.toString() : ""}
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      Role: parseInt(value) || 0
                    }));
                  }}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="Role">Vai trò</Label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                  —
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <Label htmlFor="Password">Mật khẩu <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  name="Password"
                  value={formData.Password}
                  onChange={handleChange}
                  placeholder="Nhập mật khẩu"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeCloseIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Avatar Upload */}
            <div>
              <Label htmlFor="Avartar">Ảnh đại diện</Label>
              <input
                type="file"
                name="Avartar"
                onChange={handleFileChange}
                accept="image/*"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Chọn ảnh đại diện (tùy chọn)
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-pink-600 hover:bg-pink-700 disabled:bg-pink-400 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
            >
              {loading ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
