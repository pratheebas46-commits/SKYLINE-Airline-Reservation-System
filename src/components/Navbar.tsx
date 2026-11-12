import React, { useState } from 'react';
import {
  Plane,
  Home,
  Search,
  Ticket,
  CheckCircle2,
  Activity,
  User as UserIcon,
  ShieldCheck,
  Briefcase,
  Bell,
  LogOut,
  ChevronDown,
  Menu,
  X,
  HelpCircle,
  BarChart3,
  LayoutDashboard,
  Bot,
  ShieldAlert
} from 'lucide-react';
import { User, AppNotification } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeView: string;
  setActiveView: (view: string) => void;
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenScanner?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  setActiveView,
  notifications,
  onOpenNotifications,
  onOpenAuth,
  onLogout,
  onOpenScanner,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleNavClick = (view: string) => {
    setActiveView(view);
    setMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md no-print border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div
            id="brand-logo-btn"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:bg-blue-500 transition-colors">
              <Plane className="w-5 h-5 -rotate-45 transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">SKYLINE</span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">Domestic Airline Portal</p>
            </div>
          </div>

          {/* Right Actions: Notifications + User Account/Auth + Three Horizontal Lines Menu (Always) */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Notifications Bell */}
            <button
              id="notifications-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="System Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Account OR Login / Register Buttons */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="user-menu-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-xl border border-slate-700 transition-colors text-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-semibold leading-tight text-white">{currentUser.fullName.split(' ')[0]}</p>
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${
                      currentUser.role === 'admin' ? 'text-emerald-400' :
                      currentUser.role === 'staff' ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      {currentUser.role}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-700">
                      <p className="text-[11px] text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{currentUser.fullName}</p>
                      <p className="text-xs text-slate-400 truncate">@{currentUser.username}</p>
                    </div>

                    {currentUser.role === 'customer' && (
                      <button
                        onClick={() => handleNavClick('dashboard')}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2.5"
                      >
                        <LayoutDashboard className="w-4 h-4 text-blue-400" />
                        <span>Customer Dashboard</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleNavClick('profile')}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2.5"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>My Profile & Preferences</span>
                    </button>

                    {currentUser.role === 'customer' && (
                      <button
                        onClick={() => handleNavClick('bookings')}
                        className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2.5"
                      >
                        <Ticket className="w-4 h-4 text-indigo-400" />
                        <span>My Bookings</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleNavClick('analytics')}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2.5"
                    >
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <span>Fleet & Booking Analytics</span>
                    </button>

                    <div className="border-t border-slate-700 my-1"></div>

                    <button
                      onClick={() => {
                        onLogout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10 flex items-center gap-2.5"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => handleNavClick('login')}
                  className="px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
                >
                  Login
                </button>
                <button
                  id="nav-register-btn"
                  onClick={() => handleNavClick('register')}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors shadow-sm"
                >
                  Register
                </button>
              </div>
            )}

            {/* THREE HORIZONTAL LINES (MENU BUTTON - ALWAYS VISIBLE ON BOTH FULLSCREEN & MOBILE) */}
            <button
              id="main-hamburger-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-700/60"
              title="Navigation Menu"
              aria-label="Navigation Menu"
            >
              {menuOpen ? <X className="w-5 h-5 text-red-400" /> : <Menu className="w-5 h-5 text-blue-400" />}
            </button>

          </div>
        </div>
      </div>

      {/* DROPDOWN / DRAWER MENU OPENED BY THE THREE HORIZONTAL LINES (RESPONSIVE FOR ALL SCREEN SIZES) */}
      {menuOpen && (
        <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="max-w-7xl mx-auto space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <span>Main Services & Travel Navigation</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-slate-400 hover:text-white flex items-center gap-1 normal-case text-xs"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              
              {/* Home */}
              <button
                onClick={() => handleNavClick('home')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  activeView === 'home' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Home className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <p className="font-bold">Home Portal</p>
                  <p className="text-[10px] text-slate-400">Main flight reservation portal</p>
                </div>
              </button>

              {/* Search Flights */}
              <button
                onClick={() => handleNavClick('search')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  activeView === 'search' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Search className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <p className="font-bold">Search Flights</p>
                  <p className="text-[10px] text-slate-400">Timetable, schedules & fares</p>
                </div>
              </button>

              {/* Flight Booking */}
              <button
                id="nav-chatbot-booking-btn"
                onClick={() => handleNavClick('chatbot')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  activeView === 'chatbot' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Plane className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <p className="font-bold">Flight Booking ChatBot</p>
                  <p className="text-[10px] text-slate-400">Chat flight reservation</p>
                </div>
              </button>

              {/* My Bookings */}
              <button
                onClick={() => {
                  if (currentUser) handleNavClick('bookings');
                  else handleNavClick('login');
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  activeView === 'bookings' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Ticket className="w-4 h-4 text-indigo-400 shrink-0" />
                <div>
                  <p className="font-bold">My Bookings</p>
                  <p className="text-[10px] text-slate-400">View & download PDF tickets</p>
                </div>
              </button>

              {/* Flight Status */}
              <button
                onClick={() => handleNavClick('status')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  activeView === 'status' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <p className="font-bold">Flight Status</p>
                  <p className="text-[10px] text-slate-400">Schedule timetable & departure gates</p>
                </div>
              </button>

              {/* Web Check-in */}
              <button
                onClick={() => handleNavClick('checkin')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  activeView === 'checkin' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="font-bold">Web Check-in</p>
                  <p className="text-[10px] text-slate-400">Seat selection & boarding pass</p>
                </div>
              </button>

              {/* Help & Support */}
              <button
                onClick={() => handleNavClick('help')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  activeView === 'help' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <div>
                  <p className="font-bold">Help & Support</p>
                  <p className="text-[10px] text-slate-400">Baggage rules & passenger FAQs</p>
                </div>
              </button>

              {/* Customer Dashboard (when logged in) */}
              {currentUser && currentUser.role === 'customer' && (
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                    activeView === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <p className="font-bold">Customer Dashboard</p>
                    <p className="text-[10px] text-slate-400">Trips & AI recommendations</p>
                  </div>
                </button>
              )}

              {/* Verify Ticket QR Scanner */}
              {onOpenScanner && (
                <button
                  onClick={() => {
                    onOpenScanner();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-400 hover:bg-slate-800 transition-colors text-left border border-emerald-500/20"
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">Verify Ticket QR</p>
                    <p className="text-[10px] text-emerald-300/70">Scan & validate passenger PNR</p>
                  </div>
                </button>
              )}

              {/* Fleet & Booking Analytics */}
              <button
                onClick={() => handleNavClick('analytics')}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  activeView === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-200 hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <p className="font-bold">Fleet Analytics</p>
                  <p className="text-[10px] text-slate-400">Occupancy & revenue trends</p>
                </div>
              </button>

              {/* Admin Portal (when not logged in) */}
              {!currentUser && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                    activeView === 'admin' ? 'bg-purple-600 text-white' : 'text-purple-300 hover:bg-slate-800'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <p className="font-bold">Admin Portal</p>
                    <p className="text-[10px] text-purple-300/70">Administrator login & system control</p>
                  </div>
                </button>
              )}

              {/* Staff Portal */}
              {(currentUser?.role === 'staff' || currentUser?.role === 'admin') && (
                <button
                  onClick={() => handleNavClick('staff')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                    activeView === 'staff' ? 'bg-amber-600 text-white' : 'text-amber-400 hover:bg-slate-800'
                  }`}
                >
                  <Briefcase className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">Staff Portal</p>
                    <p className="text-[10px] text-amber-300/70">Passenger & flight operations</p>
                  </div>
                </button>
              )}

              {/* Admin Panel */}
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                    activeView === 'admin' ? 'bg-emerald-600 text-white' : 'text-emerald-400 hover:bg-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <div>
                    <p className="font-bold">Admin Panel</p>
                    <p className="text-[10px] text-emerald-300/70">System & user configuration</p>
                  </div>
                </button>
              )}

            </div>

          </div>
        </div>
      )}
    </header>
  );
};
