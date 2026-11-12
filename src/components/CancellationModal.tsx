import React, { useState } from 'react';
import { X, AlertTriangle, CheckCircle, RefreshCcw, ShieldCheck, DollarSign } from 'lucide-react';
import { Booking, Flight } from '../types';
import { db } from '../services/db';

interface CancellationModalProps {
  booking: Booking;
  flight: Flight | undefined;
  isOpen: boolean;
  onClose: () => void;
  onCancellationSuccess: () => void;
}

export const CancellationModal: React.FC<CancellationModalProps> = ({
  booking,
  flight,
  isOpen,
  onClose,
  onCancellationSuccess,
}) => {
  const [reason, setReason] = useState('Change of travel plans by passenger');
  const [confirmed, setConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successInfo, setSuccessInfo] = useState<{ charge: number; refund: number } | null>(null);

  if (!isOpen) return null;

  // Calculation policy: flat ₹500 or 10% whichever is greater, rest refunded
  const cancellationCharge = Math.min(Math.max(500, Math.round(booking.totalAmount * 0.1)), booking.totalAmount);
  const refundAmount = Math.max(0, booking.totalAmount - cancellationCharge);

  const handleConfirmCancellation = () => {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const { refundAmount } = db.cancelBooking(booking.pnr, reason);
        setSuccessInfo({ charge: cancellationCharge, refund: refundAmount });
        onCancellationSuccess();
      } catch (err: any) {
        alert(err.message || 'Cancellation failed');
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm">Ticket Cancellation & Refund Simulation</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!successInfo ? (
            <>
              {/* Ticket Details summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Booking Reference:</span>
                  <span className="font-mono font-bold text-slate-900">{booking.pnr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Passenger & Flight:</span>
                  <span className="font-semibold text-slate-800">
                    {booking.passenger.fullName} • {flight?.flightNumber || 'FLIGHT'} ({flight?.originCode} → {flight?.destinationCode})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Travel Date & Seat:</span>
                  <span className="font-semibold text-slate-800">
                    {booking.travelDate} • Seat {booking.seatNumber} ({booking.cabinClass})
                  </span>
                </div>
              </div>

              {/* Transparent Refund Policy Breakdown */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs space-y-2">
                <h4 className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-amber-700" />
                  <span>Cancellation Charges & Refund Calculation</span>
                </h4>
                
                <div className="divide-y divide-amber-200/60 pt-1">
                  <div className="py-1.5 flex justify-between">
                    <span className="text-amber-800">Original Ticket Price:</span>
                    <span className="font-bold text-slate-900">₹{booking.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="py-1.5 flex justify-between">
                    <span className="text-amber-800">Standard Cancellation Fee:</span>
                    <span className="font-bold text-red-600">- ₹{cancellationCharge.toLocaleString()}</span>
                  </div>
                  <div className="py-2 flex justify-between text-sm font-extrabold text-emerald-800 bg-emerald-50 -mx-4 px-4 mt-1 rounded-lg">
                    <span>Estimated Refund Amount:</span>
                    <span className="text-emerald-700">₹{refundAmount.toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-[10px] text-amber-700 mt-2">
                  * Note: Releasing this ticket will immediately return seat {booking.seatNumber} back to available inventory.
                </p>
              </div>

              {/* Cancellation Reason Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Cancellation
                </label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Change of travel plans by passenger">Change of travel plans by passenger</option>
                  <option value="Medical emergency / health condition">Medical emergency / health condition</option>
                  <option value="Flight schedule conflict">Flight schedule conflict</option>
                  <option value="Duplicate booking made by mistake">Duplicate booking made by mistake</option>
                  <option value="Personal emergency">Personal emergency</option>
                </select>
              </div>

              {/* Checkbox agreement */}
              <div>
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 select-none">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    onChange={e => setConfirmed(e.target.checked)}
                    className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                  />
                  <span>
                    I understand that once cancelled, this ticket cannot be reinstated, and the simulated refund of ₹{refundAmount.toLocaleString()} will be credited to my simulated payment account.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
                >
                  Keep Ticket
                </button>

                <button
                  type="button"
                  disabled={!confirmed || isProcessing}
                  onClick={handleConfirmCancellation}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  {isProcessing ? 'Processing Cancellation...' : 'Confirm & Process Refund'}
                </button>
              </div>
            </>
          ) : (
            /* Success confirmation */
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Booking Cancelled Successfully</h3>
                <p className="text-xs text-slate-500 mt-1">
                  PNR {booking.pnr} has been updated to CANCELLED.
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1.5 text-left max-w-sm mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cancellation Fee Deducted:</span>
                  <span className="font-bold text-red-600">₹{successInfo.charge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Refund Simulated to Source:</span>
                  <span className="font-extrabold text-emerald-700">₹{successInfo.refund.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Seat Released:</span>
                  <span className="font-semibold text-slate-800">{booking.seatNumber} (Now Available)</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
