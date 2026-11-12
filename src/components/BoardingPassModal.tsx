import React, { useEffect, useState } from 'react';
import { X, Printer, Download, Plane, QrCode as QrIcon, CheckCircle2 } from 'lucide-react';
import { Booking, Flight } from '../types';
import { db } from '../services/db';
import { generateTicketQRCode } from '../utils/qr';

interface BoardingPassModalProps {
  booking: Booking;
  flight: Flight;
  onClose: () => void;
}

export const BoardingPassModal: React.FC<BoardingPassModalProps> = ({ booking, flight, onClose }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
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
    }).then(url => setQrCodeUrl(url));
  }, [booking, flight]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printContent = document.getElementById('printable-boarding-pass')?.innerHTML || '';
    const blob = new Blob([
      `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <title>BoardingPass_${booking.pnr}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body { font-family: sans-serif; background: #f1f5f9; padding: 20px; }
          .boarding-pass-wrap { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
        </style>
      </head>
      <body>
        <div class="boarding-pass-wrap">
          ${printContent}
        </div>
      </body>
      </html>`
    ], { type: 'text/html' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BoardingPass_${booking.pnr}_Seat${booking.seatNumber}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden my-6 flex flex-col">
        
        {/* Top bar */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Digital Boarding Pass</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
              Web Checked-in
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Boarding Pass Body (Authentic airline boarding pass styling with tear-off stub) */}
        <div id="printable-boarding-pass" className="p-6 printable-card bg-slate-50">
          <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden flex flex-col md:flex-row">
            
            {/* Main Boarding Pass Section */}
            <div className="flex-1 p-6 space-y-4 border-b md:border-b-0 md:border-r-2 border-dashed border-slate-300">
              {/* Top Banner */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {flight.airline.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm tracking-tight">{flight.airline}</h3>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Boarding Pass</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Class</span>
                  <span className="font-extrabold text-blue-700 text-xs">{booking.cabinClass}</span>
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center justify-between py-2 border-y border-slate-100">
                <div>
                  <span className="text-2xl font-black text-slate-900">{flight.originCode}</span>
                  <p className="text-[11px] text-slate-500 font-semibold">{db.getAirportByCode(flight.originCode)?.city}</p>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[10px] text-slate-400 font-bold">{flight.flightNumber}</span>
                  <Plane className="w-4 h-4 text-blue-600 rotate-90 my-0.5" />
                  <span className="text-[10px] text-slate-400">{flight.duration}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">{flight.destinationCode}</span>
                  <p className="text-[11px] text-slate-500 font-semibold">{db.getAirportByCode(flight.destinationCode)?.city}</p>
                </div>
              </div>

              {/* Key Passenger Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Passenger Name</span>
                  <span className="font-bold text-slate-900">{booking.passenger.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Travel Date</span>
                  <span className="font-bold text-slate-900">{booking.travelDate}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Gate</span>
                  <span className="font-black text-emerald-700 text-base">{flight.gate || '12A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Boarding Time</span>
                  <span className="font-black text-amber-700 text-base">{booking.boardingTime || '06:00'}</span>
                </div>
              </div>
            </div>

            {/* Stub Section */}
            <div className="w-full md:w-56 p-6 bg-slate-50 flex flex-col justify-between items-center text-center space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">PNR Reference</span>
                <span className="font-black text-xl font-mono text-blue-900 tracking-wider">{booking.pnr}</span>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200 w-full">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Assigned Seat</span>
                <span className="text-3xl font-black text-blue-600 tracking-tight">{booking.seatNumber}</span>
                <span className="text-[10px] text-slate-500 block">{booking.cabinClass}</span>
              </div>

              {/* QR Code */}
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Boarding QR" className="w-24 h-24 rounded border border-slate-300 bg-white p-1" />
              ) : (
                <div className="w-24 h-24 bg-slate-200 rounded flex items-center justify-center">
                  <QrIcon className="w-6 h-6 text-slate-400" />
                </div>
              )}

              <span className="text-[9px] text-slate-400 font-mono">GATE SECURITY SCAN</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
