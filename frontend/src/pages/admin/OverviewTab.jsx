import { useEffect, useState } from 'react';
import { DollarSign, Ticket, PlaneTakeoff, Clock3, Gauge, AlertTriangle, Plane, Users } from 'lucide-react';
import { getDashboardSummary } from '../../services/api';
import { StatCard } from './shared';

export default function OverviewTab() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDashboardSummary()
      .then(data => { if (!cancelled) setSummary(data); })
      .catch(err => { if (!cancelled) setError(err.response?.data?.detail || 'Failed to load summary.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-400 font-bold">Loading overview...</div>;
  }
  if (error) {
    return <div className="p-6 bg-red-50 text-red-700 rounded-xl font-bold text-sm border border-red-200">{error}</div>;
  }
  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Today's Revenue" value={`$${summary.todays_revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
        <StatCard icon={Ticket} label="Today's Bookings" value={summary.todays_bookings} accent="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={PlaneTakeoff} label="Today's Flights" value={summary.todays_flights} accent="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={Clock3} label="On-Time %" value={`${summary.on_time_pct}%`} accent="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Gauge} label="Load Factor" value={`${summary.load_factor_pct}%`} accent="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={AlertTriangle} label="Delayed Today" value={summary.delayed_flights} accent="text-orange-600" bg="bg-orange-50" />
        <StatCard icon={Plane} label="Fleet Size" value={`${summary.fleet_size} (${summary.aircraft_in_maintenance} in MX)`} />
        <StatCard icon={Users} label="Total Users" value={summary.total_users} accent="text-indigo-600" bg="bg-indigo-50" />
      </div>

      <div className="bg-[#004F30] rounded-3xl shadow-[0_20px_60px_rgba(0,79,48,0.3)] border border-[#0A6B41] overflow-hidden">
        <div className="p-6 border-b border-[#0A6B41] flex flex-wrap gap-4 items-center justify-between bg-[#1C2B22]/30">
          <h2 className="text-sm font-black tracking-widest uppercase text-[#A89411]">All Flights</h2>
        </div>
        <div className="bg-[#A89411] p-6">
          <p className="text-[#004F30] font-bold text-sm">
            <span className="text-[#1C2B22] font-black">{summary.total_bookings_all_time.toLocaleString()}</span> bookings recorded across the network so far,
            with <span className="text-[#1C2B22] font-black">{summary.active_flights}</span> flights currently airborne.
          </p>
        </div>
      </div>
    </div>
  );
}
