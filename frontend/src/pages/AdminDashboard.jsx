import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ShieldCheck, LayoutDashboard, PlaneTakeoff, Plane, Ticket, Users } from 'lucide-react';
import Footer from '../components/Footer';
import OverviewTab from './admin/OverviewTab';
import FlightsTab from './admin/FlightsTab';
import FleetTab from './admin/FleetTab';
import BookingsTab from './admin/BookingsTab';
import UsersTab from './admin/UsersTab';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'flights', label: 'Flights', icon: PlaneTakeoff },
  { id: 'fleet', label: 'Fleet', icon: Plane },
  { id: 'bookings', label: 'Bookings', icon: Ticket },
  { id: 'users', label: 'Users', icon: Users },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');

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

        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-colors whitespace-nowrap ${
                tab === id
                  ? 'bg-[#004F30] text-white shadow-lg shadow-[#004F30]/20'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && <OverviewTab />}
        {tab === 'flights' && <FlightsTab adminUserId={user.user_id} />}
        {tab === 'fleet' && <FleetTab />}
        {tab === 'bookings' && <BookingsTab />}
        {tab === 'users' && <UsersTab currentUserId={user.user_id} />}
      </div>

      <Footer />
    </div>
  );
}
