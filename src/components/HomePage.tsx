import React, { useState } from 'react';
import {
  Plane,
  Search,
  Calendar,
  Ticket,
  CheckCircle2,
  Activity,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  MapPin,
  HelpCircle,
  TrendingDown,
  Compass,
  FileCheck2,
  ChevronRight,
  PhoneCall,
  Bot
} from 'lucide-react';
import { db } from '../services/db';
import { Flight } from '../types';

interface HomePageProps {
  onNavigate: (view: string) => void;
  currentUser: any;
  onOpenFlightStatus?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  currentUser,
}) => {
  // Quick Flight Status check widget on Homepage
  const [quickFlightNum, setQuickFlightNum] = useState('');
  const [statusResult, setStatusResult] = useState<Flight | null>(null);
  const [statusSearched, setStatusSearched] = useState(false);

  const handleQuickStatusSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFlightNum.trim()) return;
    const cleanNum = quickFlightNum.trim().toUpperCase();
    const allFlights = db.getFlights();
    const found = allFlights.find(
      f =>
        f.flightNumber.toUpperCase() === cleanNum ||
        f.flightNumber.replace('-', '').toUpperCase() === cleanNum.replace('-', '')
    );
    setStatusResult(found || null);
    setStatusSearched(true);
  };

  return (
    <div className="space-y-10 pb-12">
      
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-2xl border border-slate-800">
        {/* Background Aviation Graphics (Self-contained SVG Pattern) */}
        <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="flight-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#flight-grid)" />
            <path
              d="M-100 200 C 300 50, 700 350, 1400 100"
              fill="none"
              stroke="rgba(59, 130, 246, 0.4)"
              strokeWidth="2"
              strokeDasharray="6,6"
            />
          </svg>
        </div>

        <div className="relative px-6 py-12 sm:px-12 sm:py-16 max-w-5xl">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            SKYLINE RESERVATION BOOKING SYSTEM
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
            Book domestic flights, manage your journeys and access your travel services from one place.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              id="hero-search-flights-btn"
              onClick={() => onNavigate('search')}
              className="inline-flex items-center gap-3 px-7 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Search className="w-4 h-4" />
              <span>Search Flights</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>

            <button
              id="hero-ai-assistant-btn"
              onClick={() => onNavigate('chatbot')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/20 transition-all border border-blue-400/30 backdrop-blur-xs transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plane className="w-4 h-4 text-white" />
              <span>Flight Booking ChatBot</span>
            </button>

            {currentUser ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm transition-all"
              >
                <span>Go to My Dashboard</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white border border-white/20 font-semibold text-sm transition-all backdrop-blur-xs"
              >
                <span>Passenger Sign In</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. QUICK ACCESS SECTION - JUST MY BOOKINGS, WEB CHECK-IN, FLIGHT STATUS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Quick Access Services</h2>
            <p className="text-xs text-slate-500">Access your journey and airport departure services</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: My Bookings */}
          <button
            id="qa-my-bookings"
            onClick={() => {
              if (currentUser) {
                onNavigate('bookings');
              } else {
                onNavigate('login');
              }
            }}
            className="group p-6 bg-white rounded-3xl border border-slate-200 hover:border-indigo-400 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between"
          >
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-4">
              <Ticket className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition-colors">
                My Bookings
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                View confirmed tickets, PNR details & download PDF
              </p>
            </div>
          </button>

          {/* Card 2: Web Check-in */}
          <button
            id="qa-web-checkin"
            onClick={() => onNavigate('checkin')}
            className="group p-6 bg-white rounded-3xl border border-slate-200 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-emerald-600 transition-colors">
                Web Check-in
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Select your seat & generate digital boarding pass
              </p>
            </div>
          </button>

          {/* Card 3: Check Flight Status */}
          <button
            id="qa-flight-status"
            onClick={() => onNavigate('status')}
            className="group p-6 bg-white rounded-3xl border border-slate-200 hover:border-amber-400 shadow-xs hover:shadow-md transition-all text-left flex flex-col justify-between"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors mb-4">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-600 transition-colors">
                Flight Status
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Check 2026 timetable, departure schedules & boarding gates
              </p>
            </div>
          </button>

        </div>
      </section>

      {/* 3. QUICK FLIGHT STATUS WIDGET (STANDALONE) */}
      <div className="max-w-3xl mx-auto w-full">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Track Flight Schedule</h3>
                <p className="text-xs text-slate-500">
                  Enter domestic flight number to check departure, arrival and gate information from the 2026 Current Schedule Dataset
                </p>
              </div>
            </div>

            <form onSubmit={handleQuickStatusSearch} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Flight Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={quickFlightNum}
                    onChange={e => setQuickFlightNum(e.target.value)}
                    placeholder="e.g. AI-202, 6E-618, UK-810, SG-115"
                    className="w-full bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Check Status
                  </button>
                </div>
              </div>
            </form>

            {statusSearched && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                {statusResult ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm text-slate-900">{statusResult.flightNumber} ({statusResult.airline})</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        statusResult.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                        statusResult.status === 'Delayed' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {statusResult.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-700 font-semibold py-1">
                      <span>{statusResult.originCode} ({statusResult.departureTime})</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span>{statusResult.destinationCode} ({statusResult.arrivalTime})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-200/60">
                      <span>Terminal: <strong>{statusResult.terminal}</strong></span>
                      <span>Gate: <strong>{statusResult.gate}</strong></span>
                      <span>Duration: <strong>{statusResult.duration}</strong></span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-red-600 bg-red-50 p-3 rounded-2xl border border-red-200">
                    No flight found matching "{quickFlightNum}". Try AI-202, 6E-618, or SG-115.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Need the full domestic schedule timetable?</span>
            <button
              onClick={() => onNavigate('status')}
              className="text-blue-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>View All Flights</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. PASSENGER SUPPORT & VIVA ASSURANCE BANNER */}
      <section className="rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white">24x7 Domestic Flight Passenger Support</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Need assistance with your booking, baggage allowance, or special concession verification?
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('help')}
            className="px-5 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-xs shadow-md transition-colors"
          >
            Help & FAQs
          </button>
          <button
            onClick={() => onNavigate('search')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-md transition-colors"
          >
            Book Flights Now
          </button>
        </div>
      </section>

    </div>
  );
};
