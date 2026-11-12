import React, { useMemo } from 'react';
import { Seat, CabinClass, Flight } from '../types';
import { db } from '../services/db';
import { Sparkles, Armchair, ShieldAlert, Check } from 'lucide-react';

interface SeatMapProps {
  flight: Flight;
  cabinClass: CabinClass;
  selectedSeatNumber: string | null;
  onSelectSeat: (seat: Seat) => void;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  flight,
  cabinClass,
  selectedSeatNumber,
  onSelectSeat,
}) => {
  const seats = useMemo(() => {
    return db.getSeatsForFlight(flight.id);
  }, [flight.id]);

  // Group seats by rows
  const rowNumbers = useMemo(() => {
    const rows = new Set<number>();
    seats.forEach(s => rows.add(s.row));
    return Array.from(rows).sort((a, b) => a - b);
  }, [seats]);

  const selectedSeat = useMemo(() => {
    return seats.find(s => s.seatNumber === selectedSeatNumber) || null;
  }, [seats, selectedSeatNumber]);

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Armchair className="w-5 h-5 text-blue-600" />
            <span>Interactive Aircraft Seat Selection</span>
          </h3>
          <p className="text-xs text-slate-500">
            Flight {flight.flightNumber} ({flight.originCode} → {flight.destinationCode}) • Click on any available seat
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md border border-slate-300 bg-white inline-block"></span>
            <span className="text-slate-600 font-medium">Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-blue-600 border border-blue-600 inline-block text-white flex items-center justify-center">
              <Check className="w-3.5 h-3.5" />
            </span>
            <span className="text-slate-600 font-medium">Selected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md border border-amber-400 bg-amber-50 inline-block"></span>
            <span className="text-slate-600 font-medium">Premium / Legroom</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-md bg-slate-200 border border-slate-300 text-slate-400 inline-block text-center font-bold text-[10px] leading-5">
              ✕
            </span>
            <span className="text-slate-500 font-medium">Booked</span>
          </div>
        </div>
      </div>

      {/* Selected Seat Summary Card */}
      <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-base shadow-xs">
            {selectedSeat ? selectedSeat.seatNumber : '--'}
          </div>
          <div>
            <p className="text-xs text-blue-800 font-bold">
              {selectedSeat ? `Selected Seat ${selectedSeat.seatNumber} (${selectedSeat.cabinClass})` : 'No seat selected yet'}
            </p>
            <p className="text-[11px] text-blue-600">
              {selectedSeat
                ? `${selectedSeat.col === 'A' || selectedSeat.col === 'F' ? 'Window' : selectedSeat.col === 'C' || selectedSeat.col === 'D' ? 'Aisle' : 'Middle'} seat • ${selectedSeat.isPremium ? 'Extra Legroom Included' : 'Standard comfort'}`
                : 'Click an available seat on the fuselage map below'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500 font-medium">Seat Selection Fee</p>
          <p className="text-sm font-bold text-slate-900">
            {selectedSeat ? (selectedSeat.extraPrice > 0 ? `+₹${selectedSeat.extraPrice}` : 'Free') : '₹0'}
          </p>
        </div>
      </div>

      {/* Airplane Fuselage Graphic Container */}
      <div className="mt-6 flex justify-center overflow-x-auto pb-4">
        <div className="w-full max-w-md bg-slate-50/80 rounded-t-[70px] rounded-b-2xl border-2 border-slate-300 p-4 pt-8 relative shadow-inner">
          
          {/* Nose & Cockpit */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-4 bg-slate-300 rounded-full mb-1 flex items-center justify-center gap-1">
              <span className="w-3 h-1.5 bg-slate-600 rounded-xs"></span>
              <span className="w-3 h-1.5 bg-slate-600 rounded-xs"></span>
            </div>
            <span className="text-[10px] tracking-widest uppercase font-bold text-slate-400">Front Cockpit</span>
          </div>

          {/* Column Letters */}
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-bold text-slate-500 mb-2 px-2">
            <div>A</div>
            <div>B</div>
            <div>C</div>
            <div className="text-[10px] text-slate-400 uppercase">Aisle</div>
            <div>D</div>
            <div>E</div>
            <div>F</div>
          </div>

          {/* Seat Grid Rows */}
          <div className="space-y-1.5">
            {rowNumbers.map(row => {
              const rowSeats = seats.filter(s => s.row === row);
              const isExitRow = row === 12 || row === 13;
              const isFirstClassRow = row <= 2;
              const isBusinessRow = row > 2 && row <= 6;

              return (
                <div key={row} className="relative">
                  {/* Exit Row Marker */}
                  {isExitRow && row === 12 && (
                    <div className="my-2 py-1 px-3 bg-amber-100 border border-amber-300 rounded text-[10px] text-amber-900 font-bold flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-700" />
                        EMERGENCY EXIT ROW
                      </span>
                      <span>Extra Legroom</span>
                    </div>
                  )}

                  {/* Cabin divider label */}
                  {row === 1 && (
                    <div className="text-[10px] uppercase font-bold tracking-wider text-purple-700 bg-purple-50 rounded py-0.5 px-2 mb-1 border border-purple-200 text-center">
                      First Class
                    </div>
                  )}
                  {row === 3 && (
                    <div className="text-[10px] uppercase font-bold tracking-wider text-blue-700 bg-blue-50 rounded py-0.5 px-2 my-1 border border-blue-200 text-center">
                      Business Class
                    </div>
                  )}
                  {row === 7 && (
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-700 bg-slate-100 rounded py-0.5 px-2 my-1 border border-slate-200 text-center">
                      Economy Class
                    </div>
                  )}

                  <div className="grid grid-cols-7 gap-1.5 items-center px-1">
                    {/* Seat A */}
                    {renderSeatBtn(rowSeats.find(s => s.col === 'A'))}
                    {/* Seat B */}
                    {renderSeatBtn(rowSeats.find(s => s.col === 'B'))}
                    {/* Seat C */}
                    {renderSeatBtn(rowSeats.find(s => s.col === 'C'))}

                    {/* Aisle Row Number */}
                    <div className="text-[10px] font-semibold text-slate-400 text-center select-none py-1">
                      {row}
                    </div>

                    {/* Seat D */}
                    {renderSeatBtn(rowSeats.find(s => s.col === 'D'))}
                    {/* Seat E */}
                    {renderSeatBtn(rowSeats.find(s => s.col === 'E'))}
                    {/* Seat F */}
                    {renderSeatBtn(rowSeats.find(s => s.col === 'F'))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Galley & Restrooms */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-around text-[11px] text-slate-400 font-medium">
            <span>Restrooms 🚻</span>
            <span>Rear Galley ☕</span>
            <span>Emergency Exit 🚪</span>
          </div>
        </div>
      </div>
    </div>
  );

  function renderSeatBtn(seat: Seat | undefined) {
    if (!seat) return <div className="w-8 h-8"></div>;

    const isSelected = selectedSeatNumber === seat.seatNumber;
    const isBooked = seat.isBooked;

    let baseStyle = 'w-8 h-8 rounded-md text-[11px] font-bold transition-all flex items-center justify-center relative cursor-pointer ';

    if (isBooked) {
      return (
        <button
          key={seat.seatNumber}
          disabled
          type="button"
          title={`Seat ${seat.seatNumber} is already booked`}
          className={baseStyle + 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'}
        >
          ✕
        </button>
      );
    }

    if (isSelected) {
      return (
        <button
          key={seat.seatNumber}
          type="button"
          onClick={() => onSelectSeat(seat)}
          title={`Seat ${seat.seatNumber} selected`}
          className={baseStyle + 'bg-blue-600 text-white border-2 border-blue-700 shadow-md transform scale-105 ring-2 ring-blue-300'}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      );
    }

    if (seat.isPremium) {
      return (
        <button
          key={seat.seatNumber}
          type="button"
          onClick={() => onSelectSeat(seat)}
          title={`Premium Seat ${seat.seatNumber} (+₹${seat.extraPrice})`}
          className={baseStyle + 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 hover:border-amber-500'}
        >
          {seat.seatNumber}
        </button>
      );
    }

    return (
      <button
        key={seat.seatNumber}
        type="button"
        onClick={() => onSelectSeat(seat)}
        title={`Seat ${seat.seatNumber} (Standard)`}
        className={baseStyle + 'bg-white hover:bg-blue-50 text-slate-700 border border-slate-300 hover:border-blue-400'}
      >
        {seat.seatNumber}
      </button>
    );
  }
};
