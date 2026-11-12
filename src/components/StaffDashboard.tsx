import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Plane,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Check,
  RefreshCw,
  Ban,
  FileText
} from 'lucide-react';
import { Flight, FlightStatus, Booking } from '../types';
import { db } from '../services/db';

interface StaffDashboardProps {
  onOpenBookingTicket: (pnr: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onOpenBookingTicket }) => {
  const [selectedFlightId, setSelectedFlightId] = useState<string>('FL-201');
  const [searchPnr, setSearchPnr] = useState('');
  const [lookupResult, setLookupResult] = useState<Booking | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Status edit modal state
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [newStatus, setNewStatus] = useState<FlightStatus>('On Time');
  const [delayMinutes, setDelayMinutes] = useState<number>(0);

  const flights = useMemo(() => db.getFlights(), [refreshKey]);
  const currentFlight = useMemo(() => {
    return flights.find(f => f.id === selectedFlightId) || flights[0];
  }, [flights, selectedFlightId]);

  // Bookings for selected flight
  const flightBookings = useMemo(() => {
    if (!currentFlight) return [];
    return db.getBookings().filter(b => b.flightId === currentFlight.id);
  }, [currentFlight, refreshKey]);

  // Handle staff manual passenger checkin
  const handleManualCheckIn = (pnr: string) => {
    try {
      db.performWebCheckIn(pnr);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Check-in failed');
    }
  };

  // Handle flight status update
  const handleSaveFlightStatus = () => {
    if (!editingFlight) return;
    db.updateFlightStatus(editingFlight.id, newStatus, delayMinutes);
    setEditingFlight(null);
    setRefreshKey(prev => prev + 1);
  };

  // Lookup booking for cancellation assistance
  const handleLookupBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);

    const b = db.getBookingByPnr(searchPnr.trim());
    if (!b) {
      setLookupError(`Booking with PNR "${searchPnr}" was not found.`);
      return;
    }
    setLookupResult(b);
  };

  // Staff cancellation assistance
  const handleStaffCancelBooking = (pnr: string) => {
    if (confirm(`Are you sure you want to assist in cancelling PNR ${pnr}? This will release the seat and record refund.`)) {
      try {
        db.cancelBooking(pnr, 'Customer requested staff desk cancellation');
        setRefreshKey(prev => prev + 1);
        if (lookupResult && lookupResult.pnr === pnr) {
          setLookupResult(db.getBookingByPnr(pnr) || null);
        }
      } catch (err: any) {
        alert(err.message || 'Cancellation error');
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-amber-800/40">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Airline Staff & Ground Operations Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Flight Dispatch & Passenger Desk
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Monitor today's scheduled flights, access passenger manifests, process airport desk check-ins, and update departure statuses.
          </p>
        </div>
      </div>

      {/* Main Grid: Flights list on Left, Passenger Manifest on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Today's Flights Selector */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Plane className="w-4 h-4 text-amber-600" />
                <span>Today's Flights ({flights.length})</span>
              </h3>
              <span className="text-[11px] text-slate-400">Click to inspect</span>
            </div>

            <div className="space-y-2.5 mt-3 max-h-[540px] overflow-y-auto pr-1">
              {flights.map(flight => {
                const isSelected = flight.id === selectedFlightId;
                const bookedCount = (db.getBookings().filter(b => b.flightId === flight.id && b.bookingStatus !== 'CANCELLED')).length;

                return (
                  <div
                    key={flight.id}
                    onClick={() => setSelectedFlightId(flight.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-amber-500 bg-amber-50/70 shadow-xs ring-1 ring-amber-500/30'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900">{flight.flightNumber}</span>
                        <span className="text-xs text-slate-500">• {flight.airline}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        flight.status === 'On Time' ? 'bg-emerald-100 text-emerald-800' :
                        flight.status === 'Delayed' ? 'bg-amber-100 text-amber-800' :
                        flight.status === 'Boarding' ? 'bg-purple-100 text-purple-800 animate-pulse' :
                        flight.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {flight.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-2 text-slate-600">
                      <span>{flight.originCode} → {flight.destinationCode}</span>
                      <span>Dep: {flight.departureTime}</span>
                      <span>Gate: {flight.gate || '12A'}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-200/60 text-slate-500">
                      <span>Manifest: {bookedCount} booked</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFlight(flight);
                          setNewStatus(flight.status);
                          setDelayMinutes(flight.delayMinutes || 0);
                        }}
                        className="text-amber-700 hover:text-amber-900 font-bold hover:underline"
                      >
                        Update Status →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cancellation & PNR Lookup Assistance Box */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500" />
              <span>Staff Desk Assistance (PNR Lookup)</span>
            </h3>

            <form onSubmit={handleLookupBooking} className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={searchPnr}
                onChange={e => setSearchPnr(e.target.value.toUpperCase())}
                placeholder="Enter PNR (e.g. A7K92P)"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Search
              </button>
            </form>

            {lookupError && (
              <p className="text-xs text-red-600 font-medium">{lookupError}</p>
            )}

            {lookupResult && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{lookupResult.passenger.fullName}</span>
                  <span className="font-mono text-blue-700">{lookupResult.pnr}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Seat: {lookupResult.seatNumber} ({lookupResult.cabinClass})</span>
                  <span className={`font-bold uppercase ${
                    lookupResult.bookingStatus === 'CONFIRMED' ? 'text-emerald-600' :
                    lookupResult.bookingStatus === 'CHECKED_IN' ? 'text-blue-600' : 'text-red-600'
                  }`}>
                    {lookupResult.bookingStatus}
                  </span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => onOpenBookingTicket(lookupResult.pnr)}
                    className="flex-1 py-1 bg-blue-600 text-white rounded text-[11px] font-bold hover:bg-blue-700"
                  >
                    View Ticket
                  </button>
                  {lookupResult.bookingStatus !== 'CANCELLED' && (
                    <button
                      onClick={() => handleStaffCancelBooking(lookupResult.pnr)}
                      className="py-1 px-2.5 border border-red-300 text-red-600 rounded text-[11px] font-bold hover:bg-red-50"
                    >
                      Cancel Ticket
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Passenger Manifest for Current Flight */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            
            {/* Manifest Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-slate-900 text-lg">
                    {currentFlight ? `${currentFlight.airline} (${currentFlight.flightNumber})` : 'Flight Manifest'}
                  </h3>
                  <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {currentFlight?.originCode} → {currentFlight?.destinationCode}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gate {currentFlight?.gate || '12A'} • Departure: {currentFlight?.departureTime} hrs • Terminal {currentFlight?.terminal}
                </p>
              </div>

              <button
                onClick={() => {
                  if (currentFlight) {
                    setEditingFlight(currentFlight);
                    setNewStatus(currentFlight.status);
                    setDelayMinutes(currentFlight.delayMinutes || 0);
                  }
                }}
                className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs self-start sm:self-auto"
              >
                Change Flight Status
              </button>
            </div>

            {/* Passenger Manifest Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Booked Passengers ({flightBookings.length})
                </span>
                <span className="text-xs text-slate-400">
                  {flightBookings.filter(b => b.isCheckedIn).length} Checked-In
                </span>
              </div>

              {flightBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                  <Users className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                  <p className="text-xs font-bold text-slate-600">No passengers booked yet</p>
                  <p className="text-[11px] text-slate-400">Bookings created by customers will appear on this manifest.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Seat</th>
                        <th className="p-3">PNR</th>
                        <th className="p-3">Passenger</th>
                        <th className="p-3">Class</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Desk Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {flightBookings.map(b => (
                        <tr key={b.pnr} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-extrabold text-blue-700 font-mono text-sm">{b.seatNumber}</td>
                          <td className="p-3 font-mono font-bold text-slate-900">{b.pnr}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{b.passenger.fullName}</p>
                            <p className="text-[11px] text-slate-400">{b.passenger.phone}</p>
                          </td>
                          <td className="p-3 font-semibold text-slate-700">{b.cabinClass}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              b.bookingStatus === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' :
                              b.bookingStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {b.bookingStatus}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            {b.bookingStatus === 'CONFIRMED' ? (
                              <button
                                onClick={() => handleManualCheckIn(b.pnr)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition-colors"
                              >
                                Check In
                              </button>
                            ) : b.bookingStatus === 'CHECKED_IN' ? (
                              <span className="text-emerald-600 font-bold text-xs flex items-center justify-end gap-1">
                                <Check className="w-3.5 h-3.5" /> Checked
                              </span>
                            ) : (
                              <span className="text-red-500 font-medium text-xs">Cancelled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Flight Status Edit Modal */}
      {editingFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-black text-slate-900 text-base">
              Update Status for Flight {editingFlight.flightNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Route: {editingFlight.originCode} → {editingFlight.destinationCode} • Scheduled: {editingFlight.departureTime}
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Flight Status</label>
                <select
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value as FlightStatus)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="On Time">On Time</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Boarding">Boarding</option>
                  <option value="Departed">Departed</option>
                  <option value="Arrived">Arrived</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {newStatus === 'Delayed' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Delay Duration (Minutes)</label>
                  <input
                    type="number"
                    min={5}
                    max={480}
                    value={delayMinutes}
                    onChange={e => setDelayMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingFlight(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveFlightStatus}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
              >
                Save & Broadcast Notification
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
