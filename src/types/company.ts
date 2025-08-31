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

export interface ChargeRate {
  id: number;
  name: string;
  rate: number;
  endDate: string;
  createAt: string;
  updateAt: string;
  note: string;
  isDeleted: boolean;
}

export interface ChargeRateResponse {
  data: ChargeRate[];
  page: number;
  amount: number;
  totalPage: number;
  totalCount: number;
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
  id?: number; // Optional numeric ID for API detail calls
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  ticketId: string | null;
  ticketStatus: number | null;
}

// New interface for customer with tickets (company-specific)
export interface CustomerWithTickets {
  id: number;
  customerId: string;
  fullName: string;
  gmail: string;
  phone: string;
  numberOfTickets: number;
}

// Customer detail interface (from /api/Customers/{id})
export interface CustomerDetail {
  customerId: string;
  fullName: string;
  gmail: string;
  phone: string;
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

// Trip search (by company) extended trip with station ids & route description
export interface TripSearchTrip extends Trip {
  routeDescription?: string;
  fromStationId?: number;
  toStationId?: number;
}

export interface TransferTripItem {
  firstTrip: TripSearchTrip;
  secondTrip: TripSearchTrip;
}

export interface TripleTripItem {
  firstTrip: TripSearchTrip;
  secondTrip: TripSearchTrip;
  thirdTrip: TripSearchTrip;
}

export interface TripSearchByCompanyResponse {
  isDirect: boolean;
  directTrips: TripSearchTrip[];
  transferTrips: TransferTripItem[];
  tripleTrips: TripleTripItem[];
}

// Seat availability for a trip segment
export interface SeatAvailability {
  id: number;
  seatId: string;
  isAvailable: boolean;
}

// Reservation (counter) request & response
export interface CounterTripSeatRequest {
  tripId: number;
  fromStationId?: number;
  toStationId?: number;
  seatIds: number[]; // backend appears to expect numeric seat primary keys
}

export interface CounterReservationRequest {
  customerId: number; // 0 if walk-in / unknown
  isReturn: boolean;  // false for one-way
  tripSeats: CounterTripSeatRequest[];
  returnTripSeats?: CounterTripSeatRequest[]; // optional when isReturn true
}

export interface CounterReservationResponse {
  success: boolean;
  message: string;
  paymentUrl?: string | null;
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
  chargeRateId?: number;
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
  pdfUrl?: string; // thêm trường pdfUrl từ response /api/Ticket/by-user
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

// Station for trip (from /api/Station/trip/{tripId}/stations)
export interface TripStationInfo {
  id: number;
  stationId: string;
  name: string;
  locationName: string;
  status: number;
  isDeleted: boolean;
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

// Admin revenue summary response
export interface AdminRevenueSummary {
  totalRevenue: number;
  totalRefunded: number;
  systemFee: number;
  netRevenue: number;
  counterRevenue?: number;
  onlineRevenue?: number;
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

// Update Bus request
export interface UpdateBusRequest {
  name: string;
  numberPlate: string;
  brand: string;
  amentity: string;
  modelYear: string; // ISO date string
  typeBusId: number;
  companyId: number;
}

// Bus detail response (from getBusById)
export interface BusDetail {
  id: number;
  busId: string;
  name: string;
  numberPlate: string;
  brand: string;
  amentity: string;
  modelYear: string;
  typeBusId: number;
  companyName: string;
  isDeleted: boolean;
}