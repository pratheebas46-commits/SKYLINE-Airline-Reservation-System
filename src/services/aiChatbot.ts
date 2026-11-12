/**
 * Offline Natural Language Processing & Automated Booking Engine
 * for SKYLINE Reservation Domestic Airline Booking System
 *
 * Extracts passenger profile, travel itinerary, schedule, cabin,
 * airline, flight number, budget, contact information and concession category.
 * Integrates directly with the local 2026 domestic schedule database.
 * ZERO external network calls, zero external APIs.
 */

import { Airport, CabinClass, Flight, ConcessionType, Seat } from '../types';
import { db } from './db';

export interface ExtractedBookingIntent {
  // Passenger Profile
  passengerName?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  passengerCategory?: ConcessionType; // 'STUDENT' | 'SENIOR' | 'DEFENCE' | 'GOVT_LTC' | 'REGULAR'
  concessionId?: string;
  phone?: string;
  email?: string;
  passengersCount: number;
  mealPreference?: string;

  // Flight Requirements
  origin?: Airport;
  destination?: Airport;
  travelDate?: string; // YYYY-MM-DD (2026 domestic schedule)
  departureTimePreference?: string; // e.g. "10:00 AM", "Morning", "6:00 PM"
  cabinClass: CabinClass;
  airlinePreference?: string; // e.g. "IndiGo", "Air India", "Vistara", "SpiceJet", "Akasa Air"
  flightNumberPreference?: string; // e.g. "6E-204"
  maxBudget?: number;

  // Selected Booking Details
  selectedFlight?: Flight;
  selectedSeat?: Seat | null;

  // Processing state
  rawText: string;
  isComplete: boolean;
  missingFields: string[];
}

export interface PreparedBookingSummary {
  flight: Flight;
  cabinClass: CabinClass;
  concessionType: ConcessionType;
  concessionId?: string;
  passengerName: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  mealPreference: string;
  selectedSeat: Seat;
  rawBaseFare: number;
  concessionDiscount: number;
  baseFare: number;
  seatFee: number;
  taxesAndFees: number;
  convenienceFee: number;
  totalAmount: number;
}

// City / Airport keyword dictionary
interface CityAlias {
  code: string;
  names: string[];
}

const CITY_ALIASES: CityAlias[] = [
  { code: 'BLR', names: ['bangalore', 'bengaluru', 'blr', 'kempegowda', 'kia'] },
  { code: 'DEL', names: ['delhi', 'new delhi', 'del', 'indira gandhi', 'igi'] },
  { code: 'BOM', names: ['mumbai', 'bombay', 'bom', 'chhatrapati shivaji', 'csmia'] },
  { code: 'MAA', names: ['chennai', 'madras', 'maa', 'meenambakkam'] },
  { code: 'HYD', names: ['hyderabad', 'hyd', 'rajiv gandhi', 'rgia'] },
  { code: 'CCU', names: ['kolkata', 'calcutta', 'ccu', 'netaji subhash'] },
  { code: 'PNQ', names: ['pune', 'pnq', 'lohegaon'] },
  { code: 'GOI', names: ['goa', 'goi', 'mopa', 'dabolim'] },
  { code: 'DXB', names: ['dubai', 'dxb'] },
];

const AIRLINE_KEYWORDS: { [key: string]: string } = {
  indigo: 'IndiGo',
  'air india': 'Air India',
  airindia: 'Air India',
  vistara: 'Vistara',
  spicejet: 'SpiceJet',
  'spice jet': 'SpiceJet',
  akasa: 'Akasa Air',
  'akasa air': 'Akasa Air',
};

const MONTH_NAMES: { [key: string]: number } = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const FEMALE_NAMES = new Set([
  'pratheeba', 'priya', 'pooja', 'ananya', 'deepa', 'neha', 'shreya',
  'kavya', 'sneha', 'divya', 'swati', 'anjali', 'sunita', 'radha',
  'lakshmi', 'meera', 'aarti', 'shweta', 'riya', 'shruti', 'rita',
  'geeta', 'rekha', 'sonia', 'tanvi', 'isha', 'nisha', 'aditi',
  'pallavi', 'meenakshi', 'chitra', 'sarita', 'preeti', 'anita'
]);

const MALE_NAMES = new Set([
  'rahul', 'rohit', 'amit', 'raj', 'arun', 'vikram', 'suresh',
  'ramesh', 'ajay', 'vijay', 'karthik', 'sanjay', 'anil', 'manoj',
  'praveen', 'vivek', 'deepak', 'rakesh', 'sunil', 'ashok', 'ravi'
]);

export function parseNaturalLanguageBooking(
  input: string,
  userProfile?: { fullName?: string; phone?: string; email?: string; gender?: 'Male' | 'Female' | 'Other' } | null,
  previousIntent?: Partial<ExtractedBookingIntent>
): ExtractedBookingIntent {
  const text = input.trim();
  const lower = text.toLowerCase();
  const airports = db.getAirports();

  const result: ExtractedBookingIntent = {
    passengerName: previousIntent?.passengerName,
    age: previousIntent?.age,
    gender: previousIntent?.gender,
    passengerCategory: previousIntent?.passengerCategory || 'REGULAR',
    concessionId: previousIntent?.concessionId,
    phone: previousIntent?.phone,
    email: previousIntent?.email,
    passengersCount: previousIntent?.passengersCount || 1,
    mealPreference: previousIntent?.mealPreference || 'Standard In-Flight Meal',

    origin: previousIntent?.origin,
    destination: previousIntent?.destination,
    travelDate: previousIntent?.travelDate,
    departureTimePreference: previousIntent?.departureTimePreference,
    cabinClass: previousIntent?.cabinClass || 'Economy',
    airlinePreference: previousIntent?.airlinePreference,
    flightNumberPreference: previousIntent?.flightNumberPreference,
    maxBudget: previousIntent?.maxBudget,

    selectedFlight: previousIntent?.selectedFlight,
    selectedSeat: previousIntent?.selectedSeat,

    rawText: text,
    isComplete: false,
    missingFields: [],
  };

  // 1. Extract Passenger Name
  // Matches: "I am Pratheeba", "my name is Pratheeba", "passenger Pratheeba", "name: Pratheeba", "myself Pratheeba"
  const nameRegex = /(?:i am|i'm|my name is|passenger is|passenger name is|myself|name:)\s+([A-Za-z]+(?:\s+[A-Za-z]+)?)/i;
  const nameMatch = text.match(nameRegex);
  if (nameMatch) {
    const candidate = nameMatch[1].trim();
    const noise = ['looking', 'searching', 'booking', 'flying', 'travelling', 'traveling', 'student', 'senior', 'defence', 'regular'];
    if (!noise.includes(candidate.toLowerCase())) {
      result.passengerName = candidate;
    }
  }

  // 2. Extract Age
  // Matches: "24 years old", "24 yr old", "24 yrs", "age 24", "age: 24", "24, student"
  const ageRegex = /(?:(\d{1,2})\s*(?:years?\s*old|yrs?\s*old|yrs?|yo\b)|(?:age|aged)\s*(?:is|:)?\s*(\d{1,2})|\b(\d{1,2})\s*,\s*(?:student|senior|male|female))/i;
  const ageMatch = text.match(ageRegex);
  if (ageMatch) {
    const ageVal = parseInt(ageMatch[1] || ageMatch[2] || ageMatch[3], 10);
    if (!isNaN(ageVal) && ageVal >= 1 && ageVal <= 110) {
      result.age = ageVal;
    }
  }

  // 3. Extract Gender
  if (/\b(?:female|girl|woman|lady|ms\.?|mrs\.?|miss)\b/i.test(text)) {
    result.gender = 'Female';
  } else if (/\b(?:male|boy|man|mr\.?|gentleman)\b/i.test(text)) {
    result.gender = 'Male';
  } else if (result.passengerName) {
    const firstName = result.passengerName.trim().split(/\s+/)[0].toLowerCase();
    if (FEMALE_NAMES.has(firstName)) {
      result.gender = 'Female';
    } else if (MALE_NAMES.has(firstName)) {
      result.gender = 'Male';
    }
  }
  if (!result.gender) {
    result.gender = 'Female'; // Sensible default
  }

  // 4. Extract Passenger Category / Concession
  if (lower.includes('student') || lower.includes('studying') || lower.includes('college')) {
    result.passengerCategory = 'STUDENT';
  } else if (lower.includes('senior') || lower.includes('pensioner') || (result.age && result.age >= 60)) {
    result.passengerCategory = 'SENIOR';
  } else if (lower.includes('defence') || lower.includes('defense') || lower.includes('military') || lower.includes('army') || lower.includes('airforce') || lower.includes('soldier')) {
    result.passengerCategory = 'DEFENCE';
  } else if (lower.includes('govt') || lower.includes('government') || lower.includes('ltc')) {
    result.passengerCategory = 'GOVT_LTC';
  }

  // 5. Extract Concession ID
  const concessionIdRegex = /(?:id(?:\s*card|\s*number)?|student\s*id|roll\s*(?:no|number)|defence\s*id)\s*(?:is|:)?\s*([A-Za-z0-9\-_]{3,20})/i;
  const concessionIdMatch = text.match(concessionIdRegex);
  if (concessionIdMatch) {
    result.concessionId = concessionIdMatch[1].toUpperCase();
  }

  // 6. Extract Mobile Phone (10 digits)
  const phoneRegex = /(?:\+91[\-\s]?)?([6-9]\d{9})\b/;
  const phoneMatch = text.match(phoneRegex);
  if (phoneMatch) {
    result.phone = phoneMatch[1];
  }

  // 7. Extract Email Address
  const emailRegex = /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/;
  const emailMatch = text.match(emailRegex);
  if (emailMatch) {
    result.email = emailMatch[1];
  }

  // 8. Extract Meal Preference
  if (lower.includes('veg meal') || lower.includes('pure veg') || lower.includes('vegetarian')) {
    result.mealPreference = 'Vegetarian Meal';
  } else if (lower.includes('non veg') || lower.includes('non-veg') || lower.includes('chicken')) {
    result.mealPreference = 'Non-Vegetarian Meal';
  } else if (lower.includes('jain meal') || lower.includes('jain')) {
    result.mealPreference = 'Jain Special Meal';
  } else if (lower.includes('vegan')) {
    result.mealPreference = 'Vegan Meal';
  }

  // 9. Extract Maximum Budget
  const budgetRegex = /(?:budget|under|below|within|max|price limit)\s*(?:is|of|:)?\s*(?:₹|rs\.?|inr)?\s*(\d{3,6})/i;
  const budgetMatch = text.match(budgetRegex);
  if (budgetMatch) {
    const bVal = parseInt(budgetMatch[1], 10);
    if (!isNaN(bVal) && bVal >= 1000) {
      result.maxBudget = bVal;
    }
  } else {
    const symbolBudgetRegex = /(?:₹|rs\.?|inr)\s*(\d{3,6})/i;
    const symbolMatch = text.match(symbolBudgetRegex);
    if (symbolMatch) {
      const bVal = parseInt(symbolMatch[1], 10);
      if (!isNaN(bVal) && bVal >= 1000) {
        result.maxBudget = bVal;
      }
    }
  }

  // 10. Extract Flight Number Preference (e.g. 6E-204)
  const flightNumRegex = /\b([0-9A-Z]{2}[-\s]?[0-9]{3,4})\b/i;
  const flightNumMatch = text.match(flightNumRegex);
  if (flightNumMatch) {
    const candidateCode = flightNumMatch[1].toUpperCase().replace(/\s+/, '-');
    if (candidateCode.startsWith('6E') || candidateCode.startsWith('AI') || candidateCode.startsWith('UK') || candidateCode.startsWith('SG') || candidateCode.startsWith('QP')) {
      result.flightNumberPreference = candidateCode;
    }
  }

  // 11. Extract Airline Preference
  for (const [key, airlineName] of Object.entries(AIRLINE_KEYWORDS)) {
    if (lower.includes(key)) {
      result.airlinePreference = airlineName;
      break;
    }
  }

  // 12. Extract Cabin Class
  if (lower.includes('business')) {
    result.cabinClass = 'Business';
  } else if (lower.includes('first class') || lower.includes('first')) {
    result.cabinClass = 'First';
  } else if (lower.includes('economy')) {
    result.cabinClass = 'Economy';
  }

  // 13. Extract Number of Passengers
  const passRegex = /(\d+)\s*(?:passengers?|people|persons?|adults?|seats?|tickets?|pax)/i;
  const passMatch = lower.match(passRegex);
  if (passMatch) {
    const count = parseInt(passMatch[1], 10);
    if (!isNaN(count) && count >= 1 && count <= 9) {
      result.passengersCount = count;
    }
  } else {
    const wordNums: { [k: string]: number } = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9
    };
    for (const [word, val] of Object.entries(wordNums)) {
      if (new RegExp(`(?:for\\s+)?${word}\\s+(?:passengers?|people|persons?|adults?|seats?|pax)`, 'i').test(lower)) {
        result.passengersCount = val;
        break;
      }
    }
  }

  // Helper to match city or airport code
  const findAirportByQuery = (query: string): Airport | undefined => {
    const clean = query.trim().toLowerCase();
    for (const alias of CITY_ALIASES) {
      if (alias.names.some(n => clean === n || clean.includes(n) || n.includes(clean))) {
        return airports.find(a => a.code === alias.code);
      }
    }
    return airports.find(
      a =>
        a.city.toLowerCase() === clean ||
        a.code.toLowerCase() === clean ||
        a.city.toLowerCase().includes(clean) ||
        clean.includes(a.city.toLowerCase())
    );
  };

  // 14. Extract Origin & Destination
  const fromToRegex = /(?:from|leaving|departing|origin)\s+([a-zA-Z\s]+?)\s+(?:to|towards|dest|destination)\s+([a-zA-Z\s]+?)(?:\s+(?:on|at|for|around|tomorrow|today|next|with|in|\$|₹)|$|\.|\,)/i;
  const fromToMatch = lower.match(fromToRegex);

  if (fromToMatch) {
    const o = findAirportByQuery(fromToMatch[1]);
    const d = findAirportByQuery(fromToMatch[2]);
    if (o) result.origin = o;
    if (d) result.destination = d;
  }

  // Check simple "CityA to CityB"
  if (!result.origin || !result.destination) {
    const simpleToRegex = /([a-zA-Z]+)\s+to\s+([a-zA-Z]+)/i;
    const simpleToMatch = lower.match(simpleToRegex);
    if (simpleToMatch) {
      const o = findAirportByQuery(simpleToMatch[1]);
      const d = findAirportByQuery(simpleToMatch[2]);
      if (o) result.origin = o;
      if (d) result.destination = d;
    }
  }

  // Fallback individual origin/dest check
  if (!result.origin) {
    const fromRegex = /(?:from|out of|departing)\s+([a-zA-Z]+)/i;
    const m = lower.match(fromRegex);
    if (m) {
      const found = findAirportByQuery(m[1]);
      if (found) result.origin = found;
    }
  }
  if (!result.destination) {
    const toRegex = /(?:to|destination|towards|reaching)\s+([a-zA-Z]+)/i;
    const m = lower.match(toRegex);
    if (m) {
      const found = findAirportByQuery(m[1]);
      if (found) result.destination = found;
    }
  }

  // 15. Extract Departure Time Preference
  const timeRegex = /(?:at|around|about|approx)?\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i;
  const timeMatch = lower.match(timeRegex);
  if (timeMatch) {
    result.departureTimePreference = timeMatch[1].toUpperCase();
  } else if (lower.includes('morning')) {
    result.departureTimePreference = 'Morning (06:00 - 12:00)';
  } else if (lower.includes('afternoon')) {
    result.departureTimePreference = 'Afternoon (12:00 - 17:00)';
  } else if (lower.includes('evening')) {
    result.departureTimePreference = 'Evening (17:00 - 21:00)';
  } else if (lower.includes('night') || lower.includes('late')) {
    result.departureTimePreference = 'Night (21:00 - 06:00)';
  }

  // 16. Extract Travel Date in 2026 Schedule Dataset
  const referenceYear = 2026;
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (lower.includes('tomorrow')) {
    const d = new Date(referenceYear, currentMonth - 1, currentDay + 1);
    result.travelDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } else if (lower.includes('today')) {
    const d = new Date(referenceYear, currentMonth - 1, currentDay);
    result.travelDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  } else {
    // "2026-10-20" or "20/10/2026"
    const fullDateRegex = /(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;
    const fullMatch = text.match(fullDateRegex);
    if (fullMatch) {
      result.travelDate = `${fullMatch[1]}-${fullMatch[2].padStart(2, '0')}-${fullMatch[3].padStart(2, '0')}`;
    } else {
      // "20 October 2026", "20th October", "25 Oct"
      const namedDateRegex = /(\d{1,2})(?:st|nd|rd|th)?\s+([a-zA-Z]+)(?:\s+(\d{4}))?/i;
      const namedMatch = text.match(namedDateRegex);
      if (namedMatch) {
        const day = parseInt(namedMatch[1], 10);
        const monthKey = namedMatch[2].toLowerCase();
        const monthNum = MONTH_NAMES[monthKey];
        if (monthNum && day >= 1 && day <= 31) {
          const yr = namedMatch[3] ? parseInt(namedMatch[3], 10) : referenceYear;
          result.travelDate = `${yr}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }
  }

  // Identify essential missing fields needed to find flights
  const missing: string[] = [];
  if (!result.origin) missing.push('Departure City (Origin)');
  if (!result.destination) missing.push('Destination City');
  if (!result.travelDate) missing.push('Travel Date');

  result.missingFields = missing;
  result.isComplete = missing.length === 0;

  return result;
}

/**
 * Searches flights matching extracted intent with budget, airline, time filters
 * against the existing local 2026 schedule dataset.
 */
export function findMatchingFlightsForIntent(intent: ExtractedBookingIntent): Flight[] {
  if (!intent.origin || !intent.destination) return [];

  const dateToQuery = intent.travelDate || '2026-10-20';
  const allFlights = db.searchFlights({
    origin: intent.origin.code,
    destination: intent.destination.code,
    date: dateToQuery,
    cabinClass: intent.cabinClass || 'Economy',
  });

  let matching = [...allFlights];

  // Specific flight number filter if user requested
  if (intent.flightNumberPreference) {
    const fPref = intent.flightNumberPreference.toUpperCase();
    const flightMatches = matching.filter(f => f.flightNumber.toUpperCase() === fPref);
    if (flightMatches.length > 0) {
      return flightMatches;
    }
  }

  // Budget filter if specified
  if (intent.maxBudget && intent.maxBudget > 0) {
    const withinBudget = matching.filter(f => f.basePrice <= (intent.maxBudget || 999999));
    if (withinBudget.length > 0) {
      matching = withinBudget;
    }
  }

  // Airline preference sorting
  if (intent.airlinePreference) {
    const pref = intent.airlinePreference.toLowerCase();
    matching.sort((a, b) => {
      const aMatch = a.airline.toLowerCase().includes(pref) ? 1 : 0;
      const bMatch = b.airline.toLowerCase().includes(pref) ? 1 : 0;
      return bMatch - aMatch;
    });
  }

  // Time preference sorting
  if (intent.departureTimePreference) {
    const timePref = intent.departureTimePreference.toLowerCase();
    const hrMatch = timePref.match(/(\d{1,2})(?::\d{2})?\s*(am|pm)/i);
    if (hrMatch) {
      let targetHr = parseInt(hrMatch[1], 10);
      if (hrMatch[2].toLowerCase() === 'pm' && targetHr < 12) targetHr += 12;
      if (hrMatch[2].toLowerCase() === 'am' && targetHr === 12) targetHr = 0;

      matching.sort((a, b) => {
        const aHr = parseInt(a.departureTime.split(':')[0], 10);
        const bHr = parseInt(b.departureTime.split(':')[0], 10);
        const diffA = Math.abs(aHr - targetHr);
        const diffB = Math.abs(bHr - targetHr);
        return diffA - diffB;
      });
    } else if (timePref.includes('morning')) {
      matching.sort((a, b) => {
        const aHr = parseInt(a.departureTime.split(':')[0], 10);
        const bHr = parseInt(b.departureTime.split(':')[0], 10);
        const aScore = aHr >= 6 && aHr <= 12 ? 0 : 1;
        const bScore = bHr >= 6 && bHr <= 12 ? 0 : 1;
        return aScore - bScore;
      });
    } else if (timePref.includes('evening')) {
      matching.sort((a, b) => {
        const aHr = parseInt(a.departureTime.split(':')[0], 10);
        const bHr = parseInt(b.departureTime.split(':')[0], 10);
        const aScore = aHr >= 17 && aHr <= 21 ? 0 : 1;
        const bScore = bHr >= 17 && bHr <= 21 ? 0 : 1;
        return aScore - bScore;
      });
    }
  }

  return matching;
}

/**
 * Automatically assigns an optimal seat for the flight and cabin class
 * (Prioritizing Window or Aisle seats in the selected class)
 */
export function autoAssignSeat(flightId: string, cabinClass: CabinClass): Seat | null {
  const seats = db.getSeatsForFlight(flightId);
  const available = seats.filter(s => !s.isBooked && s.cabinClass === cabinClass);
  if (available.length === 0) return null;

  // Prefer Window (A, F) then Aisle (C, D) then others
  const windowSeat = available.find(s => s.col === 'A' || s.col === 'F');
  if (windowSeat) return windowSeat;

  const aisleSeat = available.find(s => s.col === 'C' || s.col === 'D');
  if (aisleSeat) return aisleSeat;

  return available[0];
}

/**
 * Prepares the complete automated booking calculation and verification structure
 */
export function prepareBookingSummary(
  flight: Flight,
  cabinClass: CabinClass,
  concessionType: ConcessionType,
  intent: ExtractedBookingIntent,
  seat: Seat | null
): PreparedBookingSummary {
  const rawBaseFare = Math.round(
    flight.basePrice *
      (cabinClass === 'Business' ? flight.businessMultiplier : cabinClass === 'First' ? flight.firstMultiplier : 1)
  );

  const concessionDiscount =
    concessionType === 'DEFENCE'
      ? Math.round(rawBaseFare * 0.5)
      : concessionType === 'SENIOR' || concessionType === 'STUDENT'
      ? Math.round(rawBaseFare * 0.1)
      : concessionType === 'GOVT_LTC'
      ? Math.round(rawBaseFare * 0.05)
      : 0;

  const baseFare = rawBaseFare - concessionDiscount;
  const seatFee = seat ? seat.extraPrice : 0;
  const convenienceFee = 0; // UPI is free
  const taxesAndFees = Math.round(baseFare * 0.12) + 250;
  const totalAmount = baseFare + seatFee + taxesAndFees + convenienceFee;

  return {
    flight,
    cabinClass,
    concessionType,
    concessionId: intent.concessionId,
    passengerName: intent.passengerName || 'Passenger',
    age: intent.age || 28,
    gender: intent.gender || 'Female',
    phone: intent.phone || '9876543210',
    email: intent.email || 'passenger@example.com',
    mealPreference: intent.mealPreference || 'Standard In-Flight Meal',
    selectedSeat: seat || {
      id: `seat-${flight.id}-auto`,
      flightId: flight.id,
      seatNumber: '12A',
      row: 12,
      col: 'A',
      cabinClass,
      isBooked: false,
      isPremium: false,
      extraPrice: 0,
    },
    rawBaseFare,
    concessionDiscount,
    baseFare,
    seatFee,
    taxesAndFees,
    convenienceFee,
    totalAmount,
  };
}
