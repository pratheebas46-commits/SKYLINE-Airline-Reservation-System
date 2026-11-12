import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  User,
  Plane,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  Armchair,
  Phone,
  Mail,
  ArrowRight,
  Edit3,
  Check
} from 'lucide-react';
import { User as AuthUser, Flight, CabinClass, ConcessionType, Passenger, Seat } from '../types';
import { db } from '../services/db';
import {
  parseNaturalLanguageBooking,
  findMatchingFlightsForIntent,
  autoAssignSeat,
  prepareBookingSummary,
  ExtractedBookingIntent,
  PreparedBookingSummary
} from '../services/aiChatbot';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  intent?: ExtractedBookingIntent;
  matchedFlights?: Flight[];
  preparedBooking?: PreparedBookingSummary;
  suggestedAction?: 'select_flight' | 'confirm_booking' | 'need_info';
}

interface AIChatbotBookingProps {
  currentUser: AuthUser | null;
  onSelectFlightToBook: (
    flight: Flight,
    cabinClass: CabinClass,
    tripType: 'oneway' | 'roundtrip',
    concessionType: ConcessionType,
    prefilledPassenger?: Partial<Passenger>,
    preselectedSeat?: Seat | null,
    startAtStep?: number,
    mealPreference?: string,
    concessionId?: string
  ) => void;
  onNavigateToManual: () => void;
}

export const AIChatbotBooking: React.FC<AIChatbotBookingProps> = ({
  currentUser,
  onSelectFlightToBook,
  onNavigateToManual,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentIntent, setCurrentIntent] = useState<Partial<ExtractedBookingIntent>>({
    passengersCount: 1,
    cabinClass: 'Economy',
    passengerCategory: 'REGULAR',
    passengerName: undefined,
    gender: 'Female',
  });
  const [activePreparedBooking, setActivePreparedBooking] = useState<PreparedBookingSummary | null>(null);
  const [matchedFlights, setMatchedFlights] = useState<Flight[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize clear welcome message
  useEffect(() => {
    const greetingText = currentUser
      ? `Hello ${currentUser.fullName}!\n\nPlease enter your travel details (such as origin, destination, date, time preference, or budget) to search flights and prepare your booking.`
      : `Welcome to SKYLINE.\n\nPlease enter your travel details (such as origin, destination, date, time preference, or budget) to search flights and prepare your booking.`;

    setMessages([
      {
        id: 'msg-welcome',
        sender: 'bot',
        text: greetingText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activePreparedBooking]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    const newMsgId = `usr-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: newMsgId,
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    setTimeout(() => {
      processAssistantResponse(userText);
    }, 250);
  };

  // Helper to build a complete prepared booking for a chosen flight
  const buildPreparedBooking = (
    flight: Flight,
    intent: ExtractedBookingIntent
  ): PreparedBookingSummary => {
    const seat = autoAssignSeat(flight.id, intent.cabinClass || 'Economy');
    const concession = intent.passengerCategory || 'REGULAR';
    return prepareBookingSummary(flight, intent.cabinClass || 'Economy', concession, intent, seat);
  };

  const processAssistantResponse = (text: string) => {
    const lower = text.toLowerCase();
    const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Check for quick confirmation command if a booking is already prepared
    if (activePreparedBooking && (
      lower === 'confirm' ||
      lower === 'confirm booking' ||
      lower === 'proceed to payment' ||
      lower === 'pay now' ||
      lower === 'proceed' ||
      lower === 'yes' ||
      lower === 'pay' ||
      lower.includes('confirm and pay') ||
      lower.includes('proceed to pay')
    )) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: `Booking confirmed! Opening the secure payment gateway for ${activePreparedBooking.flight.airline} ${activePreparedBooking.flight.flightNumber}...`,
          timestamp: botTimestamp,
        },
      ]);
      setTimeout(() => {
        handleProceedToPayment(activePreparedBooking);
      }, 500);
      return;
    }

    // 2. Check if user specified a flight selection from existing matched flights
    if (matchedFlights.length > 0) {
      let chosenFlight: Flight | undefined;

      // Check flight code e.g. "6E-204" or "AI-502"
      for (const f of matchedFlights) {
        const cleanCode = f.flightNumber.toLowerCase().replace(/[-\s]/g, '');
        const cleanInput = lower.replace(/[-\s]/g, '');
        if (cleanInput.includes(cleanCode)) {
          chosenFlight = f;
          break;
        }
      }

      // Check "flight 1", "flight 2", "first flight", "second flight"
      if (!chosenFlight) {
        if (lower.includes('flight 1') || lower.includes('first flight') || lower === '1') {
          chosenFlight = matchedFlights[0];
        } else if (lower.includes('flight 2') || lower.includes('second flight') || lower === '2') {
          chosenFlight = matchedFlights[1];
        } else if (lower.includes('flight 3') || lower.includes('third flight') || lower === '3') {
          chosenFlight = matchedFlights[2];
        }
      }

      if (chosenFlight) {
        const updatedIntent = { ...currentIntent, selectedFlight: chosenFlight } as ExtractedBookingIntent;
        setCurrentIntent(updatedIntent);
        const prepared = buildPreparedBooking(chosenFlight, updatedIntent);
        setActivePreparedBooking(prepared);

        const reply = `I have selected **${chosenFlight.airline} ${chosenFlight.flightNumber}** (${chosenFlight.originCode} → ${chosenFlight.destinationCode}) and prepared your complete booking with auto-assigned Seat **${prepared.selectedSeat.seatNumber}**.\n\nPlease review the booking details below and click **Confirm Booking & Proceed to Payment** to complete your reservation.`;

        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: reply,
            timestamp: botTimestamp,
            preparedBooking: prepared,
            suggestedAction: 'confirm_booking',
          },
        ]);
        return;
      }
    }

    // 3. Parse natural language for new entities or corrections
    const parsed = parseNaturalLanguageBooking(text, currentUser, currentIntent);
    setCurrentIntent(parsed);

    // If route details are not complete, ask ONLY for the missing piece
    if (!parsed.isComplete) {
      let promptText = '';
      if (!parsed.origin && !parsed.destination) {
        promptText = `Which cities are you traveling between? (e.g. Bangalore to Delhi)`;
      } else if (!parsed.origin) {
        promptText = `Where are you departing from?`;
      } else if (!parsed.destination) {
        promptText = `Where are you flying to?`;
      } else if (!parsed.travelDate) {
        promptText = `What is your travel date? (e.g. 20 October 2026 or tomorrow)`;
      } else {
        promptText = `Please provide the remaining detail: ${parsed.missingFields.join(', ')}.`;
      }

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: promptText,
          timestamp: botTimestamp,
          intent: parsed,
          suggestedAction: 'need_info',
        },
      ]);
      return;
    }

    // Route is complete -> Search 2026 local dataset
    const flights = findMatchingFlightsForIntent(parsed);
    // Ensure contact details are populated (from message, saved intent, or neutral fallback)
    if (!parsed.passengerName) {
      parsed.passengerName = 'Passenger';
    }
    if (!parsed.phone) {
      parsed.phone = currentUser?.phone || '9876543210';
    }
    if (!parsed.email) {
      parsed.email = currentUser?.email || 'traveler@skyline.in';
    }
    if (!parsed.age) {
      parsed.age = 24;
    }

    // If only ONE flight matched (or user specified exact flight number)
    if (flights.length === 1) {
      const selectedFlight = flights[0];
      parsed.selectedFlight = selectedFlight;
      setCurrentIntent(parsed);

      const prepared = buildPreparedBooking(selectedFlight, parsed);
      setActivePreparedBooking(prepared);

      let reply = `I found a matching flight and prepared your complete booking automatically:\n`;
      reply += `• Flight: ${selectedFlight.airline} (${selectedFlight.flightNumber}) • ${selectedFlight.originCode} → ${selectedFlight.destinationCode}\n`;
      reply += `• Date & Time: ${selectedFlight.departureDate} at ${selectedFlight.departureTime} (Arrival: ${selectedFlight.arrivalTime})\n`;
      reply += `• Passenger: ${prepared.passengerName} (${prepared.gender}, ${prepared.age} yrs)\n`;
      if (prepared.concessionType !== 'REGULAR') {
        reply += `• Concession: ${prepared.concessionType} Concession Applied (Saved ₹${prepared.concessionDiscount.toLocaleString('en-IN')})\n`;
      }
      reply += `• Assigned Seat: ${prepared.selectedSeat.seatNumber} (${prepared.cabinClass})\n`;
      reply += `• Total Payable: ₹${prepared.totalAmount.toLocaleString('en-IN')}\n\n`;
      reply += `Please review the prepared booking details below. You can make changes if needed, or click **Confirm Booking & Proceed to Payment** to complete checkout via UPI QR Code, Card, or Wallet.`;

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: reply,
          timestamp: botTimestamp,
          intent: parsed,
          preparedBooking: prepared,
          suggestedAction: 'confirm_booking',
        },
      ]);
    } else if (flights.length > 1) {
      // Multiple flights match -> Present list for user to select one
      let botReply = `I found ${flights.length} flights from ${parsed.origin?.city} (${parsed.origin?.code}) to ${parsed.destination?.city} (${parsed.destination?.code}) on ${parsed.travelDate}.\n`;
      if (parsed.departureTimePreference) {
        botReply += `• Preferred Time: ${parsed.departureTimePreference}\n`;
      }
      if (parsed.passengerName) {
        botReply += `• Passenger: ${parsed.passengerName} (${parsed.age || 24} yrs`;
        if (parsed.passengerCategory && parsed.passengerCategory !== 'REGULAR') {
          botReply += `, ${parsed.passengerCategory} Concession`;
        }
        botReply += `)\n`;
      }
      if (parsed.maxBudget) {
        botReply += `• Budget Limit: Within ₹${parsed.maxBudget.toLocaleString('en-IN')}\n`;
      }
      botReply += `\nPlease select your preferred flight below to automatically prepare the booking:`;

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botReply,
          timestamp: botTimestamp,
          intent: parsed,
          matchedFlights: flights,
          suggestedAction: 'select_flight',
        },
      ]);
    } else {
      // 0 flights matched strict filter -> fallback to all available flights on route
      const fallbackFlights = db.searchFlights({
        origin: parsed.origin!.code,
        destination: parsed.destination!.code,
        date: parsed.travelDate!,
        cabinClass: parsed.cabinClass,
      });
      setMatchedFlights(fallbackFlights);

      let botReply = `No flights matched your strict budget/airline filter. Here are the available 2026 flights on this route:\n`;
      botReply += `Route: ${parsed.origin?.city} → ${parsed.destination?.city} on ${parsed.travelDate}\n\n`;
      botReply += `Select any flight below to prepare your booking:`;

      setMessages(prev => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: botReply,
          timestamp: botTimestamp,
          intent: parsed,
          matchedFlights: fallbackFlights,
          suggestedAction: 'select_flight',
        },
      ]);
    }
  };

  // User selects a flight from the list
  const handleSelectFlightFromList = (flight: Flight) => {
    const updatedIntent: ExtractedBookingIntent = {
      ...(currentIntent as ExtractedBookingIntent),
      selectedFlight: flight,
      passengerName: currentIntent.passengerName || currentUser?.fullName || 'Traveler',
      phone: currentIntent.phone || currentUser?.phone || '9876543210',
      email: currentIntent.email || currentUser?.email || 'traveler@skyline.in',
      age: currentIntent.age || 24,
      gender: currentIntent.gender || 'Female',
    };
    setCurrentIntent(updatedIntent);

    const prepared = buildPreparedBooking(flight, updatedIntent);
    setActivePreparedBooking(prepared);

    const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const replyText = `I have selected **${flight.airline} ${flight.flightNumber}** and automatically prepared your complete booking with Seat **${prepared.selectedSeat.seatNumber}**.\n\nPlease review the details below. Click **Confirm Booking & Proceed to Payment** to complete your reservation.`;

    setMessages(prev => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: botTimestamp,
        preparedBooking: prepared,
        suggestedAction: 'confirm_booking',
      },
    ]);
  };

  // User confirms the prepared booking and proceeds to the existing payment flow
  const handleProceedToPayment = (prepared: PreparedBookingSummary) => {
    onSelectFlightToBook(
      prepared.flight,
      prepared.cabinClass,
      'oneway',
      prepared.concessionType,
      {
        fullName: prepared.passengerName,
        age: prepared.age,
        gender: prepared.gender,
        phone: prepared.phone,
        email: prepared.email,
        mealPreference: prepared.mealPreference,
        concessionId: prepared.concessionId,
        specialAssistance: 'None',
      },
      prepared.selectedSeat,
      3, // Open directly at Step 3: Review & Pay
      prepared.mealPreference,
      prepared.concessionId
    );
  };

  // User wants to customize seat or details
  const handleCustomizeSeatOrDetails = (prepared: PreparedBookingSummary) => {
    onSelectFlightToBook(
      prepared.flight,
      prepared.cabinClass,
      'oneway',
      prepared.concessionType,
      {
        fullName: prepared.passengerName,
        age: prepared.age,
        gender: prepared.gender,
        phone: prepared.phone,
        email: prepared.email,
        mealPreference: prepared.mealPreference,
        concessionId: prepared.concessionId,
        specialAssistance: 'None',
      },
      prepared.selectedSeat,
      1, // Open at Step 1: Seat Map
      prepared.mealPreference,
      prepared.concessionId
    );
  };

  const handleQuickPrompt = (promptText: string) => {
    setInputValue(promptText);
  };

  const handleResetConversation = () => {
    setCurrentIntent({
      passengersCount: 1,
      cabinClass: 'Economy',
      passengerCategory: 'REGULAR',
      passengerName: undefined,
      gender: 'Female',
    });
    setActivePreparedBooking(null);
    setMatchedFlights([]);
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'bot',
        text: "Conversation reset. You can enter new travel requirements.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner - Airplane icon, clean header */}
      <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Plane className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Flight Booking ChatBot</span>
              </h1>
              <p className="text-slate-400 text-xs mt-0.5">
                Type your flight requirements to prepare your booking
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onNavigateToManual}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <span>Normal Flight Search</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetConversation}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Reset Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <Plane className="w-4 h-4 text-blue-400" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-4 text-xs sm:text-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-50 text-slate-800 border border-slate-200'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                
                {/* Inline Matched Flights List */}
                {msg.matchedFlights && msg.matchedFlights.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-200/80 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Matching Flights ({msg.matchedFlights.length})</span>
                      <span className="text-[10px] text-slate-400 font-normal">Select one to prepare booking</span>
                    </div>
                    {msg.matchedFlights.slice(0, 4).map(flight => {
                      const rawPrice = flight.basePrice;
                      const hasStudentConcession = currentIntent.passengerCategory === 'STUDENT';
                      const displayPrice = hasStudentConcession ? Math.round(rawPrice * 0.9) : rawPrice;

                      return (
                        <div
                          key={flight.id}
                          className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs hover:border-blue-500 transition-all flex items-center justify-between gap-3 text-slate-800"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-blue-600">{flight.airline}</span>
                              <span className="text-[10px] text-slate-500 font-mono">({flight.flightNumber})</span>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                                {flight.availableSeats} seats left
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-700 mt-1">
                              <span className="font-bold">{flight.departureTime}</span>
                              <span className="text-slate-400">→</span>
                              <span className="font-bold">{flight.arrivalTime}</span>
                              <span className="text-[10px] text-slate-400">({flight.duration})</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm font-black text-slate-900">
                              ₹{displayPrice.toLocaleString('en-IN')}
                            </div>
                            {hasStudentConcession && (
                              <span className="text-[10px] text-emerald-600 font-bold block">
                                10% Student Concession
                              </span>
                            )}
                            <button
                              onClick={() => handleSelectFlightFromList(flight)}
                              className="mt-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1"
                            >
                              <span>Select Flight</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Inline Prepared Booking Card inside Chat */}
                {msg.preparedBooking && (
                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                    <div className="bg-white rounded-xl p-3.5 border border-blue-200 shadow-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          Prepared Booking Summary
                        </span>
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Ready for Payment
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Flight:</span>
                          <span className="font-bold text-slate-800">
                            {msg.preparedBooking.flight.airline} {msg.preparedBooking.flight.flightNumber}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Date & Time:</span>
                          <span className="font-bold text-slate-800">
                            {msg.preparedBooking.flight.departureDate} • {msg.preparedBooking.flight.departureTime}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Passenger:</span>
                          <span className="font-bold text-slate-800">
                            {msg.preparedBooking.passengerName} ({msg.preparedBooking.age} yrs, {msg.preparedBooking.gender})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Auto-Assigned Seat:</span>
                          <span className="font-bold text-emerald-600">
                            Seat {msg.preparedBooking.selectedSeat.seatNumber} ({msg.preparedBooking.cabinClass})
                          </span>
                        </div>
                      </div>

                      {msg.preparedBooking.concessionDiscount > 0 && (
                        <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md font-semibold flex justify-between">
                          <span>{msg.preparedBooking.concessionType} Concession Applied:</span>
                          <span>-₹{msg.preparedBooking.concessionDiscount.toLocaleString('en-IN')}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block">Total Payable (Taxes Inc.):</span>
                          <span className="text-base font-extrabold text-slate-900">
                            ₹{msg.preparedBooking.totalAmount.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          onClick={() => handleProceedToPayment(msg.preparedBooking!)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
                        >
                          <span>Confirm Booking & Pay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <span className={`block text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'}`}>
                  {msg.timestamp}
                </span>
              </div>

              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Type your flight booking request..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-2xl shadow-sm transition-colors shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
