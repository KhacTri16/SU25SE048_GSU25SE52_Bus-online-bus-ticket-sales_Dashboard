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
  fromLocationId?: number;
  toLocationId?: number;
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
  fromLocationId?: number;
  toLocationId?: number;
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

export interface Trip {
  id: number;
  tripId: string;
  fromLocation: string;
  endLocation: string;
  timeStart: string;
  timeEnd: string;
  price: number;
  routeId: number;
  busName: string;
  description: string;
  status: number;
  isDeleted: boolean;
}

export interface TripResponse {
  data: Trip[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
}

export interface CreateTripRequest {
  timeStart: string; // ISO string
  timeEnd: string;   // ISO string
  price: number;
  routeId: number;
  busId: number;
  driverId: number;
  description: string;
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

// Create Company Request payload (for multipart/form-data)
export interface CreateCompanyRequest {
  companyId?: string;
  name?: string;
  phone?: string;
  address?: string;
  website?: string;
  status?: number; // 0 or 1
  taxNumber?: string;
  description?: string;
  maxPercent?: number;
  minPercent?: number;
  logo?: File | null;
}

// Ticket types
export interface Ticket {
  id: number;
  ticketId: string;
  reservationId: number;
  customerName: string;
  seatId: string;
  price: number;
  createDate: string;
  fromTripStation: string;
  toTripStation: string;
  timeStart: string;
  timeEnd: string;
  qrCodeUrl: string;
  companyName: string;
  status: number;
}

// Trip Station
export interface TripStation {
  id: number;
  tripStationId: string;
  tripId: number;
  stationName: string;
  price: number;
  status: number;
  pickUpTime: string; // ISO
  description: string;
}

// Create Trip Station Request
export interface CreateTripStationRequest {
  tripStationId: string;
  tripId: number;
  stationId: number;
  price: number;
  pickUpTime: string; // ISO
  description: string;
}

// Company settlement response
export interface CompanySettlement {
  id: number;
  companyId: number;
  period: string; // ISO date string (first day of month)
  grossAmount: number;
  netAmount: number;
  chargeAmount: number;
  totalPayments: number;
  status: number;
  createdAt: string;
  excelReportUrl: string;
}

// TypeBus + Diagram
export interface SeatPosition {
  floorIndex: number;
  rowIndex: number;
  colIndex: number;
}

export interface SeatDiagramRequest {
  name: string;
  row: number;
  column: number;
  selectedSeats: SeatPosition[];
}

export interface CreateTypeBusWithDiagramRequest {
  name: string;
  numberOfSeat: number;
  numberOfFloors: number;
  description: string;
  seatDiagram: SeatDiagramRequest;
}

export interface TypeBusDiagramDetail {
  floorIndex: number;
  rowIndex: number;
  colIndex: number;
  isSeat: boolean;
  seatCode: string;
}

export interface TypeBusDiagramResponse {
  id: number;
  name: string;
  row: number;
  column: number;
  typeBusId: number;
  details: TypeBusDiagramDetail[];
}

export interface CreateTypeBusWithDiagramResponse {
  id: number;
  typeBusId: string;
  name: string;
  numberOfSeat: number;
  numberOfFloors: number;
  description: string;
  status: number;
  diagram: TypeBusDiagramResponse;
}

// Bus Type
export interface BusType {
  id: number;
  typeBusId: string;
  name: string;
  numberOfSeat: number;
  numberOfFloors: number;
  description: string;
  status: number;
  isDeleted?: boolean;
}

export interface BusTypeResponse {
  data: BusType[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
}

// Updated Bus creation request
export interface CreateBusRequest {
  name: string;
  numberPlate: string;
  typeBusId: number;
  companyId: number;
  brand: string;
  amentity: string;
}