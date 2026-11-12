import React, { useState, useMemo } from 'react';
import {
  User as UserIcon,
  Plane,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Sliders,
  Award,
  ChevronRight,
  FileText,
  Activity,
  Luggage,
  Save,
  PlaneTakeoff,
  PlaneLanding,
  Bot
} from 'lucide-react';
import { User, Booking, Flight, CabinClass, ConcessionType } from '../types';
import { db } from '../services/db';
import { aiRecommendationService, RecommendedFlightItem } from '../services/aiRecommendation';

interface CustomerDashboardProps {
  currentUser: User;
  onViewTicket: (pnr: string) => void;
  onManageBooking: (pnr: string) => void;
  onCheckIn: (pnr: string) => void;
  onNavigate: (view: string) => void;
  onSelectFlightToBook: (
    flight: Flight,
    cabinClass: CabinClass,
    tripType: 'oneway' | 'roundtrip',
    concessionType: ConcessionType
  ) => void;
  onUpdateUser: (user: User) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  onViewTicket,
  onManageBooking,
  onCheckIn,
  onNavigate,
  onSelectFlightToBook,
  onUpdateUser,
}) => {
  // 1. Fetch user bookings from existing database
  const userBookings: Booking[] = useMemo(() => {
    return db.getBookings(currentUser.id);
  }, [currentUser.id]);

  // Today reference date for splitting upcoming vs completed
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Quick Statistics calculated dynamically from database
  const stats = useMemo(() => {
    const upcoming = userBookings.filter(
      b => b.bookingStatus !== 'CANCELLED' && (b.travelDate >= todayStr || !b.travelDate)
    ).length;
    const total = userBookings.length;
    const cancelled = userBookings.filter(b => b.bookingStatus === 'CANCELLED').length;
    const completed = userBookings.filter(
      b => b.bookingStatus !== 'CANCELLED' && b.travelDate < todayStr
    ).length;

    return {
      upcoming,
      total,
      cancelled,
      completed,
    };
  }, [userBookings, todayStr]);

  // Upcoming Trips list
  const upcomingBookings = useMemo(() => {
    return userBookings.filter(
      b => b.bookingStatus !== 'CANCELLED' && (b.travelDate >= todayStr || !b.travelDate)
    );
  }, [userBookings, todayStr]);

  // Recent Bookings (All bookings sorted newest first)
  const recentBookings = useMemo(() => {
    return [...userBookings].slice(0, 5);
  }, [userBookings]);

  // 2. Travel Preferences state
  const [preferredCabinClass, setPreferredCabinClass] = useState<CabinClass>(
    currentUser.preferredCabinClass || 'Economy'
  );
  const [preferredTravelTime, setPreferredTravelTime] = useState<'morning' | 'afternoon' | 'evening' | 'ALL'>(
    currentUser.preferredTravelTime || 'morning'
  );
  const [preferredSeatType, setPreferredSeatType] = useState<'Window' | 'Aisle' | 'Middle'>(
    currentUser.preferredSeatType || 'Window'
  );
  const [preferredRoute, setPreferredRoute] = useState<string>(
    currentUser.preferredRoute || 'DEL → BOM'
  );
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  // 3. AI Recommended Flights based on user profile & preferences
  const [recRefreshKey, setRecRefreshKey] = useState(0);

  const recommendedFlights: RecommendedFlightItem[] = useMemo(() => {
    const allFlights = db.getFlights();
    return aiRecommendationService.getPersonalizedRecommendations(
      allFlights,
      {
        preferredCabinClass,
        preferredTravelTime,
        preferredSeatType,
        preferredRoute,
      },
      3
    );
  }, [preferredCabinClass, preferredTravelTime, preferredSeatType, preferredRoute, recRefreshKey]);

  // Handle saving Travel Preferences
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = db.updateUserProfile(currentUser.id, {
      preferredCabinClass,
      preferredTravelTime,
      preferredSeatType,
      preferredRoute,
    });
    if (updated) {
      onUpdateUser(updated);
      setPrefSaveSuccess(true);
      setRecRefreshKey(prev => prev + 1);
      setTimeout(() => setPrefSaveSuccess(false), 2500);
    }
  };

  // 4. Quick Flight Status Lookup within dashboard
  const [flightStatusQuery, setFlightStatusQuery] = useState('');
  const [flightStatusResult, setFlightStatusResult] = useState<Flight | null>(null);
  const [flightStatusSearched, setFlightStatusSearched] = useState(false);

  const handleDashboardStatusSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!flightStatusQuery.trim()) return;
    const clean = flightStatusQuery.trim().toUpperCase();
    const found = db.getFlights().find(
      f => f.flightNumber.toUpperCase() === clean || f.flightNumber.replace('-', '').toUpperCase() === clean.replace('-', '')
    );
    setFlightStatusResult(found || null);
    setFlightStatusSearched(true);
  };

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto">
      
      {/* 1. DASHBOARD HEADER & PROFILE SUMMARY */}
      <section className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20 shrink-0 border border-blue-400/30">
              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Welcome, {currentUser.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {currentUser.role}
                </span>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span>Username: <strong className="text-white">@{currentUser.username}</strong></span>
                <span>•</span>
                <span>Email: <strong className="text-white">{currentUser.email}</strong></span>
                <span>•</span>
                <span>Phone: <strong className="text-white">{currentUser.phone}</strong></span>
              </div>

              {currentUser.govIdType && (
                <p className="mt-1 text-[11px] text-blue-300 font-mono">
                  {currentUser.govIdType}: {currentUser.govIdNumber || 'Verified on file'}
                </p>
              )}
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="dashboard-search-flights-btn"
              onClick={() => onNavigate('search')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Search className="w-4 h-4" />
              <span>Search Flights</span>
            </button>

            <button
              id="dashboard-ai-assistant-btn"
              onClick={() => onNavigate('chatbot')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Plane className="w-4 h-4 text-white" />
              <span>Flight Booking</span>
            </button>

            <button
              id="dashboard-web-checkin-btn"
              onClick={() => onNavigate('checkin')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Web Check-in</span>
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <UserIcon className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>

        </div>
      </section>

      {/* 2. QUICK STATISTICS CARDS */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.upcoming}</p>
            <p className="text-xs font-semibold text-slate-500">Upcoming Trips</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.total}</p>
            <p className="text-xs font-semibold text-slate-500">Total Bookings</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.completed}</p>
            <p className="text-xs font-semibold text-slate-500">Completed Trips</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-slate-900">{stats.cancelled}</p>
            <p className="text-xs font-semibold text-slate-500">Cancelled Bookings</p>
          </div>
        </div>

      </section>

      {/* 3. UPCOMING TRIPS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Upcoming Trips</span>
            </h2>
            <p className="text-xs text-slate-500">Your scheduled domestic flight journeys</p>
          </div>

          <button
            onClick={() => onNavigate('bookings')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>View All Bookings</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Plane className="w-6 h-6 -rotate-45" />
            </div>
            <h3 className="font-bold text-sm text-slate-800">No Upcoming Trips Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              You do not have any active upcoming flight reservations. Search available domestic flights and book your seat in seconds.
            </p>
            <button
              onClick={() => onNavigate('search')}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
            >
              Search & Book Flights
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingBookings.map(b => {
              const flight = db.getFlightById(b.flightId);
              return (
                <div
                  key={b.pnr}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                        PNR: {b.pnr}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {flight?.airline || 'Airline'} ({flight?.flightNumber || 'FLIGHT'})
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      b.bookingStatus === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {b.bookingStatus === 'CHECKED_IN' ? 'Checked In' : 'Confirmed'}
                    </span>
                  </div>

                  {/* Route & Times */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-slate-900">{flight?.originCode || 'DEL'}</span>
                      <p className="text-xs font-semibold text-slate-600">{flight?.departureTime || '08:30'}</p>
                      <p className="text-[11px] text-slate-400">Departure</p>
                    </div>

                    <div className="flex flex-col items-center px-4">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {flight?.duration || '2h 15m'}
                      </span>
                      <div className="w-24 h-0.5 bg-slate-200 relative my-1">
                        <Plane className="w-3 h-3 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600">Nonstop</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-slate-900">{flight?.destinationCode || 'BOM'}</span>
                      <p className="text-xs font-semibold text-slate-600">{flight?.arrivalTime || '10:45'}</p>
                      <p className="text-[11px] text-slate-400">Arrival</p>
                    </div>
                  </div>

                  {/* Metadata Row: Passenger, Date, Seat, Cabin */}
                  <div className="p-3 bg-slate-50 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Passenger</span>
                      <strong className="text-slate-800 truncate block">{b.passenger?.fullName || 'Passenger'}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Date</span>
                      <strong className="text-slate-800">{b.travelDate}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Seat Number</span>
                      <strong className="text-blue-700 font-mono">{b.seatNumber}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Cabin Class</span>
                      <strong className="text-slate-800">{b.cabinClass}</strong>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      id={`view-ticket-btn-${b.pnr}`}
                      onClick={() => onViewTicket(b.pnr)}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View Ticket</span>
                    </button>

                    <button
                      id={`manage-booking-btn-${b.pnr}`}
                      onClick={() => onManageBooking(b.pnr)}
                      className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                    >
                      Manage Booking
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. RECENT BOOKINGS SECTION & FLIGHT STATUS WIDGET */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Bookings Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-indigo-600" />
                <span>Recent Bookings</span>
              </h3>
              <p className="text-[11px] text-slate-400">All booking records stored in local database</p>
            </div>

            <button
              onClick={() => onNavigate('bookings')}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              All Records ({userBookings.length})
            </button>
          </div>

          {recentBookings.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No bookings made yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2">PNR</th>
                    <th className="pb-2">Passenger</th>
                    <th className="pb-2">Flight</th>
                    <th className="pb-2">Date</th>
                    <th className="pb-2">Seat</th>
                    <th className="pb-2">Status</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBookings.map(b => {
                    const flight = db.getFlightById(b.flightId);
                    return (
                      <tr key={b.pnr} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 font-mono font-bold text-blue-700">{b.pnr}</td>
                        <td className="py-3 font-semibold text-slate-900">{b.passenger?.fullName || 'Passenger'}</td>
                        <td className="py-3 font-semibold text-slate-800">
                          {flight ? `${flight.flightNumber} (${flight.originCode}→${flight.destinationCode})` : b.flightId}
                        </td>
                        <td className="py-3 text-slate-600">{b.travelDate}</td>
                        <td className="py-3 font-mono text-slate-700">{b.seatNumber}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.bookingStatus === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                            b.bookingStatus === 'CHECKED_IN' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {b.bookingStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onViewTicket(b.pnr)}
                            className="px-2.5 py-1 text-blue-600 hover:bg-blue-50 font-bold rounded-lg transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Flight Status in Dashboard */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Activity className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-slate-900">Check Flight Status</h3>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              Search by Flight Number to check real-time gate and timetable status.
            </p>

            <form onSubmit={handleDashboardStatusSearch} className="space-y-3">
              <div>
                <input
                  type="text"
                  value={flightStatusQuery}
                  onChange={e => setFlightStatusQuery(e.target.value)}
                  placeholder="e.g. AI-202, 6E-504"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Track Status
              </button>
            </form>

            {flightStatusSearched && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                {flightStatusResult ? (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5 border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-slate-900">{flightStatusResult.flightNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        flightStatusResult.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        flightStatusResult.status === 'Delayed' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {flightStatusResult.status}
                      </span>
                    </div>
                    <p className="text-slate-600">
                      {flightStatusResult.originCode} ({flightStatusResult.departureTime}) → {flightStatusResult.destinationCode} ({flightStatusResult.arrivalTime})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Gate: {flightStatusResult.gate} • Terminal: {flightStatusResult.terminal}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-xl">
                    Flight not found. Try AI-202 or 6E-618.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
            <span className="text-slate-500">Flight Tracker Portal</span>
            <button
              onClick={() => onNavigate('status')}
              className="text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>Full Tracker</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 5. AI/ML PERSONALIZED SECTION (OFFLINE ML RECOMMENDATION) */}
      <section className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/50 space-y-5">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-indigo-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  AI Recommended Flights
                </h2>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  100% Offline ML Model
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Recommended for you based on your travel preferences, past journeys, and optimal fare efficiency
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('search')}
            className="text-xs text-indigo-300 hover:text-white font-bold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Explore All Flights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Recommended Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendedFlights.map((item, idx) => {
            const f = item.flight;
            return (
              <div
                key={f.id || idx}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 hover:border-indigo-400/50 transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Confidence & Reason Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-md">
                      ★ {item.recommendationReason}
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      {item.confidenceScore}% Match
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-black text-lg text-white">{f.flightNumber}</span>
                      <p className="text-xs text-slate-300">{f.airline}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-amber-300">₹{f.basePrice.toLocaleString()}</span>
                      <p className="text-[10px] text-slate-300">Per Passenger</p>
                    </div>
                  </div>

                  {/* Route & Times */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-200">
                    <div>
                      <strong className="block text-sm text-white font-black">{f.originCode}</strong>
                      <span>{f.departureTime}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-300">{f.duration}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-300 my-0.5" />
                      <span className="text-[10px] text-emerald-400">Nonstop</span>
                    </div>

                    <div className="text-right">
                      <strong className="block text-sm text-white font-black">{f.destinationCode}</strong>
                      <span>{f.arrivalTime}</span>
                    </div>
                  </div>
                </div>

                <button
                  id={`book-rec-flight-${f.flightNumber}`}
                  onClick={() => onSelectFlightToBook(f, preferredCabinClass, 'oneway', 'REGULAR')}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Book This Flight</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

      </section>

      {/* 6. MODERN FEATURE — PERSONALIZED TRAVEL PROFILE (PREFERENCES) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Personalized Travel Preferences</h3>
              <p className="text-xs text-slate-500">
                Configure your preferred cabin, travel time, and seat for personalized recommendations
              </p>
            </div>
          </div>

          {prefSaveSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" /> Preferences Saved!
            </span>
          )}
        </div>

        <form onSubmit={handleSavePreferences} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
              Preferred Cabin Class
            </label>
            <select
              value={preferredCabinClass}
              onChange={e => setPreferredCabinClass(e.target.value as CabinClass)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Economy">Economy Class</option>
              <option value="Business">Business Class</option>
              <option value="First">First Class</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
              Preferred Travel Time
            </label>
            <select
              value={preferredTravelTime}
              onChange={e => setPreferredTravelTime(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="morning">Morning (06:00 - 12:00)</option>
              <option value="afternoon">Afternoon (12:00 - 17:00)</option>
              <option value="evening">Evening (17:00 - 22:00)</option>
              <option value="ALL">Any Time of Day</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
              Preferred Seat Type
            </label>
            <select
              value={preferredSeatType}
              onChange={e => setPreferredSeatType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Window">Window Seat (A / F)</option>
              <option value="Aisle">Aisle Seat (C / D)</option>
              <option value="Middle">Middle Seat (B / E)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
              Preferred Route
            </label>
            <select
              value={preferredRoute}
              onChange={e => setPreferredRoute(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="DEL → BOM">DEL → BOM (Delhi - Mumbai)</option>
              <option value="BOM → DEL">BOM → DEL (Mumbai - Delhi)</option>
              <option value="BLR → DEL">BLR → DEL (Bengaluru - Delhi)</option>
              <option value="DEL → BLR">DEL → BLR (Delhi - Bengaluru)</option>
              <option value="BOM → GOI">BOM → GOI (Mumbai - Goa)</option>
              <option value="DEL → MAA">DEL → MAA (Delhi - Chennai)</option>
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2">
            <button
              id="save-preferences-btn"
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Travel Preferences</span>
            </button>
          </div>

        </form>

      </section>

    </div>
  );
};
