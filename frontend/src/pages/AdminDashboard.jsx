import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getActiveFlights, getOnboardingFlights, delayFlight } from '../services/api';
import { ShieldAlert, AlertTriangle, Clock, Search, ShieldCheck, X } from 'lucide-react';
import Footer from '../components/Footer';

export default function AdminDashboard() {
  const { user } = useAuth();
  
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [delayMins, setDelayMins] = useState(30);
  const [delayReason, setDelayReason] = useState('Air Traffic Control');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const loadFlights = async () => {
    setLoading(true);
    try {
      const [activeRes, boardingRes] = await Promise.all([
        getActiveFlights(),
        getOnboardingFlights()
      ]);
      
      const combined = [
        ...(activeRes.flights || []).map(f => ({ ...f, type: 'active' })),
        ...(boardingRes.flights || []).map(f => ({ ...f, type: 'boarding' }))
      ];
      setFlights(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      loadFlights();
    }
  }, [user]);

  const handleDelaySubmit = async (e) => {
    e.preventDefault();
    if (!selectedFlight) return;
    setSubmitting(true);
    
    try {
      await delayFlight(selectedFlight.id, parseInt(delayMins), delayReason, user.user_id);
      setSuccessMsg(`Successfully delayed flight ${selectedFlight.flightNum} by ${delayMins} minutes.`);
      setSelectedFlight(null);
      loadFlights(); // refresh
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert("Failed to inject delay: " + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#1C2B22] flex items-center justify-center p-6 relative overflow-hidden mt-[80px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,0,0,0.15)_0%,_transparent_70%)]"></div>
        <div className="bg-black/50 backdrop-blur-xl border border-red-500/30 p-10 rounded-3xl text-center max-w-md w-full relative z-10 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
          <ShieldAlert size={64} className="mx-auto text-red-500 mb-6" />
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">RESTRICTED AREA</h1>
          <p className="text-sm text-red-200/70 uppercase tracking-widest font-bold mb-8">
            Command Center Access Prohibited.<br/>Admin credentials required.
          </p>
          <button 
            onClick={() => window.location.href = '/login?redirect=/command-center'}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-black tracking-widest text-xs uppercase py-4 rounded-xl transition-colors shadow-lg shadow-red-500/20"
          >
            Sign in first
          </button>
        </div>
      </div>
    );
  }

  const filtered = flights.filter(f => 
    f.flightNum.toLowerCase().includes(search.toLowerCase()) || 
    f.source.toLowerCase().includes(search.toLowerCase()) || 
    f.dest.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] relative flex flex-col pt-[100px]">
      <div className="max-w-[1200px] mx-auto w-full px-6 flex-grow pb-12 relative z-10">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#1C2B22] tracking-tighter flex items-center gap-3">
              <ShieldCheck className="text-[#004F30]" size={32} />
              COMMAND CENTER
            </h1>
            <p className="text-gray-500 font-bold text-sm tracking-widest mt-1 uppercase">Administrative Control Panel</p>
          </div>
        </div>

        {successMsg && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-xl font-bold text-sm border border-green-200">
            {successMsg}
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
            <h2 className="text-sm font-black tracking-widest uppercase text-gray-400">Manage Operations</h2>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search flight..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-[#004F30]"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-[10px] uppercase font-black tracking-widest text-gray-400">
                <tr>
                  <th className="p-4">Flight</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Target Time</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-bold">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-bold">No active flights found.</td></tr>
                ) : (
                  filtered.map((f, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-4 font-black text-[#1C2B22]">{f.flightNum}</td>
                      <td className="p-4 font-bold text-gray-600">{f.source} ➔ {f.dest}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${f.type === 'active' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                          {f.type}
                        </span>
                      </td>
                      <td className="p-4 font-bold text-gray-500">
                        {f.targetTime ? new Date(f.targetTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'N/A'}
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setSelectedFlight(f)}
                          className="px-4 py-1.5 bg-red-50 text-red-600 hover:bg-red-500 hover:text-white rounded-lg font-black text-[10px] uppercase tracking-widest transition-colors border border-red-100 hover:border-red-500 flex items-center gap-2 ml-auto"
                        >
                          <AlertTriangle size={12} /> Inject Delay
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Delay Modal */}
      {selectedFlight && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1C2B22]/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button onClick={() => setSelectedFlight(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full">
              <X size={16} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#1C2B22] tracking-tight">Inject Delay</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Flight {selectedFlight.flightNum}</p>
              </div>
            </div>
            
            <form onSubmit={handleDelaySubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">Delay Duration (Minutes)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="15" max="360" step="15" 
                    value={delayMins} onChange={e => setDelayMins(e.target.value)}
                    className="flex-grow accent-red-500"
                  />
                  <span className="font-black text-red-600 w-12 text-right">{delayMins}m</span>
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">Operational Reason</label>
                <select 
                  value={delayReason} onChange={e => setDelayReason(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-[#1C2B22] outline-none focus:border-red-500"
                >
                  <option>Air Traffic Control</option>
                  <option>Weather Conditions</option>
                  <option>Technical Inspection</option>
                  <option>Crew Availability</option>
                  <option>Security Clearance</option>
                </select>
              </div>
              
              <button disabled={submitting} type="submit" className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-red-500/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                {submitting ? 'Injecting...' : 'Confirm Delay'}
                {!submitting && <Clock size={16} />}
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
