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

  if (!user) {
    window.location.href = '/login?redirect=/command-center';
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden pt-[80px]">
        <div className="bg-gradient-to-br from-[#004F30] from-70% to-[#A89411] border border-red-500/30 p-10 rounded-3xl text-center max-w-md w-full relative z-10 shadow-[0_20px_60px_rgba(0,79,48,0.15)]">
          <ShieldAlert size={64} className="mx-auto text-red-400 mb-6" />
          <h1 className="text-3xl font-black text-white tracking-tighter mb-2">RESTRICTED AREA</h1>
          <p className="text-sm text-white/80 uppercase tracking-widest font-bold mb-8">
            Command Center Access Prohibited.<br/>Admin credentials required.
          </p>
          <button
            onClick={() => window.location.href = '/login?redirect=/command-center'}
            className="w-full bg-white hover:bg-gray-100 text-[#1C2B22] font-black tracking-widest text-xs uppercase py-4 rounded-xl transition-colors shadow-lg"
          >
            Switch Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative flex flex-col pt-[100px]">
      <div className="max-w-[1200px] mx-auto w-full px-6 flex-grow pb-12 relative z-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#004F30] tracking-tighter flex items-center gap-3">
              <ShieldCheck className="text-[#A89411]" size={32} />
              COMMAND CENTER
            </h1>
            <p className="text-[#004F30]/70 font-bold text-sm tracking-widest mt-1 uppercase">Administrative Control Panel</p>
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
                  : 'bg-white text-[#004F30]/70 hover:bg-[#F0F4F2] border border-[#004F30]/20'
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
