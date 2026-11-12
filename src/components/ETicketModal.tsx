import React, { useEffect, useState } from 'react';
import {
  X,
  Printer,
  Download,
  Plane,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  QrCode as QrIcon,
  Luggage,
  Info,
  Check,
  Database,
  Copy,
  RefreshCw
} from 'lucide-react';
import { Booking, Flight } from '../types';
import { db } from '../services/db';
import { generateTicketQRCode } from '../utils/qr';
import { downloadTicketPDF } from '../utils/pdf';

interface ETicketModalProps {
  pnr: string | null;
  onClose: () => void;
}

export const ETicketModal: React.FC<ETicketModalProps> = ({ pnr, onClose }) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const booking = pnr ? db.getBookingByPnr(pnr) : undefined;
  const flight = booking ? db.getFlightById(booking.flightId) : undefined;
  const originAirport = flight ? db.getAirportByCode(flight.originCode) : null;
  const destAirport = flight ? db.getAirportByCode(flight.destinationCode) : null;

  useEffect(() => {
    if (booking && flight) {
      generateTicketQRCode({
        pnr: booking.pnr,
        airline: flight.airline,
        flightNumber: flight.flightNumber,
        passengerName: booking.passenger.fullName,
        seat: booking.seatNumber,
        travelDate: booking.travelDate,
        origin: flight.originCode,
        destination: flight.destinationCode,
        cabinClass: booking.cabinClass,
      }).then(dataUrl => setQrCodeDataUrl(dataUrl));
    } else {
      setQrCodeDataUrl('');
    }
  }, [booking?.pnr, flight?.airline, flight?.flightNumber, booking?.travelDate, booking?.seatNumber, flight?.originCode, flight?.destinationCode, booking?.cabinClass]);

  if (!pnr) return null;

  if (!booking) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
        <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-900 text-lg">Booking Not Found</h3>
          <p className="text-xs text-slate-500">No booking was found with PNR: {pnr}</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-100 text-slate-800 rounded-xl font-bold text-xs hover:bg-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!booking || !flight) return;
    setDownloading(true);
    try {
      await downloadTicketPDF(booking, flight, qrCodeDataUrl);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('PDF generation error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        
        {/* Top Control Bar (Hidden during window.print) */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-blue-400 -rotate-45" />
            <span className="font-bold text-sm">Official Electronic Ticket (E-Ticket)</span>
            <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
              PNR: {booking.pnr}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Primary Download PDF Ticket Button */}
            <button
              id="download-ticket-modal-btn"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg shadow-sm transition-all ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'
              }`}
              title="Generate and download formatted PDF ticket document"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Downloaded PDF!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{downloading ? 'Generating PDF...' : 'Download PDF Ticket'}</span>
                </>
              )}
            </button>

            <button
              id="print-ticket-modal-btn"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Ticket Area */}
        <div id="printable-eticket-area" className="p-6 sm:p-8 overflow-y-auto printable-card space-y-6 bg-white text-slate-900">
          
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b-2 border-slate-800 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
                <Plane className="w-7 h-7 -rotate-45" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                  {flight?.airline || 'Skyline Airlines'}
                </h2>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Passenger Electronic Ticket & Receipt
                </p>
              </div>
            </div>

            {/* PNR Box */}
            <div className="bg-slate-900 text-white px-5 py-2.5 rounded-2xl text-right sm:text-right w-full sm:w-auto shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                Booking Reference (PNR)
              </span>
              <span className="text-2xl font-black font-mono tracking-widest text-blue-400">
                {booking.pnr}
              </span>
            </div>
          </div>

          {/* Status & Issue Info Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Booking Status:</span>
              <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[11px] ${
                booking.bookingStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                booking.bookingStatus === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                ● {booking.bookingStatus}
              </span>
            </div>
            <div>
              <span className="text-slate-500">Issued Date: </span>
              <span className="font-semibold text-slate-800">{new Date(booking.createdAt).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="text-slate-500">Cabin Class: </span>
              <span className="font-bold text-blue-700">{booking.cabinClass}</span>
            </div>
          </div>

          {/* Flight Journey Matrix */}
          <div className="bg-gradient-to-br from-blue-50/60 to-slate-50 rounded-2xl p-6 border border-blue-100">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              
              {/* Origin */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Departing From</span>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{flight?.originCode}</p>
                <p className="text-sm font-bold text-slate-800">{originAirport?.city || flight?.originCode}</p>
                <p className="text-xs text-slate-500">{originAirport?.name}</p>
                <div className="mt-2 text-xs font-semibold text-blue-900">
                  <span>Terminal: {flight?.terminal || 'T1'}</span>
                </div>
              </div>

              {/* Middle Plane & Timings */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                  <span className="h-0.5 w-12 bg-slate-300"></span>
                  <Plane className="w-5 h-5 text-blue-600 rotate-90" />
                  <span className="h-0.5 w-12 bg-slate-300"></span>
                </div>
                <p className="text-xs font-bold text-slate-700">{flight?.duration}</p>
                <p className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded inline-block mt-0.5">
                  {flight?.stops === 0 ? 'Non-Stop Direct' : `${flight?.stops} Stop`}
                </p>
                <div className="mt-2 text-xs font-mono font-bold text-slate-800">
                  {flight?.flightNumber}
                </div>
              </div>

              {/* Destination */}
              <div className="sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Arriving At</span>
                <p className="text-3xl font-black text-slate-900 tracking-tight">{flight?.destinationCode}</p>
                <p className="text-sm font-bold text-slate-800">{destAirport?.city || flight?.destinationCode}</p>
                <p className="text-xs text-slate-500">{destAirport?.name}</p>
                <div className="mt-2 text-xs font-semibold text-blue-900">
                  <span>Gate: {flight?.gate || '12A'}</span>
                </div>
              </div>

            </div>

            {/* Travel Date & Time Bar */}
            <div className="mt-6 pt-4 border-t border-blue-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Travel Date</span>
                <span className="font-bold text-slate-900 text-sm">{booking.travelDate}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Departure Time</span>
                <span className="font-bold text-slate-900 text-sm">{flight?.departureTime} hrs</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Arrival Time</span>
                <span className="font-bold text-slate-900 text-sm">{flight?.arrivalTime} hrs</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Assigned Seat</span>
                <span className="font-extrabold text-blue-600 text-base">{booking.seatNumber}</span>
              </div>
            </div>
          </div>

          {/* Passenger & QR Code Section */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            
            {/* Passenger Information */}
            <div className="sm:col-span-8 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Passenger Details & Verification
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Passenger Full Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{booking.passenger.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Age / Gender:</span>
                  <span className="font-semibold text-slate-800">{booking.passenger.age} years • {booking.passenger.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Mobile:</span>
                  <span className="font-semibold text-slate-800">{booking.passenger.phone}</span>
                </div>
                {booking.passenger.passportNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Passport Number:</span>
                    <span className="font-semibold text-slate-800">{booking.passenger.passportNumber}</span>
                  </div>
                )}
                {booking.passenger.specialAssistance !== 'None' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Special Service:</span>
                    <span className="font-bold text-blue-600">{booking.passenger.specialAssistance}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Payment Ref / Total Paid:</span>
                  <span className="font-extrabold text-slate-900">
                    ₹{booking.totalAmount.toLocaleString()} ({booking.paymentId})
                  </span>
                </div>
              </div>
            </div>

            {/* Offline Local QR Code */}
            <div className="sm:col-span-4 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt={`QR Code for PNR ${booking.pnr}`}
                  className="w-32 h-32 rounded-lg shadow-xs border border-slate-200 bg-white p-1"
                />
              ) : (
                <div className="w-32 h-32 bg-slate-200 rounded-lg flex items-center justify-center text-slate-400">
                  <QrIcon className="w-8 h-8" />
                </div>
              )}
              <span className="text-[10px] font-mono font-bold text-slate-700 mt-2">
                VERIFY-PNR: {booking.pnr}
              </span>
              <span className="text-[9px] text-slate-400">
                Official Scannable Verification QR
              </span>

              {/* Direct Download Button Under QR */}
              <button
                type="button"
                id="qr-download-pdf-btn"
                onClick={handleDownloadPdf}
                disabled={downloading}
                className={`mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors shadow-xs ${
                  downloadSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {downloadSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>PDF Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloading ? 'Downloading...' : 'Download PDF Ticket'}</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Guidelines & Baggage Note */}
          <div className="border-t border-slate-200 pt-4 text-[11px] text-slate-500 space-y-1.5">
            <p className="font-bold text-slate-700 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              Important Flight Guidelines:
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
              <li>Please report at the airport terminal at least 2 hours before scheduled domestic departure.</li>
              <li>Check-in counters close 60 minutes prior to departure; Boarding gate closes 20 minutes prior.</li>
              <li>Cabin baggage allowance: 1 piece up to 7 kg. Checked baggage: 15 kg for Economy, 25 kg for Business.</li>
              <li>Carry a valid government issued photo identity proof (Aadhaar, Passport, Voter ID, Driving License).</li>
            </ul>
          </div>

          {/* Barcode Graphic Simulation */}
          <div className="border-t-2 border-dashed border-slate-300 pt-4 flex flex-col items-center">
            <div className="w-full max-w-sm h-8 bg-[repeating-linear-gradient(90deg,#0f172a_0px,#0f172a_2px,transparent_2px,transparent_4px,#0f172a_4px,#0f172a_7px,transparent_7px,transparent_9px,#0f172a_9px,#0f172a_10px)] opacity-80"></div>
            <p className="font-mono text-[10px] tracking-widest text-slate-400 mt-1">
              *{booking.pnr}-{flight?.flightNumber || 'FLIGHT'}-AIRLINE-TICKET*
            </p>
          </div>

        </div>

        {/* Bottom Control Bar (Hidden during window.print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 no-print shrink-0">
          <div className="text-xs text-slate-600 text-center sm:text-left">
            <span className="font-bold text-slate-900">{booking.passenger.fullName}</span>
            <span className="mx-1.5 text-slate-400">•</span>
            <span>Flight {flight?.flightNumber}</span>
            <span className="mx-1.5 text-slate-400">•</span>
            <span>Seat {booking.seatNumber} ({booking.cabinClass})</span>
            <span className="mx-1.5 text-slate-400">•</span>
            <span className="font-mono font-bold text-blue-600">PNR: {booking.pnr}</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              id="footer-download-ticket-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={downloading}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
              }`}
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{downloading ? 'Generating PDF...' : 'Download PDF Ticket'}</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
