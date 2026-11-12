import React, { useState, useMemo } from 'react';
import {
  Search,
  Plane,
  Calendar,
  Users,
  ArrowRightLeft,
  ArrowRight,
  Clock,
  Tag,
  Filter,
  ArrowUpDown,
  PlaneTakeoff,
  PlaneLanding,
  Sunrise,
  Sun,
  SunMedium,
  Moon,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Utensils,
  Briefcase,
  ShieldCheck,
  Info,
  Award,
  GraduationCap,
  HeartHandshake,
  Landmark,
  FileText,
  AlertCircle,
  Luggage,
  Receipt,
  RotateCcw,
  Percent,
  Bot,
  Sparkles
} from 'lucide-react';
import { Flight, CabinClass, ConcessionType, Airport } from '../types';
import { db } from '../services/db';
import { aiRecommendationService } from '../services/aiRecommendation';

interface FlightSearchProps {
  onSelectFlightToBook: (
    flight: Flight,
    cabinClass: CabinClass,
    tripType: 'oneway' | 'roundtrip',
    concessionType: ConcessionType
  ) => void;
  onOpenChatbot?: () => void;
}

type TimeSlot = 'ALL' | 'early' | 'morning' | 'afternoon' | 'night';
type SortOption = 'price' | 'time_asc' | 'time_desc' | 'duration' | 'seats';
type DetailTab = 'flight' | 'baggage' | 'fare' | 'policy';

// Helper to format date into "Wed, 16 Sep"
function formatCarouselDate(dateStr: string): { dayName: string; formattedDate: string } {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const formattedDate = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return { dayName, formattedDate };
  } catch {
    return { dayName: 'Day', formattedDate: dateStr };
  }
}

// Airline brand color and metadata helper
function getAirlineBrand(airline: string) {
  switch (airline) {
    case 'IndiGo':
      return {
        bg: 'bg-blue-600',
        text: 'text-blue-700',
        border: 'border-blue-200',
        lightBg: 'bg-blue-50',
        code: '6E',
        meal: 'Buy on Board Snacks',
        aircraft: 'Airbus A320neo',
        pitch: '30-inch pitch',
      };
    case 'Air India':
      return {
        bg: 'bg-red-600',
        text: 'text-red-700',
        border: 'border-red-200',
        lightBg: 'bg-red-50',
        code: 'AI',
        meal: 'Complimentary Hot Meal',
        aircraft: 'Airbus A320neo / Boeing 777',
        pitch: '32-inch pitch',
      };
    case 'Vistara':
      return {
        bg: 'bg-purple-900',
        text: 'text-purple-800',
        border: 'border-purple-200',
        lightBg: 'bg-purple-50',
        code: 'UK',
        meal: 'Complimentary Gourmet Meal',
        aircraft: 'Boeing 737-800 / A321neo',
        pitch: '31-inch pitch',
      };
    case 'SpiceJet':
      return {
        bg: 'bg-orange-600',
        text: 'text-orange-700',
        border: 'border-orange-200',
        lightBg: 'bg-orange-50',
        code: 'SG',
        meal: 'Pre-book Hot Meals',
        aircraft: 'Boeing 737 MAX 8',
        pitch: '29-inch pitch',
      };
    case 'Akasa Air':
      return {
        bg: 'bg-amber-600',
        text: 'text-amber-700',
        border: 'border-amber-200',
        lightBg: 'bg-amber-50',
        code: 'QP',
        meal: 'Café Akasa Menu on Board',
        aircraft: 'Boeing 737 MAX 8',
        pitch: '30-inch pitch',
      };
    default:
      return {
        bg: 'bg-slate-700',
        text: 'text-slate-700',
        border: 'border-slate-200',
        lightBg: 'bg-slate-50',
        code: 'FL',
        meal: 'Refreshments on Board',
        aircraft: 'Standard Commercial Jet',
        pitch: '30-inch pitch',
      };
  }
}

export const FlightSearch: React.FC<FlightSearchProps> = ({ onSelectFlightToBook, onOpenChatbot }) => {
  const airports = useMemo(() => db.getAirports(), []);

  // Search form state
  const [tripType, setTripType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [concessionType, setConcessionType] = useState<ConcessionType>('REGULAR');
  const [origin, setOrigin] = useState<string>('DEL');
  const [destination, setDestination] = useState<string>('BOM');
  const [departureDate, setDepartureDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [returnDate, setReturnDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [cabinClass, setCabinClass] = useState<CabinClass>('Economy');
  const [passengers, setPassengers] = useState<number>(1);

  // Filter states (IRCTC style: time-of-day slots, airlines, and sorting)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>('ALL');
  const [selectedAirline, setSelectedAirline] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('price');

  // Expanded Flight Details state (which flight has details open, and which tab)
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<Record<string, DetailTab>>({});

  // Handle swap origin and destination
  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Helper for cabin price calculation with IRCTC concession discounts
  const getFlightPrice = (flight: Flight, cabin: CabinClass, concession: ConcessionType = concessionType): number => {
    let raw = flight.basePrice;
    if (cabin === 'Business') raw = Math.round(raw * flight.businessMultiplier);
    else if (cabin === 'First') raw = Math.round(raw * flight.firstMultiplier);

    // Concession discount logic
    if (concession === 'DEFENCE') {
      // 50% discount on base fare for armed forces
      raw = Math.round(raw * 0.5);
    } else if (concession === 'SENIOR' || concession === 'STUDENT') {
      // 10% discount on base fare for senior citizen / student
      raw = Math.round(raw * 0.9);
    }
    return raw;
  };

  // Fetch flights dynamically based on origin, destination, and selected departureDate
  const allDateFlights = useMemo(() => {
    return db.searchFlights({
      origin,
      destination,
      date: departureDate,
      cabinClass,
    });
  }, [origin, destination, departureDate, cabinClass]);

  // Generate 7-day Fare Carousel Dates centered around selected date
  const carouselDays = useMemo(() => {
    const days: { dateStr: string; dayName: string; formattedDate: string; minFare: number }[] = [];
    const baseDate = new Date(departureDate + 'T00:00:00');

    // Range: 1 day before to 5 days ahead
    for (let offset = -1; offset <= 5; offset++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + offset);
      const dateStr = d.toISOString().split('T')[0];
      const { dayName, formattedDate } = formatCarouselDate(dateStr);

      // Query flights for that day to find minimum starting fare
      const dayFlights = db.searchFlights({
        origin,
        destination,
        date: dateStr,
        cabinClass,
      });

      let minFare = 4200;
      if (dayFlights.length > 0) {
        minFare = Math.min(...dayFlights.map(f => getFlightPrice(f, cabinClass, concessionType)));
      }

      days.push({
        dateStr,
        dayName,
        formattedDate,
        minFare,
      });
    }

    return days;
  }, [departureDate, origin, destination, cabinClass, concessionType]);

  // Find the lowest fare among the 7 days
  const lowestCarouselFare = useMemo(() => {
    if (carouselDays.length === 0) return 0;
    return Math.min(...carouselDays.map(d => d.minFare));
  }, [carouselDays]);

  // Navigate carousel by offset days
  const handleShiftDate = (deltaDays: number) => {
    const cur = new Date(departureDate + 'T00:00:00');
    cur.setDate(cur.getDate() + deltaDays);
    setDepartureDate(cur.toISOString().split('T')[0]);
  };

  // Compute flight counts per departure time slot (IRCTC Air signature)
  const timeSlotCounts = useMemo(() => {
    const counts = { early: 0, morning: 0, afternoon: 0, night: 0 };
    allDateFlights.forEach(f => {
      const hour = parseInt(f.departureTime.split(':')[0], 10);
      if (hour < 6) counts.early++;
      else if (hour < 12) counts.morning++;
      else if (hour < 18) counts.afternoon++;
      else counts.night++;
    });
    return counts;
  }, [allDateFlights]);

  // Unique airlines present with counts and starting fares
  const airlineStats = useMemo(() => {
    const map = new Map<string, { count: number; minPrice: number }>();
    allDateFlights.forEach(f => {
      const price = getFlightPrice(f, cabinClass, concessionType);
      const existing = map.get(f.airline);
      if (!existing) {
        map.set(f.airline, { count: 1, minPrice: price });
      } else {
        existing.count++;
        if (price < existing.minPrice) existing.minPrice = price;
      }
    });
    return Array.from(map.entries()).map(([airline, stats]) => ({
      airline,
      count: stats.count,
      minPrice: stats.minPrice,
    }));
  }, [allDateFlights, cabinClass, concessionType]);

  // Filter flights by time-of-day slot and airline
  const filteredFlights = useMemo(() => {
    return allDateFlights.filter(f => {
      // Airline filter
      if (selectedAirline !== 'ALL' && f.airline !== selectedAirline) {
        return false;
      }
      // Time-of-day slot filter
      if (selectedTimeSlot !== 'ALL') {
        const hour = parseInt(f.departureTime.split(':')[0], 10);
        if (selectedTimeSlot === 'early' && hour >= 6) return false;
        if (selectedTimeSlot === 'morning' && (hour < 6 || hour >= 12)) return false;
        if (selectedTimeSlot === 'afternoon' && (hour < 12 || hour >= 18)) return false;
        if (selectedTimeSlot === 'night' && hour < 18) return false;
      }
      return true;
    });
  }, [allDateFlights, selectedAirline, selectedTimeSlot]);

  // Sort filtered flights
  const sortedFlights = useMemo(() => {
    const list = [...filteredFlights];
    if (sortBy === 'price') {
      list.sort((a, b) => getFlightPrice(a, cabinClass, concessionType) - getFlightPrice(b, cabinClass, concessionType));
    } else if (sortBy === 'time_asc') {
      list.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    } else if (sortBy === 'time_desc') {
      list.sort((a, b) => b.departureTime.localeCompare(a.departureTime));
    } else if (sortBy === 'duration') {
      list.sort((a, b) => a.durationMinutes - b.durationMinutes);
    } else if (sortBy === 'seats') {
      list.sort((a, b) => b.availableSeats - a.availableSeats);
    }
    return list;
  }, [filteredFlights, sortBy, cabinClass, concessionType]);

  // Best flight recommendations based on schedule and pricing
  const aiRecommendations = useMemo(() => {
    return aiRecommendationService.getRecommendations(sortedFlights, selectedTimeSlot, cabinClass);
  }, [sortedFlights, selectedTimeSlot, cabinClass]);

  const toggleFlightDetails = (flightId: string) => {
    if (expandedFlightId === flightId) {
      setExpandedFlightId(null);
    } else {
      setExpandedFlightId(flightId);
      if (!activeDetailTab[flightId]) {
        setActiveDetailTab(prev => ({ ...prev, [flightId]: 'flight' }));
      }
    }
  };

  const handleTabChange = (flightId: string, tab: DetailTab) => {
    setActiveDetailTab(prev => ({ ...prev, [flightId]: tab }));
  };

  return (
    <div className="space-y-6">
      
      {/* IRCTC Air Official Trust Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-800">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Book Flights Across All Airlines
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Every airline operates at least 5 departures every day across morning, afternoon, and night slots. Select special concession categories for Armed Forces, Senior Citizens, Students, and LTC Government travel.
            </p>
          </div>

          {onOpenChatbot && (
            <button
              id="search-open-chatbot-btn"
              onClick={onOpenChatbot}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0"
            >
              <Plane className="w-4 h-4 text-white" />
              <span>Flight Booking</span>
            </button>
          )}
        </div>

        {/* Search Controls Card */}
        <div className="mt-6 bg-white/95 backdrop-blur-md rounded-2xl p-5 sm:p-6 text-slate-800 shadow-xl border border-white/20">
          
          {/* Trip Type & Cabin Class Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 text-sm">
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                id="search-tab-oneway"
                onClick={() => setTripType('oneway')}
                className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                  tripType === 'oneway'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                One-way
              </button>
              <button
                type="button"
                id="search-tab-roundtrip"
                onClick={() => setTripType('roundtrip')}
                className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                  tripType === 'roundtrip'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Round-trip
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Cabin Class Selector */}
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Class:</span>
                <select
                  id="cabin-class-select"
                  value={cabinClass}
                  onChange={e => setCabinClass(e.target.value as CabinClass)}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Economy">Economy</option>
                  <option value="Business">Business</option>
                  <option value="First">First Class</option>
                </select>
              </div>

              {/* Passengers Selector */}
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Passengers:</span>
                <select
                  id="passengers-count-select"
                  value={passengers}
                  onChange={e => setPassengers(Number(e.target.value))}
                  className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Adult' : 'Adults'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* IRCTC Special Concession Category Selector */}
          <div className="py-3 border-b border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Special Fare / Concession Category:
              </span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {[
                {
                  id: 'REGULAR',
                  label: 'Regular Fare',
                  desc: 'Standard commercial rates',
                  icon: Users,
                  badge: 'Standard',
                },
                {
                  id: 'DEFENCE',
                  label: 'Armed Forces / Defence',
                  desc: '50% off base fare • 25kg bag',
                  icon: Award,
                  badge: '50% Off',
                },
                {
                  id: 'SENIOR',
                  label: 'Senior Citizen',
                  desc: '60+ years • Concession rate',
                  icon: HeartHandshake,
                  badge: '10% Off',
                },
                {
                  id: 'STUDENT',
                  label: 'Student Fare',
                  desc: 'Extra 10kg baggage • Discount',
                  icon: GraduationCap,
                  badge: '+10kg Bag',
                },
                {
                  id: 'GOVT_LTC',
                  label: 'Govt. Employee / LTC',
                  desc: 'Official claim approved ticket',
                  icon: Landmark,
                  badge: 'LTC Claim',
                },
              ].map(cat => {
                const isSelected = concessionType === cat.id;
                const IconComponent = cat.icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    id={`concession-btn-${cat.id}`}
                    onClick={() => setConcessionType(cat.id as ConcessionType)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                          {cat.label}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{cat.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {concessionType !== 'REGULAR' && (
              <div className="mt-2.5 p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0 text-blue-600" />
                <span>
                  {concessionType === 'DEFENCE' && 'Armed forces personnel & eligible dependents require valid Military ID / Dependent Card at airport check-in. Includes 25kg check-in baggage.'}
                  {concessionType === 'SENIOR' && 'Senior citizen concession is applicable for travelers 60 years or above. Government age proof (Aadhaar/Passport/Voter ID) mandatory at check-in.'}
                  {concessionType === 'STUDENT' && 'Student concession allows 25kg check-in baggage (15kg + 10kg free) and special discounted base fare with valid school/college photo ID.'}
                  {concessionType === 'GOVT_LTC' && 'Official tickets are 100% compliant for central and state government LTC reimbursement with official billing breakdown and GST certificate.'}
                </span>
              </div>
            )}
          </div>

          {/* Flight Route Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4 items-center">
            
            {/* Origin Airport */}
            <div className="md:col-span-4 relative">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <PlaneTakeoff className="w-3 h-3 text-blue-600" />
                From (Origin Airport)
              </label>
              <select
                id="origin-airport-select"
                value={origin}
                onChange={e => setOrigin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 hover:border-blue-400 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                {airports.map(apt => (
                  <option key={apt.code} value={apt.code}>
                    {apt.city} ({apt.code}) - {apt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Swap Button */}
            <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
              <button
                type="button"
                id="swap-airports-btn"
                onClick={handleSwapAirports}
                title="Swap departure and arrival airports"
                className="p-2.5 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 transition-all border border-slate-200 active:scale-95 cursor-pointer"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Destination Airport */}
            <div className="md:col-span-4 relative">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <PlaneLanding className="w-3 h-3 text-emerald-600" />
                To (Destination Airport)
              </label>
              <select
                id="destination-airport-select"
                value={destination}
                onChange={e => setDestination(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 hover:border-blue-400 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                {airports.map(apt => (
                  <option key={apt.code} value={apt.code} disabled={apt.code === origin}>
                    {apt.city} ({apt.code}) - {apt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Departure Date */}
            <div className={`${tripType === 'roundtrip' ? 'md:col-span-3' : 'md:col-span-3'} relative`}>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" />
                Departure Date
              </label>
              <input
                type="date"
                id="departure-date-input"
                value={departureDate}
                onChange={e => setDepartureDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 hover:border-blue-400 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              />
            </div>

            {/* Return Date (if roundtrip) */}
            {tripType === 'roundtrip' && (
              <div className="md:col-span-3 relative">
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-600" />
                  Return Date
                </label>
                <input
                  type="date"
                  id="return-date-input"
                  value={returnDate}
                  onChange={e => setReturnDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 hover:border-blue-400 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            )}
          </div>

          {/* Quick Route Shortcuts */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Popular Routes:</span>
            {[
              { from: 'DEL', to: 'BOM', label: 'Delhi ↔ Mumbai' },
              { from: 'BLR', to: 'DEL', label: 'Bengaluru → Delhi' },
              { from: 'BLR', to: 'BOM', label: 'Bengaluru → Mumbai' },
              { from: 'BLR', to: 'MAA', label: 'Bengaluru → Chennai' },
              { from: 'BLR', to: 'HYD', label: 'Bengaluru → Hyderabad' },
              { from: 'BLR', to: 'CCU', label: 'Bengaluru → Kolkata' },
              { from: 'BLR', to: 'PNQ', label: 'Bengaluru → Pune' },
              { from: 'HYD', to: 'BLR', label: 'Hyderabad → Bengaluru' },
              { from: 'CCU', to: 'DEL', label: 'Kolkata → Delhi' },
              { from: 'MAA', to: 'DEL', label: 'Chennai → Delhi' },
            ].map(r => (
              <button
                key={r.label}
                type="button"
                onClick={() => {
                  setOrigin(r.from);
                  setDestination(r.to);
                }}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors border cursor-pointer ${
                  origin === r.from && destination === r.to
                    ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                    : 'bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 border-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* IRCTC 7-Day Fare Strip (Carousel) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">Select Travel Date & Lowest Fare</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline">• Click any day to compare schedules</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              id="prev-date-btn"
              onClick={() => handleShiftDate(-1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Previous Day"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              id="next-date-btn"
              onClick={() => handleShiftDate(1)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
              title="Next Day"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {carouselDays.map(day => {
            const isSelected = day.dateStr === departureDate;
            const isLowest = day.minFare === lowestCarouselFare && lowestCarouselFare > 0;

            return (
              <button
                key={day.dateStr}
                type="button"
                id={`date-pill-${day.dateStr}`}
                onClick={() => setDepartureDate(day.dateStr)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center relative cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200'
                }`}
              >
                {isLowest && (
                  <span className={`absolute -top-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    isSelected ? 'bg-amber-300 text-slate-950 font-black' : 'bg-emerald-600 text-white'
                  }`}>
                    Cheapest
                  </span>
                )}
                <span className={`text-[11px] font-semibold uppercase tracking-wider ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                  {day.dayName}
                </span>
                <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                  {day.formattedDate}
                </span>
                <span className={`text-[11px] font-black mt-1 ${isSelected ? 'text-white' : 'text-emerald-700'}`}>
                  ₹{day.minFare.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* IRCTC Departure Time Quick Filter (Slot-based selection) */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">Departure Time Slot</span>
            <span className="text-[11px] text-slate-400 font-normal">(Filter by time window)</span>
          </div>
          {selectedTimeSlot !== 'ALL' && (
            <button
              type="button"
              id="reset-time-slot-btn"
              onClick={() => setSelectedTimeSlot('ALL')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
            >
              Reset to All ({allDateFlights.length})
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Early Morning */}
          <button
            type="button"
            id="slot-early-morning-btn"
            onClick={() => setSelectedTimeSlot(selectedTimeSlot === 'early' ? 'ALL' : 'early')}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
              selectedTimeSlot === 'early'
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedTimeSlot === 'early' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <Sunrise className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Early Morning</p>
              <p className="text-[11px] text-slate-500">Before 06:00 AM</p>
              <span className="inline-block mt-0.5 text-[10px] font-bold text-blue-600">
                {timeSlotCounts.early} Flights
              </span>
            </div>
          </button>

          {/* Morning */}
          <button
            type="button"
            id="slot-morning-btn"
            onClick={() => setSelectedTimeSlot(selectedTimeSlot === 'morning' ? 'ALL' : 'morning')}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
              selectedTimeSlot === 'morning'
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedTimeSlot === 'morning' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Morning</p>
              <p className="text-[11px] text-slate-500">06:00 AM – 12:00 PM</p>
              <span className="inline-block mt-0.5 text-[10px] font-bold text-blue-600">
                {timeSlotCounts.morning} Flights
              </span>
            </div>
          </button>

          {/* Afternoon */}
          <button
            type="button"
            id="slot-afternoon-btn"
            onClick={() => setSelectedTimeSlot(selectedTimeSlot === 'afternoon' ? 'ALL' : 'afternoon')}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
              selectedTimeSlot === 'afternoon'
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedTimeSlot === 'afternoon' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <SunMedium className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Afternoon</p>
              <p className="text-[11px] text-slate-500">12:00 PM – 06:00 PM</p>
              <span className="inline-block mt-0.5 text-[10px] font-bold text-blue-600">
                {timeSlotCounts.afternoon} Flights
              </span>
            </div>
          </button>

          {/* Evening & Night */}
          <button
            type="button"
            id="slot-night-btn"
            onClick={() => setSelectedTimeSlot(selectedTimeSlot === 'night' ? 'ALL' : 'night')}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
              selectedTimeSlot === 'night'
                ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-500/20'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <div className={`p-2 rounded-lg ${selectedTimeSlot === 'night' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Evening & Night</p>
              <p className="text-[11px] text-slate-500">After 06:00 PM</p>
              <span className="inline-block mt-0.5 text-[10px] font-bold text-blue-600">
                {timeSlotCounts.night} Flights
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Airline Filter Pills & Sort Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        
        {/* Airlines horizontal bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-xs font-bold text-slate-500 shrink-0 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Airlines (5+ daily flights each):
          </span>
          
          <button
            type="button"
            id="filter-airline-all"
            onClick={() => setSelectedAirline('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
              selectedAirline === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Airlines ({allDateFlights.length})
          </button>

          {airlineStats.map(item => {
            const brand = getAirlineBrand(item.airline);
            const isSelected = selectedAirline === item.airline;
            return (
              <button
                key={item.airline}
                type="button"
                id={`filter-airline-${brand.code}`}
                onClick={() => setSelectedAirline(isSelected ? 'ALL' : item.airline)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 border cursor-pointer ${
                  isSelected
                    ? `${brand.bg} text-white shadow-xs border-transparent`
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span>{item.airline}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {item.count} Flights
                </span>
                <span className={`text-[10px] font-medium ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  • from ₹{item.minPrice.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort Controls & Match Count */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="text-slate-600 font-medium flex flex-wrap items-center gap-2">
            <span>Showing <strong className="text-slate-900">{sortedFlights.length}</strong> of {allDateFlights.length} scheduled flights</span>
            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold text-[10px] border border-slate-200">
              2026 Current Schedule Dataset
            </span>
            {selectedTimeSlot !== 'ALL' && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                Slot: {selectedTimeSlot}
              </span>
            )}
            {selectedAirline !== 'ALL' && (
              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-bold text-[10px]">
                {selectedAirline}
              </span>
            )}
            {concessionType !== 'REGULAR' && (
              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold text-[10px]">
                Concession: {concessionType}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort by:
            </span>
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setSortBy('price')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  sortBy === 'price' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Price
              </button>
              <button
                type="button"
                onClick={() => setSortBy('time_asc')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  sortBy === 'time_asc' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Earliest
              </button>
              <button
                type="button"
                onClick={() => setSortBy('time_desc')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  sortBy === 'time_desc' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Latest
              </button>
              <button
                type="button"
                onClick={() => setSortBy('duration')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                  sortBy === 'duration' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fastest
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Recommended Flight Options */}
      {aiRecommendations.length > 0 && (
        <div id="recommended-flights-section" className="bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-slate-50/80 rounded-2xl p-5 border border-emerald-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-emerald-200/60">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Featured Flights</h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                  Best Value & Schedule
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Top flight options ranked by competitive fare, duration, and convenient departure timings.
              </p>
            </div>
            <div className="text-[11px] font-semibold text-emerald-700 bg-white/90 px-2.5 py-1 rounded-lg border border-emerald-200 self-start sm:self-auto">
              Optimized Travel Options
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {aiRecommendations.map((rec) => {
              const f = rec.flight;
              const price = getFlightPrice(f, cabinClass, concessionType);
              const brand = getAirlineBrand(f.airline);
              const originApt = airports.find(a => a.code === f.originCode);
              const destApt = airports.find(a => a.code === f.destinationCode);

              return (
                <div
                  key={`rec-${f.id}`}
                  id={`recommended-card-${f.flightNumber}`}
                  className="bg-white rounded-xl p-4 border border-emerald-200/70 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    {/* Recommendation Reason Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        rec.isLowerFare
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : rec.isFastest
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                        {rec.recommendationReason}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {rec.confidenceScore}% Match
                      </span>
                    </div>

                    {/* Flight Header */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${brand.bg}`} />
                        <span className="font-bold text-slate-900 text-sm">{f.airline}</span>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {f.flightNumber}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        {f.stops === 0 ? 'Non-stop' : `${f.stops} stop`} • {f.duration}
                      </span>
                    </div>

                    {/* Route Schedule */}
                    <div className="flex items-center justify-between bg-slate-50 rounded-lg p-2.5 text-xs">
                      <div>
                        <span className="font-bold text-slate-900">{f.departureTime}</span>
                        <span className="text-[11px] text-slate-500 block">{originApt?.city || f.originCode}</span>
                      </div>
                      <div className="text-slate-400 text-[10px] text-center font-medium">
                        ➜
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900">{f.arrivalTime}</span>
                        <span className="text-[11px] text-slate-500 block">{destApt?.city || f.destinationCode}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Fare ({cabinClass})</span>
                      <p className="text-base font-black text-slate-900 leading-tight">₹{price.toLocaleString()}</p>
                    </div>
                    <button
                      type="button"
                      id={`book-rec-btn-${f.flightNumber}`}
                      onClick={() => onSelectFlightToBook(f, cabinClass, tripType, concessionType)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs hover:shadow flex items-center gap-1.5 cursor-pointer"
                    >
                      Select Flight →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Flight Results Cards */}
      <div className="space-y-3.5">
        {sortedFlights.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No Flights Match Your Current Filter</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Try selecting "All Airlines" or resetting the departure time slot filter to view all {allDateFlights.length} scheduled flights for this date.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedAirline('ALL');
                  setSelectedTimeSlot('ALL');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition-colors shadow-xs cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        ) : (
          sortedFlights.map(flight => {
            const price = getFlightPrice(flight, cabinClass, concessionType);
            const standardPrice = getFlightPrice(flight, cabinClass, 'REGULAR');
            const hasDiscount = price < standardPrice;
            const isLowSeats = flight.availableSeats <= 25;
            const brand = getAirlineBrand(flight.airline);
            const originApt = airports.find(a => a.code === flight.originCode);
            const destApt = airports.find(a => a.code === flight.destinationCode);
            const isExpanded = expandedFlightId === flight.id;
            const currentTab = activeDetailTab[flight.id] || 'flight';

            // IRCTC itemized tax calculations for this specific flight
            const fuelSurcharge = 450;
            const udf = 260;
            const psf = 180;
            const asf = 236;
            const gst = Math.round(price * 0.05);
            const convenienceFee = 59;
            const totalEstimated = price + fuelSurcharge + udf + psf + asf + gst + convenienceFee;

            return (
              <div
                key={flight.id}
                id={`flight-card-${flight.flightNumber}`}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-400 shadow-xs hover:shadow-md transition-all duration-200 group overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                    
                    {/* Carrier & Identification Info */}
                    <div className="w-full lg:w-48 shrink-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl ${brand.bg} flex items-center justify-center text-white font-black text-xs shadow-xs tracking-wider`}>
                          {brand.code}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm leading-tight">{flight.airline}</h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-xs font-bold text-slate-600 font-mono bg-slate-100 px-1.5 py-0.2 rounded">
                              {flight.flightNumber}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5 flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          flight.status === 'On Time' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          flight.status === 'Delayed' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          flight.status === 'Boarding' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          ● {flight.status}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">Gate {flight.gate}</span>
                      </div>
                    </div>

                    {/* Flight Schedule Timeline */}
                    <div className="flex-1 flex flex-col gap-2 max-w-lg w-full">
                      <div className="flex items-center justify-between gap-4">
                        {/* Origin */}
                        <div className="text-left">
                          <p className="text-2xl font-black text-slate-900 leading-tight">
                            {flight.departureTime}
                          </p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">
                            {flight.originCode} <span className="text-slate-400 font-normal">({originApt?.city || flight.originCode})</span>
                          </p>
                          <p className="text-[11px] font-medium text-slate-500">Terminal {flight.terminal}</p>
                        </div>

                        {/* Flight Duration Line */}
                        <div className="flex-1 flex flex-col items-center px-3">
                          <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {flight.duration}
                          </span>
                          <div className="w-full flex items-center relative">
                            <div className="h-0.5 w-full bg-slate-200 group-hover:bg-blue-200 transition-colors"></div>
                            <Plane className="w-4 h-4 text-blue-600 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 bg-white px-0.5" />
                          </div>
                          <span className="text-[10px] text-emerald-700 font-bold mt-1 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                            {flight.stops === 0 ? 'Non-Stop' : `${flight.stops} Stop`}
                          </span>
                        </div>

                        {/* Destination */}
                        <div className="text-right">
                          <p className="text-2xl font-black text-slate-900 leading-tight">
                            {flight.arrivalTime}
                          </p>
                          <p className="text-xs font-bold text-slate-800 mt-0.5">
                            {flight.destinationCode} <span className="text-slate-400 font-normal">({destApt?.city || flight.destinationCode})</span>
                          </p>
                          <p className="text-[11px] font-medium text-slate-500">Terminal T2</p>
                        </div>
                      </div>

                      {/* Travel Amenities & Perks Badges (IRCTC reference) */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Briefcase className="w-3 h-3 text-slate-500" />
                          {concessionType === 'DEFENCE' || concessionType === 'STUDENT'
                            ? '7kg Cabin • 25kg Check-in (Extra)'
                            : '7kg Cabin • 15kg Check-in'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          <Utensils className="w-3 h-3 text-slate-500" />
                          {brand.meal}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Free ₹50L Insurance
                        </span>
                      </div>
                    </div>

                    {/* Price & Book Button CTA */}
                    <div className="w-full lg:w-48 shrink-0 lg:text-right flex lg:flex-col justify-between items-center lg:items-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                      <div>
                        <div className="flex items-center lg:justify-end gap-1.5">
                          {hasDiscount && (
                            <span className="text-xs text-slate-400 line-through">
                              ₹{standardPrice.toLocaleString()}
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Per passenger
                          </span>
                        </div>
                        <div className="text-2xl font-black text-slate-900 tracking-tight">
                          ₹{price.toLocaleString()}
                        </div>
                        <p className={`text-[11px] font-semibold mt-0.5 ${isLowSeats ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                          {flight.availableSeats} seats available
                        </p>
                      </div>

                      <button
                        id={`book-flight-btn-${flight.flightNumber}`}
                        onClick={() => onSelectFlightToBook(flight, cabinClass, tripType, concessionType)}
                        className="mt-2.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Book Flight</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>

                  {/* "Flight Details & Fare Rules" Dropdown Trigger */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      id={`toggle-details-${flight.id}`}
                      onClick={() => toggleFlightDetails(flight.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-blue-50"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>{isExpanded ? 'Hide Flight Details & Fare Rules' : 'View Flight Details & Fare Rules'}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* EXPANDABLE FLIGHT DETAILS & RULES DRAWER */}
                {isExpanded && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                    
                    {/* Drawer Navigation Tabs */}
                    <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2.5 mb-4 text-xs">
                      {[
                        { id: 'flight', label: 'Flight Info & Aircraft', icon: Plane },
                        { id: 'baggage', label: 'Baggage Allowance', icon: Luggage },
                        { id: 'fare', label: 'Fare Breakup', icon: Receipt },
                        { id: 'policy', label: 'Cancellation & Date Change', icon: RotateCcw },
                      ].map(tab => {
                        const IconComponent = tab.icon;
                        const isTabActive = currentTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleTabChange(flight.id, tab.id as DetailTab)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                              isTabActive
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                            }`}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* TAB 1: FLIGHT & AIRCRAFT INFORMATION */}
                    {currentTab === 'flight' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Plane className="w-3.5 h-3.5 text-blue-600" />
                            Aircraft & Layout
                          </p>
                          <div className="space-y-1.5 text-slate-600">
                            <p><strong className="text-slate-900">Aircraft Model:</strong> {brand.aircraft}</p>
                            <p><strong className="text-slate-900">Seating Layout:</strong> 3-3 Configuration</p>
                            <p><strong className="text-slate-900">Seat Pitch:</strong> {brand.pitch} (Standard Ergonomic)</p>
                            <p><strong className="text-slate-900">Cabin Class:</strong> {cabinClass}</p>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Utensils className="w-3.5 h-3.5 text-amber-600" />
                            In-Flight Services & Amenities
                          </p>
                          <div className="space-y-1.5 text-slate-600">
                            <p><strong className="text-slate-900">In-Flight Meal:</strong> {brand.meal}</p>
                            <p><strong className="text-slate-900">Power Outlets:</strong> USB-A / Type-C Charging</p>
                            <p><strong className="text-slate-900">Cabin Air Quality:</strong> Hospital-Grade HEPA Filtration</p>
                            <p><strong className="text-slate-900">Beverages:</strong> Packaged Drinking Water Included</p>
                          </div>
                        </div>

                        <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                          <p className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            Terminal & Gate Timings
                          </p>
                          <div className="space-y-1.5 text-slate-600">
                            <p><strong className="text-slate-900">Check-in Closes:</strong> 60 mins before departure</p>
                            <p><strong className="text-slate-900">Boarding Gate Closes:</strong> 25 mins before departure</p>
                            <p><strong className="text-slate-900">Departure Terminal:</strong> Terminal {flight.terminal} (Gate {flight.gate})</p>
                            <p><strong className="text-slate-900">Web Check-in:</strong> Open 48 hrs prior to departure</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: BAGGAGE POLICY */}
                    {currentTab === 'baggage' && (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Briefcase className="w-4 h-4 text-blue-600" />
                              <span className="font-bold text-slate-900">Cabin / Hand Baggage</span>
                            </div>
                            <p className="text-slate-700 font-semibold text-sm">7 kg per passenger</p>
                            <p className="text-slate-500 text-[11px] mt-1">
                              1 piece not exceeding 55 cm × 35 cm × 25 cm (total 115 cm). Plus 1 small personal laptop bag or purse.
                            </p>
                          </div>

                          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2 mb-2">
                              <Luggage className="w-4 h-4 text-emerald-600" />
                              <span className="font-bold text-slate-900">Check-in Baggage</span>
                            </div>
                            <p className="text-slate-700 font-semibold text-sm">
                              {concessionType === 'DEFENCE' || concessionType === 'STUDENT' ? (
                                <span className="text-emerald-700">25 kg Included (Special Concession Allowance)</span>
                              ) : (
                                '15 kg per passenger'
                              )}
                            </p>
                            <p className="text-slate-500 text-[11px] mt-1">
                              Standard 1 piece up to 158 cm (L+W+H). Pre-book excess baggage at ₹500/5kg to save 40% vs airport counter rates.
                            </p>
                          </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-800 text-[11px] flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-amber-700" />
                          <span>
                            Power banks, portable chargers, and e-cigarettes are permitted in <strong>cabin baggage only</strong>. Lithium batteries must not be placed in checked luggage.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* TAB 3: FARE BREAKUP */}
                    {currentTab === 'fare' && (
                      <div className="bg-white p-4 rounded-xl border border-slate-200 max-w-xl text-xs space-y-2">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 font-bold text-slate-800">
                          <span>Fare Component</span>
                          <span>Amount (INR)</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Base Airfare ({cabinClass})</span>
                          <span className="font-mono">₹{price.toLocaleString()}</span>
                        </div>
                        {hasDiscount && (
                          <div className="flex items-center justify-between text-emerald-700 font-semibold">
                            <span>Concession Discount ({concessionType})</span>
                            <span className="font-mono">-₹{(standardPrice - price).toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Airline Fuel Surcharge (YQ)</span>
                          <span className="font-mono">₹{fuelSurcharge}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>User Development Fee (UDF)</span>
                          <span className="font-mono">₹{udf}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Passenger Service Fee (PSF)</span>
                          <span className="font-mono">₹{psf}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Aviation Security Fee (ASF)</span>
                          <span className="font-mono">₹{asf}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600">
                          <span>Goods & Services Tax (GST 5%)</span>
                          <span className="font-mono">₹{gst}</span>
                        </div>
                        <div className="flex items-center justify-between text-blue-700 font-semibold">
                          <span>Convenience Fee</span>
                          <span className="font-mono">₹{convenienceFee} (₹0 via UPI)</span>
                        </div>
                        <div className="flex items-center justify-between text-emerald-700 font-semibold">
                          <span>Complimentary Travel Insurance (Cover ₹50 Lakhs)</span>
                          <span className="font-mono">FREE (₹0)</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                          <span>Total Estimated Price (1 Adult)</span>
                          <span className="text-blue-700 font-mono">₹{totalEstimated.toLocaleString()}</span>
                        </div>
                      </div>
                    )}

                    {/* TAB 4: CANCELLATION & RESCHEDULE POLICY */}
                    {currentTab === 'policy' && (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                            <p className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                              <RotateCcw className="w-4 h-4 text-red-600" />
                              Cancellation Charges
                            </p>
                            <div className="space-y-1 text-slate-600 text-[11px]">
                              <p>• <strong>More than 2 hours before departure:</strong> Airline cancellation fee ₹2,500 + Service fee ₹0.</p>
                              <p>• <strong>Within 2 hours of departure / No-Show:</strong> Non-refundable (Statutory airport taxes UDF/PSF refunded).</p>
                              <p>• <strong>Refund Timeline:</strong> Processed instantly; credited to original bank/UPI account within 3–5 days.</p>
                            </div>
                          </div>

                          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                            <p className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                              <Calendar className="w-4 h-4 text-blue-600" />
                              Date Change / Reschedule Rules
                            </p>
                            <div className="space-y-1 text-slate-600 text-[11px]">
                              <p>• <strong>Up to 2 hours before departure:</strong> Airline date change charge ₹1,500 + difference in airfare (if any).</p>
                              <p>• <strong>Reschedule Fee:</strong> ₹0 portal service fee.</p>
                              <p>• <strong>How to reschedule:</strong> Manage booking in "My Bookings" with your 6-digit PNR.</p>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-slate-100 text-slate-600 text-[11px] flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>
                            Under DGCA passenger charter, full refund is entitled if flight is cancelled by airline or delayed by more than 3 hours with complimentary alternate flight booking.
                          </span>
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
