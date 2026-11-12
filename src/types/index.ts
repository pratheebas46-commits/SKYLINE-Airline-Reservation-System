export type UserRole = 'customer' | 'staff' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  fullName: string;
  phone: string;
  passportNumber?: string;
  createdAt: string;
  dob?: string;
  gender?: 'Male' | 'Female' | 'Other';
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  govIdType?: string;
  govIdNumber?: string;
  preferredCabinClass?: CabinClass;
  preferredSeatType?: 'Window' | 'Aisle' | 'Middle';
  preferredTravelTime?: 'morning' | 'afternoon' | 'evening' | 'ALL';
  preferredRoute?: string;
  department?: string;
  officeLocation?: string;
}

export interface Airport {
  code: string;
  name: string;
  city: string;
  country: string;
  terminal: string;
}

export interface Aircraft {
  id: string;
  code: string;
  model: string;
  manufacturer: string;
  capacity: number;
  economySeats: number;
  businessSeats: number;
  firstSeats: number;
  seatRows: number;
  seatsPerRow: number; // typically 6 (A B C - D E F)
}

export interface Route {
  id: string;
  originCode: string;
  destinationCode: string;
  distanceKm: number;
  durationMinutes: number;
  isInternational: boolean;
}

export type FlightStatus =
  | 'Scheduled'
  | 'On Time'
  | 'Delayed'
  | 'Boarding'
  | 'Departed'
  | 'Arrived'
  | 'Cancelled';

export interface Flight {
  id: string;
  flightNumber: string;
  airline: string;
  aircraftId: string;
  routeId: string;
  originCode: string;
  destinationCode: string;
  departureTime: string; // "06:30"
  arrivalTime: string;   // "08:45"
  departureDate: string; // "2026-09-15"
  duration: string;      // "2h 15m"
  durationMinutes: number;
  stops: number;         // 0 for direct
  basePrice: number;     // INR
  businessMultiplier: number;
  firstMultiplier: number;
  availableSeats: number;
  status: FlightStatus;
  gate: string;
  terminal: string;
  delayMinutes?: number;
}

export type CabinClass = 'Economy' | 'Business' | 'First';

export type ConcessionType = 'REGULAR' | 'DEFENCE' | 'SENIOR' | 'STUDENT' | 'GOVT_LTC';

export interface Seat {
  id: string;
  flightId: string;
  seatNumber: string; // e.g. "12A"
  row: number;
  col: string;        // 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  cabinClass: CabinClass;
  isBooked: boolean;
  isPremium: boolean; // Extra legroom or front row
  extraPrice: number;
}

export interface Passenger {
  id: string;
  fullName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  passportNumber?: string;
  specialAssistance: 'None' | 'Wheelchair' | 'Extra Baggage' | 'Infant on Lap' | 'Senior Citizen Care';
  concessionId?: string;
  mealPreference?: string;
}

export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN';

export interface Booking {
  id: string;
  pnr: string; // 6-character alphanumeric, e.g. "A7K92P"
  userId: string;
  flightId: string;
  passenger: Passenger;
  seatNumber: string;
  cabinClass: CabinClass;
  concessionType?: ConcessionType;
  baseFare: number;
  seatFee: number;
  taxesAndFees: number;
  convenienceFee?: number;
  travelInsurance?: boolean;
  mealPreference?: string;
  totalAmount: number;
  bookingStatus: BookingStatus;
  paymentId: string;
  createdAt: string;
  travelDate: string;
  isCheckedIn: boolean;
  checkInGate?: string;
  boardingTime?: string;
}

export type PaymentMethod = 'Card' | 'UPI' | 'Wallet';
export type PaymentStatus = 'SUCCESS' | 'FAILED';

export interface Payment {
  id: string;
  bookingPnr: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string;
  timestamp: string;
  cardLast4?: string;
  upiId?: string;
  walletName?: string;
}

export interface Cancellation {
  id: string;
  bookingPnr: string;
  cancellationCharge: number;
  refundAmount: number;
  reason: string;
  cancelledAt: string;
  refundStatus: 'PROCESSED' | 'PENDING';
}

export interface WebCheckInRecord {
  id: string;
  bookingPnr: string;
  passengerName: string;
  flightNumber: string;
  seatNumber: string;
  gate: string;
  boardingTime: string;
  checkInTime: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'alert';
  isRead: boolean;
  timestamp: string;
}

export interface AnalyticsData {
  totalCustomers: number;
  totalStaff: number;
  totalFlights: number;
  totalBookings: number;
  successfulBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageTicketValue: number;
  totalSeats: number;
  totalBookedSeats: number;
  availableSeats: number;
  fleetOccupancyRate: number;
  monthlyRevenue: { month: string; revenue: number; bookings: number }[];
  popularRoutes: { route: string; bookings: number; revenue: number }[];
  seatOccupancy: {
    id: string;
    flightNumber: string;
    route: string;
    originCode: string;
    destinationCode: string;
    departureTime: string;
    aircraftModel: string;
    occupancyRate: number;
    totalSeats: number;
    bookedSeats: number;
    availableSeats: number;
  }[];
  cabinDistribution: { cabin: string; count: number; percentage: number }[];
  verifiedTicketsCount: number;
}
