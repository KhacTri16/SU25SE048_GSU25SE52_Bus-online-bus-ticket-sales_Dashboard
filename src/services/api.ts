import axios from 'axios';
import { CompanyResponse, RouteResponse, CreateRouteRequest, UpdateRouteRequest, Customer, StationResponse, CreateStationRequest, UpdateStationRequest, Station, RoleResponse, CreateRoleRequest, UpdateRoleRequest, Role, BusResponse, LocationResponse, Company, TripResponse, CreateTripRequest, CreateCompanyRequest, Ticket, CompanySettlement } from '../types/company';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://bobts-server-e7dxfwh7e5g9e3ad.malaysiawest-01.azurewebsites.net';

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // Attach auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any)['Authorization'] = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.params);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);

export const companyService = {
  async getAllCompanies(page: number = 1, amount: number = 50): Promise<CompanyResponse> {
    try {
      const response = await api.get<CompanyResponse>('/api/Company/GetAllCompany', {
        params: {
          Page: page,
          Amount: amount,
          All: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  async getCompanyById(id: number): Promise<Company> {
    try {
      const response = await api.get<Company>(`/api/Company/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching company by ID:', error);
      throw error;
    }
  },

  async createCompany(data: CreateCompanyRequest): Promise<Company> {
    try {
      const formData = new FormData();
      // According to backend expects PascalCase keys
      if (data.companyId !== undefined) formData.append('CompanyId', data.companyId ?? '');
      if (data.name !== undefined) formData.append('Name', data.name ?? '');
      if (data.phone !== undefined) formData.append('Phone', data.phone ?? '');
      if (data.address !== undefined) formData.append('Address', data.address ?? '');
      if (data.website !== undefined) formData.append('Website', data.website ?? '');
      if (data.status !== undefined) formData.append('Status', String(data.status ?? 0));
      if (data.taxNumber !== undefined) formData.append('TaxNumber', data.taxNumber ?? '');
      if (data.description !== undefined) formData.append('Description', data.description ?? '');
      if (data.maxPercent !== undefined) formData.append('MaxPercent', String(data.maxPercent ?? 0));
      if (data.minPercent !== undefined) formData.append('MinPercent', String(data.minPercent ?? 0));
      if (data.logo) formData.append('Logo', data.logo);

      const response = await api.post<Company>('/api/Company', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  },
  
  async createSettlement(companyId: number, period: string): Promise<CompanySettlement> {
    try {
      const response = await api.post<CompanySettlement>(`/api/CompanySettlements/${companyId}`, null, {
        params: { period },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating company settlement:', error);
      throw error;
    }
  },

  async getCompanySettlements(companyId: number): Promise<CompanySettlement[]> {
    try {
      const response = await api.get<CompanySettlement[]>(`/api/CompanySettlements/${companyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching company settlements:', error);
      throw error;
    }
  },
};

export const routeService = {
  async getAllRoutes(page: number = 0, amount: number = 10, all: boolean = true): Promise<RouteResponse> {
    try {
      const response = await api.get<RouteResponse>('/api/Route', {
        params: {
          Page: page,
          Amount: amount,
          All: all
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching routes:', error);
      throw error;
    }
  },

  async createRoute(routeData: CreateRouteRequest): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('RouteId', routeData.routeId);
      if (routeData.fromLocationId) {
        formData.append('FromLocationId', routeData.fromLocationId.toString());
      } else {
        formData.append('FromLocation', routeData.fromLocation);
      }
      if (routeData.toLocationId) {
        formData.append('ToLocationId', routeData.toLocationId.toString());
      } else {
        formData.append('ToLocation', routeData.toLocation);
      }
      formData.append('Duration', routeData.duration.toString());
      formData.append('Distance', routeData.distance.toString());
      formData.append('Description', routeData.description);
      formData.append('CompanyId', routeData.companyId.toString());
      
      if (routeData.license) {
        formData.append('License', routeData.license);
      }

      const response = await api.post('/api/Route', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating route:', error);
      throw error;
    }
  },

  async updateRoute(id: number, routeData: UpdateRouteRequest): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('RouteId', routeData.routeId);
      if (routeData.fromLocationId) {
        formData.append('FromLocationId', routeData.fromLocationId.toString());
      } else {
        formData.append('FromLocation', routeData.fromLocation);
      }
      if (routeData.toLocationId) {
        formData.append('ToLocationId', routeData.toLocationId.toString());
      } else {
        formData.append('ToLocation', routeData.toLocation);
      }
      formData.append('Duration', routeData.duration.toString());
      formData.append('Distance', routeData.distance.toString());
      formData.append('Description', routeData.description);
      formData.append('CompanyId', routeData.companyId.toString());
      
      if (routeData.license) {
        formData.append('License', routeData.license);
      }

      const response = await api.put(`/api/Route/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error updating route:', error);
      throw error;
    }
  },

  async deleteRoute(id: number): Promise<any> {
    try {
      const response = await api.delete(`/api/Route/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting route:', error);
      throw error;
    }
  },
  
  async activateRoute(id: number): Promise<any> {
    try {
      const response = await api.post(`/api/Route/activate/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error activating route:', error);
      throw error;
    }
  },
};

export const customerService = {
  async getAllCustomers(): Promise<Customer[]> {
    try {
      const response = await api.get<Customer[]>('/api/Customers/GetAllCustomers', {
        params: {
          All: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching customers:', error);
      throw error;
    }
  },
};

export const stationService = {
  async getAllStations(): Promise<StationResponse> {
    try {
      const response = await api.get<StationResponse>('/api/Station', {
        params: {
          All: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching stations:', error);
      throw error;
    }
  },

  async getStationById(id: number): Promise<Station> {
    try {
      const response = await api.get<Station>(`/api/Station/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching station by id:', error);
      throw error;
    }
  },

  async createStation(stationData: CreateStationRequest): Promise<any> {
    try {
      const response = await api.post('/api/Station', stationData);
      return response.data;
    } catch (error) {
      console.error('Error creating station:', error);
      throw error;
    }
  },

  async updateStation(id: number, stationData: UpdateStationRequest): Promise<any> {
    try {
      const response = await api.put(`/api/Station/${id}`, stationData);
      return response.data;
    } catch (error) {
      console.error('Error updating station:', error);
      throw error;
    }
  },

  async deleteStation(id: number): Promise<any> {
    try {
      const response = await api.delete(`/api/Station/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting station:', error);
      throw error;
    }
  },
};

export const roleService = {
  async getAllRoles(): Promise<RoleResponse> {
    try {
      const response = await api.get<RoleResponse>('/api/Role');
      return response.data;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  async getRoleById(id: number): Promise<Role> {
    try {
      const response = await api.get<Role>(`/api/Role/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching role by id:', error);
      throw error;
    }
  },

  async createRole(roleData: CreateRoleRequest): Promise<any> {
    try {
      const response = await api.post('/api/Role', roleData);
      return response.data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  async updateRole(id: number, roleData: UpdateRoleRequest): Promise<any> {
    try {
      const response = await api.put(`/api/Role/${id}`, roleData);
      return response.data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  async deleteRole(id: number): Promise<any> {
    try {
      const response = await api.delete(`/api/Role/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  },
};

export const busService = {
  async getAllBuses(): Promise<BusResponse> {
    try {
      const response = await api.get<BusResponse>('/api/Bus', {
        params: {
          All: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching buses:', error);
      throw error;
    }
  },

  async getBusById(id: number): Promise<any> {
    try {
      const response = await api.get(`/api/Bus/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bus by id:', error);
      throw error;
    }
  },

  async createBus(busData: { name: string; numberPlate: string; typeBusId: number; companyId: number }): Promise<any> {
    try {
      const response = await api.post('/api/Bus', busData);
      return response.data;
    } catch (error) {
      console.error('Error creating bus:', error);
      throw error;
    }
  },

  async updateBus(id: number, busData: { name: string; numberPlate: string; typeBusId: number; companyId: number }): Promise<any> {
    try {
      const response = await api.put(`/api/Bus/${id}`, busData);
      return response.data;
    } catch (error) {
      console.error('Error updating bus:', error);
      throw error;
    }
  },

  async deleteBus(id: number): Promise<any> {
    try {
      const response = await api.delete(`/api/Bus/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting bus:', error);
      throw error;
    }
  },
};

export const locationService = {
  async getAllLocations(): Promise<LocationResponse> {
    try {
      const response = await api.get<LocationResponse>('/api/Location', {
        params: {
          All: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching locations:', error);
      throw error;
    }
  },
};

export const tripService = {
  async getAllTrips(page: number = 0, amount: number = 100, all: boolean = true): Promise<TripResponse> {
    try {
      const response = await api.get<TripResponse>('/api/Trip', {
        params: {
          Page: page,
          Amount: amount,
          All: all,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trips:', error);
      throw error;
    }
  },
  async createTrip(data: CreateTripRequest): Promise<any> {
    try {
      const response = await api.post('/api/Trip', data);
      return response.data;
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  },
};

// Ticket service
export const ticketService = {
  async getAllTickets(): Promise<Ticket[]> {
    try {
      const response = await api.get<Ticket[]>('/api/Ticket', {
        params: {
          All: true,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets:', error);
      throw error;
    }
  },
  async cancelTicket(ticketId: number): Promise<string> {
    try {
      const response = await api.put<string>(`/api/Ticket/cancel/${ticketId}`);
      return typeof response.data === 'string' ? response.data : 'Đã hủy vé';
    } catch (error) {
      console.error('Error canceling ticket:', error);
      throw error;
    }
  },
};

// Auth Service
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    companyId?: string;
    avatar?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface SystemUser {
  id: number;
  systemId: string;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  companyId: number;
  password: string;
  avartar: string;
  isActive: boolean;
  isDeleted: boolean;
  roleId: number;
}

export interface SystemUserLoginResponse {
  token: string;
  systemUser: SystemUser;
}

export interface SystemUserResponse {
  data: SystemUser[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
}

export interface RolePermissions {
  [roleId: number]: string[];
}

export const ROLE_PERMISSIONS: RolePermissions = {
  1: [ // Admin - Full access
    'dashboard.read',
    'company.read', 'company.write', 'company.delete',
    'routes.read', 'routes.write', 'routes.delete',
    'stations.read', 'stations.write', 'stations.delete',
    'locations.read', 'locations.write', 'locations.delete',
    'customers.read', 'customers.write', 'customers.delete',
    'buses.read', 'buses.write', 'buses.delete',
    'roles.read', 'roles.write', 'roles.delete',
    'users.read', 'users.write', 'users.delete',
    'reports.read', 'reports.write',
    'settings.read', 'settings.write'
  ],
  2: [ // Manager - Company-specific access
    'dashboard.read',
    'company.read',
    'routes.read', 'routes.write',
    'stations.read', 'stations.write',
    'locations.read', 'locations.write',
    'customers.read', 'customers.write',
    'buses.read', 'buses.write',
    'reports.read'
  ],
  3: [ // Staff - Limited access
    'dashboard.read',
    'routes.read',
    'stations.read',
    'locations.read',
    'customers.read', 'customers.write',
    'buses.read',
    // Allow staff to view reports per requirement
    'reports.read'
  ],
  4: [ // Driver - Read-only company data
    'dashboard.read',
    'routes.read',
    'reports.read'
  ],
  5: [ // Seller - Read-only company data
    'dashboard.read',
    'routes.read',
    'reports.read'
  ]
};

export const authService = {
  login: (credentials: LoginRequest): Promise<AuthResponse> => api.post('/auth/login', credentials),
  register: (data: RegisterRequest): Promise<AuthResponse> => api.post('/auth/register', data),
  logout: (): Promise<void> => api.post('/auth/logout'),
  refreshToken: (data: RefreshTokenRequest): Promise<AuthResponse> => api.post('/auth/refresh', data),
  forgotPassword: (email: string): Promise<void> => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string): Promise<void> => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string): Promise<void> => api.post('/auth/verify-email', { token }),
  changePassword: (currentPassword: string, newPassword: string): Promise<void> => 
    api.post('/auth/change-password', { currentPassword, newPassword }),
  getProfile: (): Promise<AuthResponse['user']> => api.get('/auth/profile'),
  updateProfile: (data: Partial<AuthResponse['user']>): Promise<AuthResponse['user']> => 
    api.put('/auth/profile', data),
  loginSystemUser: (credentials: { email: string; password: string }): Promise<SystemUserLoginResponse> =>
    api.post('/api/SystemUser/login', credentials).then(res => res.data),
};

// Payment/Revenue Service
export interface MonthlyRevenueResponse {
  companyId: number;
  year: number;
  month: number;
  revenue: number;
}

export interface CompanyRevenueData {
  companyId: number;
  companyName: string;
  totalRevenue: number;
  monthlyRevenue: number[];
}

export interface TotalRevenueResponse {
  totalRevenue: number;
  companiesRevenue: CompanyRevenueData[];
}

export const paymentService = {
  async getCompanyTotalRevenue(companyId: number): Promise<number> {
    try {
      console.log(`Fetching revenue for company ${companyId}...`);
      const response = await api.get<number>(`/api/Payment/company/revenue/total`, {
        params: { companyId },
      });
      console.log(`Company ${companyId} revenue:`, response.data);
      return typeof response.data === 'number' ? response.data : 0;
    } catch (error) {
      console.error(`Error fetching revenue for company ${companyId}:`, error);
      return 0;
    }
  },

  async getMonthlyRevenue(
    companyId: number,
    year: number,
    month: number
  ): Promise<MonthlyRevenueResponse> {
    try {
      console.log(`Fetching monthly revenue: /Payment/monthly-revenue/${companyId}/${year}/${month}`);
      const response = await api.get<MonthlyRevenueResponse>(
        `/Payment/monthly-revenue/${companyId}/${year}/${month}`
      );
      console.log(`Monthly revenue response for ${companyId}/${year}/${month}:`, response.data);
      return response.data;
    } catch (error) {
      console.warn(`Monthly revenue endpoint failed for ${companyId}/${year}/${month}:`, error);
      // Return default structure if endpoint fails
      return {
        companyId,
        year,
        month,
        revenue: 0
      };
    }
  },

  // New API for Admin to get total revenue of all companies
  async getAllCompaniesRevenue(): Promise<TotalRevenueResponse> {
    try {
      console.log('Fetching total revenue from API...');
      const response = await api.get<number>('/api/Payment/revenue/total');
      console.log('API Response:', response.data);
      
      // Since the API returns just a number (total revenue), we need to create the structure
      // For now, we'll create a mock structure until we get company-specific data
      const totalRevenue = typeof response.data === 'number' ? response.data : 0;
      
      return {
        totalRevenue,
        companiesRevenue: [] // Will be populated when we have company-specific endpoints
      };
    } catch (error) {
      console.error('Error fetching total revenue:', error);
      throw error;
    }
  },

  // Method to get companies revenue individually with detailed breakdown
  async getAllCompaniesRevenueDetailed(): Promise<TotalRevenueResponse> {
    try {
      console.log('Fetching detailed companies revenue...');
      
      // First get all companies using the correct service
      const companiesResponse = await companyService.getAllCompanies(1, 100);
      
      const companies = companiesResponse.data || [];
      console.log('Companies found:', companies.length);
      
      if (companies.length === 0) {
        console.warn('No companies found');
        return {
          totalRevenue: 0,
          companiesRevenue: []
        };
      }
      
      // Get revenue for each company using the individual endpoint
      const companiesRevenue: CompanyRevenueData[] = [];
      let calculatedTotalRevenue = 0;
      
      console.log('Fetching revenue for each company...');
      for (const company of companies) {
        const companyRevenue = await this.getCompanyTotalRevenue(company.id);
        calculatedTotalRevenue += companyRevenue;
        
        companiesRevenue.push({
          companyId: company.id,
          companyName: company.name,
          totalRevenue: companyRevenue,
          monthlyRevenue: Array(12).fill(0) // Placeholder - would need monthly endpoint per company
        });
      }
      
      console.log('Revenue calculation summary:', {
        totalCompanies: companies.length,
        calculatedTotal: calculatedTotalRevenue,
        companiesWithRevenue: companiesRevenue.filter(c => c.totalRevenue > 0).length
      });
      
      // Also get the system total for comparison
      let systemTotalRevenue = calculatedTotalRevenue;
      try {
        const totalRevenueResponse = await api.get<number>('/api/Payment/revenue/total');
        const apiTotal = typeof totalRevenueResponse.data === 'number' ? totalRevenueResponse.data : 0;
        console.log('API total vs calculated total:', { apiTotal, calculatedTotal: calculatedTotalRevenue });
        // Use the API total as it might be more accurate
        systemTotalRevenue = apiTotal;
      } catch (error) {
        console.warn('Could not fetch system total revenue, using calculated total:', error);
      }
      
      return {
        totalRevenue: systemTotalRevenue,
        companiesRevenue: companiesRevenue.sort((a, b) => b.totalRevenue - a.totalRevenue) // Sort by revenue desc
      };
    } catch (error) {
      console.error('Error fetching detailed companies revenue:', error);
      throw error;
    }
  },
};

export const systemUserService = {
  async getAllUsers(): Promise<SystemUserResponse> {
    try {
      const response = await api.get<SystemUserResponse>('/api/SystemUser', {
        params: {
          All: true
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching system users:', error);
      throw error;
    }
  },

  async getUserById(id: number): Promise<SystemUser> {
    try {
      const response = await api.get<SystemUser>(`/api/SystemUser/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching system user by id:', error);
      throw error;
    }
  },

  async createUser(userData: {
    Email: string;
    FullName: string;
    Phone: string;
    Address: string;
    CompanyId: number;
    Password: string;
    Role: number;
    Avartar?: File;
  }): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('Email', userData.Email);
      formData.append('FullName', userData.FullName);
      formData.append('Phone', userData.Phone);
      formData.append('Address', userData.Address);
      formData.append('CompanyId', userData.CompanyId.toString());
      formData.append('Password', userData.Password);
      formData.append('Role', userData.Role.toString());
      
      if (userData.Avartar) {
        formData.append('Avartar', userData.Avartar);
      }

      const response = await api.post('/api/SystemUser', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating system user:', error);
      throw error;
    }
  },

  async updateUser(id: number, userData: Partial<SystemUser>): Promise<any> {
    try {
      const response = await api.put(`/api/SystemUser/${id}`, userData);
      return response.data;
    } catch (error) {
      console.error('Error updating system user:', error);
      throw error;
    }
  },

  async deleteUser(id: number): Promise<any> {
    try {
      const response = await api.delete(`/api/SystemUser/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting system user:', error);
      throw error;
    }
  }
};

export default api;
