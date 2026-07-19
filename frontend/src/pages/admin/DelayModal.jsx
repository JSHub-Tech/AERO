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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#1C2B22]/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-full">
          <X size={16} />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#1C2B22] tracking-tight">Inject Delay</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Flight {flight.flightNum}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
  );
}
