import React, { useState, useMemo } from 'react';
import {
  Ticket,
  Plane,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Printer,
  Ban,
  Search,
  Download
} from 'lucide-react';
import { Booking, Flight, User as AuthUser } from '../types';
import { db } from '../services/db';
import { CancellationModal } from './CancellationModal';
import { downloadTicketPDF } from '../utils/pdf';

interface MyBookingsProps {
  currentUser: AuthUser | null;
  onViewTicket: (pnr: string) => void;
  onCheckInBooking: (pnr: string) => void;
  onBookFlightClick: () => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({
  currentUser,
  onViewTicket,
  onCheckInBooking,
  onBookFlightClick,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>('upcoming');
  const [cancellingBooking, setCancellingBooking] = useState<{ booking: Booking; flight: Flight | undefined } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Search by PNR state
  const [pnrSearch, setPnrSearch] = useState('');
  const [pnrSearchResult, setPnrSearchResult] = useState<Booking | null | 'NOT_FOUND'>(null);

  // Fetch bookings: if logged in, fetch for current user; if not logged in, fetch all recent session bookings
  const userBookings = useMemo(() => {
    if (currentUser) {
      return db.getBookings(currentUser.id);
    }
    // Fallback: show recent bookings so guest/demo booking is visible
    return db.getBookings();
  }, [currentUser, refreshKey]);

  const handlePnrSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrSearch.trim()) return;
    const found = db.getBookingByPnr(pnrSearch.trim());
    if (found) {
      setPnrSearchResult(found);
      onViewTicket(found.pnr);
    } else {
      setPnrSearchResult('NOT_FOUND');
    }
  };

  // Today's date string for classifying completed trips vs upcoming
  const todayStr = new Date().toISOString().split('T')[0];

  // Filter based on tab
  const filteredBookings = useMemo(() => {
    return userBookings.filter(b => {
      if (activeTab === 'cancelled') return b.bookingStatus === 'CANCELLED';
      if (activeTab === 'completed') return b.bookingStatus !== 'CANCELLED' && b.travelDate < todayStr;
      if (activeTab === 'upcoming') return b.bookingStatus !== 'CANCELLED' && b.travelDate >= todayStr;
      return true;
    });
  }, [userBookings, activeTab, todayStr]);

  const handleCancellationSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" />
            <span>My Bookings & Trips</span>
          </h1>
          <p className="text-xs text-slate-500">
            Manage your airline reservations, access e-tickets, web check-in, and cancellations
          </p>
        </div>

        <button
          onClick={onBookFlightClick}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
        >
          <Plane className="w-4 h-4 -rotate-45" />
          <span>Book New Flight</span>
        </button>
      </div>

      {/* Quick PNR Lookup / E-Ticket Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <form onSubmit={handlePnrSearch} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={pnrSearch}
              onChange={e => {
                setPnrSearch(e.target.value.toUpperCase());
                if (pnrSearchResult) setPnrSearchResult(null);
              }}
              placeholder="Enter 6-character PNR (e.g. ABC123) to retrieve E-Ticket"
              maxLength={6}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2 text-xs font-mono font-bold tracking-wider uppercase text-slate-800 placeholder:font-sans placeholder:normal-case placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors shrink-0 flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Find & Open E-Ticket</span>
          </button>
        </form>

        {pnrSearchResult === 'NOT_FOUND' && (
          <p className="text-xs text-red-600 mt-2 font-medium">
            No booking found matching PNR "{pnrSearch}". Please check the 6-character code and try again.
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-xs font-bold w-fit">
        <button
          id="tab-upcoming-trips"
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'upcoming'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Upcoming Trips
        </button>
        <button
          id="tab-completed-trips"
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'completed'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed Trips
        </button>
        <button
          id="tab-cancelled-trips"
          onClick={() => setActiveTab('cancelled')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'cancelled'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Cancelled Trips
        </button>
        <button
          id="tab-all-trips"
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg transition-all ${
            activeTab === 'all'
              ? 'bg-white text-blue-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({userBookings.length})
        </button>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
            <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No {activeTab} trips found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              You do not have any flights listed under the {activeTab} section.
            </p>
            <button
              onClick={onBookFlightClick}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Search & Book Flight
            </button>
          </div>
        ) : (
          filteredBookings.map(booking => {
            const flight = db.getFlightById(booking.flightId);
            const isCancelled = booking.bookingStatus === 'CANCELLED';
            const isCheckedIn = booking.bookingStatus === 'CHECKED_IN' || booking.isCheckedIn;

            return (
              <div
                key={booking.pnr}
                className={`bg-white rounded-2xl p-6 border shadow-xs transition-all ${
                  isCancelled ? 'border-red-200 bg-red-50/20' : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isCancelled ? 'bg-red-100 text-red-600' : 'bg-blue-600 text-white'
                    }`}>
                      {flight?.airline.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{flight?.airline || 'Airline'}</h4>
                      <p className="text-xs text-slate-500 font-mono font-semibold">
                        Flight {flight?.flightNumber || 'FLIGHT'} • {booking.cabinClass} Class
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">PNR:</span>
                    <span className="font-mono font-black text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg text-sm">
                      {booking.pnr}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                      booking.bookingStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                      booking.bookingStatus === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      ● {booking.bookingStatus}
                    </span>
                  </div>
                </div>

                {/* Body route details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 items-center">
                  <div>
                    <span className="text-2xl font-black text-slate-900">{flight?.originCode}</span>
                    <p className="text-xs font-bold text-slate-700">{db.getAirportByCode(flight?.originCode || '')?.city}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {flight?.departureTime} hrs
                    </p>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <span className="text-[11px] font-semibold text-slate-500">{flight?.duration}</span>
                    <div className="w-full flex items-center my-1 relative">
                      <div className="h-0.5 w-full bg-slate-200"></div>
                      <Plane className="w-4 h-4 text-blue-600 rotate-90 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-600">
                      Travel Date: {booking.travelDate}
                    </span>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-2xl font-black text-slate-900">{flight?.destinationCode}</span>
                    <p className="text-xs font-bold text-slate-700">{db.getAirportByCode(flight?.destinationCode || '')?.city}</p>
                    <p className="text-xs text-slate-400 mt-1 flex sm:justify-end items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {flight?.arrivalTime} hrs
                    </p>
                  </div>
                </div>

                {/* Passenger & Fare pill */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-3 border-t border-slate-100 bg-slate-50/70 -mx-6 -mb-6 p-4 rounded-b-2xl">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-400 font-medium">Passenger: </span>
                      <span className="font-bold text-slate-800">{booking.passenger.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Seat: </span>
                      <span className="font-extrabold text-blue-700">{booking.seatNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Amount: </span>
                      <span className="font-extrabold text-slate-900">₹{booking.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Actions: View E-Ticket, Download PDF, Web Check-in, Cancel Ticket */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id={`view-ticket-btn-${booking.pnr}`}
                      onClick={() => onViewTicket(booking.pnr)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>E-Ticket & QR</span>
                    </button>

                    {flight && (
                      <button
                        id={`download-pdf-btn-${booking.pnr}`}
                        onClick={() => downloadTicketPDF(booking, flight)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                        title="Download official PDF ticket"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    )}

                    {!isCancelled && !isCheckedIn && (
                      <button
                        id={`checkin-btn-${booking.pnr}`}
                        onClick={() => onCheckInBooking(booking.pnr)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Web Check-in</span>
                      </button>
                    )}

                    {!isCancelled && (
                      <button
                        id={`cancel-ticket-btn-${booking.pnr}`}
                        onClick={() => setCancellingBooking({ booking, flight })}
                        className="px-3 py-1.5 border border-red-300 hover:bg-red-50 text-red-600 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel Flight</span>
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })
        )}
      </div>

      {/* Cancellation Modal */}
      {cancellingBooking && (
        <CancellationModal
          booking={cancellingBooking.booking}
          flight={cancellingBooking.flight}
          isOpen={true}
          onClose={() => setCancellingBooking(null)}
          onCancellationSuccess={handleCancellationSuccess}
        />
      )}

    </div>
  );
};
