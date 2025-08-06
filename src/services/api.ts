import axios from 'axios';
import { CompanyResponse, RouteResponse, CreateRouteRequest, UpdateRouteRequest, CustomerResponse, StationResponse, CreateStationRequest, UpdateStationRequest, Station, RoleResponse, CreateRoleRequest, UpdateRoleRequest, Role } from '../types/company';

const baseURL = 'https://bobts-server-e7dxfwh7e5g9e3ad.malaysiawest-01.azurewebsites.net';

const api = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor for debugging
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

// Add response interceptor for debugging
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
  async getAllCustomers(): Promise<CustomerResponse> {
    try {
      const response = await api.get<CustomerResponse>('/api/Customers/GetAllCustomers', {
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
};

export default api;
