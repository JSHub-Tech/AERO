import { useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { delayFlight } from '../../services/api';

export default function DelayModal({ flight, adminUserId, onClose, onDone }) {
  const [delayMins, setDelayMins] = useState(30);
  const [delayReason, setDelayReason] = useState('Air Traffic Control');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await delayFlight(flight.id, parseInt(delayMins), delayReason, adminUserId);
      onDone(`Successfully delayed flight ${flight.flightNum} by ${delayMins} minutes.`);
    } catch (err) {
      alert('Failed to inject delay: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1C2B22]/80 backdrop-blur-md">
      <div className="bg-[#1C2B22] border border-[#0A6B41] rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white bg-[#1C2B22]/50 hover:bg-[#1C2B22] rounded-full transition-colors">
          <X size={16} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Report Delay</h3>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest mt-1">Flight {flight.flightNum}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">Delay Duration (Minutes)</label>
            <div className="flex items-center gap-4">
              <input
                type="range" min="15" max="360" step="15"
                value={delayMins} onChange={e => setDelayMins(e.target.value)}
                className="flex-grow accent-orange-500"
              />
              <span className="font-black text-orange-500 w-12 text-right">{delayMins}m</span>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black tracking-widest text-gray-400 uppercase mb-2">Operational Reason</label>
            <select
              value={delayReason} onChange={e => setDelayReason(e.target.value)}
              className="w-full bg-[#1C2B22] border border-[#0A6B41] rounded-xl px-4 py-3 text-sm font-bold text-white placeholder-white/30 outline-none focus:border-orange-500 transition-colors"
            >
              <option>Air Traffic Control</option>
              <option>Weather Conditions</option>
              <option>Technical Inspection</option>
              <option>Crew Availability</option>
              <option>Security Clearance</option>
            </select>
          </div>

          <button disabled={submitting} type="submit" className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-[#1C2B22] disabled:text-white/30 text-white font-black py-4 rounded-xl transition-all shadow-lg shadow-orange-500/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2">
            {submitting ? 'Updating...' : 'Confirm Delay'}
            {!submitting && <Clock size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}
