import axios from 'axios';
import { CompanyResponse, RouteResponse, CreateRouteRequest, UpdateRouteRequest, CustomerResponse, StationResponse } from '../types/company';

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
};

export default api;
