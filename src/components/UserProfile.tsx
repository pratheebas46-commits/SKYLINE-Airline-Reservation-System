import React, { useState, useMemo } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Plane,
  FileText,
  Sliders,
  Calendar,
  MapPin,
  Save,
  Compass
} from 'lucide-react';
import { User, Passenger, CabinClass } from '../types';
import { db } from '../services/db';

interface UserProfileProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  onViewBookings: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({
  currentUser,
  onUpdateUser,
  onViewBookings,
}) => {
  // Personal Details
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [phone, setPhone] = useState(currentUser.phone);
  const [dob, setDob] = useState(currentUser.dob || '1996-05-14');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>(currentUser.gender || 'Male');
  const [passportNumber, setPassportNumber] = useState(currentUser.passportNumber || '');

  // Address & ID Details
  const [address, setAddress] = useState(currentUser.address || '');
  const [city, setCity] = useState(currentUser.city || 'New Delhi');
  const [state, setState] = useState(currentUser.state || 'Delhi');
  const [pincode, setPincode] = useState(currentUser.pincode || '110001');
  const [govIdType, setGovIdType] = useState(currentUser.govIdType || 'Aadhaar Card');
  const [govIdNumber, setGovIdNumber] = useState(currentUser.govIdNumber || '');

  // Travel Preferences
  const [preferredCabinClass, setPreferredCabinClass] = useState<CabinClass>(
    currentUser.preferredCabinClass || 'Economy'
  );
  const [preferredSeatType, setPreferredSeatType] = useState<'Window' | 'Aisle' | 'Middle'>(
    currentUser.preferredSeatType || 'Window'
  );
  const [preferredTravelTime, setPreferredTravelTime] = useState<'morning' | 'afternoon' | 'evening' | 'ALL'>(
    currentUser.preferredTravelTime || 'morning'
  );
  const [preferredRoute, setPreferredRoute] = useState<string>(
    currentUser.preferredRoute || 'DEL → BOM'
  );

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Compute Frequently Used Route from user's actual booking history in DB
  const frequentRoute = useMemo(() => {
    const userBookings = db.getBookings(currentUser.id);
    if (!userBookings || userBookings.length === 0) return 'DEL → BOM (Suggested Hub)';
    const routeCounts: Record<string, number> = {};
    userBookings.forEach(b => {
      const flight = db.getFlightById(b.flightId);
      if (flight) {
        const key = `${flight.originCode} → ${flight.destinationCode}`;
        routeCounts[key] = (routeCounts[key] || 0) + 1;
      }
    });
    const sorted = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : 'DEL → BOM';
  }, [currentUser.id]);

  // Saved travelers
  const [savedPassengers, setSavedPassengers] = useState<Passenger[]>(
    db.getSavedPassengers(currentUser.id)
  );
  const [isAddPassengerOpen, setIsAddPassengerOpen] = useState(false);
  const [newTraveler, setNewTraveler] = useState<Partial<Passenger>>({
    fullName: '',
    age: 30,
    gender: 'Male',
    phone: '',
    email: '',
    passportNumber: '',
    specialAssistance: 'None',
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = db.updateUserProfile(currentUser.id, {
      fullName,
      phone,
      dob,
      gender,
      passportNumber,
      address,
      city,
      state,
      pincode,
      govIdType,
      govIdNumber,
      preferredCabinClass,
      preferredSeatType,
      preferredTravelTime,
      preferredRoute,
    });
    if (updated) {
      onUpdateUser(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleAddTraveler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTraveler.fullName || !newTraveler.phone) {
      alert('Please provide name and phone');
      return;
    }
    db.savePassengerForUser(currentUser.id, newTraveler as Passenger);
    setSavedPassengers(db.getSavedPassengers(currentUser.id));
    setIsAddPassengerOpen(false);
    setNewTraveler({
      fullName: '',
      age: 30,
      gender: 'Male',
      phone: '',
      email: '',
      passportNumber: '',
      specialAssistance: 'None',
    });
  };

  const handleDeleteTraveler = (travelerId: string) => {
    db.deleteSavedPassenger(currentUser.id, travelerId);
    setSavedPassengers(db.getSavedPassengers(currentUser.id));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      
      {/* Header Profile Card */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black shadow-md border-2 border-blue-400/30">
              {currentUser.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">{currentUser.fullName}</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Username: @{currentUser.username} • Email: {currentUser.email} • Member ID: {currentUser.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-xs border border-white/15 px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">Frequent Flyer Miles</span>
              <span className="text-lg font-black text-white">1,450 pts</span>
            </div>

            <button
              onClick={onViewBookings}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>My Bookings</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SECTION 1: PERSONAL INFORMATION */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-600" />
                <span>Personal Information</span>
              </h3>
              {savedSuccess && (
                <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Username (System ID)</label>
                <input
                  type="text"
                  disabled
                  value={currentUser.username}
                  className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-xl px-3 py-2 text-xs cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registered Email</label>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full bg-slate-100 text-slate-500 border border-slate-200 rounded-xl px-3 py-2 text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Mobile *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Govt ID Type</label>
                <select
                  value={govIdType}
                  onChange={e => setGovIdType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Driving License">Driving License</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Govt ID / Passport Number</label>
                <input
                  type="text"
                  value={govIdNumber || passportNumber}
                  onChange={e => {
                    setGovIdNumber(e.target.value);
                    setPassportNumber(e.target.value);
                  }}
                  placeholder="e.g. XXXX-XXXX-8912 or Z5892144"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: TRAVEL & PROFILE INFORMATION */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Travel Preferences</span>
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Cabin Class</label>
                <select
                  value={preferredCabinClass}
                  onChange={e => setPreferredCabinClass(e.target.value as CabinClass)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Economy">Economy Class</option>
                  <option value="Business">Business Class</option>
                  <option value="First">First Class</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Seat Preference</label>
                <select
                  value={preferredSeatType}
                  onChange={e => setPreferredSeatType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Window">Window Seat (A / F)</option>
                  <option value="Aisle">Aisle Seat (C / D)</option>
                  <option value="Middle">Middle Seat (B / E)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Preferred Travel Time</label>
                <select
                  value={preferredTravelTime}
                  onChange={e => setPreferredTravelTime(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="morning">Morning (06:00 - 12:00)</option>
                  <option value="afternoon">Afternoon (12:00 - 17:00)</option>
                  <option value="evening">Evening (17:00 - 22:00)</option>
                  <option value="ALL">Any Time of Day</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Frequently Used Route
                </label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 text-xs">{frequentRoute}</span>
                    <span className="text-[10px] font-bold uppercase bg-blue-200/60 text-blue-800 px-2 py-0.5 rounded">
                      From Booking History
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Save Changes Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile & Travel Preferences</span>
          </button>
        </div>

      </form>

      {/* Saved Travelers (1-click booking autofill) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Saved Travelers</h3>
            <p className="text-[11px] text-slate-400">Autofill family & colleagues during booking</p>
          </div>

          <button
            onClick={() => setIsAddPassengerOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Traveler</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {savedPassengers.length === 0 ? (
            <div className="col-span-3 py-8 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
              <UserIcon className="w-8 h-8 mx-auto text-slate-300 mb-1" />
              <p className="text-xs font-semibold text-slate-600">No saved travelers yet</p>
              <p className="text-[11px] text-slate-400">Save family members to quickly autofill ticket forms.</p>
            </div>
          ) : (
            savedPassengers.map(p => (
              <div
                key={p.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900">{p.fullName}</span>
                  <p className="text-[11px] text-slate-500">
                    {p.gender}, {p.age} yrs • {p.phone}
                  </p>
                  {p.passportNumber && (
                    <p className="text-[10px] text-blue-700 font-mono">Passport: {p.passportNumber}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteTraveler(p.id)}
                  className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors"
                  title="Remove traveler"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Traveler Modal */}
      {isAddPassengerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <h3 className="font-black text-slate-900 text-base">Add New Saved Traveler</h3>

            <form onSubmit={handleAddTraveler} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  value={newTraveler.fullName}
                  onChange={e => setNewTraveler({ ...newTraveler, fullName: e.target.value })}
                  placeholder="e.g. Priya Sharma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Age *</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    required
                    value={newTraveler.age}
                    onChange={e => setNewTraveler({ ...newTraveler, age: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={newTraveler.gender}
                    onChange={e => setNewTraveler({ ...newTraveler, gender: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Mobile *</label>
                <input
                  type="tel"
                  required
                  value={newTraveler.phone}
                  onChange={e => setNewTraveler({ ...newTraveler, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPassengerOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  Save Traveler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
