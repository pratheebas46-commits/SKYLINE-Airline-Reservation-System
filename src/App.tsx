import React, { useState, useEffect, useMemo } from 'react';
import { Plane } from 'lucide-react';
import { User, Flight, CabinClass, AppNotification, UserRole, ConcessionType, Passenger, Seat } from './types';
import { db } from './services/db';

// Modular Components
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { RegistrationPage } from './components/RegistrationPage';
import { CustomerDashboard } from './components/CustomerDashboard';
import { FlightSearch } from './components/FlightSearch';
import { BookingFlow } from './components/BookingFlow';
import { MyBookings } from './components/MyBookings';
import { WebCheckIn } from './components/WebCheckIn';
import { FlightStatusTracker } from './components/FlightStatusTracker';
import { AIChatbotBooking } from './components/AIChatbotBooking';
import { HelpAndSupport } from './components/HelpAndSupport';
import { StaffDashboard } from './components/StaffDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { UserProfile } from './components/UserProfile';
import { ETicketModal } from './components/ETicketModal';
import { AuthModal } from './components/AuthModal';
import { NotificationModal } from './components/NotificationModal';
import { QRScannerModal } from './components/QRScannerModal';

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(() => db.getCurrentUser());

  // Active navigation view: 'home' | 'login' | 'register' | 'dashboard' | 'search' | 'booking' | 'bookings' | 'checkin' | 'status' | 'help' | 'staff' | 'admin' | 'analytics' | 'profile'
  const [activeView, setActiveView] = useState<string>('home');

  // Active booking flight selection
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
  const [selectedCabinClass, setSelectedCabinClass] = useState<CabinClass>('Economy');
  const [selectedConcessionType, setSelectedConcessionType] = useState<ConcessionType>('REGULAR');
  const [bookingPrefilledPassenger, setBookingPrefilledPassenger] = useState<Partial<Passenger> | undefined>(undefined);
  const [bookingPrefilledSeat, setBookingPrefilledSeat] = useState<Seat | null | undefined>(undefined);
  const [bookingInitialStep, setBookingInitialStep] = useState<number>(1);
  const [bookingMealPreference, setBookingMealPreference] = useState<string | undefined>(undefined);
  const [bookingConcessionId, setBookingConcessionId] = useState<string | undefined>(undefined);

  // Modals state
  const [activeTicketPnr, setActiveTicketPnr] = useState<string | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // In-app Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const loadNotifications = () => {
    setNotifications(db.getNotifications(currentUser?.id || ''));
  };

  useEffect(() => {
    loadNotifications();
  }, [currentUser]);

  // Sync user state with db
  const handleLoginSuccess = (user: User, redirectView?: string) => {
    setCurrentUser(user);
    loadNotifications();
    setIsAuthOpen(false);

    if (redirectView) {
      setActiveView(redirectView);
    } else if (user.role === 'customer') {
      setActiveView('dashboard');
    } else if (user.role === 'staff') {
      setActiveView('staff');
    } else if (user.role === 'admin') {
      setActiveView('admin');
    } else {
      setActiveView('dashboard');
    }
  };

  const handleLogout = () => {
    db.logout();
    setCurrentUser(null);
    setActiveView('home');
    loadNotifications();
  };

  // Handle flight selection from search or recommendations or automated chatbot
  const handleSelectFlightToBook = (
    flight: Flight,
    cabinClass: CabinClass,
    tripType: 'oneway' | 'roundtrip',
    concessionType: ConcessionType,
    prefilledPassenger?: Partial<Passenger>,
    preselectedSeat?: Seat | null,
    startAtStep?: number,
    mealPreference?: string,
    concessionId?: string
  ) => {
    setSelectedFlight(flight);
    setSelectedCabinClass(cabinClass);
    setSelectedConcessionType(concessionType);
    setBookingPrefilledPassenger(prefilledPassenger);
    setBookingPrefilledSeat(preselectedSeat);
    setBookingInitialStep(startAtStep || 1);
    setBookingMealPreference(mealPreference);
    setBookingConcessionId(concessionId);
    setActiveView('booking');
  };

  // Handle booking completion
  const handleBookingCompleted = (pnr: string) => {
    setActiveTicketPnr(pnr);
    loadNotifications();
    setActiveView('bookings');
  };

  // Check-in from My Bookings or other views
  const handleCheckInBooking = (pnr: string) => {
    setActiveView('checkin');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* Primary Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        setActiveView={setActiveView}
        notifications={notifications}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenAuth={() => setActiveView('login')}
        onLogout={handleLogout}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* VIEW 0: HOME PAGE (DEFAULT ENTRY) */}
        {activeView === 'home' && (
          <HomePage
            onNavigate={setActiveView}
            currentUser={currentUser}
          />
        )}

        {/* VIEW: LOGIN PORTAL */}
        {activeView === 'login' && (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigate={setActiveView}
          />
        )}

        {/* VIEW: REGISTRATION PORTAL */}
        {activeView === 'register' && (
          <RegistrationPage
            onRegisterSuccess={handleLoginSuccess}
            onNavigate={setActiveView}
          />
        )}

        {/* VIEW: CUSTOMER DASHBOARD */}
        {activeView === 'dashboard' && (
          currentUser ? (
            <CustomerDashboard
              currentUser={currentUser}
              onViewTicket={(pnr) => setActiveTicketPnr(pnr)}
              onManageBooking={(pnr) => setActiveTicketPnr(pnr)}
              onCheckIn={handleCheckInBooking}
              onNavigate={setActiveView}
              onSelectFlightToBook={handleSelectFlightToBook}
              onUpdateUser={(updated) => setCurrentUser(updated)}
            />
          ) : (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigate={setActiveView}
            />
          )
        )}

        {/* VIEW 1: FLIGHT SEARCH */}
        {activeView === 'search' && (
          <FlightSearch
            onSelectFlightToBook={handleSelectFlightToBook}
            onOpenChatbot={() => setActiveView('chatbot')}
          />
        )}

        {/* VIEW: AI FLIGHT BOOKING CHATBOT ASSISTANT */}
        {activeView === 'chatbot' && (
          <AIChatbotBooking
            currentUser={currentUser}
            onSelectFlightToBook={handleSelectFlightToBook}
            onNavigateToManual={() => setActiveView('search')}
          />
        )}

        {/* VIEW 2: BOOKING WORKFLOW */}
        {activeView === 'booking' && selectedFlight && (
          <BookingFlow
            flight={selectedFlight}
            initialCabinClass={selectedCabinClass}
            initialConcessionType={selectedConcessionType}
            initialPassenger={bookingPrefilledPassenger}
            initialSeat={bookingPrefilledSeat}
            initialStep={bookingInitialStep}
            initialMealPreference={bookingMealPreference}
            initialConcessionIdNumber={bookingConcessionId}
            currentUser={currentUser}
            onCancel={() => {
              if (bookingInitialStep === 3) {
                setActiveView('chatbot');
              } else {
                setActiveView('search');
              }
            }}
            onBookingCompleted={handleBookingCompleted}
            onRequireLogin={() => setActiveView('login')}
            onUserLoggedIn={(user) => {
              setCurrentUser(user);
              loadNotifications();
            }}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        )}

        {/* VIEW 3: MY BOOKINGS & CANCELLATIONS */}
        {activeView === 'bookings' && (
          <MyBookings
            currentUser={currentUser}
            onViewTicket={(pnr) => setActiveTicketPnr(pnr)}
            onCheckInBooking={handleCheckInBooking}
            onBookFlightClick={() => setActiveView('search')}
          />
        )}

        {/* VIEW 4: WEB CHECK-IN & BOARDING PASS */}
        {activeView === 'checkin' && (
          <WebCheckIn
            currentUser={currentUser}
            onOpenBookingTicket={(pnr) => setActiveTicketPnr(pnr)}
          />
        )}

        {/* VIEW 5: FLIGHT STATUS TRACKER */}
        {activeView === 'status' && (
          <FlightStatusTracker />
        )}

        {/* VIEW: HELP & SUPPORT */}
        {activeView === 'help' && (
          <HelpAndSupport onNavigate={setActiveView} />
        )}

        {/* VIEW 6: AIRLINE STAFF PORTAL */}
        {activeView === 'staff' && (
          <StaffDashboard
            onOpenBookingTicket={(pnr) => setActiveTicketPnr(pnr)}
          />
        )}

        {/* VIEW 7: SYSTEM ADMINISTRATOR CONTROL */}
        {activeView === 'admin' && (
          <AdminDashboard
            currentUser={currentUser}
            onOpenBookingTicket={(pnr) => setActiveTicketPnr(pnr)}
            onAdminLoginSuccess={(adminUser) => {
              setCurrentUser(adminUser);
              setActiveView('admin');
            }}
            onUpdateUser={(updated) => setCurrentUser(updated)}
          />
        )}

        {/* VIEW: ANALYTICS DASHBOARD */}
        {activeView === 'analytics' && (
          <AnalyticsDashboard
            onOpenBookingTicket={(pnr) => setActiveTicketPnr(pnr)}
          />
        )}

        {/* VIEW 8: CUSTOMER PROFILE & SAVED TRAVELERS */}
        {activeView === 'profile' && (
          currentUser ? (
            <UserProfile
              currentUser={currentUser}
              onUpdateUser={(updated) => setCurrentUser(updated)}
              onViewBookings={() => setActiveView('bookings')}
            />
          ) : (
            <LoginPage
              onLoginSuccess={handleLoginSuccess}
              onNavigate={setActiveView}
            />
          )
        )}

      </main>

      {/* E-Ticket Modal with Local QR Code */}
      <ETicketModal
        pnr={activeTicketPnr}
        onClose={() => setActiveTicketPnr(null)}
      />

      {/* Ticket QR Scanner Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onOpenTicketModal={(pnr) => setActiveTicketPnr(pnr)}
      />

      {/* Authentication Modal (Fallback if triggered from deep workflows) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* In-system Notification Modal */}
      <NotificationModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => {
          db.markNotificationAsRead(id);
          loadNotifications();
        }}
        onMarkAllAsRead={() => {
          if (currentUser) {
            db.markAllNotificationsAsRead(currentUser.id);
            loadNotifications();
          }
        }}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 no-print text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
              <Plane className="w-3.5 h-3.5 -rotate-45" />
            </div>
            <span className="font-bold text-slate-800">SKYLINE DOMESTIC AIRLINE RESERVATION SYSTEM</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-slate-600">
            <button onClick={() => setActiveView('home')} className="hover:text-blue-600">
              Home
            </button>
            <span>•</span>
            <button onClick={() => setActiveView('search')} className="hover:text-blue-600">
              Search Flights
            </button>
            <span>•</span>
            <button onClick={() => setActiveView('checkin')} className="hover:text-blue-600">
              Web Check-in
            </button>
            <span>•</span>
            <button onClick={() => setActiveView('status')} className="hover:text-blue-600">
              Flight Status
            </button>
            <span>•</span>
            <button onClick={() => setActiveView('help')} className="hover:text-blue-600">
              Help & Support
            </button>
            <span>•</span>
            <button onClick={() => setIsScannerOpen(true)} className="text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1">
              <span>Verify Ticket</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            © 2026 SKYLINE RESERVATION SYSTEM. Completely Offline & Self-Contained.
          </p>
        </div>
      </footer>

    </div>
  );
}
