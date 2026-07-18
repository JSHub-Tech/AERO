import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, Plane, Clock, Search, X, CheckCircle2 } from 'lucide-react';
import Footer from '../components/Footer';
import { getActiveFlights, getOnboardingFlights } from '../services/api';

const PASSCODE = "AERO-ADMIN";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [error, setError] = useState(false);
  
  // Dashboard State
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal State
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [delayMinutes, setDelayMinutes] = useState(30);
  const [delayReason, setDelayReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    if (passcodeInput === PASSCODE) {
      setIsAuthenticated(true);
      fetchFlights();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
      setPasscodeInput("");
    }
  };

  const fetchFlights = async () => {
    setLoading(true);
    try {
      // Fetch both active and boarding flights for admin to manage
      const [activeData, boardingData] = await Promise.all([
        getActiveFlights(),
        getOnboardingFlights()
      ]);
      const allFlights = [...(activeData.flights || []), ...(boardingData || [])];
      setFlights(allFlights);
    } catch (err) {
      console.error("Failed to load flights for admin", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelaySubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    // TODO: Connect to backend API when ready. (e.g., POST /api/v1/flights/delay)
    // For now, we mock the API response with a setTimeout.
    setTimeout(() => {
      setSubmitting(false);
      setSuccessMsg(`Successfully delayed flight ${selectedFlight.flightNum} by ${delayMinutes} minutes.`);
      
      // Update local state to reflect the change visually
      setFlights(prev => prev.map(f => 
        f.flightNum === selectedFlight.flightNum 
        ? { ...f, status: "DELAYED", delayReason: delayReason } 
        : f
      ));
      
      setTimeout(() => {
        setSuccessMsg("");
        setSelectedFlight(null);
        setDelayMinutes(30);
        setDelayReason("");
      }, 3000);
    }, 1000);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] relative flex flex-col justify-center items-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,79,48,0.1)_0%,_transparent_50%)] z-0"></div>
        <div className="z-10 bg-white/70 backdrop-blur-3xl p-12 rounded-3xl border border-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <Lock size={32} />
          </div>
          <h1 className="text-3xl font-black text-[#1C2B22] mb-2 tracking-tighter">RESTRICTED AREA</h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-8">Aero Command Center Access</p>
          
          <form onSubmit={handleLogin}>
            <input 
              type="password"
              placeholder="Enter Admin Passcode"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value)}
              className={`w-full bg-gray-50 border ${error ? 'border-red-500 bg-red-50' : 'border-gray-200'} rounded-xl px-4 py-4 mb-4 text-center tracking-[0.5em] font-black text-[#1C2B22] outline-none focus:ring-2 focus:ring-[#004F30]/20 transition-all`}
            />
            <button 
              type="submit" 
              className="w-full bg-[#1C2B22] hover:bg-[#004F30] text-white font-bold py-4 rounded-xl transition-all tracking-widest text-sm uppercase shadow-lg shadow-[#004F30]/20"
            >
              Authenticate
            </button>
          </form>
          {error && <p className="text-red-500 text-xs font-bold mt-4 animate-bounce">ACCESS DENIED. INVALID PASSCODE.</p>}
        </div>
      </div>
    );
  }

  const filteredFlights = flights.filter(f => 
    f.flightNum?.toLowerCase().includes(search.toLowerCase()) || 
    f.source?.toLowerCase().includes(search.toLowerCase()) || 
    f.dest?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] relative flex flex-col pt-[100px]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(168,148,17,0.1)_0%,_transparent_50%)] z-0 pointer-events-none"></div>
      
      <div className="relative z-10 max-w-[1200px] mx-auto w-full px-6 flex-grow pb-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="flex items-center gap-3 text-red-600 mb-2">
              <ShieldAlert size={20} />
              <span className="font-black text-xs tracking-widest uppercase">Level 4 Authorization</span>
            </div>
            <h1 className="text-4xl font-black text-[#1C2B22] tracking-tighter">COMMAND CENTER</h1>
          </div>
          
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              placeholder="Search Flights..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-full pl-10 pr-4 py-2.5 text-sm font-bold text-[#1C2B22] outline-none focus:ring-2 focus:ring-[#A89411]/50 shadow-sm transition-all"
            />
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase font-bold tracking-widest text-gray-500">
              <tr>
                <th className="py-4 pl-6">Flight No</th>
                <th className="py-4">Route</th>
                <th className="py-4">Current Status</th>
                <th className="py-4 text-right pr-6">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="4" className="py-12 text-center text-sm font-bold text-gray-400 animate-pulse">SYNCING WITH DATABASE...</td></tr>
              ) : filteredFlights.length === 0 ? (
                <tr><td colSpan="4" className="py-12 text-center text-sm font-bold text-gray-400">NO FLIGHTS MATCH QUERY</td></tr>
              ) : (
                filteredFlights.map((f, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-4 pl-6 font-black text-[#004F30]">{f.flightNum}</td>
                    <td className="py-4 font-bold text-[#1C2B22] text-xs">{f.source} → {f.dest}</td>
                    <td className="py-4 font-black text-[#A89411] text-[10px]">{f.status || 'ACTIVE'}</td>
                    <td className="py-4 text-right pr-6">
                      <button 
                        onClick={() => setSelectedFlight(f)}
                        className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors"
                      >
                        Inject Delay
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DELAY MODAL */}
      {selectedFlight && (
        <div className="fixed inset-0 z-[9999] bg-[#1C2B22]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <button onClick={() => setSelectedFlight(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 transition-colors">
              <X size={20} />
            </button>
            
            {!successMsg ? (
              <>
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
                  <Clock size={24} />
                </div>
                <h2 className="text-2xl font-black text-[#1C2B22] mb-1">Delay Flight {selectedFlight.flightNum}</h2>
                <p className="text-sm font-bold text-gray-500 mb-6">Modify operational schedule for route {selectedFlight.source} → {selectedFlight.dest}.</p>
                
                <form onSubmit={handleDelaySubmit}>
                  <div className="mb-4">
                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">Delay Duration (Minutes)</label>
                    <input 
                      type="number" 
                      min="5"
                      value={delayMinutes}
                      onChange={(e) => setDelayMinutes(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1C2B22] outline-none focus:border-red-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <div className="mb-8">
                    <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">Reason Code</label>
                    <select 
                      value={delayReason}
                      onChange={(e) => setDelayReason(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1C2B22] outline-none focus:border-red-500 focus:bg-white transition-all"
                      required
                    >
                      <option value="" disabled>Select Reason...</option>
                      <option value="Severe Weather">Severe Weather</option>
                      <option value="Technical Maintenance">Technical Maintenance</option>
                      <option value="Air Traffic Control">Air Traffic Control</option>
                      <option value="Late Inbound Aircraft">Late Inbound Aircraft</option>
                    </select>
                  </div>
                  
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setSelectedFlight(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 rounded-xl transition-colors text-xs uppercase tracking-widest">
                      Cancel
                    </button>
                    <button type="submit" disabled={submitting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-600/30 text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                      {submitting ? 'Processing...' : 'Confirm Delay'}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle2 size={48} className="text-green-500 mx-auto mb-4" />
                <h2 className="text-xl font-black text-[#1C2B22] mb-2">Network Updated</h2>
                <p className="text-sm font-bold text-gray-500">{successMsg}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
