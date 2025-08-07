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
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  ticketId: string | null;
  ticketStatus: number | null;
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
  name: string;
  locationName: string;
  locationId?: number;
  status: number;
  isDeleted: boolean;
  stationName?: string;
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  email?: string;
  description?: string;
  createAt?: string;
  updateAt?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateStationRequest {
  name: string;
  locationId: number;
  status: number;
}

export interface UpdateStationRequest {
  name: string;
  locationId: number;
  status: number;
}

export interface StationResponse {
  data: Station[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permission: boolean;
  isDeleted: boolean;
}

export interface RoleResponse {
  data: Role[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permission: boolean;
}

export interface UpdateRoleRequest {
  name: string;
  description: string;
  permission: boolean;
}

export interface Location {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  timeTransit: number;
  note: string;
  isDeleted: boolean;
}

export interface LocationResponse {
  data: Location[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
}

export interface Bus {
  id: number;
  busId: string;
  name: string;
  numberPlate: string;
  typeBusId: number;
  companyName: string;
  isDeleted: boolean;
}

export interface BusResponse {
  data: Bus[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
}
