import React, { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  Plane,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { Flight, FlightStatus } from '../types';
import { db } from '../services/db';

export const FlightStatusTracker: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const allFlights = useMemo(() => db.getFlights(), []);

  const filteredFlights = useMemo(() => {
    return allFlights.filter(f => {
      const matchSearch =
        !searchTerm ||
        f.flightNumber.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        f.originCode.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        f.destinationCode.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        f.airline.toLowerCase().includes(searchTerm.toLowerCase().trim());

      const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allFlights, searchTerm, statusFilter]);

  const getStatusBadge = (status: FlightStatus, delayMinutes?: number) => {
    switch (status) {
      case 'On Time':
        return (
          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs px-2.5 py-1 rounded-full font-bold">
            ● On Time
          </span>
        );
      case 'Delayed':
        return (
          <span className="bg-amber-100 text-amber-800 border border-amber-300 text-xs px-2.5 py-1 rounded-full font-bold">
            ● Delayed {delayMinutes ? `(+${delayMinutes}m)` : ''}
          </span>
        );
      case 'Boarding':
        return (
          <span className="bg-purple-100 text-purple-800 border border-purple-300 text-xs px-2.5 py-1 rounded-full font-bold animate-pulse">
            ● Boarding Now
          </span>
        );
      case 'Departed':
        return (
          <span className="bg-blue-100 text-blue-800 border border-blue-300 text-xs px-2.5 py-1 rounded-full font-bold">
            ● Departed
          </span>
        );
      case 'Arrived':
        return (
          <span className="bg-slate-100 text-slate-800 border border-slate-300 text-xs px-2.5 py-1 rounded-full font-bold">
            ● Landed / Arrived
          </span>
        );
      case 'Cancelled':
        return (
          <span className="bg-red-100 text-red-800 border border-red-300 text-xs px-2.5 py-1 rounded-full font-bold">
            ✕ Cancelled
          </span>
        );
      case 'Scheduled':
      default:
        return (
          <span className="bg-slate-100 text-slate-700 border border-slate-300 text-xs px-2.5 py-1 rounded-full font-bold">
            Scheduled
          </span>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Domestic Flight Schedule & Timetable
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Track departure gates, terminals, and scheduled timings across all serviced routes.
          </p>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search Flight No, Route (e.g. AI-202, BOM)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 font-medium whitespace-nowrap">Filter Status:</span>
          {['ALL', 'On Time', 'Delayed', 'Boarding', 'Departed', 'Cancelled'].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Flight Status Cards */}
      <div className="space-y-3">
        {filteredFlights.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-400">
            <Plane className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700 text-sm">No flights match your filter</p>
            <p className="text-xs text-slate-400 mt-1">Try searching for a flight number like AI-202 or UK-812</p>
          </div>
        ) : (
          filteredFlights.map(flight => {
            const originAirport = db.getAirportByCode(flight.originCode);
            const destAirport = db.getAirportByCode(flight.destinationCode);

            return (
              <div
                key={flight.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                      {flight.airline.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm">{flight.airline}</h3>
                      <span className="font-mono text-xs font-bold text-blue-700">{flight.flightNumber}</span>
                    </div>
                  </div>

                  <div>{getStatusBadge(flight.status, flight.delayMinutes)}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-3 items-center text-xs">
                  <div>
                    <span className="text-xl font-black text-slate-900">{flight.originCode}</span>
                    <p className="font-bold text-slate-700">{originAirport?.city}</p>
                    <p className="text-slate-400">Scheduled: {flight.departureTime} hrs</p>
                    <p className="text-slate-500 font-semibold mt-0.5">Terminal {flight.terminal}</p>
                  </div>

                  <div className="text-center">
                    <span className="text-[11px] font-semibold text-slate-500">{flight.duration}</span>
                    <div className="w-full flex items-center my-1 relative">
                      <div className="h-0.5 w-full bg-slate-200"></div>
                      <Plane className="w-3.5 h-3.5 text-blue-600 rotate-90 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white" />
                    </div>
                    <span className="text-[10px] text-slate-400">Date: {flight.departureDate}</span>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-xl font-black text-slate-900">{flight.destinationCode}</span>
                    <p className="font-bold text-slate-700">{destAirport?.city}</p>
                    <p className="text-slate-400">Estimated: {flight.arrivalTime} hrs</p>
                    <p className="text-emerald-700 font-bold mt-0.5">Gate: {flight.gate || '12A'}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
