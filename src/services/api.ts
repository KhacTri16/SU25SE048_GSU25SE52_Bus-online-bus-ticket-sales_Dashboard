import axios from 'axios';
import { CompanyResponse, RouteResponse, CreateRouteRequest, UpdateRouteRequest, Customer, CustomerResponse, StationResponse, CreateStationRequest, UpdateStationRequest, Station, RoleResponse, CreateRoleRequest, UpdateRoleRequest, Role, BusResponse, LocationResponse, Company } from '../types/company';

const baseURL = 'https://bobts-server-e7dxfwh7e5g9e3ad.malaysiawest-01.azurewebsites.net';

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
      formData.append('FromLocation', routeData.fromLocation);
      formData.append('ToLocation', routeData.toLocation);
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
      formData.append('FromLocation', routeData.fromLocation);
      formData.append('ToLocation', routeData.toLocation);
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
    'buses.read'
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
