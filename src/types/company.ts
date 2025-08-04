export interface Company {
  id: number;
  companyId: string;
  name: string;
  phone: string;
  address: string;
  website: string;
  createAt: string;
  status: number;
  taxNumber: string;
  description: string;
  logo: string | null;
  maxPercent: number;
  minPercent: number;
}

export interface CompanyResponse {
  data: Company[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
}

export interface Route {
  id: number;
  routeId: string;
  duration: number;
  fromLocation: string;
  toLocation: string;
  distance: number;
  description: string;
  createAt: string;
  isCreate: boolean;
  isDelete: boolean;
  routeLicense: string;
  companyName: string;
}

export interface RouteResponse {
  data: Route[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
}

export interface CreateRouteRequest {
  routeId: string;
  fromLocation: string;
  toLocation: string;
  duration: number;
  distance: number;
  description: string;
  companyId: number;
  license?: File;
}

export interface UpdateRouteRequest {
  routeId: string;
  fromLocation: string;
  toLocation: string;
  duration: number;
  distance: number;
  description: string;
  companyId: number;
  license?: File;
}

export interface Customer {
  id: number;
  customerId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  createAt: string;
  updateAt: string;
  status: number;
  avatar: string | null;
}

export interface CustomerResponse {
  data: Customer[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
}

export interface Station {
  id: number;
  stationId: string;
  stationName: string;
  address: string;
  city: string;
  province: string;
  phone: string;
  email: string;
  description: string;
  status: number;
  createAt: string;
  updateAt: string;
  latitude?: number;
  longitude?: number;
}

export interface StationResponse {
  data: Station[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
}
