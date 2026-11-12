import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Search,
  Plane,
  Calendar,
  Clock,
  User,
  Armchair,
  ShieldCheck,
  AlertCircle,
  FileText
} from 'lucide-react';
import { User as AuthUser, Booking, Flight } from '../types';
import { db } from '../services/db';
import { BoardingPassModal } from './BoardingPassModal';

interface WebCheckInProps {
  currentUser: AuthUser | null;
  onOpenBookingTicket: (pnr: string) => void;
}

export const WebCheckIn: React.FC<WebCheckInProps> = ({ currentUser, onOpenBookingTicket }) => {
  const [pnrInput, setPnrInput] = useState('');
  const [lastNameInput, setLastNameInput] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [changeSeatOpen, setChangeSeatOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string>('');
  const [checkedInBoardingPass, setCheckedInBoardingPass] = useState<{ booking: Booking; flight: Flight } | null>(null);

  // User's confirmed bookings that are eligible for checkin
  const eligibleBookings = useMemo(() => {
    if (!currentUser) return [];
    return db.getBookings(currentUser.id).filter(b => b.bookingStatus === 'CONFIRMED');
  }, [currentUser]);

  const handleSearchCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    setActiveBooking(null);

    const booking = db.getBookingByPnr(pnrInput.trim());
    if (!booking) {
      setSearchError(`No booking found with PNR "${pnrInput}". Please verify your 6-character PNR code.`);
      return;
    }

    if (lastNameInput.trim()) {
      const passengerLastName = booking.passenger.fullName.trim().split(' ').pop()?.toLowerCase();
      if (passengerLastName && passengerLastName !== lastNameInput.trim().toLowerCase()) {
        setSearchError(`Passenger last name does not match record for PNR ${booking.pnr}.`);
        return;
      }
    }

    if (booking.bookingStatus === 'CANCELLED') {
      setSearchError(`This booking (PNR ${booking.pnr}) has been cancelled and cannot be checked in.`);
      return;
    }

    setActiveBooking(booking);
    setSelectedSeat(booking.seatNumber);
  };

  const handleSelectEligibleBooking = (booking: Booking) => {
    setActiveBooking(booking);
    setSelectedSeat(booking.seatNumber);
    setPnrInput(booking.pnr);
  };

  const handleCompleteCheckIn = () => {
    if (!activeBooking) return;
    try {
      db.performWebCheckIn(activeBooking.pnr, selectedSeat);
      const updated = db.getBookingByPnr(activeBooking.pnr)!;
      const flight = db.getFlightById(updated.flightId)!;
      setActiveBooking(updated);
      setCheckedInBoardingPass({ booking: updated, flight });
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  const flight = activeBooking ? db.getFlightById(activeBooking.flightId) : null;
  const availableSeatsForFlight = useMemo(() => {
    if (!activeBooking) return [];
    return db.getSeatsForFlight(activeBooking.flightId).filter(s => !s.isBooked || s.seatNumber === activeBooking.seatNumber);
  }, [activeBooking]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Web Check-in & Boarding Pass
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Check-in online up to 24 hours prior to departure, confirm your seat, and generate your digital boarding pass instantly.
          </p>
        </div>
      </div>

      {/* Quick Select for Logged in User */}
      {currentUser && eligibleBookings.length > 0 && !activeBooking && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Your Upcoming Confirmed Flights Ready for Check-in:
          </h3>
          <div className="space-y-2">
            {eligibleBookings.map(b => {
              const f = db.getFlightById(b.flightId);
              return (
                <div
                  key={b.pnr}
                  onClick={() => handleSelectEligibleBooking(b)}
                  className="p-3 bg-blue-50/60 hover:bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      {f?.airline.charAt(0) || 'A'}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {f?.airline} {f?.flightNumber} • PNR: <span className="font-mono text-blue-700">{b.pnr}</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        {f?.originCode} → {f?.destinationCode} • Date: {b.travelDate} • Seat: {b.seatNumber}
                      </p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700">
                    Check-in Now
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search by PNR Form */}
      {!activeBooking && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <span>Search Booking for Web Check-in</span>
          </h3>

          <form onSubmit={handleSearchCheckIn} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Booking Reference / PNR (6-Characters) *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={pnrInput}
                  onChange={e => setPnrInput(e.target.value.toUpperCase())}
                  placeholder="e.g. A7K92P"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Passenger Last Name (Optional)
                </label>
                <input
                  type="text"
                  value={lastNameInput}
                  onChange={e => setLastNameInput(e.target.value)}
                  placeholder="e.g. Sharma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {searchError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{searchError}</span>
              </div>
            )}

            <button
              type="submit"
              id="search-checkin-btn"
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              Retrieve Booking for Check-in →
            </button>
          </form>
        </div>
      )}

      {/* Booking Details & Check-In Action View */}
      {activeBooking && flight && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Web Check-in Verification</span>
              <h3 className="text-lg font-bold text-slate-900">
                Flight {flight.flightNumber} ({flight.originCode} → {flight.destinationCode})
              </h3>
            </div>
            <button
              onClick={() => setActiveBooking(null)}
              className="text-xs text-slate-500 hover:text-slate-800 underline"
            >
              Check another PNR
            </button>
          </div>

          {/* Passenger & Flight Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block font-medium">Passenger Name</span>
              <span className="font-bold text-slate-900 text-sm">{activeBooking.passenger.fullName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">PNR Reference</span>
              <span className="font-mono font-black text-blue-700 text-sm">{activeBooking.pnr}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Flight / Airline</span>
              <span className="font-semibold text-slate-800">{flight.airline} ({flight.flightNumber})</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Departure Schedule</span>
              <span className="font-semibold text-slate-800">
                {activeBooking.travelDate} at {flight.departureTime} (Terminal {flight.terminal})
              </span>
            </div>
          </div>

          {/* Seat Confirmation & Selection */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                {selectedSeat}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
                  Seat {selectedSeat} ({activeBooking.cabinClass})
                </p>
                <p className="text-[11px] text-slate-500">
                  Current assigned seat for this booking
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {changeSeatOpen ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedSeat}
                    onChange={e => setSelectedSeat(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800"
                  >
                    {availableSeatsForFlight.map(s => (
                      <option key={s.seatNumber} value={s.seatNumber}>
                        Seat {s.seatNumber} ({s.cabinClass})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setChangeSeatOpen(false)}
                    className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setChangeSeatOpen(true)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-400 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                >
                  Change Seat
                </button>
              )}
            </div>
          </div>

          {/* Health & Baggage Declaration */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input type="checkbox" defaultChecked required className="mt-0.5 rounded text-blue-600" />
              <span>
                I confirm that I am fit to fly, have reviewed all luggage restrictions, and do not carry hazardous or prohibited materials.
              </span>
            </label>
          </div>

          {/* Check-In Button or View Boarding Pass */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
            {activeBooking.isCheckedIn ? (
              <button
                id="view-already-checkedin-btn"
                onClick={() => setCheckedInBoardingPass({ booking: activeBooking, flight })}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Already Checked-In • View Boarding Pass</span>
              </button>
            ) : (
              <button
                id="complete-web-checkin-btn"
                onClick={handleCompleteCheckIn}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Web Check-in & Generate Boarding Pass</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal displaying Boarding Pass */}
      {checkedInBoardingPass && (
        <BoardingPassModal
          booking={checkedInBoardingPass.booking}
          flight={checkedInBoardingPass.flight}
          onClose={() => setCheckedInBoardingPass(null)}
        />
      )}

    </div>
  );
};
