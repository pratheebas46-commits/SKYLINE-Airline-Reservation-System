import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  Plane,
  Ticket,
  DollarSign,
  Users,
  Ban,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Sliders,
  Save,
  Lock,
  Mail,
  Phone,
  Building2,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  RefreshCw
} from 'lucide-react';
import { Flight, Booking, User, CabinClass } from '../types';
import { db, SystemSettings } from '../services/db';
import { apiService } from '../services/api';
import { AnalyticsDashboard } from './AnalyticsDashboard';

interface AdminDashboardProps {
  currentUser?: User | null;
  onOpenBookingTicket: (pnr: string) => void;
  onUpdateUser?: (updated: User) => void;
  onAdminLoginSuccess?: (user: User) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  onOpenBookingTicket,
  onUpdateUser,
  onAdminLoginSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'flights' | 'bookings' | 'users' | 'aircraft' | 'settings'>('overview');
  const [refreshKey, setRefreshKey] = useState(0);

  // Admin Authentication State for unauthorized visitors
  const [adminAuthUsername, setAdminAuthUsername] = useState('');
  const [adminAuthPassword, setAdminAuthPassword] = useState('');
  const [showAdminAuthPassword, setShowAdminAuthPassword] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(false);

  // Admin Profile & System Settings Form State
  const initialSettings = useMemo(() => db.getSystemSettings(), [refreshKey]);
  const adminAccount = useMemo(() => {
    if (currentUser?.role === 'admin') return currentUser;
    return db.getUsers().find(u => u.role === 'admin') || db.getUsers().find(u => u.username === 'admin');
  }, [currentUser, refreshKey]);

  const [adminFullName, setAdminFullName] = useState(adminAccount?.fullName || 'System Administrator');
  const [adminEmail, setAdminEmail] = useState(adminAccount?.email || 'admin@airline.com');
  const [adminPhone, setAdminPhone] = useState(adminAccount?.phone || '+91 99999 00000');
  const [adminDepartment, setAdminDepartment] = useState(adminAccount?.department || initialSettings.department || 'Flight Operations & Revenue Control');
  const [adminOfficeLocation, setAdminOfficeLocation] = useState(adminAccount?.officeLocation || initialSettings.officeLocation || 'Terminal 3, Indira Gandhi International Airport, New Delhi');
  const [adminNewPassword, setAdminNewPassword] = useState('');

  // Airline System Settings
  const [airlineName, setAirlineName] = useState(initialSettings.airlineName);
  const [announcementNotice, setAnnouncementNotice] = useState(initialSettings.announcementNotice);
  const [currency, setCurrency] = useState(initialSettings.currency);
  const [maxCheckinBaggageKg, setMaxCheckinBaggageKg] = useState(initialSettings.maxCheckinBaggageKg);
  const [maxCabinBaggageKg, setMaxCabinBaggageKg] = useState(initialSettings.maxCabinBaggageKg);
  const [bookingBufferMinutes, setBookingBufferMinutes] = useState(initialSettings.bookingBufferMinutes);
  const [autoSeatAllocation, setAutoSeatAllocation] = useState(initialSettings.autoSeatAllocation);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Sync form state if adminAccount updates
  useEffect(() => {
    if (adminAccount) {
      setAdminFullName(adminAccount.fullName);
      setAdminEmail(adminAccount.email);
      setAdminPhone(adminAccount.phone);
      if (adminAccount.department) setAdminDepartment(adminAccount.department);
      if (adminAccount.officeLocation) setAdminOfficeLocation(adminAccount.officeLocation);
    }
  }, [adminAccount]);

  // Flight creation form modal state
  const [isAddFlightOpen, setIsAddFlightOpen] = useState(false);
  const [newFlightData, setNewFlightData] = useState<Partial<Flight>>({
    flightNumber: 'AI-505',
    airline: 'Air India',
    originCode: 'DEL',
    destinationCode: 'BOM',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '10:30',
    arrivalTime: '12:45',
    duration: '2h 15m',
    aircraftType: 'Airbus A320neo',
    totalSeats: 30,
    availableSeats: 30,
    basePrice: 5200,
    businessMultiplier: 2.2,
    firstMultiplier: 3.5,
    status: 'On Time',
    terminal: 'T3',
    gate: '18B',
    stops: 0,
  });

  const [bookingSearch, setBookingSearch] = useState('');

  // Pull fresh records
  const stats = useMemo(() => db.getAnalyticsSummary(), [refreshKey]);
  const flights = useMemo(() => db.getFlights(), [refreshKey]);
  const bookings = useMemo(() => db.getBookings(), [refreshKey]);
  const users = useMemo(() => db.getUsers(), [refreshKey]);
  const airports = useMemo(() => db.getAirports(), []);
  const aircraftFleet = useMemo(() => db.getAircraft(), []);
  const analyticsSummary = useMemo(() => db.getAnalyticsSummary(), [refreshKey]);

  // Filtered bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (!bookingSearch) return true;
      const s = bookingSearch.toLowerCase();
      return (
        b.pnr.toLowerCase().includes(s) ||
        b.passenger.fullName.toLowerCase().includes(s) ||
        b.flightId.toLowerCase().includes(s)
      );
    });
  }, [bookings, bookingSearch]);

  // Handle Admin Login inside Dashboard if not logged in as admin
  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminAuthError(null);
    setIsAdminAuthLoading(true);

    try {
      const user = db.login(adminAuthUsername.trim(), adminAuthPassword);
      if (!user) {
        setAdminAuthError('Invalid credentials entered. Please check username or password.');
        setIsAdminAuthLoading(false);
        return;
      }

      if (user.role !== 'admin') {
        setAdminAuthError(`Account "@${user.username}" is registered as "${user.role.toUpperCase()}". Only accounts with Administrator privileges can access this panel.`);
        setIsAdminAuthLoading(false);
        return;
      }

      // Recognized authorized administrator!
      onAdminLoginSuccess?.(user);
      setIsAdminAuthLoading(false);
    } catch (err: any) {
      setAdminAuthError(err.message || 'Authentication error.');
      setIsAdminAuthLoading(false);
    }
  };

  // Handle Save Admin Details & System Settings
  const handleSaveAdminSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);
    setIsSavingSettings(true);

    if (!adminFullName.trim() || !adminEmail.trim()) {
      setSaveErrorMsg('Administrator Full Name and Email Address are required.');
      setIsSavingSettings(false);
      return;
    }

    try {
      const targetUserId = currentUser?.id || adminAccount?.id || 'USR-003';

      // 1. Update user profile in local database
      const updatedUser = db.updateUserProfile(targetUserId, {
        fullName: adminFullName.trim(),
        email: adminEmail.trim().toLowerCase(),
        phone: adminPhone.trim(),
        department: adminDepartment.trim(),
        officeLocation: adminOfficeLocation.trim(),
        ...(adminNewPassword ? { password: adminNewPassword } : {})
      });

      // 2. Update system operational settings in local database
      db.updateSystemSettings({
        airlineName: airlineName.trim(),
        announcementNotice: announcementNotice.trim(),
        currency: currency.trim(),
        maxCheckinBaggageKg: Number(maxCheckinBaggageKg),
        maxCabinBaggageKg: Number(maxCabinBaggageKg),
        bookingBufferMinutes: Number(bookingBufferMinutes),
        autoSeatAllocation: !!autoSeatAllocation,
        department: adminDepartment.trim(),
        officeLocation: adminOfficeLocation.trim(),
      });

      // 3. Synchronize with local Flask backend
      await apiService.updateAdminSettings({
        userId: targetUserId,
        id: targetUserId,
        fullName: adminFullName.trim(),
        name: adminFullName.trim(),
        email: adminEmail.trim().toLowerCase(),
        phone: adminPhone.trim(),
        department: adminDepartment.trim(),
        office: adminOfficeLocation.trim(),
        ...(adminNewPassword ? { password: adminNewPassword } : {})
      }).catch(() => {});

      // 4. Update parent application state so header & nav reflect changes immediately
      if (onUpdateUser && updatedUser) {
        onUpdateUser(updatedUser);
      }

      setAdminNewPassword('');
      setSaveSuccessMsg('Administrator details and airline system settings have been saved and persisted successfully!');
      setRefreshKey(prev => prev + 1);
      setTimeout(() => setSaveSuccessMsg(null), 4000);
    } catch (err: any) {
      setSaveErrorMsg(err.message || 'Failed to save admin settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Handle create new flight
  const handleCreateFlight = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      db.createFlight(newFlightData as any);
      setIsAddFlightOpen(false);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to create flight');
    }
  };

  // Handle delete flight
  const handleDeleteFlight = (flightId: string) => {
    if (confirm(`Are you sure you want to remove flight ${flightId}? This will delete the flight record.`)) {
      db.deleteFlight(flightId);
      setRefreshKey(prev => prev + 1);
    }
  };

  // Handle change user role
  const handleUpdateRole = (userId: string, newRole: User['role']) => {
    try {
      db.updateUserRole(userId, newRole);
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  // ACCESS GATE: If not logged in as administrator, show the dedicated Administrator Login Portal
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto py-8">
        <div className="bg-white rounded-3xl border border-purple-200 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 p-6 text-white text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center mx-auto mb-3 text-white shadow-lg shadow-purple-500/25">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span className="inline-block px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold uppercase tracking-wider mb-1">
              Restricted Airline Access
            </span>
            <h2 className="text-xl font-black tracking-tight">Administrator Authentication</h2>
            <p className="text-xs text-slate-300 mt-1">
              Sign in with your authorized airline administrator credentials to access system control and flight management.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-4">
            {adminAuthError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{adminAuthError}</span>
              </div>
            )}

            <form onSubmit={handleAdminAuthSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  Admin Username or Email Address *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={adminAuthUsername}
                    onChange={e => setAdminAuthUsername(e.target.value)}
                    placeholder="e.g. admin or admin@airline.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  Admin Password *
                </label>
                <div className="relative">
                  <input
                    type={showAdminAuthPassword ? 'text' : 'password'}
                    required
                    value={adminAuthPassword}
                    onChange={e => setAdminAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowAdminAuthPassword(!showAdminAuthPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showAdminAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isAdminAuthLoading}
                className="w-full py-3 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-400 text-white rounded-xl font-bold text-xs shadow-md shadow-purple-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isAdminAuthLoading ? 'Authenticating...' : 'Enter Admin Control Center'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Fill Helper */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setAdminAuthUsername('admin');
                  setAdminAuthPassword('password123');
                  setAdminAuthError(null);
                }}
                className="w-full py-2 bg-purple-50 hover:bg-purple-100/70 border border-purple-200 text-purple-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>1-Click Fill Authorized Admin Account (admin / password123)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-purple-800/40">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            System Administration & Analytics
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1">
            Manage commercial flight schedules, reservation ledgers, passenger manifest, and fleet configuration.
          </p>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Flights</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Plane className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalFlights}</p>
          <span className="text-[10px] text-slate-400">Domestic & Intl Routes</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Bookings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Ticket className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalBookings}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">{stats.confirmedBookings} active reservations</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Gross Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
          <span className="text-[10px] text-indigo-600 font-semibold">Total confirmed bookings</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Cancellations</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalCancellations}</p>
          <span className="text-[10px] text-red-500 font-semibold">Seats released to pool</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active Users</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{stats.totalUsers}</p>
          <span className="text-[10px] text-purple-600 font-semibold">Customers, Staff, Admin</span>
        </div>

      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 text-xs font-bold overflow-x-auto">
        {[
          { id: 'overview', label: 'Dashboard Overview' },
          { id: 'analytics', label: 'Analytics Dashboard' },
          { id: 'flights', label: `Flights (${flights.length})` },
          { id: 'bookings', label: `Bookings (${bookings.length})` },
          { id: 'users', label: `Users (${users.length})` },
          { id: 'aircraft', label: 'Aircraft & Routes' },
          { id: 'settings', label: 'Admin Profile & Settings' },
        ].map(t => (
          <button
            key={t.id}
            id={`admin-tab-${t.id}`}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Bookings Widget */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Recent Reservations</h3>
              <button
                onClick={() => setActiveTab('bookings')}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                View all →
              </button>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {bookings.slice(0, 5).map(b => (
                <div key={b.pnr} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{b.pnr}</span>
                      <span className="font-medium text-slate-700">{b.passenger.fullName}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Flight {b.flightId} • Seat {b.seatNumber} ({b.cabinClass})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-slate-900 block">₹{b.totalAmount.toLocaleString()}</span>
                    <span className={`text-[10px] font-bold uppercase ${
                      b.bookingStatus === 'CONFIRMED' ? 'text-emerald-600' :
                      b.bookingStatus === 'CHECKED_IN' ? 'text-blue-600' : 'text-red-500'
                    }`}>
                      {b.bookingStatus}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & System Info */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              Administrative Quick Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setActiveTab('flights');
                  setIsAddFlightOpen(true);
                }}
                className="p-3.5 bg-blue-50 hover:bg-blue-100/70 border border-blue-200 rounded-xl text-left transition-colors"
              >
                <Plus className="w-5 h-5 text-blue-600 mb-1" />
                <p className="font-bold text-xs text-blue-900">Add New Flight</p>
                <p className="text-[10px] text-blue-600">Schedule a new domestic or international route</p>
              </button>

              <button
                onClick={() => setActiveTab('bookings')}
                className="p-3.5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl text-left transition-colors"
              >
                <Ticket className="w-5 h-5 text-emerald-600 mb-1" />
                <p className="font-bold text-xs text-emerald-900">Manage Bookings</p>
                <p className="text-[10px] text-emerald-600">Review reservations, status, and tickets</p>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className="p-3.5 bg-purple-50 hover:bg-purple-100/70 border border-purple-200 rounded-xl text-left transition-colors sm:col-span-2"
              >
                <ShieldCheck className="w-5 h-5 text-purple-600 mb-1" />
                <p className="font-bold text-xs text-purple-900">Admin Profile & Settings</p>
                <p className="text-[10px] text-purple-600">Edit and save administrator credentials, department, and system policies</p>
              </button>
            </div>

            {/* Travel Analytics Widget */}
            <div className="p-4 bg-gradient-to-br from-blue-50 to-teal-50/50 rounded-xl border border-blue-200 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800">Operational Analytics</span>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Database Metrics</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className="text-[11px] font-bold text-blue-700 hover:underline cursor-pointer"
                >
                  Open Dashboard →
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block text-[10px]">Total Flights</span>
                  <span className="font-bold text-slate-900">{flights.length} flights</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block text-[10px]">Total Bookings</span>
                  <span className="font-bold text-slate-900">{bookings.length} records</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block text-[10px]">Total Revenue</span>
                  <span className="font-bold text-emerald-600">₹{analyticsSummary.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                  <span className="text-slate-500 block text-[10px]">Seat Occupancy</span>
                  <span className="font-bold text-indigo-600">{analyticsSummary.fleetOccupancyRate}%</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-700 block">System Operational Status:</span>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Skyline Reservation Booking System active. Real-time seat allocation, passenger check-in verification, and booking management running smoothly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <AnalyticsDashboard onOpenBookingTicket={onOpenBookingTicket} />
      )}

      {/* TAB 2: FLIGHTS MANAGEMENT */}
      {activeTab === 'flights' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Commercial Flight Schedules</h3>
              <p className="text-xs text-slate-500">Add, edit departure schedules, or remove flights</p>
            </div>

            <button
              onClick={() => setIsAddFlightOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Flight</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Flight No</th>
                  <th className="p-3">Airline</th>
                  <th className="p-3">Route</th>
                  <th className="p-3">Timing</th>
                  <th className="p-3">Aircraft</th>
                  <th className="p-3">Base Price</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {flights.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-blue-700">{f.flightNumber}</td>
                    <td className="p-3 font-semibold text-slate-800">{f.airline}</td>
                    <td className="p-3 font-bold text-slate-900">{f.originCode} → {f.destinationCode}</td>
                    <td className="p-3 text-slate-600">{f.departureTime} - {f.arrivalTime} ({f.duration})</td>
                    <td className="p-3 text-slate-500">{f.aircraftType}</td>
                    <td className="p-3 font-extrabold text-slate-900">₹{f.basePrice.toLocaleString()}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {f.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteFlight(f.id)}
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete flight"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BOOKINGS LEDGER */}
      {activeTab === 'bookings' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Passenger Reservation Ledger</h3>
              <p className="text-xs text-slate-500">Inspect all reservations across all commercial flights</p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={e => setBookingSearch(e.target.value)}
                placeholder="Search PNR, passenger..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">PNR</th>
                  <th className="p-3">Passenger</th>
                  <th className="p-3">Flight & Seat</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map(b => (
                  <tr key={b.pnr} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-blue-700">{b.pnr}</td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{b.passenger.fullName}</p>
                      <p className="text-[11px] text-slate-400">{b.passenger.phone}</p>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {b.flightId} • Seat {b.seatNumber} ({b.cabinClass})
                    </td>
                    <td className="p-3 text-slate-600">{b.travelDate}</td>
                    <td className="p-3 font-extrabold text-slate-900">₹{b.totalAmount.toLocaleString()}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        b.bookingStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                        b.bookingStatus === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onOpenBookingTicket(b.pnr)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold"
                      >
                        Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-base">Registered System Users</h3>
            <p className="text-xs text-slate-500">Overview of customers, ground agents, and administrators</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">User ID</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Member Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono text-slate-500">{u.id}</td>
                    <td className="p-3 font-bold text-slate-900">{u.fullName}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'staff' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AIRCRAFT & ROUTES */}
      {activeTab === 'aircraft' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Fleet */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
              Commercial Aircraft Fleet
            </h3>
            <div className="space-y-3">
              {aircraftFleet.map(ac => (
                <div key={ac.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-900 text-sm">{ac.model}</span>
                    <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">
                      {ac.totalSeats} Total Seats
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{ac.manufacturer} • Tail: {ac.registration}</p>
                  <p className="text-[11px] text-slate-600 font-mono">
                    Layout: {ac.economySeats} Economy | {ac.businessSeats} Business | {ac.firstSeats} First Class
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Airports & Hubs */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">
              Serviced Airport Stations
            </h3>
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {airports.map(ap => (
                <div key={ap.code} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-700 mr-2">{ap.code}</span>
                    <span className="font-bold text-slate-900">{ap.city}</span>
                    <p className="text-[11px] text-slate-400">{ap.name}</p>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold uppercase">{ap.country}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ADMIN PROFILE & SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                <span>Authorized Administrator Settings</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                Administrator Profile & System Configuration
              </h3>
              <p className="text-xs text-slate-500">
                Update your authorized administrator account details, security credentials, and commercial airline operational rules.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="font-bold text-slate-900">@{adminAccount?.username || 'admin'}</p>
                <p className="text-[10px] text-slate-400">ID: {adminAccount?.id || 'USR-003'} • Role: Admin</p>
              </div>
            </div>
          </div>

          {/* Alert Messages */}
          {saveSuccessMsg && (
            <div id="admin-settings-success-alert" className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-2xl flex items-center gap-3 animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="font-semibold">{saveSuccessMsg}</div>
            </div>
          )}

          {saveErrorMsg && (
            <div id="admin-settings-error-alert" className="p-4 bg-red-50 border border-red-300 text-red-800 text-xs rounded-2xl flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="font-semibold">{saveErrorMsg}</div>
            </div>
          )}

          <form onSubmit={handleSaveAdminSettings} className="space-y-6">
            
            {/* Section 1: Administrator Profile Details */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800">
                <ShieldAlert className="w-4 h-4 text-purple-600" />
                <span>Section 1: Administrator Profile & Contact Credentials</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Administrator Full Name *
                  </label>
                  <div className="relative">
                    <input
                      id="admin-fullname-input"
                      type="text"
                      required
                      value={adminFullName}
                      onChange={e => setAdminFullName(e.target.value)}
                      placeholder="e.g. System Administrator"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Displayed on airline operations manifest and admin audit logs</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Official Admin Email Address *
                  </label>
                  <div className="relative">
                    <input
                      id="admin-email-input"
                      type="email"
                      required
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="admin@airline.com"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Used for administrative login and critical system notifications</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Phone / Operations Contact *
                  </label>
                  <div className="relative">
                    <input
                      id="admin-phone-input"
                      type="text"
                      required
                      value={adminPhone}
                      onChange={e => setAdminPhone(e.target.value)}
                      placeholder="+91 99999 00000"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Operations Department
                  </label>
                  <div className="relative">
                    <input
                      id="admin-department-input"
                      type="text"
                      value={adminDepartment}
                      onChange={e => setAdminDepartment(e.target.value)}
                      placeholder="e.g. Flight Operations & Revenue Control"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                    />
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Office / Airport Station Location
                  </label>
                  <div className="relative">
                    <input
                      id="admin-office-input"
                      type="text"
                      value={adminOfficeLocation}
                      onChange={e => setAdminOfficeLocation(e.target.value)}
                      placeholder="e.g. Terminal 3, IGI Airport, New Delhi"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Update Admin Password (Optional)
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password-input"
                      type="password"
                      value={adminNewPassword}
                      onChange={e => setAdminNewPassword(e.target.value)}
                      placeholder="Leave blank to keep existing password"
                      className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-2xs"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Default password is: <code className="bg-slate-200 px-1 py-0.5 rounded font-mono">password123</code></p>
                </div>
              </div>
            </div>

            {/* Section 2: Airline System & Operational Settings */}
            <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Section 2: Airline Commercial Policies & Operational Rules</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Airline System Name
                  </label>
                  <input
                    type="text"
                    required
                    value={airlineName}
                    onChange={e => setAirlineName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Operational Currency
                  </label>
                  <select
                    value={currency}
                    onChange={e => setCurrency(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                    <option value="USD ($)">USD ($) - US Dollar</option>
                    <option value="EUR (€)">EUR (€) - Euro</option>
                    <option value="GBP (£)">GBP (£) - British Pound</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Booking Buffer Before Departure (Mins)
                  </label>
                  <input
                    type="number"
                    min={30}
                    max={720}
                    value={bookingBufferMinutes}
                    onChange={e => setBookingBufferMinutes(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Check-in Baggage Allowance (Kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={maxCheckinBaggageKg}
                    onChange={e => setMaxCheckinBaggageKg(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Cabin Baggage Allowance (Kg)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={maxCabinBaggageKg}
                    onChange={e => setMaxCabinBaggageKg(Number(e.target.value))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                    Auto Seat Allocation Algorithm
                  </label>
                  <select
                    value={autoSeatAllocation ? 'true' : 'false'}
                    onChange={e => setAutoSeatAllocation(e.target.value === 'true')}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="true">Enabled (Auto-assign preferred seats)</option>
                    <option value="false">Manual Selection Only</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                  System-Wide Passenger Announcement / Notice
                </label>
                <textarea
                  rows={2}
                  value={announcementNotice}
                  onChange={e => setAnnouncementNotice(e.target.value)}
                  placeholder="e.g. Skyline Reservations operational. Web check-in opens 48 hours before flight departure."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Submit & Reset Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  if (adminAccount) {
                    setAdminFullName(adminAccount.fullName);
                    setAdminEmail(adminAccount.email);
                    setAdminPhone(adminAccount.phone);
                    if (adminAccount.department) setAdminDepartment(adminAccount.department);
                    if (adminAccount.officeLocation) setAdminOfficeLocation(adminAccount.officeLocation);
                  }
                  const s = db.getSystemSettings();
                  setAirlineName(s.airlineName);
                  setAnnouncementNotice(s.announcementNotice);
                  setCurrency(s.currency);
                  setMaxCheckinBaggageKg(s.maxCheckinBaggageKg);
                  setMaxCabinBaggageKg(s.maxCabinBaggageKg);
                  setBookingBufferMinutes(s.bookingBufferMinutes);
                  setAutoSeatAllocation(s.autoSeatAllocation);
                  setAdminNewPassword('');
                  setSaveErrorMsg(null);
                  setSaveSuccessMsg(null);
                }}
                className="px-4 py-2.5 border border-slate-300 text-slate-600 hover:bg-slate-50 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset to Saved Values</span>
              </button>

              <button
                id="save-admin-settings-btn"
                type="submit"
                disabled={isSavingSettings}
                className="w-full sm:w-auto px-8 py-3.5 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-400 text-white rounded-xl font-bold text-xs shadow-lg shadow-purple-700/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSavingSettings ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving Administrator Details & Operational Settings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Administrator Details & System Settings</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ADD FLIGHT MODAL */}
      {isAddFlightOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-slate-900 text-base">Schedule New Commercial Flight</h3>
            
            <form onSubmit={handleCreateFlight} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Flight Number *</label>
                  <input
                    type="text"
                    required
                    value={newFlightData.flightNumber}
                    onChange={e => setNewFlightData({ ...newFlightData, flightNumber: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Airline *</label>
                  <input
                    type="text"
                    required
                    value={newFlightData.airline}
                    onChange={e => setNewFlightData({ ...newFlightData, airline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Origin Airport *</label>
                  <select
                    value={newFlightData.originCode}
                    onChange={e => setNewFlightData({ ...newFlightData, originCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    {airports.map(a => (
                      <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination Airport *</label>
                  <select
                    value={newFlightData.destinationCode}
                    onChange={e => setNewFlightData({ ...newFlightData, destinationCode: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold"
                  >
                    {airports.map(a => (
                      <option key={a.code} value={a.code}>{a.city} ({a.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departure Time</label>
                  <input
                    type="time"
                    required
                    value={newFlightData.departureTime}
                    onChange={e => setNewFlightData({ ...newFlightData, departureTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Arrival Time</label>
                  <input
                    type="time"
                    required
                    value={newFlightData.arrivalTime}
                    onChange={e => setNewFlightData({ ...newFlightData, arrivalTime: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    value={newFlightData.duration}
                    onChange={e => setNewFlightData({ ...newFlightData, duration: e.target.value })}
                    placeholder="2h 15m"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-2 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Economy Base Price (₹) *</label>
                  <input
                    type="number"
                    min={1000}
                    required
                    value={newFlightData.basePrice}
                    onChange={e => setNewFlightData({ ...newFlightData, basePrice: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Aircraft Model</label>
                  <select
                    value={newFlightData.aircraftType}
                    onChange={e => setNewFlightData({ ...newFlightData, aircraftType: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2"
                  >
                    <option value="Airbus A320neo">Airbus A320neo</option>
                    <option value="Boeing 737 MAX 8">Boeing 737 MAX 8</option>
                    <option value="Airbus A321">Airbus A321</option>
                    <option value="Boeing 787-9 Dreamliner">Boeing 787-9 Dreamliner</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddFlightOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-2xs"
                >
                  Create & Seed Seats
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
