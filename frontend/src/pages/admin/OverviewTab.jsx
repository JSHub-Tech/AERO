import { useEffect, useState } from 'react';
import { Plane, Ticket, Users, AlertTriangle, TrendingUp } from 'lucide-react';
import { StatCard } from './shared';
// If your shared file is in the same directory, use './shared'
// If it's up a level, use '../shared' depending on where you save this file.

export default function OverviewTab() {
  const [stats, setStats] = useState({
    totalFlights: 0,
    totalBookings: 0,
    activeFleet: 0,
    delayedFlights: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated API fetch to match your dashboard's style
    const fetchOverviewStats = async () => {
      try {
        setLoading(false);
        setStats({
          totalFlights: 42,
          totalBookings: 184,
          activeFleet: 12,
          delayedFlights: 3,
          revenue: 24500,
        });
      } catch (error) {
        console.error("Failed to load overview metrics", error);
      }
    };

    fetchOverviewStats();
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 font-bold">
        Loading system metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          icon={Plane} 
          label="Total Flights" 
          value={stats.totalFlights} 
          accent="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard 
          icon={Ticket} 
          label="Total Bookings" 
          value={stats.totalBookings} 
          accent="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Delayed Flights" 
          value={stats.delayedFlights} 
          accent="text-orange-600"
          bg="bg-orange-50"
        />
        <StatCard 
          icon={TrendingUp} 
          label="Gross Revenue" 
          value={`$${stats.revenue.toLocaleString()}`} 
          accent="text-[#004F30]"
          bg="bg-[#004F30]/10"
        />
      </div>

      {/* System Status Banner */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xl shadow-gray-200/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-black text-[#1C2B22] tracking-tight uppercase">
            Operational Status: Nominal
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
            All database shards and real-time synchronization channels are running smoothly.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Environment
        </div>
      </div>
    </div>
  );
}