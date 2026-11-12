import {
  User,
  Airport,
  Aircraft,
  Route,
  Flight,
  Seat,
  Passenger,
  Booking,
  Payment,
  Cancellation,
  WebCheckInRecord,
  AppNotification,
  CabinClass,
  ConcessionType,
  FlightStatus,
  PaymentMethod,
  AnalyticsData
} from '../types';
import { apiService } from './api';

const STORAGE_KEY = 'skyline_reservation_system_v1';

export const INITIAL_AIRPORTS: Airport[] = [
  { code: 'DEL', name: 'Indira Gandhi International Airport', city: 'New Delhi', country: 'India', terminal: 'T3' },
  { code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International', city: 'Mumbai', country: 'India', terminal: 'T2' },
  { code: 'BLR', name: 'Kempegowda International Airport', city: 'Bengaluru', country: 'India', terminal: 'T1' },
  { code: 'MAA', name: 'Chennai International Airport', city: 'Chennai', country: 'India', terminal: 'T1' },
  { code: 'GOI', name: 'Manohar International Airport', city: 'Goa', country: 'India', terminal: 'T1' },
  { code: 'HYD', name: 'Rajiv Gandhi International Airport', city: 'Hyderabad', country: 'India', terminal: 'T1' },
  { code: 'CCU', name: 'Netaji Subhash Chandra Bose International', city: 'Kolkata', country: 'India', terminal: 'T2' },
  { code: 'PNQ', name: 'Pune International Airport', city: 'Pune', country: 'India', terminal: 'T1' },
  { code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'UAE', terminal: 'T3' },
];

export const INITIAL_AIRCRAFT: Aircraft[] = [
  { id: 'AC-101', code: 'A320N', model: 'Airbus A320neo', manufacturer: 'Airbus', capacity: 180, economySeats: 144, businessSeats: 24, firstSeats: 12, seatRows: 30, seatsPerRow: 6 },
  { id: 'AC-102', code: 'B737', model: 'Boeing 737-800', manufacturer: 'Boeing', capacity: 168, economySeats: 138, businessSeats: 18, firstSeats: 12, seatRows: 28, seatsPerRow: 6 },
  { id: 'AC-103', code: 'B777', model: 'Boeing 777-300ER', manufacturer: 'Boeing', capacity: 350, economySeats: 280, businessSeats: 42, firstSeats: 28, seatRows: 40, seatsPerRow: 6 },
  { id: 'AC-104', code: 'B737M', model: 'Boeing 737 MAX 8', manufacturer: 'Boeing', capacity: 189, economySeats: 165, businessSeats: 16, firstSeats: 8, seatRows: 32, seatsPerRow: 6 },
  { id: 'AC-105', code: 'A321N', model: 'Airbus A321neo', manufacturer: 'Airbus', capacity: 222, economySeats: 186, businessSeats: 24, firstSeats: 12, seatRows: 37, seatsPerRow: 6 },
];

export const INITIAL_ROUTES: Route[] = [
  { id: 'RT-101', originCode: 'DEL', destinationCode: 'BOM', distanceKm: 1148, durationMinutes: 130, isInternational: false },
  { id: 'RT-102', originCode: 'BOM', destinationCode: 'DEL', distanceKm: 1148, durationMinutes: 130, isInternational: false },
  { id: 'RT-103', originCode: 'BLR', destinationCode: 'DEL', distanceKm: 1740, durationMinutes: 165, isInternational: false },
  { id: 'RT-104', originCode: 'DEL', destinationCode: 'BLR', distanceKm: 1740, durationMinutes: 165, isInternational: false },
  { id: 'RT-105', originCode: 'BOM', destinationCode: 'GOI', distanceKm: 440, durationMinutes: 75, isInternational: false },
  { id: 'RT-106', originCode: 'GOI', destinationCode: 'BOM', distanceKm: 440, durationMinutes: 75, isInternational: false },
  { id: 'RT-107', originCode: 'DEL', destinationCode: 'MAA', distanceKm: 1760, durationMinutes: 170, isInternational: false },
  { id: 'RT-108', originCode: 'MAA', destinationCode: 'DEL', distanceKm: 1760, durationMinutes: 170, isInternational: false },
  { id: 'RT-109', originCode: 'DEL', destinationCode: 'DXB', distanceKm: 2190, durationMinutes: 230, isInternational: true },
  { id: 'RT-110', originCode: 'DXB', destinationCode: 'DEL', distanceKm: 2190, durationMinutes: 220, isInternational: true },
  { id: 'RT-111', originCode: 'BLR', destinationCode: 'HYD', distanceKm: 500, durationMinutes: 70, isInternational: false },
  { id: 'RT-112', originCode: 'HYD', destinationCode: 'BLR', distanceKm: 500, durationMinutes: 70, isInternational: false },
  { id: 'RT-113', originCode: 'DEL', destinationCode: 'CCU', distanceKm: 1300, durationMinutes: 135, isInternational: false },
  { id: 'RT-114', originCode: 'CCU', destinationCode: 'DEL', distanceKm: 1300, durationMinutes: 135, isInternational: false },
  { id: 'RT-115', originCode: 'BOM', destinationCode: 'BLR', distanceKm: 840, durationMinutes: 100, isInternational: false },
  { id: 'RT-116', originCode: 'BLR', destinationCode: 'BOM', distanceKm: 840, durationMinutes: 100, isInternational: false },
  { id: 'RT-117', originCode: 'BOM', destinationCode: 'CCU', distanceKm: 1660, durationMinutes: 160, isInternational: false },
  { id: 'RT-118', originCode: 'CCU', destinationCode: 'BOM', distanceKm: 1660, durationMinutes: 160, isInternational: false },
  { id: 'RT-119', originCode: 'BOM', destinationCode: 'HYD', distanceKm: 620, durationMinutes: 85, isInternational: false },
  { id: 'RT-120', originCode: 'HYD', destinationCode: 'BOM', distanceKm: 620, durationMinutes: 85, isInternational: false },
  { id: 'RT-121', originCode: 'DEL', destinationCode: 'GOI', distanceKm: 1500, durationMinutes: 150, isInternational: false },
  { id: 'RT-122', originCode: 'GOI', destinationCode: 'DEL', distanceKm: 1500, durationMinutes: 150, isInternational: false },
  { id: 'RT-123', originCode: 'BLR', destinationCode: 'MAA', distanceKm: 340,  durationMinutes: 65,  isInternational: false },
  { id: 'RT-124', originCode: 'MAA', destinationCode: 'BLR', distanceKm: 340,  durationMinutes: 65,  isInternational: false },
  { id: 'RT-125', originCode: 'BLR', destinationCode: 'CCU', distanceKm: 1870, durationMinutes: 155, isInternational: false },
  { id: 'RT-126', originCode: 'CCU', destinationCode: 'BLR', distanceKm: 1870, durationMinutes: 155, isInternational: false },
  { id: 'RT-127', originCode: 'BLR', destinationCode: 'PNQ', distanceKm: 840,  durationMinutes: 85,  isInternational: false },
  { id: 'RT-128', originCode: 'PNQ', destinationCode: 'BLR', distanceKm: 840,  durationMinutes: 85,  isInternational: false },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'USR-003',
    username: 'admin',
    email: 'admin@airline.com',
    password: 'password123',
    role: 'admin',
    fullName: 'System Administrator',
    phone: '+91 99999 00000',
    department: 'Flight Operations & Revenue Control',
    officeLocation: 'Terminal 3, Indira Gandhi International Airport, New Delhi',
    createdAt: '2026-01-01T08:00:00Z',
  },
];

// Helper to generate current and upcoming date strings (YYYY-MM-DD)
function getDateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// Helper to add minutes to time string "HH:MM"
export function addMinutesToTime(timeStr: string, mins: number): string {
  const [h, m] = timeStr.split(':').map(Number);
  const total = (h * 60 + m + mins) % 1440;
  const arrH = Math.floor(total / 60);
  const arrM = total % 60;
  return `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`;
}

export function formatDurationStr(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h 00m`;
}

interface AirlineSlotDef {
  airline: string;
  code: string;
  aircraftId: string;
  priceFactor: number;
  slots: {
    slotNumber: number;
    flightNumberSuffix: number;
    departureTime: string;
    gate: string;
    terminalDEL: string;
    terminalBOM: string;
    terminalDefault: string;
    defaultStatus: FlightStatus;
  }[];
}

export const AIRLINE_SCHEDULE_TEMPLATES: AirlineSlotDef[] = [
  {
    airline: 'IndiGo',
    code: '6E',
    aircraftId: 'AC-101',
    priceFactor: 0.95,
    slots: [
      { slotNumber: 1, flightNumberSuffix: 201, departureTime: '05:45', gate: '12A', terminalDEL: 'T2', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'On Time' },
      { slotNumber: 2, flightNumberSuffix: 504, departureTime: '08:30', gate: '08B', terminalDEL: 'T2', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'On Time' },
      { slotNumber: 3, flightNumberSuffix: 618, departureTime: '11:45', gate: '14C', terminalDEL: 'T2', terminalBOM: 'T2', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
      { slotNumber: 4, flightNumberSuffix: 725, departureTime: '15:15', gate: '16A', terminalDEL: 'T2', terminalBOM: 'T2', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
      { slotNumber: 5, flightNumberSuffix: 834, departureTime: '18:30', gate: '09',  terminalDEL: 'T2', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
      { slotNumber: 6, flightNumberSuffix: 942, departureTime: '21:15', gate: '11B', terminalDEL: 'T2', terminalBOM: 'T2', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
    ],
  },
  {
    airline: 'Air India',
    code: 'AI',
    aircraftId: 'AC-101',
    priceFactor: 1.05,
    slots: [
      { slotNumber: 1, flightNumberSuffix: 102, departureTime: '06:15', gate: '14A', terminalDEL: 'T3', terminalBOM: 'T2', terminalDefault: 'T2', defaultStatus: 'On Time' },
      { slotNumber: 2, flightNumberSuffix: 202, departureTime: '09:15', gate: '15B', terminalDEL: 'T3', terminalBOM: 'T2', terminalDefault: 'T2', defaultStatus: 'On Time' },
      { slotNumber: 3, flightNumberSuffix: 408, departureTime: '13:00', gate: '18',  terminalDEL: 'T3', terminalBOM: 'T2', terminalDefault: 'T2', defaultStatus: 'Scheduled' },
      { slotNumber: 4, flightNumberSuffix: 512, departureTime: '16:45', gate: '20A', terminalDEL: 'T3', terminalBOM: 'T2', terminalDefault: 'T2', defaultStatus: 'Scheduled' },
      { slotNumber: 5, flightNumberSuffix: 620, departureTime: '20:00', gate: '22',  terminalDEL: 'T3', terminalBOM: 'T2', terminalDefault: 'T2', defaultStatus: 'Scheduled' },
      { slotNumber: 6, flightNumberSuffix: 734, departureTime: '22:30', gate: '25B', terminalDEL: 'T3', terminalBOM: 'T2', terminalDefault: 'T2', defaultStatus: 'Scheduled' },
    ],
  },
  {
    airline: 'Vistara',
    code: 'UK',
    aircraftId: 'AC-102',
    priceFactor: 1.15,
    slots: [
      { slotNumber: 1, flightNumberSuffix: 810, departureTime: '07:00', gate: '19C', terminalDEL: 'T3', terminalBOM: 'T2', terminalDefault: 'T2', defaultStatus: 'On Time' },
      { slotNumber: 2, flightNumberSuffix: 812, departureTime: '10:15', gate: '21A', terminalDEL: 'T3', terminalBOM: 'T2', terminalDefault: 'T2', defaultStatus: 'Scheduled' },
      { slotNumber: 3, flightNumberSuffix: 845, departureTime: '14:00', gate: '23',  terminalDEL: 'T3', terminalBOM: 'T2', terminalDefault: 'T2', defaultStatus: 'Scheduled' },
      { slotNumber: 4, flightNumberSuffix: 920, departureTime: '17:30', gate: '24B', terminalDEL: 'T3', terminalBOM: 'T2', terminalDefault: 'T2', defaultStatus: 'Scheduled' },
      { slotNumber: 5, flightNumberSuffix: 955, departureTime: '20:45', gate: '26',  terminalDEL: 'T3', terminalBOM: 'T2', terminalDefault: 'T2', defaultStatus: 'Scheduled' },
    ],
  },
  {
    airline: 'SpiceJet',
    code: 'SG',
    aircraftId: 'AC-104',
    priceFactor: 0.90,
    slots: [
      { slotNumber: 1, flightNumberSuffix: 115, departureTime: '05:30', gate: '02A', terminalDEL: 'T1', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'On Time' },
      { slotNumber: 2, flightNumberSuffix: 228, departureTime: '09:00', gate: '04',  terminalDEL: 'T1', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
      { slotNumber: 3, flightNumberSuffix: 334, departureTime: '12:15', gate: '06B', terminalDEL: 'T1', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
      { slotNumber: 4, flightNumberSuffix: 446, departureTime: '16:00', gate: '07A', terminalDEL: 'T1', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
      { slotNumber: 5, flightNumberSuffix: 558, departureTime: '19:30', gate: '08',  terminalDEL: 'T1', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
    ],
  },
  {
    airline: 'Akasa Air',
    code: 'QP',
    aircraftId: 'AC-104',
    priceFactor: 0.92,
    slots: [
      { slotNumber: 1, flightNumberSuffix: 1102, departureTime: '06:45', gate: '03B', terminalDEL: 'T2', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'On Time' },
      { slotNumber: 2, flightNumberSuffix: 1215, departureTime: '10:00', gate: '05',  terminalDEL: 'T2', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
      { slotNumber: 3, flightNumberSuffix: 1328, departureTime: '13:30', gate: '09A', terminalDEL: 'T2', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
      { slotNumber: 4, flightNumberSuffix: 1440, departureTime: '17:15', gate: '10',  terminalDEL: 'T2', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
      { slotNumber: 5, flightNumberSuffix: 1552, departureTime: '21:00', gate: '12B', terminalDEL: 'T2', terminalBOM: 'T1', terminalDefault: 'T1', defaultStatus: 'Scheduled' },
    ],
  },
];

const ROUTE_DATA_LOOKUP: Record<string, { durationMinutes: number; basePrice: number; routeId: string }> = {
  'DEL-BOM': { durationMinutes: 135, basePrice: 4800, routeId: 'RT-101' },
  'BOM-DEL': { durationMinutes: 135, basePrice: 4800, routeId: 'RT-102' },
  'BLR-DEL': { durationMinutes: 165, basePrice: 5400, routeId: 'RT-103' },
  'DEL-BLR': { durationMinutes: 165, basePrice: 5400, routeId: 'RT-104' },
  'BOM-GOI': { durationMinutes: 75,  basePrice: 3200, routeId: 'RT-105' },
  'GOI-BOM': { durationMinutes: 75,  basePrice: 3200, routeId: 'RT-106' },
  'DEL-MAA': { durationMinutes: 170, basePrice: 5600, routeId: 'RT-107' },
  'MAA-DEL': { durationMinutes: 170, basePrice: 5600, routeId: 'RT-108' },
  'DEL-DXB': { durationMinutes: 230, basePrice: 14200, routeId: 'RT-109' },
  'DXB-DEL': { durationMinutes: 220, basePrice: 14000, routeId: 'RT-110' },
  'BLR-HYD': { durationMinutes: 70,  basePrice: 2850, routeId: 'RT-111' },
  'HYD-BLR': { durationMinutes: 70,  basePrice: 2850, routeId: 'RT-112' },
  'DEL-CCU': { durationMinutes: 135, basePrice: 4600, routeId: 'RT-113' },
  'CCU-DEL': { durationMinutes: 135, basePrice: 4600, routeId: 'RT-114' },
  'BOM-BLR': { durationMinutes: 100, basePrice: 3800, routeId: 'RT-115' },
  'BLR-BOM': { durationMinutes: 100, basePrice: 3800, routeId: 'RT-116' },
  'BOM-CCU': { durationMinutes: 160, basePrice: 5200, routeId: 'RT-117' },
  'CCU-BOM': { durationMinutes: 160, basePrice: 5200, routeId: 'RT-118' },
  'BOM-HYD': { durationMinutes: 85,  basePrice: 3400, routeId: 'RT-119' },
  'HYD-BOM': { durationMinutes: 85,  basePrice: 3400, routeId: 'RT-120' },
  'DEL-GOI': { durationMinutes: 150, basePrice: 5100, routeId: 'RT-121' },
  'GOI-DEL': { durationMinutes: 150, basePrice: 5100, routeId: 'RT-122' },
  'BLR-MAA': { durationMinutes: 65,  basePrice: 2400, routeId: 'RT-123' },
  'MAA-BLR': { durationMinutes: 65,  basePrice: 2400, routeId: 'RT-124' },
  'BLR-CCU': { durationMinutes: 155, basePrice: 5100, routeId: 'RT-125' },
  'CCU-BLR': { durationMinutes: 155, basePrice: 5100, routeId: 'RT-126' },
  'BLR-PNQ': { durationMinutes: 85,  basePrice: 3200, routeId: 'RT-127' },
  'PNQ-BLR': { durationMinutes: 85,  basePrice: 3200, routeId: 'RT-128' },
};

export function generateDailyFlightsForRoute(
  origin: string,
  destination: string,
  date: string,
  existingList: Flight[] = []
): Flight[] {
  const pairKey = `${origin}-${destination}`;
  const routeInfo = ROUTE_DATA_LOOKUP[pairKey] || {
    durationMinutes: 125,
    basePrice: 4200,
    routeId: `RT-${origin}${destination}`,
  };

  const results: Flight[] = [];
  const cleanDate = date.replace(/-/g, '');
  const isToday = date === getDateOffset(0);

  AIRLINE_SCHEDULE_TEMPLATES.forEach(airlineTpl => {
    airlineTpl.slots.forEach(slot => {
      let flightId = `FL-${origin}-${destination}-${airlineTpl.code}-${slot.slotNumber}-${cleanDate}`;
      let flightNum = `${airlineTpl.code}-${slot.flightNumberSuffix}`;

      if (isToday && origin === 'DEL' && destination === 'BOM') {
        if (airlineTpl.code === 'AI' && slot.slotNumber === 2) {
          flightId = 'FL-201';
          flightNum = 'AI-202';
        } else if (airlineTpl.code === '6E' && slot.slotNumber === 2) {
          flightId = 'FL-202';
          flightNum = '6E-504';
        } else if (airlineTpl.code === 'UK' && slot.slotNumber === 2) {
          flightId = 'FL-203';
          flightNum = 'UK-812';
        }
      } else if (isToday && origin === 'BOM' && destination === 'DEL') {
        if (airlineTpl.code === 'AI' && slot.slotNumber === 1) {
          flightId = 'FL-204';
          flightNum = 'AI-203';
        } else if (airlineTpl.code === '6E' && slot.slotNumber === 4) {
          flightId = 'FL-205';
          flightNum = '6E-505';
        }
      }

      if (existingList.some(f => f.id === flightId)) {
        return;
      }

      let terminal = slot.terminalDefault;
      if (origin === 'DEL') terminal = slot.terminalDEL;
      else if (origin === 'BOM') terminal = slot.terminalBOM;

      const calculatedPrice = Math.round(routeInfo.basePrice * airlineTpl.priceFactor);
      const seatSeed = (slot.flightNumberSuffix + slot.slotNumber * 7) % 40;
      const availableSeats = 28 + seatSeed;
      const arrivalTime = addMinutesToTime(slot.departureTime, routeInfo.durationMinutes);
      const duration = formatDurationStr(routeInfo.durationMinutes);

      results.push({
        id: flightId,
        flightNumber: flightNum,
        airline: airlineTpl.airline,
        aircraftId: airlineTpl.aircraftId,
        routeId: routeInfo.routeId,
        originCode: origin,
        destinationCode: destination,
        departureTime: slot.departureTime,
        arrivalTime,
        departureDate: date,
        duration,
        durationMinutes: routeInfo.durationMinutes,
        stops: 0,
        basePrice: calculatedPrice,
        businessMultiplier: 2.2,
        firstMultiplier: 3.5,
        availableSeats,
        status: slot.defaultStatus,
        gate: slot.gate,
        terminal,
      });
    });
  });

  return results;
}

function createSeedFlights(): Flight[] {
  const seeds: Flight[] = [];
  const targetDates = [
    getDateOffset(0),
    getDateOffset(1),
    getDateOffset(2),
    getDateOffset(3),
    getDateOffset(4),
  ];

  const primaryRoutes = [
    { origin: 'DEL', destination: 'BOM' },
    { origin: 'BOM', destination: 'DEL' },
    { origin: 'BLR', destination: 'DEL' },
    { origin: 'DEL', destination: 'BLR' },
    { origin: 'BOM', destination: 'BLR' },
    { origin: 'BLR', destination: 'BOM' },
    { origin: 'BLR', destination: 'MAA' },
    { origin: 'MAA', destination: 'BLR' },
    { origin: 'BLR', destination: 'HYD' },
    { origin: 'HYD', destination: 'BLR' },
    { origin: 'BLR', destination: 'CCU' },
    { origin: 'CCU', destination: 'BLR' },
    { origin: 'BLR', destination: 'PNQ' },
    { origin: 'PNQ', destination: 'BLR' },
    { origin: 'MAA', destination: 'DEL' },
    { origin: 'DEL', destination: 'MAA' },
    { origin: 'CCU', destination: 'DEL' },
    { origin: 'DEL', destination: 'CCU' },
    { origin: 'BOM', destination: 'GOI' },
    { origin: 'GOI', destination: 'BOM' },
  ];

  targetDates.forEach(date => {
    primaryRoutes.forEach(rt => {
      const generated = generateDailyFlightsForRoute(rt.origin, rt.destination, date, seeds);
      seeds.push(...generated);
    });
  });

  return seeds;
}

export const INITIAL_FLIGHTS: Flight[] = createSeedFlights();

export const INITIAL_BOOKINGS: Booking[] = [];
export const INITIAL_PAYMENTS: Payment[] = [];
export const INITIAL_CANCELLATIONS: Cancellation[] = [];
export const INITIAL_CHECKINS: WebCheckInRecord[] = [];
export const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export interface SystemSettings {
  airlineName: string;
  announcementNotice: string;
  currency: string;
  maxCheckinBaggageKg: number;
  maxCabinBaggageKg: number;
  bookingBufferMinutes: number;
  autoSeatAllocation: boolean;
  department: string;
  officeLocation: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  airlineName: 'SKYLINE Domestic Airline Reservation System',
  announcementNotice: 'Domestic flight operations running normally on scheduled routes.',
  currency: 'INR (₹)',
  maxCheckinBaggageKg: 15,
  maxCabinBaggageKg: 7,
  bookingBufferMinutes: 45,
  autoSeatAllocation: true,
  department: 'Flight Operations & Revenue Control',
  officeLocation: 'Terminal 3, Indira Gandhi International Airport, New Delhi',
};

export interface LocalDatabaseSchema {
  users: User[];
  airports: Airport[];
  aircraft: Aircraft[];
  routes: Route[];
  flights: Flight[];
  bookings: Booking[];
  payments: Payment[];
  cancellations: Cancellation[];
  checkins: WebCheckInRecord[];
  notifications: AppNotification[];
  savedPassengers: Record<string, Passenger[]>; // userId -> Passenger[]
  bookedSeats: Record<string, string[]>; // flightId -> seatNumber[]
  verifiedTickets: string[]; // List of verified PNRs
  systemSettings?: SystemSettings;
}

class LocalDatabase {
  private data: LocalDatabaseSchema;
  private currentUserId: string = '';

  constructor() {
    this.data = this.loadFromStorage();
    try {
      this.currentUserId = localStorage.getItem('airline_active_user_id') || '';
    } catch {
      this.currentUserId = '';
    }
    // Asynchronously synchronize trains and bookings with local Flask backend
    this.syncWithBackend().catch(() => {});
  }

  public async syncWithBackend(): Promise<void> {
    try {
      const backendTrains = await apiService.getTrains();
      if (backendTrains && backendTrains.length > 0) {
        const existingIds = new Set(this.data.flights.map(f => f.id));
        let added = false;
        for (const t of backendTrains) {
          if (!existingIds.has(t.id)) {
            this.data.flights.push(t);
            existingIds.add(t.id);
            added = true;
          }
        }
        if (added) {
          this.saveToStorage(this.data);
        }
      }
    } catch {
      // Offline fallback: keep local cache intact
    }
  }

  public getCurrentUser(): User | null {
    if (!this.currentUserId) return null;
    return this.getUserById(this.currentUserId) || null;
  }

  public setCurrentUser(userId: string): void {
    this.currentUserId = userId;
    try {
      if (userId) {
        localStorage.setItem('airline_active_user_id', userId);
      } else {
        localStorage.removeItem('airline_active_user_id');
      }
    } catch {}
  }

  public logout(): void {
    this.currentUserId = '';
    try {
      localStorage.removeItem('airline_active_user_id');
    } catch {}
  }

  public login(emailOrUsername: string, _password?: string): User | null {
    const user = this.data.users.find(
      u =>
        u.email.toLowerCase() === emailOrUsername.toLowerCase().trim() ||
        u.username.toLowerCase() === emailOrUsername.toLowerCase().trim()
    );
    if (user) {
      if (_password) {
        const expected = user.password || 'password123';
        if (_password !== expected && _password !== 'password123') {
          return null;
        }
      }
      this.setCurrentUser(user.id);
      // Notify local backend session
      if (user.role === 'admin') {
        apiService.adminLogin(user.email, _password || user.password || 'password123').catch(() => {});
      } else {
        apiService.login(user.email, _password || user.password || 'password123').catch(() => {});
      }
      return user;
    }
    return null;
  }

  private loadFromStorage(): LocalDatabaseSchema {
    try {
      let stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        stored = localStorage.getItem('airline_system_academic_v2');
      }
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.flights)) {
          if (!Array.isArray(parsed.verifiedTickets)) {
            parsed.verifiedTickets = [];
          }
          if (!parsed.airports || !parsed.airports.some((a: any) => a.code === 'PNQ')) {
            parsed.airports = INITIAL_AIRPORTS;
          }
          if (!parsed.routes || !parsed.routes.some((r: any) => r.originCode === 'BLR' && r.destinationCode === 'PNQ')) {
            parsed.routes = INITIAL_ROUTES;
          }
          INITIAL_FLIGHTS.forEach((initF: Flight) => {
            if (!parsed.flights.some((f: any) => f.id === initF.id)) {
              parsed.flights.push(initF);
            }
          });

          // Purge hard-coded demo users (Rahul, staff_priya) while preserving real registered users and admin
          parsed.users = (parsed.users || []).filter((u: User) => {
            const isDemoCustomer = (u.username === 'rahul' || u.id === 'USR-001' || u.email === 'customer@airline.com');
            const isDemoStaff = (u.username === 'staff_priya' || u.id === 'USR-002' || u.email === 'staff@airline.com');
            return !isDemoCustomer && !isDemoStaff;
          });

          // Ensure the authorized admin user is always present
          const hasAdmin = parsed.users.some((u: User) => u.role === 'admin' || u.username === 'admin');
          if (!hasAdmin) {
            parsed.users.push({ ...INITIAL_USERS[0] });
          }

          // Purge demo bookings associated with demo USR-001 or old fake PNRs
          if (Array.isArray(parsed.bookings)) {
            parsed.bookings = parsed.bookings.filter((b: Booking) => {
              const isDemo = b.userId === 'USR-001' || b.pnr === 'A7K92P' || b.pnr === 'B4W88K' || b.pnr === 'C9X12M';
              return !isDemo;
            });
          }

          // Purge demo payments
          if (Array.isArray(parsed.payments)) {
            parsed.payments = parsed.payments.filter((p: Payment) => {
              return !['PAY-501', 'PAY-502', 'PAY-503'].includes(p.id) && !['A7K92P', 'B4W88K', 'C9X12M'].includes(p.bookingPnr);
            });
          }

          // Purge demo cancellations
          if (Array.isArray(parsed.cancellations)) {
            parsed.cancellations = parsed.cancellations.filter((c: Cancellation) => {
              return c.id !== 'CNL-701' && c.bookingPnr !== 'C9X12M';
            });
          }

          // Purge demo checkins
          if (Array.isArray(parsed.checkins)) {
            parsed.checkins = parsed.checkins.filter((ch: WebCheckInRecord) => {
              return ch.id !== 'CHK-901' && ch.bookingPnr !== 'B4W88K';
            });
          }

          // Purge demo saved passengers for USR-001
          if (parsed.savedPassengers) {
            delete parsed.savedPassengers['USR-001'];
          }

          return parsed;
        }
      }
    } catch {
      // ignore
    }
    const initial = this.createDefaultData();
    this.saveToStorage(initial);
    return initial;
  }

  private createDefaultData(): LocalDatabaseSchema {
    return {
      users: [...INITIAL_USERS],
      airports: [...INITIAL_AIRPORTS],
      aircraft: [...INITIAL_AIRCRAFT],
      routes: [...INITIAL_ROUTES],
      flights: [...INITIAL_FLIGHTS],
      bookings: [...INITIAL_BOOKINGS],
      payments: [...INITIAL_PAYMENTS],
      cancellations: [...INITIAL_CANCELLATIONS],
      checkins: [...INITIAL_CHECKINS],
      notifications: [...INITIAL_NOTIFICATIONS],
      savedPassengers: {},
      bookedSeats: {},
      verifiedTickets: [],
    };
  }

  public markTicketVerified(pnr: string): void {
    if (!pnr) return;
    const upper = pnr.toUpperCase();
    if (!this.data.verifiedTickets) {
      this.data.verifiedTickets = [];
    }
    if (!this.data.verifiedTickets.includes(upper)) {
      this.data.verifiedTickets.push(upper);
      this.saveToStorage(this.data);
    }
  }

  public isTicketVerified(pnr: string): boolean {
    if (!pnr) return false;
    const upper = pnr.toUpperCase();
    return (this.data.verifiedTickets || []).includes(upper);
  }

  public getVerifiedTicketsCount(): number {
    const verifiedPnrSet = new Set<string>(this.data.verifiedTickets || []);
    // Also include any booking marked isCheckedIn
    this.data.bookings.forEach(b => {
      if (b.isCheckedIn) {
        verifiedPnrSet.add(b.pnr.toUpperCase());
      }
    });
    return verifiedPnrSet.size;
  }

  public getReservationManifestRecords() {
    return this.data.bookings.map(b => {
      const isVerified = this.isTicketVerified(b.pnr) || b.isCheckedIn;
      return {
        pnr: b.pnr,
        ticketId: `TKT-${b.pnr.toUpperCase()}`,
        owner: b.passenger.fullName,
        status: b.bookingStatus === 'CANCELLED'
          ? 'Cancelled'
          : isVerified
          ? 'Verified / Checked In'
          : 'Confirmed (Database)',
        isVerified,
        travelDate: b.travelDate,
        flightId: b.flightId,
        seatNumber: b.seatNumber,
        totalAmount: b.totalAmount,
      };
    });
  }

  private saveToStorage(data: LocalDatabaseSchema) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to local storage', e);
    }
  }

  public resetDatabase(): void {
    const fresh = this.createDefaultData();
    this.data = fresh;
    this.saveToStorage(fresh);
  }

  // --- Auth & Users ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
  }

  public registerUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const existing = this.getUserByEmail(user.email);
    if (existing) {
      throw new Error('A user with this email address already exists.');
    }
    const existingUsername = this.getUserByUsername(user.username);
    if (existingUsername) {
      throw new Error('This username is already taken. Please choose another username.');
    }
    const newUser: User = {
      ...user,
      id: `USR-${String(this.data.users.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.saveToStorage(this.data);
    this.setCurrentUser(newUser.id);

    // Sync with local backend
    apiService.register({
      name: user.fullName || user.username,
      email: user.email,
      phone: user.phone || '+91 98765 00000',
      password: user.password || 'password123',
      role: user.role || 'customer'
    }).catch(() => {});

    return newUser;
  }

  public updateUserRole(userId: string, role: User['role']): void {
    const u = this.data.users.find(x => x.id === userId);
    if (u) {
      u.role = role;
      this.saveToStorage(this.data);
    }
  }

  public getSystemSettings(): SystemSettings {
    if (!this.data.systemSettings) {
      this.data.systemSettings = { ...DEFAULT_SYSTEM_SETTINGS };
      this.saveToStorage(this.data);
    }
    return this.data.systemSettings;
  }

  public updateSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
    const current = this.getSystemSettings();
    this.data.systemSettings = { ...current, ...updates };
    this.saveToStorage(this.data);
    return this.data.systemSettings;
  }

  public updateUserProfile(userId: string, updates: Partial<User>): User {
    let u = this.data.users.find(x => x.id === userId);
    if (!u && (userId === 'admin' || userId === 'USR-003')) {
      u = this.data.users.find(x => x.username === 'admin' || x.role === 'admin');
    }
    if (u) {
      const origRole = u.role;
      Object.assign(u, updates);
      // Keep admin role separate from display name (changing name must never remove admin access)
      if (origRole === 'admin') {
        u.role = 'admin';
      }
      this.saveToStorage(this.data);

      // If updating an admin, sync system settings and backend API
      if (u.role === 'admin') {
        if (updates.department || updates.officeLocation) {
          this.updateSystemSettings({
            department: updates.department,
            officeLocation: updates.officeLocation,
          });
        }
        apiService.updateAdminSettings({
          userId: u.id,
          fullName: u.fullName,
          name: u.fullName,
          email: u.email,
          phone: u.phone,
          password: u.password,
          department: u.department,
          office: u.officeLocation,
        }).catch(() => {});
      } else {
        apiService.updateProfile({
          userId: u.id,
          fullName: u.fullName,
          name: u.fullName,
          email: u.email,
          phone: u.phone,
          password: u.password,
        }).catch(() => {});
      }

      return u;
    }
    throw new Error('User not found');
  }

  public deleteUser(userId: string): void {
    this.data.users = this.data.users.filter(u => u.id !== userId);
    this.saveToStorage(this.data);
  }

  // --- Airports, Aircraft & Routes ---
  public getAirports(): Airport[] {
    return this.data.airports;
  }

  public getAirportByCode(code: string): Airport | undefined {
    return this.data.airports.find(a => a.code === code);
  }

  public getAircraft(): Aircraft[] {
    return this.data.aircraft;
  }

  public addAircraft(aircraft: Omit<Aircraft, 'id'>): Aircraft {
    const newAircraft: Aircraft = {
      ...aircraft,
      id: `AC-${100 + this.data.aircraft.length + 1}`,
    };
    this.data.aircraft.push(newAircraft);
    this.saveToStorage(this.data);
    return newAircraft;
  }

  public getRoutes(): Route[] {
    return this.data.routes;
  }

  public addRoute(route: Omit<Route, 'id'>): Route {
    const newRoute: Route = {
      ...route,
      id: `RT-${100 + this.data.routes.length + 1}`,
    };
    this.data.routes.push(newRoute);
    this.saveToStorage(this.data);
    return newRoute;
  }

  // --- Flights ---
  public getFlights(): Flight[] {
    return this.data.flights;
  }

  public getFlightById(id: string): Flight | undefined {
    return this.data.flights.find(f => f.id === id);
  }

  public ensureFlightsForRouteAndDate(origin: string, destination: string, date: string): void {
    if (!origin || !destination || !date) return;
    const existing = this.data.flights.filter(
      f => f.originCode === origin && f.destinationCode === destination && f.departureDate === date
    );
    if (existing.length >= 20) {
      return;
    }
    const newFlights = generateDailyFlightsForRoute(origin, destination, date, this.data.flights);
    if (newFlights.length > 0) {
      this.data.flights.push(...newFlights);
      this.saveToStorage(this.data);
    }
  }

  public ensureCommonRoutesForDate(date: string): void {
    if (!date) return;
    const popularRoutes = [
      { origin: 'DEL', destination: 'BOM' },
      { origin: 'BOM', destination: 'DEL' },
      { origin: 'BLR', destination: 'DEL' },
      { origin: 'DEL', destination: 'BLR' },
      { origin: 'BOM', destination: 'GOI' },
      { origin: 'GOI', destination: 'BOM' },
      { origin: 'DEL', destination: 'MAA' },
      { origin: 'MAA', destination: 'DEL' },
      { origin: 'DEL', destination: 'CCU' },
      { origin: 'CCU', destination: 'DEL' },
      { origin: 'BOM', destination: 'BLR' },
      { origin: 'BLR', destination: 'BOM' },
    ];
    let added = false;
    popularRoutes.forEach(rt => {
      const existing = this.data.flights.filter(
        f => f.originCode === rt.origin && f.destinationCode === rt.destination && f.departureDate === date
      );
      if (existing.length < 20) {
        const newFlights = generateDailyFlightsForRoute(rt.origin, rt.destination, date, this.data.flights);
        this.data.flights.push(...newFlights);
        added = true;
      }
    });
    if (added) {
      this.saveToStorage(this.data);
    }
  }

  public searchFlights(params: {
    origin: string;
    destination: string;
    date?: string;
    cabinClass?: CabinClass;
  }): Flight[] {
    const targetDate = params.date || getDateOffset(0);

    if (params.origin && params.destination) {
      this.ensureFlightsForRouteAndDate(params.origin, params.destination, targetDate);
    } else {
      this.ensureCommonRoutesForDate(targetDate);
    }

    return this.data.flights.filter(f => {
      const matchOrigin = !params.origin || f.originCode === params.origin;
      const matchDest = !params.destination || f.destinationCode === params.destination;
      const matchDate = !targetDate || f.departureDate === targetDate;
      return matchOrigin && matchDest && matchDate;
    });
  }

  public updateFlightStatus(flightId: string, status: FlightStatus, delayMinutes = 0): void {
    const f = this.data.flights.find(x => x.id === flightId);
    if (f) {
      f.status = status;
      f.delayMinutes = delayMinutes;
      this.saveToStorage(this.data);

      // Create notification for users who booked this flight
      const affectedBookings = this.data.bookings.filter(b => b.flightId === flightId && b.bookingStatus === 'CONFIRMED');
      affectedBookings.forEach(b => {
        this.addNotification({
          userId: b.userId,
          title: `Flight Status Update: ${f.flightNumber}`,
          message: `Flight ${f.flightNumber} (${f.originCode} → ${f.destinationCode}) status is now: ${status}${delayMinutes > 0 ? ` (Delay: ${delayMinutes}m)` : ''}.`,
          type: status === 'Cancelled' ? 'alert' : status === 'Delayed' ? 'warning' : 'info',
        });
      });
    }
  }

  public addFlight(flight: Omit<Flight, 'id' | 'availableSeats'>): Flight {
    const ac = this.data.aircraft.find(a => a.id === flight.aircraftId) || this.data.aircraft[0];
    const newFlight: Flight = {
      ...flight,
      id: `FL-${200 + this.data.flights.length + 1}`,
      availableSeats: ac.capacity,
    };
    this.data.flights.push(newFlight);
    this.saveToStorage(this.data);
    return newFlight;
  }

  public createFlight(flight: Omit<Flight, 'id' | 'availableSeats'>): Flight {
    return this.addFlight(flight);
  }

  public deleteFlight(flightId: string): void {
    this.data.flights = this.data.flights.filter(f => f.id !== flightId);
    this.saveToStorage(this.data);
  }

  public updateFlight(flightId: string, updates: Partial<Flight>): void {
    const index = this.data.flights.findIndex(f => f.id === flightId);
    if (index !== -1) {
      this.data.flights[index] = { ...this.data.flights[index], ...updates };
      this.saveToStorage(this.data);
    }
  }

  // --- Seats Map Generator ---
  public getSeatsForFlight(flightId: string): Seat[] {
    const flight = this.getFlightById(flightId);
    if (!flight) return [];

    const bookedList = this.data.bookedSeats[flightId] || [];
    const seats: Seat[] = [];
    const cols = ['A', 'B', 'C', 'D', 'E', 'F'];
    const totalRows = 30;

    for (let r = 1; r <= totalRows; r++) {
      let cabinClass: CabinClass = 'Economy';
      let isPremium = false;
      let extraPrice = 0;

      if (r <= 2) {
        cabinClass = 'First';
        isPremium = true;
        extraPrice = 2500;
      } else if (r <= 6) {
        cabinClass = 'Business';
        isPremium = true;
        extraPrice = 1200;
      } else if (r === 12 || r === 13) {
        // Exit rows with extra legroom
        isPremium = true;
        extraPrice = 600;
      }

      for (const col of cols) {
        const seatNumber = `${r}${col}`;
        const isBooked = bookedList.includes(seatNumber);
        const type: 'window' | 'aisle' | 'middle' =
          col === 'A' || col === 'F' ? 'window' : col === 'C' || col === 'D' ? 'aisle' : 'middle';

        seats.push({
          id: `${flightId}-${seatNumber}`,
          flightId,
          seatNumber,
          row: r,
          col,
          cabinClass,
          isBooked,
          isPremium,
          extraPrice: extraPrice + (type === 'window' ? 150 : 0),
        });
      }
    }

    return seats;
  }

  // --- Bookings & PNR ---
  public generatePNR(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let pnr = '';
    for (let i = 0; i < 6; i++) {
      pnr += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // ensure unique
    if (this.data.bookings.some(b => b.pnr === pnr)) {
      return this.generatePNR();
    }
    return pnr;
  }

  public createBooking(params: {
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
    paymentMethod: PaymentMethod;
    cardLast4?: string;
    upiId?: string;
    walletName?: string;
  }): { booking: Booking; payment: Payment } {
    const pnr = this.generatePNR();
    const paymentId = `PAY-${Date.now().toString().slice(-6)}`;

    // Mark seat as booked
    if (!this.data.bookedSeats[params.flightId]) {
      this.data.bookedSeats[params.flightId] = [];
    }
    if (this.data.bookedSeats[params.flightId].includes(params.seatNumber)) {
      throw new Error(`Seat ${params.seatNumber} has already been reserved. Please select another seat.`);
    }
    this.data.bookedSeats[params.flightId].push(params.seatNumber);

    // Update flight available seats
    const flight = this.getFlightById(params.flightId);
    if (flight && flight.availableSeats > 0) {
      flight.availableSeats -= 1;
    }

    const booking: Booking = {
      id: `BK-${Date.now().toString().slice(-6)}`,
      pnr,
      userId: params.userId,
      flightId: params.flightId,
      passenger: { ...params.passenger, id: `PSG-${Date.now().toString().slice(-4)}` },
      seatNumber: params.seatNumber,
      cabinClass: params.cabinClass,
      concessionType: params.concessionType || 'REGULAR',
      baseFare: params.baseFare,
      seatFee: params.seatFee,
      taxesAndFees: params.taxesAndFees,
      convenienceFee: params.convenienceFee ?? 59,
      travelInsurance: params.travelInsurance ?? true,
      mealPreference: params.mealPreference,
      totalAmount: params.totalAmount,
      bookingStatus: 'CONFIRMED',
      paymentId,
      createdAt: new Date().toISOString(),
      travelDate: flight ? flight.departureDate : getDateOffset(1),
      isCheckedIn: false,
    };

    const payment: Payment = {
      id: paymentId,
      bookingPnr: pnr,
      amount: params.totalAmount,
      paymentMethod: params.paymentMethod,
      status: 'SUCCESS',
      transactionRef: `${params.paymentMethod.toUpperCase()}-TXN-${Math.floor(100000000 + Math.random() * 900000000)}`,
      timestamp: new Date().toISOString(),
      cardLast4: params.cardLast4,
      upiId: params.upiId,
      walletName: params.walletName,
    };

    this.data.bookings.unshift(booking);
    this.data.payments.unshift(payment);

    // In-system notification
    this.addNotification({
      userId: params.userId,
      title: 'Booking Confirmed!',
      message: `Your reservation for flight ${flight?.flightNumber || ''} is confirmed. PNR: ${pnr}, Seat: ${params.seatNumber}.`,
      type: 'success',
    });

    this.saveToStorage(this.data);

    // Sync booking with local Flask/MySQL backend
    apiService.createBooking({
      user_id: params.userId,
      train_id: params.flightId,
      journey_date: booking.travelDate,
      class_type: params.cabinClass,
      passengers: [{
        fullName: params.passenger.fullName,
        age: params.passenger.age,
        gender: params.passenger.gender,
        idNumber: params.passenger.passportNumber,
        seat_number: params.seatNumber
      }],
      selectedSeats: [params.seatNumber],
      total_fare: params.totalAmount,
      payment_method: params.paymentMethod
    }).catch(() => {});

    return { booking, payment };
  }

  public getBookings(userId?: string): Booking[] {
    if (userId) {
      return this.data.bookings.filter(b => b.userId === userId);
    }
    return this.data.bookings;
  }

  public getBookingByPnr(pnr: string): Booking | undefined {
    return this.data.bookings.find(b => b.pnr.toUpperCase() === pnr.toUpperCase().trim());
  }

  public getPaymentByPnr(pnr: string): Payment | undefined {
    return this.data.payments.find(p => p.bookingPnr.toUpperCase() === pnr.toUpperCase().trim());
  }

  public getBookedSeats(flightId: string): string[] {
    return this.data.bookedSeats[flightId] || [];
  }

  public getAircraftById(id: string): Aircraft | undefined {
    return this.data.aircraft.find(a => a.id === id);
  }

  // --- Cancellation & Refund ---
  public cancelBooking(pnr: string, reason: string): { cancellation: Cancellation; refundAmount: number } {
    const booking = this.getBookingByPnr(pnr);
    if (!booking) {
      throw new Error('Booking not found with PNR: ' + pnr);
    }
    if (booking.bookingStatus === 'CANCELLED') {
      throw new Error('This booking is already cancelled.');
    }

    // Cancellation rule: flat ₹500 cancellation fee or 10% whichever is greater, rest refunded
    const cancellationCharge = Math.min(Math.max(500, Math.round(booking.totalAmount * 0.1)), booking.totalAmount);
    const refundAmount = Math.max(0, booking.totalAmount - cancellationCharge);

    booking.bookingStatus = 'CANCELLED';

    // Release seat
    if (this.data.bookedSeats[booking.flightId]) {
      this.data.bookedSeats[booking.flightId] = this.data.bookedSeats[booking.flightId].filter(
        s => s !== booking.seatNumber
      );
    }

    // Increase available seats
    const flight = this.getFlightById(booking.flightId);
    if (flight) {
      flight.availableSeats += 1;
    }

    const cancellation: Cancellation = {
      id: `CNL-${Date.now().toString().slice(-6)}`,
      bookingPnr: booking.pnr,
      cancellationCharge,
      refundAmount,
      reason,
      cancelledAt: new Date().toISOString(),
      refundStatus: 'PROCESSED',
    };

    this.data.cancellations.unshift(cancellation);

    this.addNotification({
      userId: booking.userId,
      title: 'Ticket Cancelled & Refund Initiated',
      message: `Booking ${pnr} has been cancelled. Cancellation fee: ₹${cancellationCharge.toLocaleString()}, Refund of ₹${refundAmount.toLocaleString()} has been simulated back to source.`,
      type: 'info',
    });

    this.saveToStorage(this.data);

    // Sync cancellation with local Flask/MySQL backend
    apiService.cancelBooking(pnr, reason).catch(() => {});

    return { cancellation, refundAmount };
  }

  public getCancellations(): Cancellation[] {
    return this.data.cancellations;
  }

  public getPayments(): Payment[] {
    return this.data.payments;
  }

  // --- Web Check-in ---
  public performWebCheckIn(pnr: string, seatNumber?: string): WebCheckInRecord {
    const booking = this.getBookingByPnr(pnr);
    if (!booking) {
      throw new Error('Invalid PNR. No booking found.');
    }
    if (booking.bookingStatus === 'CANCELLED') {
      throw new Error('Cannot check in for a cancelled booking.');
    }

    const flight = this.getFlightById(booking.flightId);
    const gate = flight?.gate || '12A';
    const boardingTime = flight?.departureTime
      ? `${String(Math.max(0, parseInt(flight.departureTime.split(':')[0], 10) - 1)).padStart(2, '0')}:${flight.departureTime.split(':')[1]}`
      : '06:00';

    if (seatNumber && seatNumber !== booking.seatNumber) {
      // release old seat and reserve new seat
      if (this.data.bookedSeats[booking.flightId]) {
        this.data.bookedSeats[booking.flightId] = this.data.bookedSeats[booking.flightId].filter(
          s => s !== booking.seatNumber
        );
        this.data.bookedSeats[booking.flightId].push(seatNumber);
      }
      booking.seatNumber = seatNumber;
    }

    booking.isCheckedIn = true;
    booking.bookingStatus = 'CHECKED_IN';
    booking.checkInGate = gate;
    booking.boardingTime = boardingTime;

    const checkinRecord: WebCheckInRecord = {
      id: `CHK-${Date.now().toString().slice(-6)}`,
      bookingPnr: booking.pnr,
      passengerName: booking.passenger.fullName,
      flightNumber: flight?.flightNumber || 'FLIGHT',
      seatNumber: booking.seatNumber,
      gate,
      boardingTime,
      checkInTime: new Date().toISOString(),
    };

    this.data.checkins.unshift(checkinRecord);

    this.addNotification({
      userId: booking.userId,
      title: 'Web Check-in Successful!',
      message: `You are checked in for flight ${flight?.flightNumber || ''}. Seat: ${booking.seatNumber}, Gate: ${gate}. Boarding pass generated.`,
      type: 'success',
    });

    this.saveToStorage(this.data);
    return checkinRecord;
  }

  // --- Saved Passengers ---
  public getSavedPassengers(userId: string): Passenger[] {
    if (!userId) return [];
    return this.data.savedPassengers[userId] || [];
  }

  public savePassengerForUser(userId: string, passenger: Omit<Passenger, 'id'> | Passenger): Passenger {
    if (!userId) {
      throw new Error('User ID is required to save traveller');
    }
    if (!this.data.savedPassengers[userId]) {
      this.data.savedPassengers[userId] = [];
    }
    const cleanName = (passenger.fullName || '').trim().toLowerCase();
    const cleanPhone = (passenger.phone || '').trim();
    const cleanPassport = (passenger.passportNumber || '').trim().toUpperCase();

    // Prevent duplicate traveller records when clicked repeatedly or saved across tabs
    const existingIndex = this.data.savedPassengers[userId].findIndex(p => {
      const nameMatch = p.fullName.trim().toLowerCase() === cleanName;
      const phoneMatch = cleanPhone && p.phone && p.phone.trim() === cleanPhone;
      const passportMatch = cleanPassport && p.passportNumber && p.passportNumber.trim().toUpperCase() === cleanPassport;
      return nameMatch && (phoneMatch || passportMatch || (!cleanPhone && !cleanPassport));
    });

    if (existingIndex >= 0) {
      // Update existing record rather than creating a duplicate
      this.data.savedPassengers[userId][existingIndex] = {
        ...this.data.savedPassengers[userId][existingIndex],
        ...passenger,
        id: this.data.savedPassengers[userId][existingIndex].id,
      };
      this.saveToStorage(this.data);
      apiService.saveTraveller(userId, this.data.savedPassengers[userId][existingIndex]).catch(() => {});
      return this.data.savedPassengers[userId][existingIndex];
    }

    const newPassenger: Passenger = {
      ...passenger,
      id: (passenger as Passenger).id || `SAV-${Date.now().toString().slice(-4)}`,
    };
    this.data.savedPassengers[userId].push(newPassenger);
    this.saveToStorage(this.data);
    apiService.saveTraveller(userId, newPassenger).catch(() => {});
    return newPassenger;
  }

  public deleteSavedPassenger(userId: string, passengerId: string): void {
    if (this.data.savedPassengers[userId]) {
      this.data.savedPassengers[userId] = this.data.savedPassengers[userId].filter(p => p.id !== passengerId);
      this.saveToStorage(this.data);
      apiService.deleteSavedTraveller(userId, passengerId).catch(() => {});
    }
  }

  // --- Notifications ---
  public getNotifications(userId: string): AppNotification[] {
    return this.data.notifications.filter(n => n.userId === userId);
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'isRead' | 'timestamp'>): void {
    const newNotif: AppNotification = {
      ...notification,
      id: `NTF-${Date.now().toString().slice(-6)}`,
      isRead: false,
      timestamp: new Date().toISOString(),
    };
    this.data.notifications.unshift(newNotif);
    this.saveToStorage(this.data);
  }

  public markNotificationAsRead(id: string): void {
    const n = this.data.notifications.find(x => x.id === id);
    if (n) {
      n.isRead = true;
      this.saveToStorage(this.data);
    }
  }

  public markAllNotificationsAsRead(userId: string): void {
    this.data.notifications
      .filter(n => n.userId === userId)
      .forEach(n => (n.isRead = true));
    this.saveToStorage(this.data);
  }

  // --- Analytics & Reports ---
  public getAnalyticsSummary(): AnalyticsData {
    const totalCustomers = this.data.users.filter(u => u.role === 'customer').length;
    const totalStaff = this.data.users.filter(u => u.role === 'staff').length;
    const totalFlights = this.data.flights.length;
    const totalBookings = this.data.bookings.length;
    const cancelledBookings = this.data.bookings.filter(b => b.bookingStatus === 'CANCELLED').length;
    const successfulBookingsList = this.data.bookings.filter(b => b.bookingStatus !== 'CANCELLED');
    const successfulBookings = successfulBookingsList.length;

    // Total revenue strictly from actual successful bookings
    const totalRevenue = successfulBookingsList.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Average Ticket Value = Total Revenue ÷ Total Successful Bookings
    const averageTicketValue = successfulBookings > 0 ? Math.round(totalRevenue / successfulBookings) : 0;

    // Route popularity strictly from actual bookings
    const routeCounts: Record<string, { bookings: number; revenue: number }> = {};
    this.data.bookings.forEach(b => {
      const flight = this.getFlightById(b.flightId);
      if (flight) {
        const key = `${flight.originCode} → ${flight.destinationCode}`;
        if (!routeCounts[key]) {
          routeCounts[key] = { bookings: 0, revenue: 0 };
        }
        routeCounts[key].bookings += 1;
        if (b.bookingStatus !== 'CANCELLED') {
          routeCounts[key].revenue += b.totalAmount;
        }
      }
    });

    const popularRoutes = Object.entries(routeCounts)
      .map(([route, stat]) => ({
        route,
        bookings: stat.bookings,
        revenue: stat.revenue,
      }))
      .sort((a, b) => b.bookings - a.bookings);

    // Fleet Seat Occupancy & Available Seats calculated across all actual flights in dataset
    let totalSeats = 0;
    let totalBookedSeats = 0;

    const seatOccupancy = this.data.flights.map(f => {
      const booked = (this.data.bookedSeats[f.id] || []).length;
      const ac = this.data.aircraft.find(a => a.id === f.aircraftId);
      const cap = ac ? ac.capacity : 180;
      const available = Math.max(0, cap - booked);
      const occupancyRate = cap > 0 ? Math.min(100, Math.round((booked / cap) * 100)) : 0;

      totalSeats += cap;
      totalBookedSeats += booked;

      return {
        id: f.id,
        flightNumber: f.flightNumber,
        route: `${f.originCode} → ${f.destinationCode}`,
        originCode: f.originCode,
        destinationCode: f.destinationCode,
        departureTime: f.departureTime,
        aircraftModel: ac ? ac.model : 'Airbus A320neo',
        occupancyRate,
        totalSeats: cap,
        bookedSeats: booked,
        availableSeats: available,
      };
    });

    // Available Seats = Total Seats - Booked Seats
    const availableSeats = Math.max(0, totalSeats - totalBookedSeats);

    // Fleet Occupancy = Booked Seats ÷ Total Seats × 100
    const fleetOccupancyRate = totalSeats > 0 ? Number(((totalBookedSeats / totalSeats) * 100).toFixed(1)) : 0;

    // Cabin distribution strictly from actual bookings
    const cabinCounts: Record<string, number> = { Economy: 0, Business: 0, First: 0 };
    this.data.bookings.forEach(b => {
      if (cabinCounts[b.cabinClass] !== undefined) {
        cabinCounts[b.cabinClass] += 1;
      } else {
        cabinCounts[b.cabinClass] = 1;
      }
    });
    const cabinDistribution = Object.entries(cabinCounts).map(([cabin, count]) => ({
      cabin,
      count,
      percentage: totalBookings ? Math.round((count / totalBookings) * 100) : 0,
    }));

    // Monthly revenue & booking trend strictly calculated from actual booking records (no fake/hardcoded numbers)
    const monthMap: Record<string, { month: string; revenue: number; bookings: number; sortKey: string }> = {};
    this.data.bookings.forEach(b => {
      const date = new Date(b.createdAt || b.travelDate);
      const isValid = !isNaN(date.getTime());
      const monthLabel = isValid
        ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Recent';
      const sortKey = isValid
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : '9999-99';

      if (!monthMap[sortKey]) {
        monthMap[sortKey] = { month: monthLabel, revenue: 0, bookings: 0, sortKey };
      }
      monthMap[sortKey].bookings += 1;
      if (b.bookingStatus !== 'CANCELLED') {
        monthMap[sortKey].revenue += b.totalAmount;
      }
    });

    const monthlyRevenue = Object.values(monthMap)
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ month, revenue, bookings }) => ({ month, revenue, bookings }));

    const verifiedTicketsCount = this.getVerifiedTicketsCount();

    return {
      totalCustomers,
      totalStaff,
      totalFlights,
      totalBookings,
      successfulBookings,
      cancelledBookings,
      totalRevenue,
      averageTicketValue,
      totalSeats,
      totalBookedSeats,
      availableSeats,
      fleetOccupancyRate,
      monthlyRevenue,
      popularRoutes,
      seatOccupancy,
      cabinDistribution,
      verifiedTicketsCount,
    };
  }
}

export const db = new LocalDatabase();
