import React, { useState } from 'react';
import {
  HelpCircle,
  PhoneCall,
  Mail,
  FileText,
  ShieldCheck,
  Luggage,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plane,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';

interface HelpAndSupportProps {
  onNavigate: (view: string) => void;
}

export const HelpAndSupport: React.FC<HelpAndSupportProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [queryName, setQueryName] = useState('');
  const [queryEmail, setQueryEmail] = useState('');
  const [querySubject, setQuerySubject] = useState('Baggage Query');
  const [queryMessage, setQueryMessage] = useState('');
  const [queryTicketId, setQueryTicketId] = useState<string | null>(null);

  const faqs = [
    {
      q: 'What is the domestic baggage allowance for check-in and cabin luggage?',
      a: 'For standard Economy class on Indian domestic sectors, passengers are permitted 1 piece of cabin baggage weighing up to 7 kg (dimensions up to 115 cm) plus 1 small laptop bag/purse. Standard check-in allowance is 15 kg per passenger (30 kg for Business Class).'
    },
    {
      q: 'When does Web Check-in open and close for domestic flights?',
      a: 'Web check-in opens 48 hours prior to scheduled departure and closes 60 minutes prior to domestic flight departure. Once completed, your digital boarding pass with verifiable QR code is immediately available for download.'
    },
    {
      q: 'What Government Photo IDs are valid for airport entry in India?',
      a: 'Valid photo identification documents include: Aadhaar Card (physical or m-Aadhaar), Passport, Voter ID Card, Driving License, Central/State Govt Employee ID, or Student Photo ID for bona fide students.'
    },
    {
      q: 'How does cancellation and simulated refund work?',
      a: 'Cancellations can be made up to 2 hours prior to scheduled departure. In accordance with airline rules, a flat fee of ₹500 (or 10%) applies, and the remaining balance is processed back to your original payment method with a cancellation receipt.'
    },
    {
      q: 'Does this flight reservation portal require internet or external APIs to work?',
      a: 'No. The entire system—including ticket generation, QR code verification, local offline AI/ML recommendations, and database storage—is completely self-contained and operates 100% offline without any third-party API keys.'
    }
  ];

  const handleSubmitQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryName || !queryEmail || !queryMessage) return;
    const ticketId = `SUP-${Math.floor(100000 + Math.random() * 900000)}`;
    setQueryTicketId(ticketId);
    setQueryName('');
    setQueryEmail('');
    setQueryMessage('');
  };

  return (
    <div className="max-w-5xl mx-auto py-4 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Passenger Care & Grievance Cell</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Help & Support Center</h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Find answers to frequently asked questions about domestic air travel, baggage allowances, check-in, and refunds.
          </p>
        </div>

        <div className="p-4 bg-white/10 rounded-2xl border border-white/15 text-center shrink-0">
          <p className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Domestic Passenger Toll-Free</p>
          <p className="text-xl font-black text-white mt-0.5">1800-SKY-LINE</p>
          <p className="text-[11px] text-slate-300 mt-0.5">(1800-759-5463)</p>
        </div>
      </div>

      {/* 3 Support Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Luggage className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Baggage Guidelines</h3>
          <p className="text-xs text-slate-500">
            Cabin baggage: 7 kg per passenger. Check-in luggage: 15 kg for domestic Economy class. Extra baggage available during booking.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Web Check-in Timings</h3>
          <p className="text-xs text-slate-500">
            Opens 48 hours before departure. Closing 60 mins before scheduled flight. Skip airport queues with digital boarding passes.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-sm text-slate-900">Valid Photo ID</h3>
          <p className="text-xs text-slate-500">
            Aadhaar card, Passport, Voter ID or Driving License required along with printed or mobile boarding pass at the security gate.
          </p>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* FAQs Accordion */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 pb-2 border-b border-slate-100">
            Frequently Asked Questions
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="font-bold text-xs text-slate-800">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="p-4 bg-white text-xs text-slate-600 leading-relaxed border-t border-slate-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit Query Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Mail className="w-4 h-4 text-blue-600" />
            <span>Submit Passenger Query</span>
          </h3>

          {queryTicketId ? (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <p className="font-bold text-sm text-emerald-900">Query Registered Successfully</p>
              <p className="text-xs text-emerald-800">
                Ticket Reference: <strong className="font-mono">{queryTicketId}</strong>
              </p>
              <p className="text-[11px] text-emerald-700">
                Our domestic airport passenger help desk has logged your request.
              </p>
              <button
                onClick={() => setQueryTicketId(null)}
                className="mt-2 px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold"
              >
                Submit Another Query
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitQuery} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Passenger Name *
                </label>
                <input
                  type="text"
                  required
                  value={queryName}
                  onChange={e => setQueryName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={queryEmail}
                  onChange={e => setQueryEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Query Category
                </label>
                <select
                  value={querySubject}
                  onChange={e => setQuerySubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Baggage Query">Baggage & Luggage Allowance</option>
                  <option value="Web Check-in">Web Check-in & Boarding Pass</option>
                  <option value="Cancellation / Refund">Cancellation & Refund Status</option>
                  <option value="Special Assistance">Wheelchair & Special Assistance</option>
                  <option value="Other Flight Query">Other Flight Information</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Message / Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={queryMessage}
                  onChange={e => setQueryMessage(e.target.value)}
                  placeholder="Describe your query or provide your PNR..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Passenger Query</span>
              </button>
            </form>
          )}
        </div>

      </div>

    </div>
  );
};
