import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  BarChart3,
  PieChart,
  DollarSign,
  Ticket,
  Plane,
  ArrowUpRight,
  RefreshCw,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Layers,
  MapPin,
  CreditCard,
  Percent,
  Search,
  Info,
  ExternalLink,
  ChevronRight,
  Database,
  Hash,
  Cpu,
  Copy,
  Check
} from 'lucide-react';
import { db } from '../services/db';
import { Booking, Flight } from '../types';

interface AnalyticsDashboardProps {
  onOpenBookingTicket?: (pnr: string) => void;
  onOpenScanner?: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  onOpenBookingTicket,
  onOpenScanner,
}) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [flightSearchTerm, setFlightSearchTerm] = useState('');
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState('');
  const [verifyPnrInput, setVerifyPnrInput] = useState('');
  const [verifyFeedback, setVerifyFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Core Data dynamically derived strictly from local database
  const analyticsSummary = useMemo(() => db.getAnalyticsSummary(), [refreshKey]);
  const allBookings = useMemo(() => db.getBookings(), [refreshKey]);
  const allFlights = useMemo(() => db.getFlights(), [refreshKey]);
  const allPayments = useMemo(() => db.getPayments(), [refreshKey]);
  const manifestRecords = useMemo(() => db.getReservationManifestRecords(), [refreshKey]);

  // Actual payment method breakdown strictly from database payments
  const paymentMethodStats = useMemo(() => {
    const stats: Record<string, { count: number; totalAmount: number }> = {
      Card: { count: 0, totalAmount: 0 },
      UPI: { count: 0, totalAmount: 0 },
      Wallet: { count: 0, totalAmount: 0 },
    };

    allPayments.forEach(p => {
      const method = p.paymentMethod || 'Card';
      if (!stats[method]) {
        stats[method] = { count: 0, totalAmount: 0 };
      }
      stats[method].count += 1;
      if (p.status === 'SUCCESS') {
        stats[method].totalAmount += p.amount;
      }
    });

    return stats;
  }, [allPayments]);

  // Filtered flights for the seat occupancy table
  const filteredOccupancyFlights = useMemo(() => {
    if (!flightSearchTerm.trim()) return analyticsSummary.seatOccupancy;
    const term = flightSearchTerm.toLowerCase();
    return analyticsSummary.seatOccupancy.filter(f =>
      f.flightNumber.toLowerCase().includes(term) ||
      f.route.toLowerCase().includes(term) ||
      (f.aircraftModel && f.aircraftModel.toLowerCase().includes(term))
    );
  }, [analyticsSummary.seatOccupancy, flightSearchTerm]);

  // Filtered reservation manifest records
  const filteredManifestRecords = useMemo(() => {
    if (!ledgerSearchTerm.trim()) return manifestRecords;
    const term = ledgerSearchTerm.toLowerCase();
    return manifestRecords.filter(item =>
      item.pnr.toLowerCase().includes(term) ||
      item.owner.toLowerCase().includes(term) ||
      item.flightId.toLowerCase().includes(term) ||
      item.seatNumber.toLowerCase().includes(term)
    );
  }, [manifestRecords, ledgerSearchTerm]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setVerifyFeedback(null);
  };

  const handleVerifyTicketInline = (e: React.FormEvent) => {
    e.preventDefault();
    const pnr = verifyPnrInput.trim().toUpperCase();
    if (!pnr) return;

    const booking = db.getBookingByPnr(pnr);
    if (booking) {
      if (booking.bookingStatus === 'CANCELLED') {
        setVerifyFeedback({
          type: 'error',
          message: `Ticket ${pnr} was cancelled. Status: CANCELLED in reservation system.`,
        });
      } else {
        db.markTicketVerified(pnr);
        setVerifyFeedback({
          type: 'success',
          message: `Ticket ${pnr} verified: ${booking.passenger.fullName} (Flight ${booking.flightId}, Seat ${booking.seatNumber}, Class: ${booking.cabinClass}). Status: CONFIRMED.`,
        });
        setVerifyPnrInput('');
        setRefreshKey(prev => prev + 1);
      }
    } else {
      setVerifyFeedback({
        type: 'error',
        message: `No reservation record found for PNR "${pnr}". Please verify the booking reference.`,
      });
    }
  };

  // Max value for monthly chart scaling
  const maxMonthlyRevenue = useMemo(() => {
    if (analyticsSummary.monthlyRevenue.length === 0) return 1;
    return Math.max(...analyticsSummary.monthlyRevenue.map(m => m.revenue), 1000);
  }, [analyticsSummary.monthlyRevenue]);

  return (
    <div id="admin-analytics-dashboard" className="space-y-6 pb-14 text-slate-800">
      
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Admin Analytics Dashboard
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time operational business intelligence calculated strictly from actual local project data.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200 flex items-center gap-1.5"
            title="Recalculate dynamic statistics"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sync Data</span>
          </button>

          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Ticket</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 PRIMARY SUMMARY CARDS (Strict Requirement 2 & 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total Flights */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Flights</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plane className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-slate-900">
              {analyticsSummary.totalFlights}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Actual flights active in project dataset
            </p>
          </div>
        </div>

        {/* Card 2: Total Bookings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-slate-900">
              {analyticsSummary.totalBookings}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-emerald-600 font-semibold">{analyticsSummary.successfulBookings} Confirmed</span>
              <span className="text-slate-300">•</span>
              <span className="text-rose-500 font-semibold">{analyticsSummary.cancelledBookings} Cancelled</span>
            </div>
          </div>
        </div>

        {/* Card 3: Available Seats */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Seats</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-slate-900">
              {analyticsSummary.availableSeats.toLocaleString()}
            </h3>
            <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
              <span>{analyticsSummary.totalBookedSeats} booked of {analyticsSummary.totalSeats.toLocaleString()} seats</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-teal-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(analyticsSummary.fleetOccupancyRate, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Total Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-3xl font-black text-slate-900">
              ₹{analyticsSummary.totalRevenue.toLocaleString()}
            </h3>
            <p className="text-xs text-emerald-700 font-semibold mt-1">
              From {analyticsSummary.successfulBookings} successful bookings
            </p>
          </div>
        </div>

      </div>

      {/* MATHEMATICAL RATIOS & DERIVED METRICS BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-blue-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Average Ticket Value
            </span>
            <span className="text-lg font-black text-slate-900">
              ₹{analyticsSummary.averageTicketValue.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block">Total Revenue ÷ Successful Bookings</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-teal-600">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Seat Occupancy Rate
            </span>
            <span className="text-lg font-black text-slate-900">
              {analyticsSummary.fleetOccupancyRate}%
            </span>
            <span className="text-[10px] text-slate-400 block">Booked Seats ÷ Total Seats × 100</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-purple-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
              Verified Passenger Tickets
            </span>
            <span className="text-lg font-black text-slate-900">
              {analyticsSummary.verifiedTicketsCount} Tickets
            </span>
            <span className="text-[10px] text-slate-400 block">Verified via QR Scanner & Check-in</span>
          </div>
        </div>
      </div>

      {/* SECTION 3: BOOKING & REVENUE ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Monthly Booking & Revenue Trends (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Monthly Revenue & Booking Trends
              </h2>
              <p className="text-xs text-slate-500">Calculated strictly from actual booking records</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-blue-600" /> Revenue (₹)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-teal-400" /> Bookings
              </span>
            </div>
          </div>

          {/* If no bookings exist, display "No booking data available" instead of fake graphs */}
          {analyticsSummary.monthlyRevenue.length === 0 ? (
            <div className="py-14 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-100">
              <Clock className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-700">No booking data available</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Monthly revenue and booking trends will appear here automatically once reservations are made.
              </p>
            </div>
          ) : (
            <div className="pt-4 pb-2">
              <div className="flex items-end gap-3 sm:gap-6 h-56 border-b border-slate-200 px-2 overflow-x-auto">
                {analyticsSummary.monthlyRevenue.map((m, idx) => {
                  const heightPct = Math.max(15, Math.round((m.revenue / maxMonthlyRevenue) * 100));
                  return (
                    <div key={idx} className="flex-1 min-w-[50px] flex flex-col items-center h-full justify-end group">
                      <div className="w-full max-w-[42px] flex items-end justify-center gap-1 h-full">
                        <div
                          className="w-full bg-blue-600 rounded-t-md hover:bg-blue-500 transition-all duration-300 relative"
                          style={{ height: `${heightPct}%` }}
                        >
                          <span className="hidden sm:block text-[9px] font-bold text-white text-center pt-1 truncate">
                            {m.revenue >= 1000 ? `${(m.revenue / 1000).toFixed(0)}k` : m.revenue}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-slate-700 mt-2">{m.month}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">{m.bookings} bks</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Summary Strip */}
          <div className="grid grid-cols-3 gap-3 pt-2 text-center text-xs">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Confirmed</span>
              <span className="font-bold text-slate-800">{analyticsSummary.successfulBookings} Reservations</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Revenue</span>
              <span className="font-bold text-slate-800">₹{analyticsSummary.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Fleet</span>
              <span className="font-bold text-slate-800">{analyticsSummary.totalFlights} Scheduled Flights</span>
            </div>
          </div>
        </div>

        {/* Cabin Distribution & Actual Payment Method Breakdown (1 col) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-6">
          <div>
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-600" />
                Cabin Class Distribution
              </h2>
              <p className="text-xs text-slate-500">Passenger booking share by seating tier</p>
            </div>

            {analyticsSummary.totalBookings === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">No booking data available</p>
            ) : (
              <div className="space-y-3.5 mt-4">
                {analyticsSummary.cabinDistribution.map((item) => {
                  const color =
                    item.cabin === 'Economy' ? 'bg-blue-600' :
                    item.cabin === 'Business' ? 'bg-indigo-600' : 'bg-purple-600';

                  return (
                    <div key={item.cabin} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700">{item.cabin} Class</span>
                        <span className="text-slate-900 font-bold">{item.count} tickets ({item.percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`${color} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${Math.max(item.percentage, item.count > 0 ? 5 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Payment Method Breakdown strictly from actual payment transactions */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-500" />
              Actual Payment Gateway Transactions
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold">UPI</span>
                <span className="font-black text-slate-800 text-sm">{paymentMethodStats.UPI.count}</span>
                <span className="text-[10px] text-slate-500 block">₹{paymentMethodStats.UPI.totalAmount.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold">Card</span>
                <span className="font-black text-slate-800 text-sm">{paymentMethodStats.Card.count}</span>
                <span className="text-[10px] text-slate-500 block">₹{paymentMethodStats.Card.totalAmount.toLocaleString()}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold">Wallet</span>
                <span className="font-black text-slate-800 text-sm">{paymentMethodStats.Wallet.count}</span>
                <span className="text-[10px] text-slate-500 block">₹{paymentMethodStats.Wallet.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* POPULAR ROUTES & SEAT OCCUPANCY TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Popular Routes Leaderboard */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Popular Routes Based on Actual Bookings
              </h2>
              <p className="text-xs text-slate-500">Dynamic route rankings from reservation dataset</p>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              {analyticsSummary.popularRoutes.length} Active Routes
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {analyticsSummary.popularRoutes.length === 0 ? (
              <div className="py-10 text-center space-y-1 bg-slate-50 rounded-2xl">
                <p className="text-xs font-bold text-slate-600">No route booking statistics recorded yet</p>
                <p className="text-[11px] text-slate-400">Routes will automatically populate as passengers make bookings.</p>
              </div>
            ) : (
              analyticsSummary.popularRoutes.map((r, idx) => (
                <div key={`${r.route}-${idx}`} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[11px]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{r.route}</span>
                      <span className="text-[11px] text-slate-500">{r.bookings} passenger bookings</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-slate-900 text-sm block">₹{r.revenue.toLocaleString()}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Active Sector</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Seat Occupancy for each flight in dataset */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plane className="w-4 h-4 text-blue-600" />
                Seat Occupancy per Flight in Dataset
              </h2>
              <p className="text-xs text-slate-500">Every flight from your existing dataset</p>
            </div>
            
            {/* Search filter for flights */}
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by flight or route..."
                value={flightSearchTerm}
                onChange={(e) => setFlightSearchTerm(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-44"
              />
            </div>
          </div>

          <div className="space-y-2.5 overflow-y-auto max-h-80 pr-1">
            {filteredOccupancyFlights.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No flights matched your filter.</p>
            ) : (
              filteredOccupancyFlights.map((flight) => {
                const badgeColor =
                  flight.occupancyRate >= 50
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : flight.occupancyRate >= 20
                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                    : 'text-amber-700 bg-amber-50 border-amber-200';

                return (
                  <div key={flight.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{flight.flightNumber}</span>
                        <span className="text-slate-600 font-medium">({flight.route})</span>
                        {flight.departureTime && (
                          <span className="text-[10px] text-slate-400">{flight.departureTime} hrs</span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badgeColor}`}>
                        {flight.occupancyRate}% Full ({flight.bookedSeats}/{flight.totalSeats} seats)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          flight.occupancyRate >= 50 ? 'bg-emerald-500' : flight.occupancyRate >= 20 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(flight.occupancyRate, flight.bookedSeats > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* SECTION 6 & 7: PASSENGER RESERVATION MANIFEST & TICKET VERIFICATION */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-black text-slate-900">
                Reservation Manifest & Ticket Verification
              </h2>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Official Airline Database
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Real-time booking records, seat allocations, travel status, and ticket verification records.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-xl border border-emerald-200">
              {analyticsSummary.verifiedTicketsCount} Verified Tickets
            </span>
          </div>
        </div>

        {/* Quick Inline Verification Form */}
        <form onSubmit={handleVerifyTicketInline} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <input
              type="text"
              placeholder="Enter PNR to verify reservation status (e.g. A7K92P)..."
              value={verifyPnrInput}
              onChange={(e) => setVerifyPnrInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Verify Ticket</span>
          </button>
        </form>

        {verifyFeedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              verifyFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {verifyFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{verifyFeedback.message}</span>
          </div>
        )}

        {/* Manifest Search Filter */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <span className="text-xs font-bold text-slate-700">
            Passenger Reservations ({filteredManifestRecords.length})
          </span>
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by PNR, passenger, or flight..."
              value={ledgerSearchTerm}
              onChange={(e) => setLedgerSearchTerm(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 w-56"
            />
          </div>
        </div>

        {/* Reservation Manifest Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                <th className="py-2.5 px-3">PNR</th>
                <th className="py-2.5 px-3">Passenger</th>
                <th className="py-2.5 px-3">Flight ID</th>
                <th className="py-2.5 px-3">Seat</th>
                <th className="py-2.5 px-3">Travel Date</th>
                <th className="py-2.5 px-3">Fare Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
              {filteredManifestRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No passenger reservation records found in the database.
                  </td>
                </tr>
              ) : (
                filteredManifestRecords.map((item) => (
                  <tr key={item.pnr} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-blue-700">
                      {item.pnr}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-semibold text-slate-900">
                      {item.owner}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-bold">
                      {item.flightId}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px] font-bold">
                        Seat {item.seatNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                      {item.travelDate}
                    </td>
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-900">
                      ₹{item.totalAmount.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.isVerified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status.includes('Cancelled')
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {item.isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {item.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            db.markTicketVerified(item.pnr);
                            setRefreshKey(prev => prev + 1);
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition-colors cursor-pointer border border-emerald-200"
                          title="Verify ticket in system"
                        >
                          Verify
                        </button>
                        {onOpenBookingTicket && (
                          <button
                            type="button"
                            onClick={() => onOpenBookingTicket(item.pnr)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer border border-slate-200"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
