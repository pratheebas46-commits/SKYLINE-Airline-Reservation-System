import React, { useState, useEffect } from 'react';
import {
  Plane,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  CreditCard,
  QrCode,
  ShieldCheck,
  User,
  Users,
  Armchair,
  FileText,
  Clock,
  Sparkles,
  Lock,
  Smartphone,
  Wallet,
  Printer,
  Download,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Database,
  Cpu,
  Link as LinkIcon,
  Save
} from 'lucide-react';
import { Flight, CabinClass, Passenger, Seat, User as AuthUser, ConcessionType } from '../types';
import { db } from '../services/db';
import { SeatMap } from './SeatMap';
import { generateTicketQRCode, generatePaymentQRCode } from '../utils/qr';
import { downloadTicketPDF } from '../utils/pdf';
import { connectWallet, recordBookingOnBlockchain, type BlockchainBookingResult } from '../services/blockchainService';

interface BookingFlowProps {
  flight: Flight;
  initialCabinClass: CabinClass;
  initialConcessionType?: ConcessionType;
  initialPassenger?: Partial<Passenger>;
  initialSeat?: Seat | null;
  initialStep?: number;
  initialMealPreference?: string;
  initialConcessionIdNumber?: string;
  currentUser: AuthUser | null;
  onCancel: () => void;
  onBookingCompleted: (pnr: string) => void;
  onRequireLogin: () => void;
  onUserLoggedIn?: (user: AuthUser) => void;
  onOpenScanner?: () => void;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  flight,
  initialCabinClass,
  initialConcessionType,
  initialPassenger,
  initialSeat,
  initialStep,
  initialMealPreference,
  initialConcessionIdNumber,
  currentUser,
  onCancel,
  onBookingCompleted,
  onRequireLogin,
  onUserLoggedIn,
  onOpenScanner,
}) => {
  // Step indicator: 1: Seat -> 2: Passenger -> 3: Review & Pay -> 4: Success
  const [currentStep, setCurrentStep] = useState<number>(initialStep || 1);
  const [cabinClass, setCabinClass] = useState<CabinClass>(initialCabinClass);
  const [concessionType, setConcessionType] = useState<ConcessionType>(initialConcessionType || 'REGULAR');
  const [concessionIdNumber, setConcessionIdNumber] = useState<string>(initialConcessionIdNumber || initialPassenger?.concessionId || '');
  const [mealPreference, setMealPreference] = useState<string>(initialMealPreference || initialPassenger?.mealPreference || 'Standard In-Flight Meal');
  const [freeInsurance, setFreeInsurance] = useState<boolean>(true);

  // Seat Selection
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(initialSeat || null);

  // Passenger form (strictly separated from customer login account)
  const [passenger, setPassenger] = useState<Passenger>({
    id: '',
    fullName: initialPassenger?.fullName || '',
    age: initialPassenger?.age || 28,
    gender: initialPassenger?.gender || 'Male',
    phone: initialPassenger?.phone || '',
    email: initialPassenger?.email || '',
    passportNumber: initialPassenger?.passportNumber || '',
    specialAssistance: initialPassenger?.specialAssistance || 'None',
  });

  const [savePassengerForFuture, setSavePassengerForFuture] = useState(false);
  const [isSavedTravellerClicked, setIsSavedTravellerClicked] = useState(false);

  // Saved passengers from profile (private to this customer)
  const [savedPassengers, setSavedPassengers] = useState<Passenger[]>(
    currentUser ? db.getSavedPassengers(currentUser.id) : []
  );

  // Explicit Save Traveller Handler
  const handleExplicitSaveTraveller = () => {
    if (!currentUser) {
      alert('Please sign in to save travellers to your account.');
      return;
    }
    if (!passenger.fullName.trim() || !passenger.phone.trim()) {
      alert('Please fill in passenger full name and mobile number first.');
      return;
    }
    try {
      db.savePassengerForUser(currentUser.id, passenger);
      setSavedPassengers(db.getSavedPassengers(currentUser.id));
      setIsSavedTravellerClicked(true);
      setTimeout(() => setIsSavedTravellerClicked(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save traveller');
    }
  };

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'Card' | 'UPI' | 'Wallet'>('UPI');
  const [upiPayTab, setUpiPayTab] = useState<'qr' | 'manual'>('qr');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('789');
  const [upiId, setUpiId] = useState('passenger@okaxis');
  const [walletName, setWalletName] = useState('PayTM Wallet');

  // QR Code States
  const [paymentQrUrl, setPaymentQrUrl] = useState<string>('');
  const [ticketQrUrl, setTicketQrUrl] = useState<string>('');
  const [paymentTimer, setPaymentTimer] = useState<number>(600); // 10 minutes
  const [copiedPnr, setCopiedPnr] = useState(false);

  // Payment simulation state
  const [simulateOutcome, setSimulateOutcome] = useState<'SUCCESS' | 'FAILED'>('SUCCESS');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentProcessStage, setPaymentProcessStage] = useState<string>('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [confirmedPnr, setConfirmedPnr] = useState<string | null>(null);
  const [blockchainWallet, setBlockchainWallet] = useState<{ address: string; balanceEth: string; chainId: number } | null>(null);
  const [blockchainResult, setBlockchainResult] = useState<BlockchainBookingResult | null>(null);
  const [blockchainBusy, setBlockchainBusy] = useState(false);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);
  const [bookingStorageMode, setBookingStorageMode] = useState<'normal' | 'ethereum'>('normal');

  // Pre-select default seat if available
  useEffect(() => {
    const flightSeats = db.getSeatsForFlight(flight.id);
    const firstAvail = flightSeats.find(s => !s.isBooked && s.cabinClass === cabinClass);
    if (firstAvail && !selectedSeat) {
      setSelectedSeat(firstAvail);
    }
  }, [flight.id, cabinClass]);

  // Autofill passenger from saved list
  const handleAutofillPassenger = (saved: Passenger) => {
    setPassenger({
      id: '',
      fullName: saved.fullName,
      age: saved.age,
      gender: saved.gender,
      phone: saved.phone,
      email: saved.email,
      passportNumber: saved.passportNumber || '',
      specialAssistance: saved.specialAssistance || 'None',
    });
  };

  // Fare calculations with IRCTC Concession logic
  const rawBaseFare = Math.round(
    flight.basePrice *
      (cabinClass === 'Business' ? flight.businessMultiplier : cabinClass === 'First' ? flight.firstMultiplier : 1)
  );

  const concessionDiscount =
    concessionType === 'DEFENCE'
      ? Math.round(rawBaseFare * 0.5)
      : concessionType === 'SENIOR' || concessionType === 'STUDENT'
      ? Math.round(rawBaseFare * 0.1)
      : 0;

  const baseFare = rawBaseFare - concessionDiscount;
  const seatFee = selectedSeat ? selectedSeat.extraPrice : 0;
  // IRCTC Air feature: Zero convenience fee on UPI!
  const convenienceFee = paymentMethod === 'UPI' ? 0 : 59;
  const taxesAndFees = Math.round(baseFare * 0.12) + 250; // GST & User development fee
  const totalAmount = baseFare + seatFee + taxesAndFees + convenienceFee;

  // Generate Payment QR code whenever on step 3 or amount changes
  useEffect(() => {
    if (currentStep === 3) {
      const cleanVpa = flight.airline.toLowerCase().replace(/[^a-z0-9]/g, '');
      generatePaymentQRCode({
        amount: totalAmount,
        flightNumber: flight.flightNumber,
        upiId: `${cleanVpa}.pay@icici`,
        payeeName: `${flight.airline} Reservations`,
        transactionNote: `${flight.airline} ${flight.flightNumber} Booking`,
      }).then(url => setPaymentQrUrl(url));
    }
  }, [currentStep, totalAmount, flight.flightNumber, flight.airline]);

  // QR Code Expiry Countdown Timer
  useEffect(() => {
    if (currentStep !== 3 || paymentMethod !== 'UPI') return;
    const interval = setInterval(() => {
      setPaymentTimer(prev => (prev > 1 ? prev - 1 : 600));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep, paymentMethod]);

  // Format timer into MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle seat map click
  const handleSelectSeat = (seat: Seat) => {
    setSelectedSeat(seat);
  };

  // Step validation
  const handleNextFromPassenger = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passenger.fullName.trim()) {
      alert('Please enter passenger full name');
      return;
    }
    if (!passenger.phone.trim()) {
      alert('Please enter a valid mobile number');
      return;
    }
    if (!passenger.email.trim()) {
      alert('Please enter a valid email address');
      return;
    }
    // Check if international flight requires passport
    const isInternational = flight.originCode === 'DXB' || flight.destinationCode === 'DXB';
    if (isInternational && !passenger.passportNumber?.trim()) {
      alert('Passport number is required for international flights.');
      return;
    }

    // If user asked to save passenger
    if (savePassengerForFuture && currentUser) {
      try {
        db.savePassengerForUser(currentUser.id, passenger);
      } catch {
        // ignore
      }
    }

    setCurrentStep(3);
  };

  // Process Payment & Generate E-Ticket
  const handleProcessSimulatedPayment = async () => {
    if (!selectedSeat) {
      alert('Please select a seat before proceeding.');
      return;
    }

    setPaymentError(null);
    setIsProcessingPayment(true);
    setPaymentProcessStage('Processing airline booking...');

    if (simulateOutcome === 'FAILED') {
      setIsProcessingPayment(false);
      setPaymentError('Payment failed: Bank simulator rejected transaction (Simulated test scenario). Please try again.');
      return;
    }

    try {
      // Ensure user account exists (allow guest booking with auto-created customer profile)
      let activeUser = currentUser;
      if (!activeUser) {
        const allUsers = db.getUsers();
        activeUser = allUsers.find(u => u.email.toLowerCase() === passenger.email.toLowerCase()) || null;
        if (!activeUser) {
          activeUser = db.registerUser({
            fullName: passenger.fullName,
            email: passenger.email,
            phone: passenger.phone,
            username: passenger.email.split('@')[0] || `user_${Date.now().toString().slice(-4)}`,
            role: 'customer',
            passportNumber: passenger.passportNumber,
          });
        }
        db.setCurrentUser(activeUser.id);
        onUserLoggedIn?.(activeUser);
      }

      const { booking } = db.createBooking({
        userId: activeUser.id,
        flightId: flight.id,
        passenger: {
          ...passenger,
          concessionId: concessionIdNumber || undefined,
          mealPreference: mealPreference || undefined,
        },
        seatNumber: selectedSeat.seatNumber,
        cabinClass,
        concessionType,
        baseFare,
        seatFee,
        taxesAndFees,
        convenienceFee,
        travelInsurance: freeInsurance,
        mealPreference,
        totalAmount,
        paymentMethod,
        cardLast4: paymentMethod === 'Card' ? '4242' : undefined,
        upiId: paymentMethod === 'UPI' ? upiId : undefined,
        walletName: paymentMethod === 'Wallet' ? walletName : undefined,
      });

      setConfirmedPnr(booking.pnr);

      // Generate official E-Ticket QR Code immediately with exact booked airline
      const qrUrl = await generateTicketQRCode({
        pnr: booking.pnr,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        passengerName: passenger.fullName,
        seat: selectedSeat.seatNumber,
        travelDate: flight.departureDate,
        origin: flight.originCode,
        destination: flight.destinationCode,
        cabinClass,
      });
      setTicketQrUrl(qrUrl);

      // Write to Ganache when user selected Ethereum mode or connected MetaMask
      if (bookingStorageMode === 'ethereum' || Boolean(blockchainWallet)) {
        try {
          const result = await recordBookingOnBlockchain(booking.pnr, flight.id, selectedSeat.seatNumber);
          setBlockchainResult(result);
          setBlockchainWallet({ address: result.walletAddress, balanceEth: blockchainWallet?.balanceEth || 'unknown', chainId: blockchainWallet?.chainId || Number(import.meta.env.VITE_GANACHE_CHAIN_ID || 1337) });
        } catch (chainErr: any) {
          setBlockchainError(chainErr?.shortMessage || chainErr?.reason || chainErr?.message || 'Blockchain transaction failed. The local booking remains saved.');
        }
      }

      setIsProcessingPayment(false);
      setCurrentStep(4);
    } catch (err: any) {
      setIsProcessingPayment(false);
      setPaymentError(err.message || 'Booking creation failed in local database.');
    }
  };

  const handleCopyPnr = () => {
    if (!confirmedPnr) return;
    navigator.clipboard.writeText(confirmedPnr);
    setCopiedPnr(true);
    setTimeout(() => setCopiedPnr(false), 2000);
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPDFTicket = async () => {
    if (!confirmedPnr) return;
    const booking = db.getBookingByPnr(confirmedPnr);
    if (!booking) return;

    setIsDownloadingPdf(true);
    try {
      await downloadTicketPDF(booking, flight, ticketQrUrl);
    } catch (err) {
      console.error('Failed to generate ticket PDF:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadInlineTicket = () => {
    const el = document.getElementById('printable-confirmed-eticket');
    if (!el || !confirmedPnr) return;
    const blob = new Blob([
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>ETicket_${confirmedPnr}_${flight.flightNumber}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: sans-serif; background: #f8fafc; padding: 24px; }
          .ticket-wrap { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
          @media print { body { padding: 0; background: white; } }
        </style>
      </head>
      <body>
        <div class="ticket-wrap">
          ${el.innerHTML}
        </div>
      </body>
      </html>`
    ], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ETicket_${confirmedPnr}_${flight.flightNumber}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Flights</span>
        </button>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
            <span>1</span>
            <span className="hidden sm:inline">Seat Map</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
            <span>2</span>
            <span className="hidden sm:inline">Passenger</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
            <span>3</span>
            <span className="hidden sm:inline">Payment & Gateway</span>
          </div>
          <span className="text-slate-300">→</span>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${currentStep >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
            <span>4</span>
            <span className="hidden sm:inline">Confirmation</span>
          </div>
        </div>
      </div>

      {/* Flight Summary Pill */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-sm">
            {flight.airline.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight text-white">{flight.airline} • {flight.flightNumber}</h3>
            <p className="text-xs text-slate-400">
              {flight.originCode} → {flight.destinationCode} • Date: {flight.departureDate} • Departure: {flight.departureTime}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-slate-400 block">Class:</span>
            <span className="font-bold text-blue-300">{cabinClass}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Selected Seat:</span>
            <span className="font-bold text-emerald-400">{selectedSeat ? selectedSeat.seatNumber : 'None'}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block">Total Fare:</span>
            <span className="text-base font-extrabold text-white">₹{totalAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* STEP 1: INTERACTIVE SEAT SELECTION */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <SeatMap
            flight={flight}
            cabinClass={cabinClass}
            selectedSeatNumber={selectedSeat?.seatNumber || null}
            onSelectSeat={handleSelectSeat}
          />

          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-xs text-slate-500">Selected Seat</p>
              <p className="text-base font-bold text-slate-900">
                {selectedSeat ? `${selectedSeat.seatNumber} (${selectedSeat.cabinClass})` : 'Please pick a seat above'}
              </p>
            </div>
            <button
              id="proceed-to-passenger-btn"
              disabled={!selectedSeat}
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm shadow-md transition-all"
            >
              Continue to Passenger Details →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: PASSENGER DETAILS FORM */}
      {currentStep === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>Passenger Information</span>
              </h3>
              <p className="text-xs text-slate-500">Enter government photo ID matching details for your ticket</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setPassenger({
                      id: '',
                      fullName: currentUser.fullName,
                      age: currentUser.dob ? Math.max(18, Math.floor((new Date().getTime() - new Date(currentUser.dob).getTime()) / (365.25 * 24 * 3600 * 1000))) : 28,
                      gender: currentUser.gender || 'Male',
                      phone: currentUser.phone || '',
                      email: currentUser.email || '',
                      passportNumber: currentUser.passportNumber || '',
                      specialAssistance: 'None'
                    });
                  }}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span>Use My Details ({currentUser.fullName.split(' ')[0]})</span>
                </button>
              )}

              {/* Saved Passengers Autofill */}
              {savedPassengers.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  <select
                    onChange={e => {
                      const found = savedPassengers.find(p => p.id === e.target.value);
                      if (found) handleAutofillPassenger(found);
                    }}
                    className="bg-blue-50 text-blue-800 border border-blue-200 rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none"
                  >
                    <option value="">Select Saved Traveler</option>
                    {savedPassengers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.gender}, {p.age}y)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleNextFromPassenger} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Full Name (as on Govt Photo ID / Passport) *
                </label>
                <input
                  type="text"
                  required
                  value={passenger.fullName}
                  onChange={e => setPassenger({ ...passenger, fullName: e.target.value })}
                  placeholder="e.g. Manoj Kumar"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Age *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={passenger.age}
                  onChange={e => setPassenger({ ...passenger, age: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gender *</label>
                <select
                  value={passenger.gender}
                  onChange={e => setPassenger({ ...passenger, gender: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={passenger.phone}
                  onChange={e => setPassenger({ ...passenger, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email (for E-Ticket) *</label>
                <input
                  type="email"
                  required
                  value={passenger.email}
                  onChange={e => setPassenger({ ...passenger, email: e.target.value })}
                  placeholder="rahul@example.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Passport Number {flight.originCode === 'DXB' || flight.destinationCode === 'DXB' ? '(Required for DXB)' : '(Optional)'}
                </label>
                <input
                  type="text"
                  value={passenger.passportNumber || ''}
                  onChange={e => setPassenger({ ...passenger, passportNumber: e.target.value })}
                  placeholder="e.g. Z5892144"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* IRCTC In-Flight Meal Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">In-Flight Meal Preference</label>
                <select
                  value={mealPreference}
                  onChange={e => setMealPreference(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="Standard In-Flight Meal">Standard In-Flight Meal / Refreshment</option>
                  <option value="Vegetarian Hindu Meal (AVML)">Vegetarian Hindu Meal (AVML)</option>
                  <option value="Jain Vegetarian Meal (VJML)">Jain Vegetarian Meal (VJML - No Onion/Garlic)</option>
                  <option value="Diabetic Friendly Meal (DBML)">Diabetic Friendly Meal (DBML)</option>
                  <option value="Non-Vegetarian Meal (NVML)">Non-Vegetarian Meal (NVML)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Special Assistance Request</label>
                <select
                  value={passenger.specialAssistance}
                  onChange={e => setPassenger({ ...passenger, specialAssistance: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="None">None</option>
                  <option value="Wheelchair">Wheelchair Assistance (Airport & Boarding)</option>
                  <option value="Senior Citizen Care">Senior Citizen Care</option>
                  <option value="Infant on Lap">Infant on Lap</option>
                  <option value="Extra Baggage">Pre-book Extra Baggage Allowance</option>
                </select>
              </div>

              {/* Concession details if applied */}
              {concessionType !== 'REGULAR' && (
                <div className="md:col-span-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-blue-900">
                      Applied Concession: {concessionType === 'DEFENCE' ? 'Armed Forces (50% Off Base Fare)' : concessionType === 'STUDENT' ? 'Student Fare (+10kg Bag & 10% Off)' : concessionType === 'SENIOR' ? 'Senior Citizen Concession (10% Off)' : 'Government / LTC Claim'}
                    </span>
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded">
                      Verified Category
                    </span>
                  </div>
                  <label className="block text-[11px] font-semibold text-blue-800 mb-1">
                    {concessionType === 'DEFENCE' && 'Armed Forces Service / Dependent ID Number:'}
                    {concessionType === 'STUDENT' && 'Student ID / Enrollment Number:'}
                    {concessionType === 'SENIOR' && 'Aadhaar / Government Photo ID Number (60+ yrs):'}
                    {concessionType === 'GOVT_LTC' && 'Official Govt Employee ID / Department Code:'}
                  </label>
                  <input
                    type="text"
                    value={concessionIdNumber}
                    onChange={e => setConcessionIdNumber(e.target.value)}
                    placeholder="Enter valid ID number to verify at airport gate"
                    className="w-full bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              )}

            </div>

            {/* Complimentary Travel Insurance Banner */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={freeInsurance}
                  onChange={e => setFreeInsurance(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                />
                <div>
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Complimentary ₹50 Lakhs Travel Insurance
                  </span>
                  <p className="text-[11px] text-emerald-700 mt-0.5">
                    Enjoy ₹50,00,000 personal accidental coverage on all domestic flights at zero additional cost (Premium: ₹0 Free).
                  </p>
                </div>
              </label>
            </div>

            {/* Save details option (explicit control with duplicate prevention) */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={savePassengerForFuture}
                  onChange={e => setSavePassengerForFuture(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span>Save this passenger to my Saved Travellers list for future bookings</span>
              </label>

              {currentUser && (
                <button
                  type="button"
                  onClick={handleExplicitSaveTraveller}
                  disabled={isSavedTravellerClicked || !passenger.fullName.trim()}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-blue-50 hover:border-blue-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {isSavedTravellerClicked ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Traveller Saved!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 text-blue-600" />
                      <span>Save Traveller</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                ← Back to Seat Selection
              </button>

              <button
                type="submit"
                id="passenger-submit-btn"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md transition-all"
              >
                Proceed to Fare Review & Payment →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 3: FARE BREAKDOWN & SIMULATED PAYMENT */}
      {currentStep === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Fare Summary Column */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-900 text-base pb-3 border-b border-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Fare Calculation</span>
              </h3>

              <div className="divide-y divide-slate-100 text-xs py-2">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Standard Base Airfare</span>
                  <span className="font-semibold text-slate-900 font-mono">₹{rawBaseFare.toLocaleString()}</span>
                </div>
                {concessionDiscount > 0 && (
                  <div className="py-2.5 flex justify-between text-emerald-700 font-semibold">
                    <span>Concession Savings ({concessionType})</span>
                    <span className="font-mono">-₹{concessionDiscount.toLocaleString()}</span>
                  </div>
                )}
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Seat Selection ({selectedSeat?.seatNumber})</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {seatFee > 0 ? `+₹${seatFee.toLocaleString()}` : 'Complimentary'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">Airport Taxes & Aviation GST (12%)</span>
                  <span className="font-semibold text-slate-900 font-mono">₹{taxesAndFees.toLocaleString()}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-600">
                    Convenience Fee
                    {paymentMethod === 'UPI' && <strong className="text-emerald-600 ml-1">(UPI Free!)</strong>}
                  </span>
                  <span className={`font-semibold font-mono ${paymentMethod === 'UPI' ? 'text-emerald-700' : 'text-slate-900'}`}>
                    {paymentMethod === 'UPI' ? '₹0 (Saved ₹59)' : `₹${convenienceFee}`}
                  </span>
                </div>
                {freeInsurance && (
                  <div className="py-2.5 flex justify-between text-emerald-700 font-semibold">
                    <span>Travel Insurance (Cover ₹50 Lakhs)</span>
                    <span className="font-mono">FREE (₹0)</span>
                  </div>
                )}
                <div className="py-3 flex justify-between text-sm font-extrabold text-slate-900 bg-slate-50 -mx-6 px-6 mt-2">
                  <span>Grand Total Payable</span>
                  <span className="text-blue-600 text-base font-mono">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>

              {/* Passenger Review */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Passenger Summary:</p>
                <p>{passenger.fullName} ({passenger.gender}, {passenger.age} yrs)</p>
                <p>{passenger.phone} • {passenger.email}</p>
                <p><span className="text-slate-500">Meal:</span> {mealPreference}</p>
                {passenger.specialAssistance !== 'None' && (
                  <p className="text-blue-600 font-medium">Assistance: {passenger.specialAssistance}</p>
                )}
                {concessionType !== 'REGULAR' && (
                  <p className="text-emerald-700 font-semibold">Concession ID: {concessionIdNumber || 'Verified'}</p>
                )}
              </div>
            </div>

            {/* Payment Security Notice Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-slate-200 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1 text-white">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Instant Payment & Verification</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Secured payment processing. Dynamic UPI QR code with scan verification, credit/debit card, and digital wallet checkout.
              </p>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="md:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            <section className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 space-y-3">
              <div className="font-bold text-slate-900 flex items-center gap-2"><LinkIcon className="w-4 h-4 text-violet-700" /> Booking Record Option</div>
              <p className="text-xs text-slate-600">Choose how to record this booking. Normal booking works without MetaMask. Ethereum booking requires MetaMask connected to Ganache.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button type="button" onClick={() => { setBookingStorageMode('normal'); setBlockchainError(null); }} className={`text-left rounded-xl border p-3 ${bookingStorageMode === 'normal' ? 'border-blue-500 bg-white ring-1 ring-blue-200' : 'border-slate-200 bg-white'}`}><span className="block text-sm font-bold text-slate-800">Normal Booking</span><span className="block text-xs text-slate-500 mt-1">Use the existing reservation database</span></button>
                <button type="button" onClick={() => { setBookingStorageMode('ethereum'); setBlockchainError(null); }} className={`text-left rounded-xl border p-3 ${bookingStorageMode === 'ethereum' ? 'border-violet-500 bg-white ring-1 ring-violet-200' : 'border-slate-200 bg-white'}`}><span className="block text-sm font-bold text-violet-900">Ethereum Blockchain</span><span className="block text-xs text-slate-500 mt-1">Record booking on Ganache using MetaMask</span></button>
              </div>
              {bookingStorageMode === 'ethereum' && <div className="flex flex-wrap items-center gap-3"><button type="button" disabled={blockchainBusy || isProcessingPayment} onClick={async () => { setBlockchainBusy(true); setBlockchainError(null); try { const w = await connectWallet(); setBlockchainWallet(w); setBookingStorageMode('ethereum'); } catch (e: any) { setBlockchainError(e?.shortMessage || e?.reason || e?.message || 'Could not connect MetaMask.'); } finally { setBlockchainBusy(false); } }} className="px-4 py-2 rounded-xl bg-violet-700 text-white font-bold text-sm hover:bg-violet-800 disabled:opacity-50">{blockchainBusy ? 'Connecting...' : blockchainWallet ? 'MetaMask Connected ✓' : 'Connect MetaMask'}</button>{blockchainWallet && <span className="text-xs text-slate-600 break-all">{blockchainWallet.address} · <strong>{blockchainWallet.balanceEth} ETH</strong> · Chain {blockchainWallet.chainId}</span>}</div>}
              {bookingStorageMode === 'ethereum' && !blockchainWallet && <p className="text-xs text-amber-800">Connect MetaMask before confirming an Ethereum booking.</p>}
              {blockchainError && bookingStorageMode === 'ethereum' && <p role="alert" className="text-xs text-red-700">{blockchainError}</p>}
            </section>
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Select Payment Method</span>
              </h3>
              <p className="text-xs text-slate-500">Choose UPI QR Code, Credit/Debit Card, or Wallet</p>
            </div>

            {/* Payment Tabs: Card, UPI, Wallet */}
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                id="pay-method-upi"
                onClick={() => setPaymentMethod('UPI')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'UPI'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold">UPI / QR</span>
              </button>

              <button
                type="button"
                id="pay-method-card"
                onClick={() => setPaymentMethod('Card')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'Card'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-bold">Credit / Debit</span>
              </button>

              <button
                type="button"
                id="pay-method-wallet"
                onClick={() => setPaymentMethod('Wallet')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                  paymentMethod === 'Wallet'
                    ? 'border-blue-600 bg-blue-50/60 text-blue-900 ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Wallet className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold">Wallet</span>
              </button>
            </div>

            {/* Method Inputs */}
            {paymentMethod === 'UPI' && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                {/* Sub tabs: QR vs Manual */}
                <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-bold w-fit mx-auto">
                  <button
                    type="button"
                    onClick={() => setUpiPayTab('qr')}
                    className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      upiPayTab === 'qr' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Scan Payment QR Code</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiPayTab('manual')}
                    className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                      upiPayTab === 'manual' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Enter UPI ID</span>
                  </button>
                </div>

                {upiPayTab === 'qr' ? (
                  <div className="flex flex-col items-center text-center space-y-3 py-2">
                    <div className="relative p-3 bg-white rounded-2xl shadow-md border-2 border-blue-500/30">
                      {paymentQrUrl ? (
                        <img
                          src={paymentQrUrl}
                          alt="Simulated Payment QR Code"
                          className="w-48 h-48 rounded-lg"
                        />
                      ) : (
                        <div className="w-48 h-48 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-2">
                          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                          <span className="text-xs">Generating Payment QR...</span>
                        </div>
                      )}
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                        UPI QR • ₹{totalAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-800">Scan & Pay Using Any UPI App</p>
                      <p className="text-[11px] text-slate-500">
                        VPA: <span className="font-mono font-semibold text-slate-700">{flight.airline.toLowerCase().replace(/[^a-z0-9]/g, '')}.pay@icici</span> • Payee: <span className="font-semibold text-slate-700">{flight.airline} Reservations</span>
                      </p>
                    </div>

                    {/* Supported apps badges */}
                    <div className="flex flex-wrap justify-center items-center gap-1.5 text-[10px] font-semibold text-slate-600">
                      <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200">Google Pay</span>
                      <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200">PhonePe</span>
                      <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200">Paytm</span>
                      <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200">BHIM UPI</span>
                      <span className="px-2 py-0.5 bg-white rounded-md border border-slate-200">Cred</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      <Clock className="w-3.5 h-3.5" />
                      <span>QR Valid For: <strong>{formatTimer(paymentTimer)}</strong></span>
                    </div>

                    <button
                      type="button"
                      id="simulate-qr-payment-btn"
                      disabled={isProcessingPayment || (bookingStorageMode === 'ethereum' && !blockchainWallet)}
                      onClick={handleProcessSimulatedPayment}
                      className="mt-1 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Verifying UPI Transaction...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Simulate QR Scan & Pay ₹{totalAmount.toLocaleString()}</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-slate-700">Virtual Payment Address (UPI ID)</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={e => setUpiId(e.target.value)}
                      placeholder="e.g. rahul@okaxis or 9876543210@paytm"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <QrCode className="w-4 h-4 text-slate-400" />
                      <span>Simulated UPI handles Google Pay, PhonePe, Paytm, and BHIM</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {paymentMethod === 'Card' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Card Number (Simulated)</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'Wallet' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <label className="block text-xs font-semibold text-slate-700">Select Digital Wallet</label>
                <select
                  value={walletName}
                  onChange={e => setWalletName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="PayTM Wallet">PayTM Wallet (Simulated Balance: ₹25,000)</option>
                  <option value="Amazon Pay">Amazon Pay Balance (Simulated)</option>
                  <option value="PhonePe Wallet">PhonePe Wallet (Simulated)</option>
                  <option value="Mobikwik">Mobikwik Wallet (Simulated)</option>
                </select>
              </div>
            )}

            {/* Test Simulation Outcome Controller (for Project Evaluation) */}
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Payment Gateway Simulation Outcome:</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="simulate-outcome-success"
                  onClick={() => setSimulateOutcome('SUCCESS')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    simulateOutcome === 'SUCCESS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white'
                  }`}
                >
                  ✓ Success
                </button>
                <button
                  type="button"
                  id="simulate-outcome-failure"
                  onClick={() => setSimulateOutcome('FAILED')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    simulateOutcome === 'FAILED'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 bg-white'
                  }`}
                >
                  ✕ Failure
                </button>
              </div>
            </div>

            {paymentError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                ← Back
              </button>

              <button
                type="button"
                id="complete-payment-btn"
                disabled={isProcessingPayment || (bookingStorageMode === 'ethereum' && !blockchainWallet)}
                onClick={handleProcessSimulatedPayment}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{paymentProcessStage || 'Processing Payment Gateway...'}</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Pay ₹{totalAmount.toLocaleString()} & Confirm Booking</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: BOOKING CONFIRMED & INLINE GENERATED E-TICKET WITH QR */}
      {currentStep === 4 && confirmedPnr && (
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Confirmation Top Banner */}
          <div className="bg-white rounded-3xl p-6 border border-emerald-200 shadow-lg text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ● Payment Successful • Reservation Confirmed
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Your E-Ticket Has Been Generated!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your flight reservation has been logged into the airline reservation database.
              </p>
            </div>

            {/* PNR Box */}
            <div className="max-w-md mx-auto p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl flex items-center justify-between">
              <div className="text-left">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Booking Reference (PNR)</span>
                <div className="text-2xl font-black font-mono tracking-widest text-blue-900">
                  {confirmedPnr}
                </div>
              </div>
              <button
                type="button"
                onClick={handleCopyPnr}
                className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                {copiedPnr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPnr ? 'Copied!' : 'Copy PNR'}</span>
              </button>
            </div>
          </div>

          {/* Ethereum blockchain proof: optional and independent of the existing booking flow. */}
          <div className="bg-white rounded-2xl border border-violet-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-violet-900 font-bold"><LinkIcon className="w-5 h-5" /> Ethereum Blockchain Record</div>
            <p className="text-sm text-slate-600">Record this booking on your local Ganache blockchain. MetaMask must be connected to the configured Ganache network. Only the booking reference, flight ID, and seat are stored on-chain, not passenger personal details.</p>
            {blockchainWallet && <div className="text-xs text-slate-600 break-all">Wallet: <span className="font-mono">{blockchainWallet.address}</span><br />Balance: {blockchainWallet.balanceEth} ETH (chain ID {blockchainWallet.chainId})</div>}
            {blockchainResult ? (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 space-y-1 text-sm">
                <div className="font-bold text-emerald-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Transaction confirmed on Ganache</div>
                <div className="text-slate-700">Transaction hash:</div><div className="font-mono text-xs break-all">{blockchainResult.transactionHash}</div>
                <div className="text-slate-700">Block number: <strong>{blockchainResult.blockNumber}</strong></div>
                <div className="text-slate-700">Wallet: <span className="font-mono text-xs break-all">{blockchainResult.walletAddress}</span></div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" disabled={blockchainBusy} onClick={async () => { setBlockchainBusy(true); setBlockchainError(null); try { setBlockchainWallet(await connectWallet()); } catch (e: any) { setBlockchainError(e?.message || 'Could not connect MetaMask.'); } finally { setBlockchainBusy(false); } }} className="px-4 py-2 rounded-xl border border-violet-300 text-violet-800 font-bold text-sm hover:bg-violet-50 disabled:opacity-50">{blockchainBusy ? 'Connecting...' : blockchainWallet ? 'Refresh Wallet' : 'Connect MetaMask'}</button>
                <button type="button" disabled={blockchainBusy} onClick={async () => { if (!confirmedPnr) return; const savedBooking = db.getBookingByPnr(confirmedPnr); if (!savedBooking) { setBlockchainError('Booking could not be found in the current application database.'); return; } setBlockchainBusy(true); setBlockchainError(null); try { const result = await recordBookingOnBlockchain(savedBooking.pnr, savedBooking.flightId, savedBooking.seatNumber); setBlockchainResult(result); setBlockchainWallet({ address: result.walletAddress, balanceEth: blockchainWallet?.balanceEth || 'unknown', chainId: blockchainWallet?.chainId || Number(import.meta.env.VITE_GANACHE_CHAIN_ID || 1337) }); } catch (e: any) { setBlockchainError(e?.shortMessage || e?.reason || e?.message || 'Blockchain transaction failed.'); } finally { setBlockchainBusy(false); } }} className="px-4 py-2 rounded-xl bg-violet-700 text-white font-bold text-sm hover:bg-violet-800 disabled:opacity-50">{blockchainBusy ? 'Waiting for MetaMask...' : 'Record Booking on Ganache'}</button>
              </div>
            )}
            {blockchainError && <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{blockchainError}</p>}
          </div>

          {/* THE OFFICIAL GENERATED E-TICKET CARD (Printable & Downloadable) */}
          <div
            id="printable-confirmed-eticket"
            className="bg-white rounded-3xl border border-slate-300 shadow-xl overflow-hidden"
          >
            {/* Airline Ticket Header */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-sm">
                  <Plane className="w-5 h-5 -rotate-45" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight">{flight.airline}</h3>
                  <p className="text-xs text-blue-200 font-mono">
                    Electronic Passenger Ticket & Boarding Document
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-xs font-bold uppercase">
                  ● Confirmed
                </span>
                <span className="px-3 py-1 bg-white/10 border border-white/20 text-white rounded-full text-xs font-semibold">
                  {cabinClass} Class
                </span>
              </div>
            </div>

            {/* Flight Route Banner */}
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center sm:text-left">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Departure Airport</span>
                  <div className="text-3xl font-black text-slate-900 mt-0.5">{flight.originCode}</div>
                  <div className="text-xs font-bold text-slate-700">{db.getAirportByCode(flight.originCode)?.city}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-center sm:justify-start gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-semibold">{flight.departureTime} hrs</span>
                  </div>
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xs font-bold text-blue-700 font-mono">{flight.flightNumber}</span>
                  <div className="w-full flex items-center my-2 relative max-w-[160px]">
                    <div className="h-0.5 w-full bg-slate-300"></div>
                    <Plane className="w-4 h-4 text-blue-600 rotate-90 absolute left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50" />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{flight.duration} Non-stop</span>
                  <span className="text-[11px] font-bold text-slate-700 mt-1">Date: {flight.departureDate}</span>
                </div>

                <div className="sm:text-right">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Arrival Airport</span>
                  <div className="text-3xl font-black text-slate-900 mt-0.5">{flight.destinationCode}</div>
                  <div className="text-xs font-bold text-slate-700">{db.getAirportByCode(flight.destinationCode)?.city}</div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center justify-center sm:justify-end gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold">{flight.arrivalTime} hrs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger, Seat & Generated QR Code Section */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Passenger & Flight Details */}
              <div className="md:col-span-8 space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Seat</span>
                    <span className="text-xl font-black text-blue-600">{selectedSeat?.seatNumber}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Cabin Class</span>
                    <span className="text-xs font-bold text-slate-800">{cabinClass}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Terminal / Gate</span>
                    <span className="text-xs font-bold text-slate-800">T{flight.terminal} • {flight.gate}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Aircraft</span>
                    <span className="text-xs font-bold text-slate-800">
                      {db.getAircraftById(flight.aircraftId)?.model || 'Airbus A320neo'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Passenger Name:</span>
                    <span className="font-bold text-slate-900">{passenger.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Age / Gender:</span>
                    <span className="font-semibold text-slate-800">{passenger.age} years • {passenger.gender}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mobile & Email:</span>
                    <span className="font-semibold text-slate-800">{passenger.phone} • {passenger.email}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200">
                    <span className="text-slate-500">Total Fare Paid:</span>
                    <span className="font-extrabold text-slate-900 text-sm">₹{totalAmount.toLocaleString()} (Verified)</span>
                  </div>
                </div>
              </div>

              {/* Generated Ticket QR Code */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                  {ticketQrUrl ? (
                    <img
                      src={ticketQrUrl}
                      alt={`Ticket QR Code for PNR ${confirmedPnr}`}
                      className="w-36 h-36 rounded-lg"
                    />
                  ) : (
                    <div className="w-36 h-36 bg-slate-100 rounded-lg flex flex-col items-center justify-center text-slate-400 gap-1 text-[11px]">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Generating QR...</span>
                    </div>
                  )}
                </div>
                <span className="text-[11px] font-bold text-slate-800 mt-2">Official E-Ticket QR Code</span>
                <span className="text-[10px] text-slate-500">Scan to view passenger & flight details</span>
              </div>

            </div>

            {/* Bottom Barcode Strip */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
              <span className="font-mono text-[11px]">ETKT-NUM: 098-{confirmedPnr}-{Date.now().toString().slice(-6)}</span>
              <div className="font-mono text-xs tracking-widest text-slate-700 select-none">
                ||| | |||| || ||||| ||| |||| || |||| |||
              </div>
              <span>Status: CONFIRMED & READY FOR TRAVEL</span>
            </div>

          </div>
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              id="download-pdf-ticket-btn"
              onClick={handleDownloadPDFTicket}
              disabled={isDownloadingPdf}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Ticket'}</span>
            </button>

            <button
              type="button"
              id="print-ticket-btn"
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print E-Ticket</span>
            </button>

            {onOpenScanner && (
              <button
                type="button"
                id="verify-ticket-btn"
                onClick={onOpenScanner}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify Ticket</span>
              </button>
            )}

            <button
              type="button"
              id="view-ticket-dialog-btn"
              onClick={() => onBookingCompleted(confirmedPnr)}
              className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span>Open in Ticket Viewer</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors"
            >
              Book Another Flight
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
