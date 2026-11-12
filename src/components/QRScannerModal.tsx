import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Plane,
  Download,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
  QrCode
} from 'lucide-react';
import { Booking, Flight } from '../types';
import { db } from '../services/db';
import { downloadTicketPDF } from '../utils/pdf';
import { parseTicketQRText } from '../utils/qr';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTicketModal: (pnr: string) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onOpenTicketModal,
}) => {
  const [searchPnrInput, setSearchPnrInput] = useState('');
  const [foundBooking, setFoundBooking] = useState<Booking | null>(null);
  const [foundFlight, setFoundFlight] = useState<Flight | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen) return null;

  // Handle manual PNR / QR code string verification
  const handleVerify = (pnrToVerify?: string) => {
    const rawInput = (pnrToVerify || searchPnrInput).trim();
    if (!rawInput) return;

    setErrorMessage(null);

    // Try full QR parser first (handles JSON or pipe/newline formatted QR payloads)
    const parsed = parseTicketQRText(rawInput);
    let cleanedPnr = parsed?.pnr;

    if (!cleanedPnr) {
      // Regex match for PNR:XXXX or 6-12 character alphanumeric code
      const pnrPrefixMatch = rawInput.match(/PNR[:=\s]*([A-Z0-9]+)/i);
      if (pnrPrefixMatch) {
        cleanedPnr = pnrPrefixMatch[1].toUpperCase();
      } else {
        const generalMatch = rawInput.toUpperCase().match(/\b([A-Z0-9]{6,12})\b/);
        cleanedPnr = generalMatch ? generalMatch[1] : rawInput.toUpperCase();
      }
    }

    const booking = db.getBookingByPnr(cleanedPnr);
    if (booking) {
      db.markTicketVerified(cleanedPnr);
      setFoundBooking(booking);
      const flight = db.getFlightById(booking.flightId);
      setFoundFlight(flight || null);
    } else {
      setFoundBooking(null);
      setFoundFlight(null);
      setErrorMessage(`No verified booking found for reference "${cleanedPnr}". Please check your PNR reference code.`);
    }
  };

  // Reset to verify another ticket
  const handleVerifyAnother = () => {
    setFoundBooking(null);
    setFoundFlight(null);
    setErrorMessage(null);
    setSearchPnrInput('');
  };

  // Handle PDF download
  const handleDownloadPdf = async () => {
    if (!foundBooking || !foundFlight) return;
    setIsDownloadingPdf(true);
    try {
      await downloadTicketPDF(foundBooking, foundFlight);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const recentBookings = db.getBookings().slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Ticket Verification</h2>
              <p className="text-[11px] text-slate-400">
                Verify passenger ticket details, booking status & download official PDF
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {foundBooking ? (
            /* VERIFIED TICKET VIEW */
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              
              {/* Verification Status Banner */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-xl mt-0.5">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Ticket Verified • Authentic Booking
                    </span>
                    <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                      VALID
                    </span>
                  </div>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Official booking reference matched. All flight segments, seat assignment, and passenger details are active.
                  </p>
                </div>
              </div>

              {/* Verified Ticket Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                
                {/* Card Header */}
                <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Booking Reference (PNR)
                    </span>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <span className="text-2xl font-black font-mono tracking-widest text-blue-400">
                        {foundBooking.pnr}
                      </span>
                      {foundFlight?.airline && (
                        <span className="text-xs font-bold text-amber-300 bg-amber-950/70 px-2.5 py-0.5 rounded-full border border-amber-500/40">
                          {foundFlight.airline}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
                      foundBooking.bookingStatus === 'CONFIRMED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      foundBooking.bookingStatus === 'CHECKED_IN' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}>
                      ● {foundBooking.bookingStatus}
                    </span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
                      {foundBooking.cabinClass} Class
                    </span>
                  </div>
                </div>

                {/* Flight Route Banner */}
                {foundFlight && (
                  <div className="p-4 bg-white border-b border-slate-200">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
                        <div className="text-xl font-black text-slate-900">{foundFlight.originCode}</div>
                        <div className="text-xs text-slate-600">{db.getAirportByCode(foundFlight.originCode)?.city}</div>
                        <div className="text-xs font-semibold text-blue-700 mt-1">{foundFlight.departureTime} hrs</div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-xs font-mono font-bold text-slate-800">{foundFlight.flightNumber}</span>
                        <div className="flex items-center gap-1 text-slate-300 my-1">
                          <span className="w-8 h-0.5 bg-slate-200"></span>
                          <Plane className="w-4 h-4 text-blue-600" />
                          <span className="w-8 h-0.5 bg-slate-200"></span>
                        </div>
                        <span className="text-[11px] text-slate-500">{foundBooking.travelDate}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
                        <div className="text-xl font-black text-slate-900">{foundFlight.destinationCode}</div>
                        <div className="text-xs text-slate-600">{db.getAirportByCode(foundFlight.destinationCode)?.city}</div>
                        <div className="text-xs font-semibold text-emerald-700 mt-1">{foundFlight.arrivalTime} hrs</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Passenger Breakdown Details */}
                <div className="p-4 space-y-2.5 text-xs bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Passenger Name</span>
                      <span className="font-bold text-slate-900 text-sm">{foundBooking.passenger.fullName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Age & Gender</span>
                      <span className="font-semibold text-slate-800">{foundBooking.passenger.age} Years • {foundBooking.passenger.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Assigned Seat</span>
                      <span className="font-extrabold text-blue-700 text-base">{foundBooking.seatNumber}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Terminal & Gate</span>
                      <span className="font-semibold text-slate-800">
                        Terminal {foundFlight?.terminal || 'T1'} • Gate {foundFlight?.gate || '12A'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-slate-600 text-xs">
                    <div>
                      <span>Contact: <strong>{foundBooking.passenger.phone}</strong> • {foundBooking.passenger.email}</span>
                    </div>
                    <div>
                      <span>Total Fare: <strong className="text-slate-900">₹{foundBooking.totalAmount.toLocaleString()}</strong></span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  id="verification-download-pdf-btn"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Ticket'}</span>
                </button>

                <button
                  type="button"
                  id="verification-view-full-btn"
                  onClick={() => {
                    onOpenTicketModal(foundBooking.pnr);
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-blue-400" />
                  <span>View Full E-Ticket & Print</span>
                </button>

                <button
                  type="button"
                  onClick={handleVerifyAnother}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Verify Another Ticket</span>
                </button>
              </div>

            </div>
          ) : (
            /* VERIFICATION FORM VIEW */
            <div className="space-y-5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerify();
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Enter Passenger Booking Reference (PNR):
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchPnrInput}
                      onChange={(e) => setSearchPnrInput(e.target.value.toUpperCase())}
                      placeholder="e.g. A9B2X7"
                      maxLength={12}
                      autoFocus
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-mono text-lg font-black text-slate-900 uppercase tracking-widest focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={!searchPnrInput.trim()}
                      className="absolute right-2 top-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                    >
                      Verify Ticket
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    The 6-character PNR code is printed on your booking confirmation or ticket.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800 animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p>{errorMessage}</p>
                  </div>
                )}
              </form>

              {/* Quick test with recent bookings */}
              {recentBookings.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2.5">
                    Recent Bookings in System:
                  </span>
                  <div className="space-y-2">
                    {recentBookings.map((b) => {
                      const fl = db.getFlightById(b.flightId);
                      return (
                        <div
                          key={b.pnr}
                          onClick={() => {
                            setSearchPnrInput(b.pnr);
                            handleVerify(b.pnr);
                          }}
                          className="flex items-center justify-between p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200 hover:border-blue-300 rounded-xl cursor-pointer transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-blue-700 text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                              {b.pnr}
                            </span>
                            <span className="font-semibold text-slate-800">{b.passenger.fullName}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-600">Seat {b.seatNumber}</span>
                          </div>

                          <div className="flex items-center gap-2 text-slate-500">
                            <span>{fl?.originCode} → {fl?.destinationCode}</span>
                            <span className="text-blue-600 font-bold">Verify →</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
